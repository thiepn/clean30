import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getTaskLibraryItems } from "../src/utils/homeLibrary.js";
import { buildQuickCleanPlan } from "../src/utils/quickClean.js";
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

function customRoutine({ archived = false } = {}) {
  return {
    id: archived ? "archived-storage" : "active-storage",
    title: archived ? "Archived storage clean" : "Storage clean",
    archived,
    phases: [
      {
        id: "storage-phase",
        title: "Storage room",
        tasks: [
          {
            id: "polish-shelf",
            title: "Polish trophy shelf",
            duration: "4 min",
            detail: "",
            note: "",
            tags: [],
            priority: "normal"
          }
        ]
      }
    ]
  };
}

test("archived routine tasks stay out of active Task Library suggestions", () => {
  const items = getTaskLibraryItems({
    routines: [customRoutine({ archived: true })],
    homeRooms: ["Storage room"],
    room: "All"
  });

  assert.equal(items.some((item) => item.title === "Polish trophy shelf"), false);
});

test("active custom routine tasks remain reusable in Task Library and Quick Clean", () => {
  const routine = customRoutine();
  const items = getTaskLibraryItems({
    routines: [routine],
    homeRooms: ["Storage room"],
    room: "Storage room"
  });
  const plan = buildQuickCleanPlan({
    minutes: 15,
    rooms: ["Storage room"],
    routines: [routine],
    history: [],
    currentDateKey: "2026-08-09"
  });

  assert.ok(items.some((item) => item.title === "Polish trophy shelf"));
  assert.ok(plan.items.some((item) => item.title === "Polish trophy shelf"));
});

test("archived custom routines cannot leak back into generated Quick Clean plans", () => {
  const plan = buildQuickCleanPlan({
    minutes: 15,
    rooms: ["Storage room"],
    routines: [customRoutine({ archived: true })],
    history: [],
    currentDateKey: "2026-08-09"
  });

  assert.equal(plan.items.some((item) => item.title === "Polish trophy shelf"), false);
});

test("Phase 19 production runtime smoke verification is part of local and CI release acceptance", () => {
  const packageJson = jsonFile("../package.json");
  const ci = textFile("../.github/workflows/ci.yml");
  const runtimeVerifier = textFile("../scripts/verify-runtime.mjs");
  const releaseCommand = packageJson.scripts?.["verify:release-candidate"] || "";

  assert.equal(packageJson.scripts?.["verify:runtime"], "node scripts/verify-runtime.mjs");
  assert.match(releaseCommand, /npm run verify:runtime/);
  assert.match(ci, /name: Verify production runtime/);
  assert.match(ci, /run: npm run verify:runtime/);
  assert.match(runtimeVerifier, /npmCommand/);
  assert.match(runtimeVerifier, /npm run preview|\["run", "preview"/);
  assert.match(runtimeVerifier, /\/clean30\//);
  assert.match(runtimeVerifier, /scoped HTML assets verified/);
  assert.match(runtimeVerifier, /manifest icons verified over HTTP/);
  assert.match(runtimeVerifier, /app-shell-v19/);
});

test("Phase 19 advances the final PWA cache while preserving old-cache cleanup", () => {
  const sw = textFile("../public/sw.js");
  const verifier = textFile("../scripts/verify-release.mjs");

  assert.match(sw, /app-shell-v19/);
  assert.doesNotMatch(sw, /app-shell-v18/);
  assert.match(sw, /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/);
  assert.match(verifier, /app-shell-v19/);
  assert.match(verifier, /Phase 19 service-worker cache boundary verified/);
});

test("Phase 19 remains schema-free and preserves deployment and persistence invariants", () => {
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
