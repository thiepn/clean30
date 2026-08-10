import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildQuickCleanPlan, quickCleanBudgets } from "../src/utils/quickClean.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Quick Clean exposes useful fixed time budgets without persisting a new setting", () => {
  assert.deepEqual(quickCleanBudgets, [5, 10, 15, 30, 45, 60]);
  const plan = buildQuickCleanPlan({ minutes: 15, rooms: ["Kitchen", "Bathroom"] });
  assert.equal(plan.requestedMinutes, 15);
  assert.ok(plan.items.length > 0);
  assert.ok(plan.estimatedMinutes <= 15);
  assert.equal(plan.fitsBudget, true);
});

test("Quick Clean generation is deterministic, bounded, and duplicate-free", () => {
  const options = {
    minutes: 30,
    rooms: ["Kitchen", "Bathroom", "Bedroom"]
  };
  const first = buildQuickCleanPlan(options);
  const second = buildQuickCleanPlan(options);
  assert.deepEqual(
    first.items.map((item) => item.title),
    second.items.map((item) => item.title)
  );
  assert.ok(first.estimatedMinutes <= 30);
  assert.equal(
    new Set(first.items.map((item) => item.title.toLowerCase())).size,
    first.items.length
  );
});

test("a larger Quick Clean distributes attention across selected rooms", () => {
  const plan = buildQuickCleanPlan({
    minutes: 30,
    rooms: ["Kitchen", "Bathroom", "Bedroom"]
  });
  const rooms = new Set(plan.items.map((item) => item.room));
  assert.ok(rooms.has("Kitchen"));
  assert.ok(rooms.has("Bathroom"));
  assert.ok(rooms.has("Bedroom"));
  assert.ok(rooms.has("Whole home"));
});

test("Quick Clean execution order keeps early collection work ahead of floors", () => {
  const plan = buildQuickCleanPlan({
    minutes: 60,
    rooms: ["Kitchen", "Bathroom", "Living room"]
  });
  const stages = plan.items.map((item) => Number(item.stage) || 55);
  assert.deepEqual(stages, [...stages].sort((a, b) => a - b));
  const firstFloor = plan.items.findIndex((item) => (Number(item.stage) || 55) >= 70);
  const firstEarly = plan.items.findIndex((item) => (Number(item.stage) || 55) <= 30);
  assert.ok(firstEarly >= 0);
  if (firstFloor >= 0) assert.ok(firstEarly < firstFloor);
});

test("Quick Clean can use existing routine tasks for custom home rooms", () => {
  const routines = [
    {
      id: "guest-room-clean",
      title: "Guest room clean",
      phases: [
        {
          id: "guest-room",
          title: "Guest room",
          tasks: [
            {
              id: "polish-dresser",
              title: "Polish guest-room dresser",
              duration: "4 min"
            }
          ]
        }
      ]
    }
  ];
  const plan = buildQuickCleanPlan({
    minutes: 10,
    rooms: ["Guest room"],
    routines
  });
  assert.ok(plan.items.some((item) => item.title === "Polish guest-room dresser"));
});

test("Routines surfaces Quick Clean without replacing Task Library or reusable routines", () => {
  const routines = textFile("../src/components/Routines.jsx");
  const dialog = textFile("../src/components/QuickCleanDialog.jsx");
  assert.match(routines, /Plan a quick clean/);
  assert.match(routines, /QuickCleanDialog/);
  assert.match(routines, /Task library/);
  assert.match(routines, /Build routine/);
  assert.match(dialog, /How much time do you have\?/);
  assert.match(dialog, /Add to Today/);
  assert.match(dialog, /Build routine/);
  assert.match(dialog, /Whole-home basics are always considered/);
});

test("Quick Clean remains schema-free and reuses the existing Today and routine-draft paths", () => {
  const app = textFile("../src/App.jsx");
  const routines = textFile("../src/components/Routines.jsx");
  const dialog = textFile("../src/components/QuickCleanDialog.jsx");
  assert.match(routines, /onAddLibraryTasksToToday/);
  assert.match(dialog, /createRoutineDraftFromLibraryItems/);
  assert.doesNotMatch(app, /quickCleanBudget/);
  assert.doesNotMatch(app, /quickCleanRooms/);
  assert.match(app, /saveAppState\(appState\);/);
});

test("Phase 11 styling loads last and keeps the planner full-screen on phones", () => {
  const main = textFile("../src/main.jsx");
  const css = textFile("../src/styles/universal-phase11.css");
  const phaseTen = main.indexOf('"./styles/universal-phase10.css"');
  const phaseEleven = main.indexOf('"./styles/universal-phase11.css"');
  assert.ok(phaseTen >= 0);
  assert.ok(phaseEleven > phaseTen);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Help keeps the direct-routine regression wording while explaining Quick Clean", () => {
  const help = textFile("../src/components/HelpGuide.jsx");
  assert.match(help, /Start, create, or edit them directly from Routines/);
  assert.match(help, /Use Quick clean when you only know how much time you have/);
});
