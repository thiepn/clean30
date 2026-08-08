import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createBlankRoutineTask,
  createSimpleRoutineDraft,
  duplicateRoutineForLibrary,
  hasDuplicateRoutineTitle,
  sanitizeRoutineDraft
} from "../src/utils/routineLibrary.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("new routine fields stay blank until the user types", () => {
  const draft = createSimpleRoutineDraft();
  const task = createBlankRoutineTask();
  assert.equal(draft.title, "");
  assert.equal(draft.phases[0].title, "Tasks");
  assert.equal(draft.phases[0].tasks[0].title, "");
  assert.equal(task.title, "");
});

test("simple routine drafts save into one ordinary Tasks section", () => {
  const draft = createSimpleRoutineDraft();
  draft.title = "Sunday clean";
  draft.estimatedMinutes = 25;
  draft.phases[0].tasks[0].title = "Clean shower";
  const saved = sanitizeRoutineDraft(draft);
  assert.equal(saved.title, "Sunday clean");
  assert.equal(saved.estimatedMinutes, 25);
  assert.equal(saved.phases.length, 1);
  assert.equal(saved.phases[0].title, "Tasks");
  assert.equal(saved.phases[0].tasks[0].title, "Clean shower");
});

test("routine editing preserves multiple existing sections", () => {
  const saved = sanitizeRoutineDraft({
    id: "routine-a",
    title: "Weekly clean",
    estimatedMinutes: 40,
    phases: [
      {
        id: "phase-a",
        title: "Kitchen",
        tasks: [{ id: "task-a", title: "Wipe counters" }]
      },
      {
        id: "phase-b",
        title: "Bathroom",
        tasks: [{ id: "task-b", title: "Clean sink" }]
      }
    ]
  });
  assert.deepEqual(
    saved.phases.map((phase) => phase.title),
    ["Kitchen", "Bathroom"]
  );
  assert.deepEqual(
    saved.phases.map((phase) => phase.tasks.length),
    [1, 1]
  );
});

test("routine duplicate receives independent routine, section, and task IDs", () => {
  const original = sanitizeRoutineDraft({
    id: "routine-a",
    title: "Weekly clean",
    estimatedMinutes: 40,
    phases: [
      {
        id: "phase-a",
        title: "Tasks",
        tasks: [{ id: "task-a", title: "Vacuum" }]
      }
    ]
  });
  const duplicate = duplicateRoutineForLibrary(original, [
    original.title,
    "Weekly clean Copy"
  ]);
  assert.equal(duplicate.title, "Weekly clean Copy 2");
  assert.notEqual(duplicate.id, original.id);
  assert.notEqual(duplicate.phases[0].id, original.phases[0].id);
  assert.notEqual(duplicate.phases[0].tasks[0].id, original.phases[0].tasks[0].id);
});

test("routine title comparison is case-insensitive and ignores the current routine", () => {
  const routines = [
    { id: "a", title: "Weekly Clean" },
    { id: "b", title: "Quick tidy" }
  ];
  assert.equal(hasDuplicateRoutineTitle(" weekly clean ", routines), true);
  assert.equal(hasDuplicateRoutineTitle("weekly clean", routines, "a"), false);
});

test("Routines retains direct Start and advanced editing while routine building can evolve", () => {
  const routines = textFile("../src/components/Routines.jsx");
  const editor = textFile("../src/components/RoutineEditorDialog.jsx");
  assert.match(routines, /"Continue" : "Start"/);
  assert.match(routines, /Start routine/);
  assert.match(routines, /Build routine|New routine/);
  assert.match(routines, /Advanced structure/);
  assert.match(routines, /onStartRoutine\(routine.id\)/);
  assert.match(editor, /Routine name/);
  assert.match(editor, /Estimated time/);
  assert.match(editor, /Create routine/);
  assert.match(editor, /createBlankRoutineTask/);
  assert.doesNotMatch(editor, /Template ID|Today defaults/);
});

test("current-clean labels require both template and routine identity", () => {
  const app = textFile("../src/App.jsx");
  const routines = textFile("../src/components/Routines.jsx");
  assert.match(app, /activeTemplateId=\{activeTemplate.id\}/);
  assert.match(routines, /activeSession\?\.templateId === activeTemplateId/);
  assert.match(routines, /activeSession\?\.routineId === routineId/);
});

test("starting a routine requests focused cleaning on Today", () => {
  const app = textFile("../src/App.jsx");
  const dashboard = textFile("../src/components/Dashboard.jsx");
  assert.match(app, /autoOpenCleanModeSessionId/);
  assert.match(app, /setAutoOpenCleanModeSessionId\(nextSession.id\)/);
  assert.match(dashboard, /onAutoOpenCleanModeHandled/);
  assert.match(dashboard, /setCleanModeOpen\(true\)/);
});

test("Phase 3 styles load after earlier universal styles", () => {
  const main = textFile("../src/main.jsx");
  const phaseTwo = main.indexOf('"./styles/universal-phase2.css"');
  const phaseThree = main.indexOf('"./styles/universal-phase3.css"');
  assert.ok(phaseTwo >= 0);
  assert.ok(phaseThree > phaseTwo);
});
