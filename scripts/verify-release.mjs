import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import {
  createDefaultTemplate,
  createTemplateExport
} from "../src/utils/templateUtils.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "..");
const distDir = resolve(rootDir, "dist");
const expectedBase = "/clean30/";

function read(relativePath) {
  return readFileSync(resolve(rootDir, relativePath), "utf8");
}

function requireFile(relativePath) {
  const path = resolve(rootDir, relativePath);
  assert.ok(existsSync(path), `Missing required release file: ${relativePath}`);
  return path;
}

requireFile("dist/index.html");
requireFile("dist/manifest.webmanifest");
requireFile("dist/sw.js");

const viteConfig = read("vite.config.js");
assert.match(
  viteConfig,
  /base:\s*["']\/clean30\/["']/,
  "Vite base must remain /clean30/."
);

const builtIndex = read("dist/index.html");
assert.match(
  builtIndex,
  /\/clean30\/assets\/[^"']+\.js/,
  "Built JavaScript assets must use the GitHub Pages /clean30/ base."
);
assert.match(
  builtIndex,
  /\/clean30\/assets\/[^"']+\.css/,
  "Built CSS assets must use the GitHub Pages /clean30/ base."
);
assert.match(
  builtIndex,
  /\/clean30\/manifest\.webmanifest/,
  "Built HTML must reference the scoped manifest."
);
assert.doesNotMatch(
  builtIndex,
  /(?:src|href)=["']\/assets\//,
  "Built HTML must not emit root-level /assets/ references."
);

const manifest = JSON.parse(read("dist/manifest.webmanifest"));
assert.equal(manifest.id, expectedBase, "Manifest id must use /clean30/.");
assert.equal(manifest.start_url, expectedBase, "Manifest start_url must use /clean30/.");
assert.equal(manifest.scope, expectedBase, "Manifest scope must use /clean30/.");
assert.equal(manifest.display, "standalone", "Manifest must remain installable as a standalone PWA.");
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "Manifest must include app icons.");

for (const icon of manifest.icons) {
  assert.ok(
    typeof icon.src === "string" && icon.src.startsWith(expectedBase),
    `Manifest icon must stay under ${expectedBase}: ${icon.src}`
  );
  const relativeIconPath = icon.src.slice(expectedBase.length);
  assert.ok(
    existsSync(resolve(distDir, relativeIconPath)),
    `Manifest icon is missing from the build: ${icon.src}`
  );
}

const serviceWorker = read("dist/sw.js");
assert.match(
  serviceWorker,
  /const BASE_PATH = "\/clean30\/";/,
  "Service worker base path must match the deployed app path."
);
assert.match(
  serviceWorker,
  /app-shell-v17/,
  "The release candidate must use the Phase 17 app-shell cache boundary."
);
assert.match(
  serviceWorker,
  /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/,
  "Service worker activation must remove older Clean30 release caches."
);
assert.match(
  serviceWorker,
  /getNavigationFallback/,
  "Service worker must provide an explicit navigation fallback."
);
assert.match(
  serviceWorker,
  /new Response\(OFFLINE_FALLBACK_HTML/,
  "Navigation fallback must always resolve to a Response when no cached shell exists."
);

assert.equal(CURRENT_BACKUP_VERSION, 3, "Full-backup schema changed unexpectedly.");
assert.equal(
  createTemplateExport(createDefaultTemplate()).version,
  2,
  "Template-export schema changed unexpectedly."
);

const storageSource = read("src/utils/storage.js");
assert.match(
  storageSource,
  /export function saveAppState\(state\)\s*{\s*writeJson\(STORAGE_KEYS\.appState, normalizeAppState\(state\)\);\s*}/s,
  "saveAppState must remain void-style."
);

const appSource = read("src/App.jsx");
assert.match(
  appSource,
  /useEffect\(\(\) =>\s*{\s*saveAppState\(appState\);\s*}, \[appState\]\);/s,
  "App persistence effect must not return saveAppState."
);

const gitignore = read(".gitignore");
assert.match(
  gitignore,
  /(^|\n)node_modules\/?\s*($|\n)/,
  "node_modules must remain ignored so new dependency files are not added to the repository."
);

console.log("Clean30 release verification passed.");
console.log(`- deployment base: ${expectedBase}`);
console.log(`- backup schema: v${CURRENT_BACKUP_VERSION}`);
console.log("- template export schema: v2");
console.log(`- manifest icons verified: ${manifest.icons.length}`);
console.log("- Phase 17 service-worker cache boundary verified");
console.log("- service worker offline fallback verified");
console.log("- node_modules ignore rule verified");
