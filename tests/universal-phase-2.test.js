import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getAdjacentTodayCleaningTaskId,
  getInitialTodayCleaningTaskId,
  getNextIncompleteTodayTaskId,
  getTodayCleaningProgress,
  orderTodayCleaningTasks
} from "../src/utils/todayCleaning.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const tasks = [
  { id: "done-a", text: "Done A", completed: true },
  { id: "todo-a", text: "Todo A", completed: false },
  { id: "todo-b", text: "Todo B", completed: false },
  { id: "done-b", text: "Done B", completed: true }
];

test("Today cleaning orders unfinished tasks before completed tasks", () => {
  assert.deepEqual(
    orderTodayCleaningTasks(tasks).map((task) => task.id),
    ["todo-a", "todo-b", "done-a", "done-b"]
  );
  assert.equal(getInitialTodayCleaningTaskId(tasks), "todo-a");
  assert.equal(
    getInitialTodayCleaningTaskId([
      { id: "done-only", completed: true }
    ]),
    "done-only"
  );
  assert.equal(getInitialTodayCleaningTaskId([]), "");
});

test("Today cleaning navigation wraps and advances to another unfinished task", () => {
  assert.equal(getAdjacentTodayCleaningTaskId(tasks, "todo-a", 1), "todo-b");
  assert.equal(getAdjacentTodayCleaningTaskId(tasks, "todo-a", -1), "done-b");
  assert.equal(getNextIncompleteTodayTaskId(tasks, "todo-a"), "todo-b");
  assert.equal(
    getNextIncompleteTodayTaskId(
      [
        { id: "todo", completed: false },
        { id: "done", completed: true }
      ],
      "todo"
    ),
    ""
  );
});

test("Today cleaning progress is derived directly from Today tasks", () => {
  assert.deepEqual(getTodayCleaningProgress(tasks), {
    completed: 2,
    total: 4,
    percent: 50
  });
  assert.deepEqual(getTodayCleaningProgress([]), {
    completed: 0,
    total: 0,
    percent: 0
  });
});

test("Today screen removes Calendar and bulky Quick Start from its normal idle layout", () => {
  const dashboard = textFile("../src/components/Dashboard.jsx");
  assert.doesNotMatch(dashboard, /buildMonthCells|dashboard-calendar-panel|Calendar day/);
  assert.doesNotMatch(dashboard, />Quick Start</);
  assert.match(dashboard, /Start cleaning/);
  assert.match(dashboard, /today-more-panel/);
  assert.match(dashboard, /Completed/);
  assert.match(dashboard, /activeSession \? \(/);
});

test("Today focused cleaning mode is a real modal with progress and task controls", () => {
  const mode = textFile("../src/components/TodayCleaningMode.jsx");
  assert.match(mode, /role="dialog"/);
  assert.match(mode, /aria-modal="true"/);
  assert.match(mode, /role="progressbar"/);
  assert.match(mode, /Mark done/);
  assert.match(mode, /Previous/);
  assert.match(mode, /Next/);
  assert.match(mode, /Today&apos;s list is complete/);
});

test("Phase 2 styles are loaded after the Phase 1 foundation styles", () => {
  const main = textFile("../src/main.jsx");
  const phaseOneIndex = main.indexOf('"./styles/universal-phase1.css"');
  const phaseTwoIndex = main.indexOf('"./styles/universal-phase2.css"');
  assert.ok(phaseOneIndex >= 0);
  assert.ok(phaseTwoIndex > phaseOneIndex);
});
