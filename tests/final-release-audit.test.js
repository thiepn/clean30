import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createSession, getLastRoutineFinishedAt } from "../src/utils/calculations.js";
import { parseDurationMinutes } from "../src/utils/duration.js";
import {
  createRoutineDraftFromLibraryItems,
  getCanonicalHomeRoomName,
  getHomeRoomNames,
  getTaskLibraryItems,
  isReservedHomeRoomName
} from "../src/utils/homeLibrary.js";
import { buildQuickCleanPlan } from "../src/utils/quickClean.js";
import { getLastFullRoomRoutineCompletion } from "../src/utils/roomCare.js";
import {
  appendParsedTaskText,
  createSimpleRoutineDraft,
  moveRoutineTaskByDrop,
  parseRoutineTaskText
} from "../src/utils/routineLibrary.js";
import { CURRENT_BACKUP_VERSION, normalizeAppState } from "../src/utils/storage.js";
import { createDefaultTemplate, createTemplateExport } from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function roomRoutine(id, room, title = "Polish shelf") {
  return {
    id,
    title: `${room} clean`,
    archived: false,
    estimatedMinutes: 5,
    estimatedTime: "5 min",
    phases: [
      {
        id: `${id}-phase`,
        title: room,
        tasks: [{ id: `${id}-task`, title, duration: "2 min" }]
      }
    ]
  };
}

test("duration parser handles hour units, compound durations, and ranges", () => {
  assert.equal(parseDurationMinutes("90 min"), 90);
  assert.equal(parseDurationMinutes("1h 30m"), 90);
  assert.equal(parseDurationMinutes("1-2 hr"), 90);
  assert.equal(parseDurationMinutes("30-45 min"), 38);
});

test("routine parser preserves the same action in different rooms but dedupes within a room", () => {
  const parsed = parseRoutineTaskText(
    "Bedroom:\nVacuum floor\nVacuum floor\n\nLiving room:\nVacuum floor"
  );
  assert.equal(parsed.taskCount, 2);
  assert.deepEqual(parsed.sections.map((section) => section.tasks), [
    ["Vacuum floor"],
    ["Vacuum floor"]
  ]);

  const draft = createSimpleRoutineDraft();
  draft.phases[0].title = "Bedroom";
  draft.phases[0].tasks[0].title = "Vacuum floor";
  const appended = appendParsedTaskText(
    draft,
    "Bedroom:\nVacuum floor\nLiving room:\nVacuum floor"
  );
  assert.equal(
    appended.phases
      .flatMap((phase) => phase.tasks)
      .filter((task) => task.title === "Vacuum floor").length,
    2
  );
});

test("library routine drafts preserve same-named tasks that belong to different rooms", () => {
  const draft = createRoutineDraftFromLibraryItems([
    { id: "bed", title: "Vacuum floor", room: "Bedroom", minutes: 3 },
    { id: "living", title: "Vacuum floor", room: "Living room", minutes: 4 }
  ]);
  assert.equal(draft.phases.length, 2);
  assert.equal(draft.phases.flatMap((phase) => phase.tasks).length, 2);
});

test("explicit routine room wins over catalog-title inference", () => {
  const routine = roomRoutine("office-custom", "Office", "Wipe electronics");
  const items = getTaskLibraryItems({
    routines: [routine],
    homeRooms: ["Office", "Living room"],
    room: "Office"
  });
  const item = items.find((candidate) => candidate.title === "Wipe electronics");
  assert.ok(item);
  assert.equal(item.room, "Office");
  assert.equal(item.source, "routine");
});

test("Home canonicalizes preset casing and hides reserved virtual or utility room names", () => {
  assert.equal(getCanonicalHomeRoomName("kItChEn"), "Kitchen");
  for (const name of ["All", "Whole home", "Other", "Floors"]) {
    assert.equal(isReservedHomeRoomName(name), true);
  }
  assert.deepEqual(
    getHomeRoomNames(["kitchen", "All", "Whole home", "Floors", "Other", "Guest room"]),
    ["Kitchen", "Guest room"]
  );
  const kitchenItems = getTaskLibraryItems({ routines: [], homeRooms: ["kitchen"], room: "KITCHEN" });
  assert.ok(kitchenItems.some((item) => item.title === "Clean the kitchen sink"));
});

test("Quick Clean keeps same-named custom tasks in two selected rooms", () => {
  const routines = [roomRoutine("studio", "Studio"), roomRoutine("guest", "Guest room")];
  const plan = buildQuickCleanPlan({
    minutes: 30,
    rooms: ["Studio", "Guest room"],
    routines,
    history: []
  });
  const matching = plan.items.filter((item) => item.title === "Polish shelf");
  assert.equal(matching.length, 2);
  assert.deepEqual(new Set(matching.map((item) => item.room)), new Set(["Studio", "Guest room"]));
});

