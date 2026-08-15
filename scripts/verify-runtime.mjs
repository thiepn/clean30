import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "..");
const viteBin = resolve(rootDir, "node_modules", "vite", "bin", "vite.js");
const host = "127.0.0.1";
const basePath = "/clean30/";

async function findAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 4173;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

const port = await findAvailablePort();
const baseUrl = `http://${host}:${port}`;
const appUrl = `${baseUrl}${basePath}`;
const serverOutput = [];

function collectOutput(chunk) {
  const text = String(chunk || "");
  if (!text) return;
  serverOutput.push(text);
  if (serverOutput.length > 30) serverOutput.shift();
}

async function waitForServer(timeoutMs = 15000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(appUrl, { redirect: "follow" });
      if (response.ok) return response;
      lastError = new Error(`Preview returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  const output = serverOutput.join("").trim();
  throw new Error(
    `Timed out waiting for the production preview.${lastError ? ` Last error: ${lastError.message}` : ""}${output ? `\nPreview output:\n${output}` : ""}`
  );
}

function extractScopedReferences(html) {
  const references = new Set();
  const pattern = /(?:src|href)=["'](\/clean30\/[^"'#?]+(?:\?[^"'#]*)?)["']/g;
  let match = pattern.exec(html);
  while (match) {
    references.add(match[1]);
    match = pattern.exec(html);
  }
  return [...references];
}

async function fetchRequired(pathname, label = pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "follow" });
  assert.equal(response.status, 200, `${label} must return HTTP 200.`);
  const body = await response.arrayBuffer();
  assert.ok(body.byteLength > 0, `${label} must not be empty.`);
  return { response, body };
}

const preview = spawn(
  process.execPath,
  [viteBin, "preview", "--host", host, "--port", String(port), "--strictPort"],
  {
    cwd: rootDir,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"]
  }
);

preview.stdout.on("data", collectOutput);
preview.stderr.on("data", collectOutput);

try {
  const initialResponse = await waitForServer();
  const html = await initialResponse.text();

  assert.match(html, /<div id=["']root["']><\/div>/, "Production HTML must expose the React root.");
  assert.match(html, /\/clean30\/assets\/[^"']+\.js/, "Production HTML must reference a scoped JavaScript bundle.");
  assert.match(html, /\/clean30\/assets\/[^"']+\.css/, "Production HTML must reference a scoped CSS bundle.");
  assert.doesNotMatch(html, /(?:src|href)=["']\/assets\//, "Production HTML must not reference root-level /assets/ URLs.");

  const scopedReferences = extractScopedReferences(html);
  assert.ok(scopedReferences.length >= 3, "Production HTML should expose multiple scoped release assets.");

  for (const pathname of scopedReferences) {
    const { response } = await fetchRequired(pathname, `HTML asset ${pathname}`);
    const contentType = response.headers.get("content-type") || "";
    if (pathname.endsWith(".js")) {
      assert.match(contentType, /javascript/i, `JavaScript asset ${pathname} should use a JavaScript content type.`);
    }
    if (pathname.endsWith(".css")) {
      assert.match(contentType, /text\/css/i, `CSS asset ${pathname} should use text/css.`);
    }
  }

  const manifestResult = await fetchRequired(`${basePath}manifest.webmanifest`, "PWA manifest");
  const manifest = JSON.parse(Buffer.from(manifestResult.body).toString("utf8"));
  assert.equal(manifest.id, basePath, "Runtime manifest id must remain /clean30/.");
  assert.equal(manifest.start_url, basePath, "Runtime manifest start_url must remain /clean30/.");
  assert.equal(manifest.scope, basePath, "Runtime manifest scope must remain /clean30/.");

  for (const icon of manifest.icons || []) {
    assert.ok(icon.src.startsWith(basePath), `Runtime manifest icon must stay scoped: ${icon.src}`);
    await fetchRequired(icon.src, `Manifest icon ${icon.src}`);
  }

  const swResult = await fetchRequired(`${basePath}sw.js`, "Service worker");
  const serviceWorker = Buffer.from(swResult.body).toString("utf8");
  assert.match(serviceWorker, /const BASE_PATH = "\/clean30\/";/, "Served service worker must retain the deployment base.");
  assert.match(serviceWorker, /app-shell-v20/, "Served service worker must use the autopilot v20 cache boundary.");
  assert.match(serviceWorker, /getNavigationFallback/, "Served service worker must retain the offline navigation fallback.");

  const startUrlResponse = await fetch(`${baseUrl}${manifest.start_url}`, { redirect: "follow" });
  assert.equal(startUrlResponse.status, 200, "Manifest start_url must load successfully from the production preview.");

  console.log("Clean30 runtime smoke verification passed.");
  console.log(`- production preview: ${appUrl}`);
  console.log(`- scoped HTML assets verified: ${scopedReferences.length}`);
  console.log(`- manifest icons verified over HTTP: ${(manifest.icons || []).length}`);
  console.log("- service worker served from /clean30/sw.js");
} finally {
  if (!preview.killed) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      preview.kill("SIGTERM");
    }
  }
  await new Promise((resolveWait) => {
    if (preview.exitCode !== null) {
      resolveWait();
      return;
    }
    const timeout = setTimeout(resolveWait, 1500);
    preview.once("exit", () => {
      clearTimeout(timeout);
      resolveWait();
    });
  });
}
