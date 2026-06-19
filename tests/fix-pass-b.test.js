import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { formatCalendarDayLabel } from "../src/utils/accessibility.js";
import {
  buildActivityByDate,
  buildHistoryDisplayEntries,
  getActivityStreaks,
  getWeeklyActivitySummary
} from "../src/utils/activity.js";
import {
  createDailyRulesHistoryEntry,
  createHistoryEntry,
  createSession,
  finishSessionState
} from "../src/utils/calculations.js";
import { cycleDialogFocus } from "../src/utils/dialogFocus.js";
import {
  closedRoutinePickerState,
  openRoutinePickerState,
  reconcileRoutinePickerState,
  toggleRoutinePickerTask
} from "../src/utils/routinePickerState.js";
import {
  CURRENT_BACKUP_VERSION,
  buildTodayTasksForDate,
  createFullBackup,
  resetToFreshState,
  validateFullBackupPayload
} from "../src/utils/storage.js";
import {
  cloneTasksWithNewIds,
  getTodayDefaultsForDate,
  normalizeTemplate
} from "../src/utils/templateUtils.js";

const DATE_KEY = "2026-06-15";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function completeTodayTask(template, source = "default") {
  const defaultTask = template.todayDefaults[0];
  return {
    id: `today-${source}-task`,
    defaultTaskId: source === "default" ? defaultTask.id : null,
    text: defaultTask.title,
    completed: true,
    source,
    note: "",
    tags: [],
    routineId: null,
    routineName: "",
    originalTaskId: null,
    createdAt: `${DATE_KEY}T08:00:00.000Z`,
    completedAt: `${DATE_KEY}T09:00:00.000Z`
  };
}

function routineHistory(template, id = "routine-history") {
  const routine = template.routines.find((item) => item.id === "weekly-reset");
  const session = {
    ...createSession(routine, template),
    id,
    startedAt: `${DATE_KEY}T10:00:00.000Z`
  };
  return createHistoryEntry(session, template, `${DATE_KEY}T10:30:00.000Z`);
}

test("dated Today tasks are the Today activity source and are non-deletable", () => {
  const template = resetToFreshState().templates[0];
  const activity = buildActivityByDate(
    [],
    { [DATE_KEY]: [completeTodayTask(template)] },
    template
  );
  const day = activity[DATE_KEY];
  assert.equal(day.todayCompleted, 1);
  assert.equal(day.sessions.length, 0);
  assert.equal(day.todayActivity.derived, true);
  assert.equal(day.todayActivity.deletable, false);
  assert.equal(buildHistoryDisplayEntries(activity).length, 1);
});

test("routine-imported Today tasks remain Today activity rather than routine sessions", () => {
  const template = resetToFreshState().templates[0];
  const routine = template.routines.find((item) => item.id === "weekly-reset");
  const task = routine.phases[0].tasks[0];
  const imported = {
    ...completeTodayTask(template, "routine"),
    text: task.title,
    routineId: routine.id,
    routineName: routine.title,
    originalTaskId: task.id
  };
  const day = buildActivityByDate(
    [],
    { [DATE_KEY]: [imported] },
    template
  )[DATE_KEY];
  assert.equal(day.todayCompleted, 1);
  assert.equal(day.sessions.length, 0);
  assert.ok(day.estimatedTodayMinutes >= 0);
});

test("routine sessions remain persisted and deletable", () => {
  const template = resetToFreshState().templates[0];
  const entry = routineHistory(template);
  const activity = buildActivityByDate([entry], {}, template);
  const displayed = buildHistoryDisplayEntries(activity);
  assert.equal(displayed.length, 1);
  assert.equal(displayed[0].id, entry.id);
  assert.equal(displayed[0].deletable, true);
  assert.equal(activity[DATE_KEY].routineElapsedMinutes, 30);
});

test("estimated-only or invalid routine duration is not presented as measured time", () => {
  const template = resetToFreshState().templates[0];
  const estimatedOnly = {
    ...routineHistory(template, "estimated-only"),
    elapsedMs: null,
    elapsedMinutes: null,
    startedAt: `${DATE_KEY}T10:00:00.000Z`,
    finishedAt: `${DATE_KEY}T10:00:00.000Z`,
    estimatedDurationMinutes: 45
  };
  const day = buildActivityByDate([estimatedOnly], {}, template)[DATE_KEY];
  assert.equal(day.routineElapsedMinutes, 0);
  assert.equal(day.sessions.length, 1);
});