test("dragging down onto the next task moves it after the target", () => {
  const draft = createSimpleRoutineDraft();
  draft.phases[0].tasks = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
    { id: "c", title: "C" }
  ];
  const phaseId = draft.phases[0].id;
  const down = moveRoutineTaskByDrop(
    draft,
    { phaseId, taskId: "b" },
    phaseId,
    "c"
  );
  assert.deepEqual(down.phases[0].tasks.map((task) => task.id), ["a", "c", "b"]);
  const up = moveRoutineTaskByDrop(
    down,
    { phaseId, taskId: "b" },
    phaseId,
    "a"
  );
  assert.deepEqual(up.phases[0].tasks.map((task) => task.id), ["b", "a", "c"]);
});

test("explicit template identity prevents shared routine IDs from changing another plan's recency", () => {
  const routine = roomRoutine("shared-id", "Kitchen", "Clean the kitchen sink");
  const history = [
    { routineId: "shared-id", templateId: "other", percent: 100, finishedAt: "2026-08-09T10:00:00.000Z" },
    { routineId: "shared-id", templateId: "current", percent: 100, finishedAt: "2026-08-01T10:00:00.000Z" }
  ];
  assert.equal(
    getLastFullRoomRoutineCompletion("Kitchen", [routine], history, "current"),
    "2026-08-01T10:00:00.000Z"
  );
  assert.equal(
    getLastRoutineFinishedAt(history, "shared-id", "current"),
    "2026-08-01T10:00:00.000Z"
  );
});

test("session IDs remain unique even when sessions begin in the same millisecond", () => {
  const template = createDefaultTemplate();
  const routine = template.routines.find((item) => item.id !== "daily-rules");
  const originalNow = Date.now;
  Date.now = () => 123456789;
  try {
    const first = createSession(routine, template);
    const second = createSession(routine, template);
    assert.notEqual(first.id, second.id);
    assert.match(first.id, /^session-/);
  } finally {
    Date.now = originalNow;
  }
});

test("local normalization drops impossible or future History and caps impossible completion counts", () => {
  const template = createDefaultTemplate();
  const state = normalizeAppState({
    templates: [template],
    activeTemplateId: template.id,
    history: [
      {
        id: "future",
        routineId: "x",
        routineTitle: "X",
        startedAt: "2999-01-01T00:00:00.000Z",
        finishedAt: "2999-01-01T00:10:00.000Z",
        completedTasks: 1,
        totalTasks: 1,
        percent: 100
      },
      {
        id: "backwards",
        routineId: "x",
        routineTitle: "X",
        startedAt: "2026-08-08T12:00:00.000Z",
        finishedAt: "2026-08-08T11:00:00.000Z",
        completedTasks: 1,
        totalTasks: 1,
        percent: 100
      },
      {
        id: "valid",
        routineId: "x",
        routineTitle: "X",
        startedAt: "2026-08-08T10:00:00.000Z",
        finishedAt: "2026-08-08T10:10:00.000Z",
        completedTasks: 9,
        totalTasks: 2,
        percent: 100
      }
    ]
  });
  assert.deepEqual(state.history.map((entry) => entry.id), ["valid"]);
  assert.equal(state.history[0].completedTasks, 2);
});

test("starter restore is guarded by live active-session state at UI and mutation boundaries", () => {
  const app = textFile("../src/App.jsx");
  const settings = textFile("../src/components/Settings.jsx");
  assert.match(app, /appState\.activeSession\?\.templateId === activeTemplate\.id/);
  assert.match(app, /current\.activeSession\?\.templateId === current\.activeTemplateId/);
  assert.match(app, /activeSession=\{appState\.activeSession\}/);
  assert.doesNotMatch(settings, /loadAppState\(\)/);
  assert.match(settings, /activeSession\?\.templateId === template\.id/);
});

test("final release deployment and runtime verification are hardened", () => {
  const deploy = textFile("../.github/workflows/deploy.yml");
  const runtime = textFile("../scripts/verify-runtime.mjs");
  assert.match(deploy, /actions\/checkout@v7/);
  assert.match(deploy, /actions\/setup-node@v7/);
  assert.match(deploy, /npm run verify:release-candidate/);
  assert.match(runtime, /findAvailablePort/);
  assert.match(runtime, /server\.listen\(0, host/);
  assert.doesNotMatch(runtime, /const port = 4173;/);
});

test("final audit remains schema-free and preserves deployment and persistence invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");
  assert.equal(CURRENT_BACKUP_VERSION, 4);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(
    app,
    /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s
  );
});
