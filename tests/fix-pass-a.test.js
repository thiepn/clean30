import assert from "node:assert/strict";
import test from "node:test";

import {
  createHistoryEntry,
  createSession,
  finishSessionState,
  getHistoryDurationMinutes,
  isSessionForRoutine
} from "../src/utils/calculations.js";
import { daysBetween } from "../src/utils/dates.js";
import { getHistoryInsights } from "../src/utils/historyInsights.js";
import {
  createFullBackup,
  getStorageHealth,
  hasMeaningfulTodayData,
  prepareImportedAppState,
  resetToFreshState,
  saveAppState,
  subscribeStorageHealth,
  validateFullBackupPayload
} from "../src/utils/storage.js";

function completeBackup() {
  return createFullBackup(resetToFreshState());
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

test("complete current backup is accepted and incomplete typed v2 backups are rejected", () => {
  const backup = completeBackup();
  assert.equal(validateFullBackupPayload(backup).ok, true);

  for (const field of ["history", "todayTasksByDate", "appSettings", "activeSession"]) {
    const incomplete = clone(backup);
    delete incomplete.data[field];
    const result = validateFullBackupPayload(incomplete);
    assert.equal(result.ok, false, field);
    assert.match(result.error, /incomplete|invalid/i);
  }

  const templatesOnly = {
    app: "Clean30",
    type: "full-backup",
    version: 2,
    data: { templates: backup.data.templates }
  };
  assert.equal(validateFullBackupPayload(templatesOnly).ok, false);

  const malformedNestedTask = completeBackup();
  malformedNestedTask.data.templates[0].routines[0].phases[0].tasks[0].title = null;
  assert.equal(validateFullBackupPayload(malformedNestedTask).ok, false);
});

test("invalid objects are rejected while a legacy raw state uses the legacy upgrader", () => {
  for (const payload of [{}, [], null, { templates: [] }]) {
    assert.equal(validateFullBackupPayload(payload).ok, false);
  }

  const legacyState = clone(completeBackup().data);
  delete legacyState.todayTasksByDate;
  const result = validateFullBackupPayload(legacyState);
  assert.equal(result.ok, true);
  assert.match(result.warnings.join(" "), /legacy/i);
});

test("old active sessions infer template identity only when unambiguous", () => {
  const backup = completeBackup();
  const routine = backup.data.templates[0].routines.find(
    (item) => item.id === "weekly-reset"
  );
  const legacyState = clone(backup.data);
  delete legacyState.todayTasksByDate;
  legacyState.activeSession = {
    ...createSession(routine, backup.data.templates[0]),
    templateId: undefined
  };
  const inferred = validateFullBackupPayload(legacyState);
  assert.equal(inferred.ok, true);
  assert.equal(inferred.data.activeSession.templateId, backup.data.templates[0].id);

  const ambiguous = completeBackup();
  ambiguous.data.templates.push({
    ...clone(ambiguous.data.templates[0]),
    id: "template-b",
    name: "Template B"
  });
  const ambiguousLegacyState = clone(ambiguous.data);
  delete ambiguousLegacyState.todayTasksByDate;
  ambiguousLegacyState.activeSession = {
    ...createSession(
      ambiguous.data.templates[0].routines.find((item) => item.id === "weekly-reset"),
      ambiguous.data.templates[0]
    ),
    templateId: undefined
  };
  const dropped = validateFullBackupPayload(ambiguousLegacyState);
  assert.equal(dropped.ok, true);
  assert.equal(dropped.data.activeSession, null);
  assert.match(dropped.warnings.join(" "), /ambiguous|discarded/i);
});

test("malformed imported active sessions are dropped with warnings", () => {
  const backup = completeBackup();
  const routine = backup.data.templates[0].routines.find(
    (item) => item.id === "weekly-reset"
  );
  backup.data.activeSession = {
    ...createSession(routine, backup.data.templates[0]),
    startedAt: "not-a-date"
  };
  const result = validateFullBackupPayload(backup);
  assert.equal(result.ok, true);
  assert.equal(result.data.activeSession, null);
  assert.match(result.warnings.join(" "), /start time|discarded/i);
});

test("paused and completed-task active-session repairs are explicit", () => {
  const validPaused = completeBackup();
  const template = validPaused.data.templates[0];
  const routine = template.routines.find((item) => item.id === "weekly-reset");
  validPaused.data.activeSession = {
    ...createSession(routine, template),
    startedAt: "2026-06-19T10:00:00.000Z",
    paused: true,
    pausedAt: "2026-06-19T10:10:00.000Z",
    totalPausedMs: 60_000,
    completedTaskIds: [routine.phases[0].tasks[0].id, "unknown-task"]
  };
  const repaired = validateFullBackupPayload(validPaused);
  assert.equal(repaired.ok, true);
  assert.equal(repaired.data.activeSession.paused, true);
  assert.deepEqual(repaired.data.activeSession.completedTaskIds, [
    routine.phases[0].tasks[0].id
  ]);
  assert.match(repaired.warnings.join(" "), /unknown completed task/i);

  const invalidPausedAt = clone(validPaused);
  invalidPausedAt.data.activeSession.pausedAt = "bad-date";
  assert.equal(validateFullBackupPayload(invalidPausedAt).data.activeSession, null);

  const invalidPauseTotal = clone(validPaused);
  invalidPauseTotal.data.activeSession.totalPausedMs = -1;
  assert.equal(validateFullBackupPayload(invalidPauseTotal).data.activeSession, null);

  const missingUniverse = completeBackup();
  missingUniverse.data.activeSession = {
    id: "missing-universe",
    routineId: "deleted-routine",
    templateId: null,
    startedAt: "2026-06-19T10:00:00.000Z",
    paused: false,
    pausedAt: null,
    totalPausedMs: 0,
    completedTaskIds: [],
    notes: "",
    routineSnapshot: null
  };
  assert.equal(validateFullBackupPayload(missingUniverse).data.activeSession, null);
});

test("storage write failures report persistent health and a later success clears it", () => {
  const originalWindow = globalThis.window;
  const originalWarn = console.warn;
  let shouldThrow = true;
  globalThis.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        if (shouldThrow) throw new Error("quota");
      }
    }
  };

  const statuses = [];
  const unsubscribe = subscribeStorageHealth((health) => statuses.push(health.status));
  console.warn = () => {};
  try {
    assert.equal(saveAppState(resetToFreshState()), undefined);
    assert.equal(getStorageHealth().status, "error");
    shouldThrow = false;
    assert.equal(saveAppState(resetToFreshState()), undefined);
    assert.equal(getStorageHealth().status, "ok");
    assert.deepEqual(statuses.slice(-2), ["error", "ok"]);
  } finally {
    unsubscribe();
    console.warn = originalWarn;
    globalThis.window = originalWindow;
  }
});

