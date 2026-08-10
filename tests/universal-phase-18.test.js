import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import {
  createDefaultTemplate,
  createTemplateExport
} from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function jsonFile(path) {
  return JSON.parse(textFile(path));
}

function versionParts(version) {
  return String(version || "")
    .split(".")
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10));
}

function versionAtLeast(version, minimum) {
  const actual = versionParts(version);
  const floor = versionParts(minimum);
  for (let index = 0; index < 3; index += 1) {
    const actualPart = Number.isFinite(actual[index]) ? actual[index] : 0;
    const floorPart = Number.isFinite(floor[index]) ? floor[index] : 0;
    if (actualPart > floorPart) return true;
    if (actualPart < floorPart) return false;
  }
  return true;
}

test("Phase 18 raises the tested direct-dependency floor without taking a risky major upgrade", () => {
  const packageJson = jsonFile("../package.json");
  const dependencies = packageJson.dependencies || {};

  assert.equal(dependencies.vite, "^7.3.6");
  assert.equal(dependencies["@vitejs/plugin-react"], "^5.2.0");
  assert.equal(dependencies.react, "^19.2.8");
  assert.equal(dependencies["react-dom"], "^19.2.8");
  assert.doesNotMatch(dependencies.vite, /^\^8\./);
  assert.doesNotMatch(dependencies["@vitejs/plugin-react"], /^\^6\./);
});

test("the refreshed lockfile is above the security floors that motivated Phase 18", () => {
  const lock = jsonFile("../package-lock.json");
  const packages = lock.packages || {};
  const vite = packages["node_modules/vite"]?.version;
  const pluginReact = packages["node_modules/@vitejs/plugin-react"]?.version;
  const react = packages["node_modules/react"]?.version;
  const reactDom = packages["node_modules/react-dom"]?.version;
  const postcss = packages["node_modules/postcss"]?.version;
  const esbuild = packages["node_modules/esbuild"]?.version;

  assert.ok(versionAtLeast(vite, "7.3.6") && versionParts(vite)[0] === 7);
  assert.ok(versionAtLeast(pluginReact, "5.2.0") && versionParts(pluginReact)[0] === 5);
  assert.ok(versionAtLeast(react, "19.2.8") && versionParts(react)[0] === 19);
  assert.ok(versionAtLeast(reactDom, "19.2.8") && versionParts(reactDom)[0] === 19);
  assert.ok(versionAtLeast(postcss, "8.5.18"));
  assert.ok(versionAtLeast(esbuild, "0.28.1"));
});

test("release CI now treats dependency advisories as a release gate", () => {
  const packageJson = jsonFile("../package.json");
  const ci = textFile("../.github/workflows/ci.yml");

  assert.equal(packageJson.scripts?.["audit:release"], "npm audit --audit-level=low");
  assert.match(ci, /name: Audit release dependencies/);
  assert.match(ci, /run: npm run audit:release/);
});

test("Phase 18 established a versioned PWA cache boundary that future release phases may advance", () => {
  const sw = textFile("../public/sw.js");
  const verifier = textFile("../scripts/verify-release.mjs");
  const cacheMatch = sw.match(/app-shell-v(\d+)/);

  assert.ok(cacheMatch, "The service worker must retain a versioned app-shell cache.");
  assert.ok(Number(cacheMatch[1]) >= 18, "The current cache boundary must not regress below Phase 18.");
  assert.match(verifier, /app-shell-v\d+/);
  assert.match(verifier, /service-worker cache boundary verified/);
  assert.match(sw, /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/);
});

test("one command can run the local release-candidate acceptance suite", () => {
  const packageJson = jsonFile("../package.json");
  const command = packageJson.scripts?.["verify:release-candidate"] || "";

  assert.match(command, /npm run audit:release/);
  assert.match(command, /npm test/);
  assert.match(command, /npm run build/);
  assert.match(command, /npm run verify:release/);
  assert.match(command, /node --check public\/sw\.js/);
});

test("the temporary lockfile-refresh workflow is not part of the release candidate", () => {
  assert.equal(
    existsSync(new URL("../.github/workflows/phase18-lockfile-refresh.yml", import.meta.url)),
    false
  );
});

test("Phase 18 remains schema-free and preserves deployment and persistence invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");

  assert.equal(CURRENT_BACKUP_VERSION, 3);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(
    app,
    /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s
  );
});