test("Today activity and a routine session share one active day with separate time values", () => {
  const template = resetToFreshState().templates[0];
  const activity = buildActivityByDate(
    [routineHistory(template)],
    { [DATE_KEY]: [completeTodayTask(template)] },
    template
  );
  const day = activity[DATE_KEY];
  assert.equal(day.todayCompleted, 1);
  assert.equal(day.sessions.length, 1);
  assert.equal(day.routineElapsedMinutes, 30);
  assert.ok(day.estimatedTodayMinutes > 0);
  const summary = getWeeklyActivitySummary(activity, DATE_KEY);
  assert.equal(summary.activeDays, 1);
  assert.equal(summary.routines, 1);
  assert.equal(summary.routineElapsedMinutes, 30);
  assert.equal(summary.estimatedTodayMinutes, day.estimatedTodayMinutes);
});

test("legacy Today history is a fallback and dated Today data prevents duplication", () => {
  const template = resetToFreshState().templates[0];
  const legacy = createDailyRulesHistoryEntry({
    dateKey: DATE_KEY,
    dailyRules: template.dailyRules,
    template,
    completedAt: `${DATE_KEY}T09:00:00.000Z`
  });

  const fallback = buildActivityByDate([legacy], {}, template)[DATE_KEY];
  assert.equal(fallback.todayActivity.legacyFallback, true);
  assert.equal(fallback.todayActivity.deletable, false);

  const preferred = buildActivityByDate(
    [legacy],
    { [DATE_KEY]: [completeTodayTask(template)] },
    template
  )[DATE_KEY];
  assert.equal(preferred.todayActivity.derived, true);
  assert.equal(preferred.todayActivity.legacyFallback, false);
  assert.equal(buildHistoryDisplayEntries({ [DATE_KEY]: preferred }).length, 1);
});

test("resetting or unchecking Today tasks predictably removes derived activity", () => {
  const template = resetToFreshState().templates[0];
  const completed = completeTodayTask(template);
  const before = buildActivityByDate(
    [],
    { [DATE_KEY]: [completed] },
    template
  )[DATE_KEY];
  const after = buildActivityByDate(
    [],
    { [DATE_KEY]: [{ ...completed, completed: false, completedAt: null }] },
    template
  )[DATE_KEY];
  assert.ok(before.todayActivity);
  assert.equal(after.todayActivity, null);
  assert.equal(after.todayCompleted, 0);
});

test("Calendar activity and streak calculations agree on same-day activity", () => {
  const template = resetToFreshState().templates[0];
  const activity = buildActivityByDate(
    [routineHistory(template)],
    { [DATE_KEY]: [completeTodayTask(template)] },
    template
  );
  assert.equal(getWeeklyActivitySummary(activity, DATE_KEY).activeDays, 1);
  assert.deepEqual(getActivityStreaks(activity, DATE_KEY), {
    current: 1,
    best: 1
  });
});

test("finishing a legacy Today session updates dated completion without persisting History", () => {
  const state = resetToFreshState();
  const template = state.templates[0];
  const routine = template.routines.find((item) => item.id === "daily-rules");
  const session = {
    ...createSession(routine, template),
    id: "legacy-today-session",
    startedAt: `${DATE_KEY}T08:00:00.000Z`,
    completedTaskIds: template.dailyRules.map((task) => task.id)
  };
  const result = finishSessionState(
    { ...state, activeSession: session },
    session.id,
    `${DATE_KEY}T09:00:00.000Z`
  );
  assert.equal(result.accepted, true);
  assert.equal(result.historyEntry, null);
  assert.equal(result.state.history.length, 0);
});

test("weekday defaults distinguish General, custom, and explicit empty", () => {
  const template = normalizeTemplate({
    ...resetToFreshState().templates[0],
    todayWeekdayDefaultsEnabled: true,
    todayWeekdayDefaultsExplicit: true,
    todayWeekdayDefaults: {
      ...resetToFreshState().templates[0].todayWeekdayDefaults,
      monday: null,
      tuesday: [resetToFreshState().templates[0].todayDefaults[0]],
      wednesday: []
    }
  });
  assert.equal(
    getTodayDefaultsForDate(template, "2026-06-15"),
    template.todayDefaults
  );
  assert.equal(getTodayDefaultsForDate(template, "2026-06-16").length, 1);
  assert.equal(getTodayDefaultsForDate(template, "2026-06-17").length, 0);
});