test("finish is guarded by session ID and creates one history entry", () => {
  const state = resetToFreshState();
  const template = state.templates[0];
  const routine = template.routines.find((item) => item.id === "weekly-reset");
  const session = {
    ...createSession(routine, template),
    id: "guarded-session",
    startedAt: "2026-06-19T10:00:00.000Z"
  };
  const activeState = { ...state, activeSession: session };

  const first = finishSessionState(
    activeState,
    session.id,
    "2026-06-19T10:30:00.000Z"
  );
  const second = finishSessionState(
    first.state,
    session.id,
    "2026-06-19T10:30:01.000Z"
  );
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
  assert.equal(first.state.history.length, 1);
  assert.equal(second.state.history.length, 1);
  assert.equal(first.state.history[0].id, "session-history-guarded-session");

  const newerSession = { ...createSession(routine, template), id: "newer-session" };
  const stale = finishSessionState(
    { ...activeState, activeSession: newerSession },
    session.id,
    "2026-06-19T10:31:00.000Z"
  );
  assert.equal(stale.accepted, false);
  assert.equal(stale.state.activeSession.id, "newer-session");
});

test("session identity requires both template and routine IDs", () => {
  const session = { templateId: "template-a", routineId: "weekly-reset" };
  assert.equal(isSessionForRoutine(session, "template-a", "weekly-reset"), true);
  assert.equal(isSessionForRoutine(session, "template-b", "weekly-reset"), false);
});

