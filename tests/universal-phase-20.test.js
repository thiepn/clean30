import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import { createDefaultTemplate, createTemplateExport } from "../src/utils/templateUtils.js";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Phase 20 gives the app one four-tab mental model centered on Clean", () => {
  const navigation = read("src/components/Navigation.jsx");
  assert.match(navigation, /label: "Clean"/);
  assert.match(navigation, /label: "Routines"/);
  assert.match(navigation, /label: "Progress"/);
  assert.match(navigation, /label: "Settings"/);
  assert.doesNotMatch(navigation, /label: "Today"/);
});

test("Clean exposes Just start, time, rooms, and the existing Today list without Quick Clean jargon", () => {
  const startPanel = read("src/components/CleanStartPanel.jsx");
  const dashboard = read("src/components/Dashboard.jsx");
  assert.match(startPanel, />Just start</);
  assert.match(startPanel, /I have some time/);
  assert.match(startPanel, /Clean a room/);
  assert.match(startPanel, /startTimedClean\(10\)/);
  assert.match(dashboard, /<h2>Today&apos;s list<\/h2>/);
  assert.doesNotMatch(startPanel, />Quick Clean</);
});

test("ad-hoc task and time selection make Start cleaning the primary endpoint", () => {
  const chooser = read("src/components/TaskLibraryDialog.jsx");
  const planner = read("src/components/QuickCleanDialog.jsx");
  assert.match(chooser, /Start cleaning/);
  assert.match(planner, /Start cleaning/);
  assert.match(chooser, /one focused clean/);
  assert.match(planner, /one focused clean/);
});

test("Routines is only saved cleans plus one New routine entry", () => {
  const routines = read("src/components/Routines.jsx");
  assert.match(routines, /<h2>Routines<\/h2>/);
  assert.match(routines, /\+ New routine/);
  assert.match(routines, /<RoutineCreationDialog/);
  assert.match(routines, /purpose="routine"/);
  assert.doesNotMatch(routines, /Quick clean/);
  assert.doesNotMatch(routines, /Task Library/);
});

test("new routine presents exactly four understandable starting methods", () => {
  const creation = read("src/components/RoutineCreationDialog.jsx");
  for (const label of [
    "Choose tasks",
    "Paste a checklist",
    "Use a starter",
    "Start blank"
  ]) {
    assert.match(creation, new RegExp(label));
  }
  assert.match(creation, /How do you want to make it\?/);
  assert.match(creation, /same reusable routine/);
});

test("the shared task chooser changes its final action for routine creation instead of starting a clean", () => {
  const chooser = read("src/components/TaskLibraryDialog.jsx");
  assert.match(chooser, /purpose = "clean"/);
  assert.match(chooser, /purpose === "routine"/);
  assert.match(chooser, /Choose tasks for your routine/);
  assert.match(chooser, /Continue/);
  assert.match(chooser, /purpose === "routine"\) return/);
});

test("paste checklist is a focused creation path before the common routine editor", () => {
  const routines = read("src/components/Routines.jsx");
  const paste = read("src/components/RoutinePasteDialog.jsx");
  assert.match(routines, /<RoutinePasteDialog/);
  assert.match(routines, /appendParsedTaskText\(createSimpleRoutineDraft\(\), text\)/);
  assert.match(paste, /Paste one task per line/);
  assert.match(paste, /Markdown checkboxes/);
  assert.match(paste, /preview\.taskCount/);
});

test("rooms are configuration in Settings while room status remains contextual guidance", () => {
  const settings = read("src/components/Settings.jsx");
  const progress = read("src/components/History.jsx");
  assert.match(settings, /title="Rooms"/);
  assert.match(settings, /Edit rooms/);
  assert.match(settings, /Rooms help Clean30 suggest relevant work/);
  assert.match(progress, /Home snapshot/);
});

test("onboarding and Help teach goals rather than internal subsystems", () => {
  const onboarding = read("src/components/Onboarding.jsx");
  const help = read("src/components/HelpGuide.jsx");
  assert.match(onboarding, /Choose what to clean now/);
  assert.match(onboarding, /Start cleaning/);
  assert.match(help, /Use Just start/);
  assert.match(help, /choose how much time you have/);
  assert.doesNotMatch(help, /Task Library/);
  assert.doesNotMatch(help, /Quick Clean/);
});

test("Phase 20 stays compatible with the current persisted and deployment contracts", () => {
  assert.equal(CURRENT_BACKUP_VERSION, 4);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(read("vite.config.js"), /base:\s*["']\/clean30\/["']/);
  assert.match(read("public/sw.js"), /app-shell-v20/);
  assert.match(
    read("src/App.jsx"),
    /useEffect\(\(\) =>\s*{\s*saveAppState\(appState\);\s*}, \[appState\]\);/s
  );
});
