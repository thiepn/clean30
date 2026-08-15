import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { cleaningTaskCatalog, routineStarterTemplates } from "../src/data/taskSuggestions.js";
import {
  appendParsedTaskText,
  createRoutineDraftFromTemplate,
  createSimpleRoutineDraft,
  estimateRoutineMinutes,
  getTaskSuggestions,
  optimizeRoutineTaskOrder,
  parseRoutineTaskText
} from "../src/utils/routineLibrary.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("bulk parser accepts headings, bullets, numbered lines, and Markdown checkboxes", () => {
  const parsed = parseRoutineTaskText(`
Kitchen:
- [ ] Clear dishes
- Wipe counters
1. Clean sink

Bathroom:
* Clean toilet
2) Clean mirror
`);
  assert.equal(parsed.hasHeadings, true);
  assert.equal(parsed.taskCount, 5);
  assert.deepEqual(parsed.sections.map((section) => section.title), ["Kitchen", "Bathroom"]);
  assert.deepEqual(parsed.sections[0].tasks, ["Clear dishes", "Wipe counters", "Clean sink"]);
});

test("bulk append builds sections and skips duplicate task names", () => {
  const draft = createSimpleRoutineDraft();
  draft.phases[0].tasks[0].title = "Clear visible trash";
  const next = appendParsedTaskText(draft, `Whole home:\nClear visible trash\nPut away loose items\n\nBathroom:\nClean the toilet`);
  const titles = next.phases.flatMap((phase) => phase.tasks.map((task) => task.title));
  assert.equal(titles.filter((title) => title === "Clear visible trash").length, 1);
  assert.ok(titles.includes("Put away loose items"));
  assert.ok(titles.includes("Clean the toilet"));
  assert.ok(next.phases.some((phase) => phase.title === "Bathroom"));
});

test("task catalog is substantial and searchable by room or keyword", () => {
  assert.ok(cleaningTaskCatalog.length >= 45);
  assert.ok(getTaskSuggestions("mirror", "All", 20).some((task) => /mirror/i.test(task.title)));
  assert.ok(getTaskSuggestions("", "Bathroom", 100).every((task) => task.room === "Bathroom"));
});

test("starter routine templates create independent editable drafts with automatic estimates", () => {
  assert.ok(routineStarterTemplates.length >= 4);
  const first = createRoutineDraftFromTemplate("bathroom-clean");
  const second = createRoutineDraftFromTemplate("bathroom-clean");
  assert.equal(first.title, "Bathroom clean");
  assert.ok(first.phases[0].tasks.length >= 5);
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.phases[0].tasks[0].id, second.phases[0].tasks[0].id);
  assert.ok(first.estimatedMinutes > 0);
});

test("routine duration can be derived from tasks instead of requiring manual entry", () => {
  const draft = createRoutineDraftFromTemplate("kitchen-clean");
  const estimated = estimateRoutineMinutes(draft);
  assert.ok(estimated >= 20);
  assert.ok(estimated <= 120);
});

test("optimizer moves collection and decluttering before floors", () => {
  const draft = createSimpleRoutineDraft();
  draft.phases[0].tasks = [
    { id: "mop", title: "Mop hard floors" },
    { id: "trash", title: "Clear visible trash" },
    { id: "clutter", title: "Put away loose items" },
    { id: "vacuum", title: "Vacuum main floors" }
  ];
  const optimized = optimizeRoutineTaskOrder(draft);
  assert.deepEqual(optimized.phases[0].tasks.map((task) => task.id), ["trash", "clutter", "vacuum", "mop"]);
});

test("routine editor exposes bulk paste, rapid Enter entry, suggestions, auto time, and drag reorder", () => {
  const editor = textFile("../src/components/RoutineEditorDialog.jsx");
  assert.match(editor, /Paste a list/);
  assert.match(editor, /Markdown checkboxes/);
  assert.match(editor, /event\.key === "Enter"/);
  assert.match(editor, /onPaste=\{/);
  assert.match(editor, /Choose common cleaning tasks/);
  assert.match(editor, /Automatic/);
  assert.match(editor, /Optimize order/);
  assert.match(editor, /draggable="true"/);
});

test("Routines identifies the original starter set and offers reversible archive cleanup", () => {
  const routines = textFile("../src/components/Routines.jsx");
  assert.match(routines, /Older Clean30 starter examples found/);
  assert.match(routines, /Archive old examples/);
  assert.match(routines, /routine\.id === "initial-reset"/);
  assert.match(routines, /archived: true/);
});

test("Phase 9 styling loads after the visual-polish layers and supports a full-screen mobile editor", () => {
  const main = textFile("../src/main.jsx");
  const phaseEightB = main.indexOf('"./styles/universal-phase8b.css"');
  const phaseNine = main.indexOf('"./styles/universal-phase9.css"');
  const css = textFile("../src/styles/universal-phase9.css");
  assert.ok(phaseEightB >= 0);
  assert.ok(phaseNine > phaseEightB);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /routine-editor-sticky-footer/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