test("finishing a paused session settles pause time correctly", () => {
  const state = resetToFreshState();
  const template = state.templates[0];
  const routine = template.routines.find((item) => item.id === "weekly-reset");
  const session = {
    ...createSession(routine, template),
    id: "paused-session",
    startedAt: "2026-06-19T10:00:00.000Z",
    paused: true,
    pausedAt: "2026-06-19T10:20:00.000Z",
    totalPausedMs: 5 * 60 * 1000
  };
  const result = finishSessionState(
    { ...state, activeSession: session },
    session.id,
    "2026-06-19T10:30:00.000Z"
  );
  assert.equal(result.historyEntry.elapsedMs, 15 * 60 * 1000);
});

test("elapsed-only History entries use measured elapsed time", () => {
  const entry = {
    elapsedMs: 30 * 60 * 1000,
    estimatedDurationMinutes: null,
    startedAt: "2026-06-19T10:00:00.000Z",
    finishedAt: "2026-06-19T10:30:00.000Z"
  };
  assert.equal(getHistoryDurationMinutes(entry), 30);
  assert.equal(
    getHistoryDurationMinutes({ elapsedMs: -1, estimatedDurationMinutes: -5 }),
    null
  );
  assert.equal(getHistoryDurationMinutes({ estimatedDurationMinutes: 45 }), 45);
});

test("recent 7-day and 30-day windows include today and exclude future dates", () => {
  const now = new Date();
  const routine = { id: "weekly-reset", title: "Weekly reset" };
  const template = resetToFreshState().templates[0];
  const offsets = [0, -6, -7, -29, -30, 1];
  const history = offsets.map((offset, index) => ({
    id: `entry-${index}`,
    routineId: "weekly-reset",
    routineTitle: "Weekly reset",
    startedAt: addDays(now, offset).toISOString(),
    finishedAt: addDays(now, offset).toISOString(),
    completedTasks: 1,
    totalTasks: 1,
    percent: 100
  }));
  const insights = getHistoryInsights(history, [routine], template);
  assert.equal(insights.recent7, 2);
  assert.equal(insights.recent30, 4);
  assert.equal(daysBetween("2026-03-28", "2026-03-29"), 1);
});

test("meaningful Today usage excludes untouched defaults", () => {
  const untouched = {
    "2026-06-19": [
      {
        source: "default",
        completed: false,
        note: "",
        tags: []
      }
    ]
  };
  assert.equal(hasMeaningfulTodayData(untouched), false);
  assert.equal(
    hasMeaningfulTodayData({
      "2026-06-19": [{ ...untouched["2026-06-19"][0], completed: true }]
    }),
    true
  );
  assert.equal(
    hasMeaningfulTodayData({
      "2026-06-19": [{ ...untouched["2026-06-19"][0], source: "custom" }]
    }),
    true
  );
  assert.equal(
    hasMeaningfulTodayData({
      "2026-06-19": [{ ...untouched["2026-06-19"][0], source: "routine" }]
    }),
    true
  );
  assert.equal(
    hasMeaningfulTodayData({
      "2026-06-19": [{ ...untouched["2026-06-19"][0], note: "Use vinegar" }]
    }),
    true
  );
});

test("imported backup health is reset without mutating imported content", () => {
  const state = completeBackup().data;
  state.lastFullBackupExportedAt = "2026-06-19T10:00:00.000Z";
  const prepared = prepareImportedAppState(state);
  assert.equal(prepared.lastFullBackupExportedAt, null);
  assert.equal(prepared.templates, state.templates);
  assert.equal(state.lastFullBackupExportedAt, "2026-06-19T10:00:00.000Z");
});

test("new session History IDs are stable per session", () => {
  const state = resetToFreshState();
  const template = state.templates[0];
  const routine = template.routines.find((item) => item.id === "weekly-reset");
  const session = { ...createSession(routine, template), id: "stable-id" };
  assert.equal(
    createHistoryEntry(session, template).id,
    "session-history-stable-id"
  );
});
