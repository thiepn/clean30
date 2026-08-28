import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}/clean30/`;
const ARTIFACT_DIR = resolve("artifacts/rc1");
const report = {
  phase: "RC1",
  sha: process.env.GITHUB_SHA || null,
  startedAt: new Date().toISOString(),
  gates: [],
};

function record(name, details = {}) {
  report.gates.push({ name, status: "passed", ...details });
  console.log(`PASS: ${name}`);
}

async function waitForServer(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL, { cache: "no-store" });
      if (response.ok) return;
      lastError = new Error(`Preview returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Preview did not start: ${lastError?.message || "unknown error"}`);
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    client: document.documentElement.clientWidth,
    root: document.documentElement.scrollWidth,
  }));
  assert.ok(
    dimensions.root <= dimensions.client + 1 && dimensions.body <= dimensions.client + 1,
    `${label}: horizontal overflow detected (${JSON.stringify(dimensions)})`,
  );

  const chrome = await page.evaluate(() => {
    const selectors = [".v2-setup-footer", ".v2-nav", ".v2-update-toast"];
    return selectors.flatMap((selector) => [...document.querySelectorAll(selector)].map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        selector,
        visible: style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0,
        left: rect.left,
        right: rect.right,
        viewport: window.innerWidth,
      };
    }));
  });

  for (const item of chrome.filter((candidate) => candidate.visible)) {
    assert.ok(item.left >= -1, `${label}: ${item.selector} extends left of the viewport`);
    assert.ok(item.right <= item.viewport + 1, `${label}: ${item.selector} extends right of the viewport`);
  }
}

async function assertTouchTargets(page, selector, label, minimum = 40) {
  const targets = await page.locator(selector).evaluateAll((elements) => elements
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        name: element.getAttribute("aria-label") || element.textContent?.trim().replace(/\s+/g, " ") || element.tagName,
        visible: style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0,
        width: rect.width,
        height: rect.height,
      };
    })
    .filter((target) => target.visible));

  assert.ok(targets.length > 0, `${label}: no visible touch targets found`);
  for (const target of targets) {
    assert.ok(
      target.width >= minimum && target.height >= minimum,
      `${label}: ${target.name} is ${target.width.toFixed(1)}×${target.height.toFixed(1)}px`,
    );
  }
}

function attachDiagnostics(page, diagnostics) {
  let offlineMode = false;
  page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (offlineMode && /ERR_INTERNET_DISCONNECTED|Failed to load resource/i.test(message.text())) return;
    diagnostics.push(`console: ${message.text()}`);
  });
  return {
    setOfflineMode(value) {
      offlineMode = value;
    },
  };
}

async function completeFreshSetup(page, viewport, { addCustomData = false, fontScale = 100 } = {}) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Set up your home." }).waitFor();
  if (fontScale !== 100) {
    await page.addStyleTag({ content: `html { font-size: ${fontScale}% !important; }` });
  }

  await assertNoHorizontalOverflow(page, `${viewport.width}px intro at ${fontScale}% text`);
  await assertTouchTargets(page, ".v2-setup-footer button", `${viewport.width}px setup footer`);
  await page.getByRole("button", { name: "Set up my home" }).click();
  await page.getByRole("heading", { name: "Add your rooms." }).waitFor();

  const hierarchy = await page.evaluate(() => {
    const current = document.querySelector(".v2-room-list-heading")?.getBoundingClientRect();
    const add = document.querySelector(".v2-add-room-heading")?.getBoundingClientRect();
    return {
      currentTop: current?.top ?? Number.POSITIVE_INFINITY,
      addTop: add?.top ?? Number.NEGATIVE_INFINITY,
      viewportHeight: window.innerHeight,
    };
  });
  assert.ok(hierarchy.currentTop < hierarchy.addTop, "Current rooms must precede room-add controls");
  assert.ok(hierarchy.currentTop < hierarchy.viewportHeight, "Current-room heading must be visible without scrolling on entry");
  assert.equal(await page.locator(".v2-room-list-heading span").innerText(), "4 rooms");
  await assertNoHorizontalOverflow(page, `${viewport.width}px room setup`);

  if (addCustomData) {
    await page.locator(".v2-room-add").filter({ hasText: "Kitchen" }).click();
    assert.equal(await page.locator(".v2-room-list-heading span").innerText(), "5 rooms");
    assert.equal(await page.getByLabel("Room name 5").inputValue(), "Kitchen 2");

    await page.getByLabel("Custom room name").fill("Hallway");
    await page.getByRole("button", { name: "Add room", exact: true }).click();
    assert.equal(await page.locator(".v2-room-list-heading span").innerText(), "6 rooms");
    assert.equal(await page.getByLabel("Room name 6").inputValue(), "Hallway");
  }

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Add room details." }).waitFor();
  await assertNoHorizontalOverflow(page, `${viewport.width}px room details`);

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Choose your cleaning tasks." }).waitFor();
  await assertNoHorizontalOverflow(page, `${viewport.width}px task setup`);

  const firstFrequency = page.locator("select[aria-label^='Frequency for ']").first();
  await firstFrequency.waitFor();
  const frequencyLabels = await firstFrequency.locator("option").allTextContents();
  assert.ok(frequencyLabels.some((label) => /Daily/i.test(label)), "Daily frequency option is missing");
  assert.ok(frequencyLabels.some((label) => /Custom interval/i.test(label)), "Custom frequency option is missing");

  if (addCustomData) {
    await page.getByLabel("Custom cleaning task").fill("Clean test surface");
    await page.getByLabel("Custom task frequency").selectOption("custom");
    await page.getByLabel("Custom task frequency in days").fill("2");
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    const customTaskTitle = page.getByLabel("Custom task title").last();
    await customTaskTitle.waitFor();
    assert.equal(await customTaskTitle.inputValue(), "Clean test surface");
  }

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Choose your cleaning days." }).waitFor();
  await page.getByRole("button", { name: "Sun" }).click();
  assert.equal(await page.getByRole("button", { name: "Sun" }).getAttribute("aria-pressed"), "true");
  await assertNoHorizontalOverflow(page, `${viewport.width}px schedule setup`);

  await page.getByRole("button", { name: "Create for later" }).click();
  await page.locator(".v2-app-shell").waitFor();
  await assertNoHorizontalOverflow(page, `${viewport.width}px home`);
  await assertTouchTargets(page, ".v2-nav button", `${viewport.width}px primary navigation`);
  const homeHeading = (await page.locator("main h1").first().innerText()).trim();
  assert.ok(["Today’s clean", "Nothing due today"].includes(homeHeading), `Unexpected Home heading: ${homeHeading}`);
}

async function certifyViewport(browser, viewport, options = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: viewport.width >= 390 ? 3 : 2,
    hasTouch: true,
    isMobile: true,
    reducedMotion: options.reducedMotion ? "reduce" : "no-preference",
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const diagnostics = [];
  attachDiagnostics(page, diagnostics);
  await completeFreshSetup(page, viewport, options);
  await page.screenshot({ path: resolve(ARTIFACT_DIR, `${options.name || viewport.width}.png`), fullPage: true });
  assert.deepEqual(diagnostics, [], `Browser errors at ${viewport.width}px:\n${diagnostics.join("\n")}`);
  await context.close();
  record(`Touch viewport ${viewport.width}×${viewport.height}`, {
    fontScale: options.fontScale || 100,
    reducedMotion: Boolean(options.reducedMotion),
  });
}

async function certifyFunctionalFlow(browser) {
  const viewport = { width: 390, height: 844 };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
    acceptDownloads: true,
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const diagnostics = [];
  const diagnosticControl = attachDiagnostics(page, diagnostics);
  await completeFreshSetup(page, viewport, { addCustomData: true, reducedMotion: true });

  await page.getByRole("button", { name: /Clean a room/ }).click();
  const roomDialog = page.getByRole("dialog", { name: "What needs cleaning?" });
  await roomDialog.waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Close room picker");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await roomDialog.evaluate((dialog) => {
    const focusable = [...dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])")];
    return document.activeElement === focusable.at(-1);
  }), true, "Shift+Tab did not wrap focus inside the room dialog");
  await page.keyboard.press("Escape");
  await roomDialog.waitFor({ state: "detached" });

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("heading", { name: "Settings" }).waitFor();
  await page.getByRole("button", { name: /^Rooms\b/ }).click();
  await page.getByRole("heading", { name: "Add your rooms." }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { name: "Settings" }).waitFor();

  const appearanceButton = page.getByRole("button", { name: /^Light appearance/ });
  await appearanceButton.click();
  assert.equal(await page.locator(".v2-app").getAttribute("data-theme"), "dark");
  await page.getByRole("button", { name: /^Dark appearance/ }).click();
  assert.equal(await page.locator(".v2-app").getAttribute("data-theme"), "light");

  const backupPath = resolve(ARTIFACT_DIR, "clean30-rc1-backup.json");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Export backup/ }).click();
  const download = await downloadPromise;
  await download.saveAs(backupPath);
  const backup = JSON.parse(await readFile(backupPath, "utf8"));
  assert.equal(backup.app, "Clean30");
  assert.equal(backup.type, "clean30-v2-backup");
  assert.equal(backup.version, 1);
  assert.equal(backup.data.onboardingComplete, true);
  assert.ok(backup.data.rooms.some((room) => room.name === "Hallway"));
  assert.equal(backup.data.rooms.filter((room) => room.type === "kitchen").length, 2);
  assert.ok(backup.data.tasks.some((task) => task.title === "Clean test surface" && task.cadence === 2));

  await page.locator("input[type='file']").setInputFiles(backupPath);
  const restoreDialog = page.getByRole("alertdialog", { name: "Restore this backup?" });
  await restoreDialog.waitFor();
  await restoreDialog.getByRole("button", { name: "Restore backup" }).click();
  await page.getByText("Backup restored.", { exact: true }).waitFor();

  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: /Clean a room/ }).click();
  await page.getByRole("dialog", { name: "What needs cleaning?" }).getByRole("button", { name: /^Kitchen\b/ }).first().click();
  await page.getByRole("button", { name: "Pause", exact: true }).waitFor();
  await assertTouchTargets(page, ".v2-focus-actions button", "Focused-clean primary actions");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("clean30_v2_state");
    if (!raw) return false;
    const state = JSON.parse(raw);
    return state.activeSession?.items?.some((item) => item.done);
  });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Continue cleaning" }).waitFor();

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Pause", exact: true }).waitFor();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Continue cleaning" }).click();

  let complete = false;
  for (let index = 0; index < 30; index += 1) {
    if (await page.getByText("Clean complete", { exact: true }).count()) {
      complete = true;
      break;
    }
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }
  assert.equal(complete, true, "Focused clean did not reach its completion summary");
  await page.getByRole("button", { name: "Review choices" }).click();
  await page.getByRole("button", { name: "Return to summary" }).click();
  await page.getByRole("button", { name: "Save and finish" }).click();
  await page.getByText("Clean saved. Your plan has been updated.", { exact: true }).waitFor();

  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await page.getByRole("heading", { name: "Cleaning plan" }).waitFor();
  assert.ok(await page.locator(".v2-history-list strong").filter({ hasText: "Kitchen" }).count(), "Completed clean missing from history");

  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: /Clean a room/ }).click();
  await page.getByRole("dialog", { name: "What needs cleaning?" }).getByRole("button", { name: /^Kitchen\b/ }).first().click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Discard clean", exact: true }).click();
  const discardDialog = page.getByRole("alertdialog", { name: "Discard this clean?" });
  await discardDialog.waitFor();
  await discardDialog.getByRole("button", { name: "Discard clean" }).click();
  await page.getByText("Clean discarded. No tasks were rescheduled.", { exact: true }).waitFor();

  await page.evaluate(() => window.dispatchEvent(new CustomEvent("clean30:updateAvailable")));
  await page.getByText("Clean30 update ready", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Dismiss update" }).click();

  const serviceWorkerState = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return { supported: false };
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker readiness timed out")), 15_000)),
    ]);
    return {
      supported: true,
      active: Boolean(registration.active),
      scope: registration.scope,
    };
  });
  assert.equal(serviceWorkerState.supported, true);
  assert.equal(serviceWorkerState.active, true);
  assert.ok(serviceWorkerState.scope.endsWith("/clean30/"), `Unexpected service-worker scope: ${serviceWorkerState.scope}`);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".v2-app-shell").waitFor();
  diagnosticControl.setOfflineMode(true);
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.locator(".v2-app-shell").waitFor({ timeout: 15_000 });
  await assertNoHorizontalOverflow(page, "Offline installed-PWA shell");
  await context.setOffline(false);
  diagnosticControl.setOfflineMode(false);

  const reducedMotion = await page.evaluate(() => {
    const element = document.querySelector(".v2-nav button");
    return {
      media: matchMedia("(prefers-reduced-motion: reduce)").matches,
      transitionDuration: getComputedStyle(element).transitionDuration,
      hasSafeAreaRule: [...document.styleSheets].some((sheet) => {
        try {
          return [...sheet.cssRules].some((rule) => rule.cssText.includes("safe-area-inset-bottom"));
        } catch {
          return false;
        }
      }),
    };
  });
  assert.equal(reducedMotion.media, true);
  assert.ok(reducedMotion.transitionDuration.split(",").every((value) => {
    const seconds = value.trim().endsWith("ms")
      ? Number.parseFloat(value) / 1000
      : Number.parseFloat(value);
    return Number.isFinite(seconds) && seconds <= 0.0001;
  }), `Reduced-motion duration is ${reducedMotion.transitionDuration}`);
  assert.equal(reducedMotion.hasSafeAreaRule, true, "Safe-area CSS rule missing");

  await page.screenshot({ path: resolve(ARTIFACT_DIR, "390-functional-offline.png"), fullPage: true });
  assert.deepEqual(diagnostics, [], `Browser errors in functional certification:\n${diagnostics.join("\n")}`);
  await context.close();

  record("Focused cleaning persistence, review, completion, history, and discard");
  record("Backup export and restore", { backupSchema: 1 });
  record("Keyboard focus containment and Escape dismissal");
  record("PWA service worker and offline reload", { scope: serviceWorkerState.scope });
  record("Reduced motion and mobile safe-area CSS");
}

await mkdir(ARTIFACT_DIR, { recursive: true });
const preview = spawn(process.platform === "win32" ? "npm.cmd" : "npm", [
  "run",
  "preview",
  "--",
  "--host",
  HOST,
  "--port",
  String(PORT),
  "--strictPort",
], {
  stdio: ["ignore", "pipe", "pipe"],
});

let previewLog = "";
preview.stdout.on("data", (chunk) => { previewLog += chunk.toString(); });
preview.stderr.on("data", (chunk) => { previewLog += chunk.toString(); });

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  await certifyViewport(browser, { width: 320, height: 568 }, { name: "320" });
  await certifyViewport(browser, { width: 360, height: 800 }, { name: "360" });
  await certifyViewport(browser, { width: 390, height: 844 }, { name: "390" });
  await certifyViewport(browser, { width: 320, height: 568 }, {
    name: "320-large-text",
    fontScale: 125,
    reducedMotion: true,
  });
  await certifyFunctionalFlow(browser);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error?.stack || String(error);
  console.error(error);
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  report.previewLog = previewLog;
  await writeFile(resolve(ARTIFACT_DIR, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await browser?.close();
  preview.kill("SIGTERM");
}
