import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import { createDefaultTemplate, createTemplateExport } from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Clean is one obvious primary entry while internal route identity stays compatible", () => {
  const navigation = textFile("../src/components/Navigation.jsx");
  const clean = textFile("../src/components/CleanStartPanel.jsx");
  assert.match(navigation, /id: "dashboard", label: "Clean"/);
  assert.match(clean, /What do you want to clean\?/);
  assert.match(clean, /Just start/);
  assert.match(clean, /I have some time/);
  assert.match(clean, /Clean a room/);
  assert.match(clean, /Choose any tasks/);
});

test("Quick Clean and Task Library survive as implementation machinery rather than parallel user concepts", () => {
  const layout = textFile("../src/components/Layout.jsx");
  const routines = textFile("../src/components/Routines.jsx");
  const chooser = textFile("../src/components/TaskLibraryDialog.jsx");
  const planner = textFile("../src/components/QuickCleanDialog.jsx");
  assert.doesNotMatch(layout, /Quick clean/i);
  assert.doesNotMatch(routines, /Quick clean|Task library|Your home/i);
  assert.match(chooser, /Choose tasks/);
  assert.match(chooser, /Start cleaning/);
  assert.match(planner, /Choose time/);
  assert.match(planner, /Start cleaning/);
});

test("Routines is only saved reusable cleans plus one routine creation flow", () => {
  const routines = textFile("../src/components/Routines.jsx");
  const editor = textFile("../src/components/RoutineEditorDialog.jsx");
  assert.match(routines, /Saved cleans/);
  assert.match(routines, /\+ New routine/);
  assert.match(routines, /One place to make a routine/);
  assert.match(editor, /Choose common cleaning tasks, paste a checklist, use a starter, or type from scratch/);
  assert.match(editor, /Choose how to start/);
});

test("rooms are setup infrastructure in Settings and selection context in Clean", () => {
  const settings = textFile("../src/components/Settings.jsx");
  const clean = textFile("../src/components/CleanStartPanel.jsx");
  assert.match(settings, /title="Rooms"/);
  assert.match(settings, /Edit rooms/);
  assert.match(settings, /HomeRoomsDialog/);
  assert.match(clean, /rankRoomsForCare/);
  assert.match(clean, /Clean a room/);
});

test("chosen generated work is scoped before opening focused cleaning", () => {
  const dashboard = textFile("../src/components/Dashboard.jsx");
  const mode = textFile("../src/components/TodayCleaningMode.jsx");
  assert.match(dashboard, /preferredTodayTaskKeys/);
  assert.match(dashboard, /startChosenTasks/);
  assert.match(dashboard, /onAddLibraryTasksToToday\?\.\(items\)/);
  assert.match(dashboard, /preferredTaskKeys=\{preferredTodayTaskKeys\}/);
  assert.match(mode, /preferredTaskKeys/);
  assert.match(mode, /scopedTasks/);
  assert.match(mode, /getTodayTaskSelectionKey/);
});

test("an active routine clean remains the sole focused cleaning session", () => {
  const dashboard = textFile("../src/components/Dashboard.jsx");
  assert.match(dashboard, /!activeSession \? \(/);
  assert.match(dashboard, /disabled=\{!incompleteTasks\.length \|\| Boolean\(activeSession\)\}/);
  assert.match(dashboard, /Finish current clean first/);
  assert.match(dashboard, /Continue cleaning/);
});

test("the consolidation is responsive and keeps reduced-motion support", () => {
  const main = textFile("../src/main.jsx");
  const css = textFile("../src/styles/universal-intuitiveness.css");
  const phaseFourteen = main.indexOf('"./styles/universal-phase14.css"');
  const consolidation = main.indexOf('"./styles/universal-intuitiveness.css"');
  assert.ok(consolidation > phaseFourteen);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(max-width: 480px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("the intuitiveness update stays schema-free and preserves release invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");
  assert.equal(CURRENT_BACKUP_VERSION, 4);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(app, /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s);
});
