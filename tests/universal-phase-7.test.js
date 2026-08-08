import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import {
  createDefaultTemplate,
  createTemplateExport
} from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Phase 7 preserves deployment and data-schema invariants", () => {
  const vite = textFile("../vite.config.js");
  const storage = textFile("../src/utils/storage.js");
  const app = textFile("../src/App.jsx");

  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.equal(CURRENT_BACKUP_VERSION, 3);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(
    storage,
    /export function saveAppState\(state\)\s*{\s*writeJson\(STORAGE_KEYS\.appState, normalizeAppState\(state\)\);\s*}/s
  );
  assert.match(
    app,
    /useEffect\(\(\) =>\s*{\s*saveAppState\(appState\);\s*}, \[appState\]\);/s
  );
});

test("PWA manifest has stable Clean30 identity and universal copy", () => {
  const manifest = JSON.parse(textFile("../public/manifest.webmanifest"));
  assert.equal(manifest.id, "/clean30/");
  assert.equal(manifest.start_url, "/clean30/");
  assert.equal(manifest.scope, "/clean30/");
  assert.equal(manifest.display, "standalone");
  assert.match(manifest.description, /local-first cleaning assistant/i);
  assert.doesNotMatch(manifest.description, /apartment cleaning routine system/i);
  assert.ok(manifest.icons.every((icon) => icon.src.startsWith("/clean30/")));
});

test("service worker uses a fresh cache and always returns an offline navigation response", () => {
  const sw = textFile("../public/sw.js");
  assert.match(sw, /app-shell-v7/);
  assert.match(sw, /const BASE_PATH = "\/clean30\/";/);
  assert.match(sw, /async function getNavigationFallback/);
  assert.match(sw, /new Response\(OFFLINE_FALLBACK_HTML/);
  assert.match(sw, /\.catch\(\(\) => getNavigationFallback\(\)\)/);
});

test("restarted onboarding detects existing users broadly and cannot import over their setup", () => {
  const onboarding = textFile("../src/components/Onboarding.jsx");
  assert.match(onboarding, /initialState\.onboardingCompleted/);
  assert.match(onboarding, /initialState\.onboardingCompletedAt/);
  assert.match(onboarding, /initialState\.firstMeaningfulUseAt/);
  assert.match(onboarding, /if \(isReturningUser\) \{/);
  assert.match(onboarding, /Existing cleaning plans can be imported from Settings/);
  assert.match(onboarding, /!isReturningUser \? \(/);
  assert.match(onboarding, /No data will be reset/);
});

test("routine action disclosure uses ordinary buttons instead of incomplete ARIA menu behavior", () => {
  const routines = textFile("../src/components/Routines.jsx");
  assert.match(routines, /data-routine-menu-trigger="true"/);
  assert.match(routines, /document\.addEventListener\("pointerdown", handlePointerDown\)/);
  assert.match(routines, /event\.key === "Escape"/);
  assert.doesNotMatch(routines, /aria-haspopup="menu"/);
  assert.doesNotMatch(routines, /role="menu"/);
  assert.doesNotMatch(routines, /role="menuitem"/);
});

test("routine editor can recover focus even after every task row is removed", () => {
  const editor = textFile("../src/components/RoutineEditorDialog.jsx");
  assert.match(editor, /const addTaskButtonRef = useRef\(null\)/);
  assert.match(editor, /const firstRenderedTask =/);
  assert.match(editor, /if \(firstTaskInputRef\.current\) firstTaskInputRef\.current\.focus\(\)/);
  assert.match(editor, /else addTaskButtonRef\.current\?\.focus\(\)/);
  assert.match(editor, /ref=\{phaseIndex === 0 \? addTaskButtonRef : undefined\}/);
});

test("release verification is wired into the package and CI after the production build", () => {
  const packageInfo = JSON.parse(textFile("../package.json"));
  const ci = textFile("../.github/workflows/ci.yml");
  const verifier = textFile("../scripts/verify-release.mjs");
  const gitignore = textFile("../.gitignore");

  assert.equal(packageInfo.scripts["verify:release"], "node scripts/verify-release.mjs");
  const buildIndex = ci.indexOf("npm run build");
  const verifyIndex = ci.indexOf("npm run verify:release");
  assert.ok(buildIndex >= 0);
  assert.ok(verifyIndex > buildIndex);
  assert.match(verifier, /dist\/index\.html/);
  assert.match(verifier, /Manifest icon is missing from the build/);
  assert.match(verifier, /saveAppState must remain void-style/);
  assert.match(verifier, /const gitignore = read\("\.gitignore"\)/);
  assert.doesNotMatch(verifier, /ls-files.*node_modules/);
  assert.match(gitignore, /(^|\n)node_modules\/?\s*($|\n)/);
});