test("explicit empty weekday survives normalization, reset, and backup round-trip", () => {
  const state = resetToFreshState();
  state.templates[0] = normalizeTemplate({
    ...state.templates[0],
    todayWeekdayDefaultsEnabled: true,
    todayWeekdayDefaultsExplicit: true,
    todayWeekdayDefaults: {
      ...state.templates[0].todayWeekdayDefaults,
      monday: []
    }
  });
  assert.deepEqual(
    buildTodayTasksForDate(
      null,
      state.templates[0],
      "2026-06-15",
      [],
      state.appSettings
    ),
    []
  );
  const backup = createFullBackup(state);
  assert.equal(backup.version, CURRENT_BACKUP_VERSION);
  const restored = validateFullBackupPayload(backup);
  assert.equal(restored.ok, true);
  assert.deepEqual(restored.data.templates[0].todayWeekdayDefaults.monday, []);
});

test("legacy weekday arrays migrate empty values to General fallback", () => {
  const backup = createFullBackup(resetToFreshState());
  backup.version = 2;
  backup.data.templates.forEach((template) => {
    delete template.todayWeekdayDefaultsExplicit;
    template.todayWeekdayDefaults.monday = [];
  });
  const result = validateFullBackupPayload(backup);
  assert.equal(result.ok, true);
  assert.equal(result.data.templates[0].todayWeekdayDefaults.monday, null);
  assert.match(result.warnings.join(" "), /older/i);
});

test("copying General creates independent weekday task IDs", () => {
  const tasks = resetToFreshState().templates[0].todayDefaults;
  const copied = cloneTasksWithNewIds(tasks);
  assert.deepEqual(
    copied.map((task) => task.title),
    tasks.map((task) => task.title)
  );
  assert.notDeepEqual(
    copied.map((task) => task.id),
    tasks.map((task) => task.id)
  );
});

test("global Start Today empty overrides General and weekday initialization", () => {
  const template = resetToFreshState().templates[0];
  assert.deepEqual(
    buildTodayTasksForDate(null, template, DATE_KEY, [], {
      startTodayEmpty: true
    }),
    []
  );
});

test("routine picker close, successful add, and disappearing routines reset transient state", () => {
  const routines = [{ id: "a" }, { id: "b" }];
  let state = openRoutinePickerState(routines);
  state = toggleRoutinePickerTask(state, "task-1");
  assert.deepEqual(closedRoutinePickerState(), {
    open: false,
    routineId: "",
    selectedTaskIds: []
  });
  assert.deepEqual(openRoutinePickerState(routines).selectedTaskIds, []);
  assert.deepEqual(
    reconcileRoutinePickerState(state, [{ id: "b" }]),
    { open: true, routineId: "b", selectedTaskIds: [] }
  );
});

test("dialog focus cycling contains forward and backward Tab navigation", () => {
  const focused = [];
  const first = { focus: () => focused.push("first") };
  const last = { focus: () => focused.push("last") };
  const forwardEvent = {
    key: "Tab",
    shiftKey: false,
    preventDefault: () => focused.push("prevent-forward")
  };
  assert.equal(cycleDialogFocus(forwardEvent, [first, last], last), true);
  assert.deepEqual(focused, ["prevent-forward", "first"]);

  focused.length = 0;
  const backwardEvent = {
    key: "Tab",
    shiftKey: true,
    preventDefault: () => focused.push("prevent-back")
  };
  assert.equal(cycleDialogFocus(backwardEvent, [first, last], first), true);
  assert.deepEqual(focused, ["prevent-back", "last"]);
});

test("Calendar labels announce date, Today activity, routines, and empty days", () => {
  const active = formatCalendarDayLabel(
    DATE_KEY,
    { todayCompleted: 3, sessions: [{ id: "one" }] },
    DATE_KEY
  );
  assert.match(active, /today/i);
  assert.match(active, /3 Today tasks completed/i);
  assert.match(active, /1 routine session/i);
  assert.match(
    formatCalendarDayLabel("2026-06-16", null, DATE_KEY),
    /no activity/i
  );
});

test("normal active-session Dashboard has one interval source and StartSession has none", async () => {
  const dashboard = await readFile(
    new URL("../src/components/Dashboard.jsx", import.meta.url),
    "utf8"
  );
  const startSession = await readFile(
    new URL("../src/components/StartSession.jsx", import.meta.url),
    "utf8"
  );
  assert.equal((dashboard.match(/setInterval/g) || []).length, 1);
  assert.equal((dashboard.match(/clearInterval/g) || []).length, 1);
  assert.equal((startSession.match(/setInterval/g) || []).length, 0);
});
