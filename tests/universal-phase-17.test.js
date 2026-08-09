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

test("Phase 17 establishes a fresh PWA release cache and removes older Clean30 caches", () => {
  const sw = textFile("../public/sw.js");
  const verifier = textFile("../scripts/verify-release.mjs");

  assert.match(sw, /app-shell-v17/);
  assert.match(sw, /const CACHE_PREFIX = "clean30-"/);
  assert.match(sw, /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/);
  assert.match(sw, /caches\.delete\(key\)/);
  assert.match(verifier, /app-shell-v17/);
  assert.match(verifier, /Phase 17 app-shell cache boundary/);
});

test("PWA update handoff still waits for explicit reload and then claims the new controller", () => {
  const sw = textFile("../public/sw.js");
  const main = textFile("../src/main.jsx");

  assert.match(sw, /event\.data\?\.type === "SKIP_WAITING"/);
  assert.match(sw, /self\.skipWaiting\(\)/);
  assert.match(sw, /self\.clients\.claim\(\)/);
  assert.match(main, /clean30:updateAvailable/);
  assert.match(main, /clean30:applyUpdate/);
  assert.match(main, /worker\.postMessage\(\{ type: "SKIP_WAITING" \}\)/);
  assert.match(main, /controllerchange/);
});

test("the current routine cannot be edited while its clean is active", () => {
  const routines = textFile("../src/components/Routines.jsx");

  assert.match(routines, /function openEdit\(routineId\) \{\s*if \(isCurrentRoutine\(routineId\)\) return;/s);
  assert.match(routines, /function openAdvancedEdit\(routineId\) \{\s*if \(isCurrentRoutine\(routineId\)\) return;/s);
  assert.match(routines, /disabled=\{isCurrent\}[\s\S]*?>\s*Edit\s*<\/button>/);
  assert.match(routines, /disabled=\{isCurrent\}[\s\S]*?>\s*Advanced structure\s*<\/button>/);
  assert.match(routines, /disabled=\{isCurrentRoutine\(selectedRoutine\.id\)\}/);
  assert.match(routines, /Finish or discard the current clean before editing this routine/);
});

test("advanced routine editing becomes read-only while the active template has a current clean", () => {
  const customize = textFile("../src/components/Customize.jsx");

  assert.match(customize, /const activePlanSession = Boolean\(/);
  assert.match(customize, /activeSession\?\.templateId === activeTemplate\.id/);
  assert.match(customize, /const routinesCanEdit = focusedTodayEditor/);
  assert.match(customize, /canEdit=\{routinesCanEdit\}/);
  assert.match(customize, /Editing paused while a clean is active/);
  assert.match(customize, /const editorStatus = activeSection === "routines" && !routinesCanEdit/);
  assert.match(customize, /resetTemplateLocked=\{activePlanSession\}/);
  assert.match(customize, /disabled=\{resetTemplateLocked\}/);
});

test("Advanced Settings blocks starter restore while that cleaning plan has an active session", () => {
  const settings = textFile("../src/components/Settings.jsx");

  assert.match(settings, /import \{ loadAppState \} from "\.\.\/utils\/storage\.js"/);
  assert.match(settings, /const starterRestoreLocked = Boolean\(/);
  assert.match(settings, /loadAppState\(\)\.activeSession\?\.templateId === template\.id/);
  assert.match(settings, /disabled=\{starterRestoreLocked\}/);
  assert.match(settings, /Unavailable while a clean from this plan is active/);
});

test("release CI uses current Node 24-based GitHub Action majors while testing the app on Node 22", () => {
  const ci = textFile("../.github/workflows/ci.yml");

  assert.match(ci, /uses: actions\/checkout@v7/);
  assert.match(ci, /uses: actions\/setup-node@v7/);
  assert.match(ci, /node-version: 22/);
  assert.doesNotMatch(ci, /actions\/(?:checkout|setup-node)@v4/);
});

test("Phase 17 release hardening remains schema-free and preserves deployment and persistence invariants", () => {
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
