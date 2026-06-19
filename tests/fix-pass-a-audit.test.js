import assert from "node:assert/strict";
import test from "node:test";

import {
  createDailyRulesHistoryEntry,
  createHistoryEntry,
  createSession,
  finishSessionState,
  isSessionForRoutine
} from "../src/utils/calculations.js";
import {
  createFullBackup,
  resetToFreshState,
  validateFullBackupPayload
} from "../src/utils/storage.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function completeBackup() {
  return createFullBackup(resetToFreshState());
}

function backupWithSessionHistory() {
  const state = resetToFreshState();
  const template = state.templates[0];
  const routine = template.routines.find((item) => item.id === "weekly-reset");
  const session = {
    ...createSession(routine, template),
    id: "strict-history-session",
    startedAt: "2026-06-19T10:00:00.000Z"
  };
  state.history = [
    createHistoryEntry(session, template, "2026-06-19T10:30:00.000Z"),
    createDailyRulesHistoryEntry({
      dateKey: "2026-06-19",
      dailyRules: template.dailyRules,
      template,
      completedAt: "2026-06-19T09:00:00.000Z"
    })
  ];
  return createFullBackup(state);
}

function makeLegacyRawState(backup) {
  const legacy = clone(backup.data);
  delete legacy.todayTasksByDate;
  return legacy;
}

function routineById(template, routineId = "weekly-reset") {
  return template.routines.find((routine) => routine.id === routineId);
}

function removeRoutine(template, routineId = "weekly-reset") {
  template.routines = template.routines.filter(
    (routine) => routine.id !== routineId
  );
}

function currentSessionBackup() {
  const backup = completeBackup();
  const template = backup.data.templates[0];
  const routine = routineById(template);
  backup.data.activeSession = {
    ...createSession(routine, template),
    id: "current-session",
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  };
  return backup;
}

test("canonical exporter output passes strict current-version validation", () => {
  const emptyBackup = completeBackup();
  const emptyResult = validateFullBackupPayload(emptyBackup);
  assert.equal(emptyResult.ok, true);
  assert.deepEqual(emptyResult.data, emptyBackup.data);

  const historyBackup = backupWithSessionHistory();
  const historyResult = validateFullBackupPayload(historyBackup);
  assert.equal(historyResult.ok, true);
  assert.deepEqual(historyResult.data, historyBackup.data);
});

test("current History requires every canonical field and valid counts", () => {
  const missingHistory = backupWithSessionHistory();
  delete missingHistory.data.history;
  assert.equal(validateFullBackupPayload(missingHistory).ok, false);

  for (const field of ["completedTasks", "notes", "elapsedMs"]) {
    const backup = backupWithSessionHistory();
    delete backup.data.history[0][field];
    const result = validateFullBackupPayload(backup);
    assert.equal(result.ok, false, field);
    assert.match(result.error, /history/i);
  }

  const tooManyCompleted = backupWithSessionHistory();
  tooManyCompleted.data.history[0].completedTasks =
    tooManyCompleted.data.history[0].totalTasks + 1;
  assert.equal(validateFullBackupPayload(tooManyCompleted).ok, false);

  const negativeTotal = backupWithSessionHistory();
  negativeTotal.data.history[0].totalTasks = -1;
  assert.equal(validateFullBackupPayload(negativeTotal).ok, false);

  const invalidDuration = backupWithSessionHistory();
  invalidDuration.data.history[0].elapsedMs = -1;
  assert.equal(validateFullBackupPayload(invalidDuration).ok, false);
});

test("current app settings reject missing keys, invalid enums, and malformed tags", () => {
  const missingSettings = completeBackup();
  delete missingSettings.data.appSettings;
  assert.equal(validateFullBackupPayload(missingSettings).ok, false);

  const missingSettingKey = completeBackup();
  delete missingSettingKey.data.appSettings.startTodayEmpty;
  assert.equal(validateFullBackupPayload(missingSettingKey).ok, false);

  const invalidFontSize = completeBackup();
  invalidFontSize.data.appSettings.fontSize = "huge";
  assert.equal(validateFullBackupPayload(invalidFontSize).ok, false);

  const invalidDensity = completeBackup();
  invalidDensity.data.appSettings.density = "spacious";
  assert.equal(validateFullBackupPayload(invalidDensity).ok, false);

  const invalidAccent = completeBackup();
  invalidAccent.data.appSettings.accentColor = "ultraviolet";
  assert.equal(validateFullBackupPayload(invalidAccent).ok, false);

  const malformedTags = completeBackup();
  malformedTags.data.appSettings.taskTags = ["Kitchen", 42];
  assert.equal(validateFullBackupPayload(malformedTags).ok, false);

  const invalidBoolean = completeBackup();
  invalidBoolean.data.appSettings.startTodayEmpty = "false";
  assert.equal(validateFullBackupPayload(invalidBoolean).ok, false);
});

test("current templates require complete retained systems and canonical sections", () => {
  const incompleteSystems = completeBackup();
  delete incompleteSystems.data.templates[0].systems.systemSections;
  assert.equal(validateFullBackupPayload(incompleteSystems).ok, false);

  const incompleteSystemSection = completeBackup();
  delete incompleteSystemSection.data.templates[0].systems.systemSections[0]
    .secondaryItems;
  assert.equal(validateFullBackupPayload(incompleteSystemSection).ok, false);

  const missingSchedule = completeBackup();
  delete missingSchedule.data.templates[0].schedule;
  assert.equal(validateFullBackupPayload(missingSchedule).ok, false);

  const missingZones = completeBackup();
  delete missingZones.data.templates[0].zones;
  assert.equal(validateFullBackupPayload(missingZones).ok, false);

  const invalidAppearance = completeBackup();
  invalidAppearance.data.templates[0].appearance.accentColor = "invalid";
  assert.equal(validateFullBackupPayload(invalidAppearance).ok, false);
});

test("malformed current data is not downgraded to legacy and validation is non-mutating", () => {
  const localState = resetToFreshState();
  const localSnapshot = clone(localState);
  const malformed = completeBackup();
  delete malformed.data.history;

  const result = validateFullBackupPayload(malformed);
  assert.equal(result.ok, false);
  assert.doesNotMatch(result.error, /legacy/i);
  assert.deepEqual(localState, localSnapshot);

  const validLegacy = makeLegacyRawState(completeBackup());
  const legacyResult = validateFullBackupPayload(validLegacy);
  assert.equal(legacyResult.ok, true);
  assert.match(legacyResult.warnings.join(" "), /legacy/i);
});

test("current active session with a correct template and routine is preserved", () => {
  const backup = currentSessionBackup();
  const result = validateFullBackupPayload(backup);
  assert.equal(result.ok, true);
  assert.equal(
    result.data.activeSession.templateId,
    backup.data.activeSession.templateId
  );
  assert.equal(
    result.data.activeSession.routineId,
    backup.data.activeSession.routineId
  );
});

test("current active session with a false template binding is dropped with a warning", () => {
  const backup = completeBackup();
  const originalTemplate = backup.data.templates[0];
  const otherTemplate = clone(originalTemplate);
  otherTemplate.id = "template-b";
  otherTemplate.name = "Template B";
  otherTemplate.readOnly = false;
  const routine = routineById(otherTemplate);
  removeRoutine(originalTemplate);
  backup.data.templates.push(otherTemplate);
  backup.data.activeSession = {
    ...createSession(routine, otherTemplate),
    id: "false-template-binding",
    templateId: originalTemplate.id,
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  };

  const result = validateFullBackupPayload(backup);
  assert.equal(result.ok, true);
  assert.equal(result.data.activeSession, null);
  assert.match(result.warnings.join(" "), /template and routine do not match|discarded/i);
});

test("current active session with a mismatched routine snapshot is dropped", () => {
  const backup = currentSessionBackup();
  backup.data.activeSession.routineSnapshot.id = "different-routine";

  const result = validateFullBackupPayload(backup);
  assert.equal(result.ok, true);
  assert.equal(result.data.activeSession, null);
  assert.match(result.warnings.join(" "), /snapshot does not match|discarded/i);
});

test("current active session with malformed canonical progress fields is dropped", () => {
  for (const mutate of [
    (session) => {
      session.totalPausedMs = "0";
    },
    (session) => {
      session.completedTaskIds = "task-id";
    },
    (session) => {
      session.notes = null;
    }
  ]) {
    const backup = currentSessionBackup();
    mutate(backup.data.activeSession);
    const result = validateFullBackupPayload(backup);
    assert.equal(result.ok, true);
    assert.equal(result.data.activeSession, null);
    assert.match(result.warnings.join(" "), /invalid saved progress|discarded/i);
  }
});

test("legacy active session repairs to the only matching template with a warning", () => {
  const backup = completeBackup();
  const originalTemplate = backup.data.templates[0];
  const otherTemplate = clone(originalTemplate);
  otherTemplate.id = "template-b";
  otherTemplate.name = "Template B";
  otherTemplate.readOnly = false;
  const routine = routineById(otherTemplate);
  removeRoutine(originalTemplate);
  backup.data.templates.push(otherTemplate);
  backup.data.activeSession = {
    ...createSession(routine, otherTemplate),
    id: "legacy-template-repair",
    templateId: originalTemplate.id,
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  };

  const result = validateFullBackupPayload(makeLegacyRawState(backup));
  assert.equal(result.ok, true);
  assert.equal(result.data.activeSession.templateId, otherTemplate.id);
  assert.match(result.warnings.join(" "), /template inferred/i);
});

test("ambiguous legacy routine identity is never silently assigned", () => {
  const backup = completeBackup();
  const duplicateTemplate = clone(backup.data.templates[0]);
  duplicateTemplate.id = "template-b";
  duplicateTemplate.name = "Template B";
  duplicateTemplate.readOnly = false;
  backup.data.templates.push(duplicateTemplate);
  const routine = routineById(backup.data.templates[0]);
  backup.data.activeSession = {
    ...createSession(routine, backup.data.templates[0]),
    id: "ambiguous-session",
    templateId: undefined,
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  };

  const result = validateFullBackupPayload(makeLegacyRawState(backup));
  assert.equal(result.ok, true);
  assert.equal(result.data.activeSession, null);
  assert.match(result.warnings.join(" "), /ambiguous|discarded/i);
});

test("snapshot-only sessions use an explicit unknown template and never create false History identity", () => {
  const backup = completeBackup();
  const template = backup.data.templates[0];
  const routine = clone(routineById(template));
  removeRoutine(template);
  backup.data.activeSession = {
    ...createSession(routine, { id: "removed-template" }),
    id: "snapshot-only-session",
    templateId: null,
    startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  };

  const restored = validateFullBackupPayload(backup);
  assert.equal(restored.ok, true);
  assert.equal(restored.data.activeSession.templateId, null);
  assert.match(restored.warnings.join(" "), /snapshot without a template/i);

  const finished = finishSessionState(
    restored.data,
    restored.data.activeSession.id,
    new Date().toISOString()
  );
  assert.equal(finished.accepted, true);
  assert.equal(finished.historyEntry.templateId, null);
  assert.equal(finished.historyEntry.templateName, "");
});

test("active session with no routine match and no usable snapshot is dropped", () => {
  const backup = currentSessionBackup();
  backup.data.activeSession.templateId = null;
  backup.data.activeSession.routineId = "deleted-routine";
  backup.data.activeSession.routineSnapshot = null;

  const result = validateFullBackupPayload(backup);
  assert.equal(result.ok, true);
  assert.equal(result.data.activeSession, null);
  assert.match(result.warnings.join(" "), /discarded|could not be restored|no valid/i);
});

test("same routine ID in another template still requires replacement", () => {
  const session = { templateId: "template-a", routineId: "weekly-reset" };
  assert.equal(
    isSessionForRoutine(session, "template-a", "weekly-reset"),
    true
  );
  assert.equal(
    isSessionForRoutine(session, "template-b", "weekly-reset"),
    false
  );
});

test("valid running and paused active-session timestamps are accepted", () => {
  const running = currentSessionBackup();
  assert.equal(validateFullBackupPayload(running).data.activeSession.paused, false);

  const paused = currentSessionBackup();
  paused.data.activeSession.paused = true;
  paused.data.activeSession.pausedAt = new Date(
    Date.now() - 2 * 60 * 1000
  ).toISOString();
  paused.data.activeSession.totalPausedMs = 60_000;
  const pausedResult = validateFullBackupPayload(paused);
  assert.equal(pausedResult.ok, true);
  assert.equal(pausedResult.data.activeSession.paused, true);
});

test("invalid and implausibly future pause timestamps drop only the active session", () => {
  const beforeStart = currentSessionBackup();
  beforeStart.data.activeSession.paused = true;
  beforeStart.data.activeSession.pausedAt = new Date(
    new Date(beforeStart.data.activeSession.startedAt).getTime() - 1000
  ).toISOString();
  assert.equal(validateFullBackupPayload(beforeStart).data.activeSession, null);

  const oneDayFuture = currentSessionBackup();
  oneDayFuture.data.activeSession.paused = true;
  oneDayFuture.data.activeSession.pausedAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();
  const futureResult = validateFullBackupPayload(oneDayFuture);
  assert.equal(futureResult.ok, true);
  assert.equal(futureResult.data.activeSession, null);
  assert.match(futureResult.warnings.join(" "), /future pause time|discarded/i);

  const farFuture = currentSessionBackup();
  farFuture.data.activeSession.paused = true;
  farFuture.data.activeSession.pausedAt = "2999-01-01T00:00:00.000Z";
  assert.equal(validateFullBackupPayload(farFuture).data.activeSession, null);
});

test("small clock skew is allowed while impossible paused totals and future starts are dropped", () => {
  const withinSkew = currentSessionBackup();
  withinSkew.data.activeSession.paused = true;
  withinSkew.data.activeSession.pausedAt = new Date(
    Date.now() + 60 * 1000
  ).toISOString();
  withinSkew.data.activeSession.totalPausedMs = 60_000;
  assert.equal(
    validateFullBackupPayload(withinSkew).data.activeSession.paused,
    true
  );

  const impossibleTotal = currentSessionBackup();
  impossibleTotal.data.activeSession.totalPausedMs = 24 * 60 * 60 * 1000;
  assert.equal(
    validateFullBackupPayload(impossibleTotal).data.activeSession,
    null
  );

  const futureStart = currentSessionBackup();
  futureStart.data.activeSession.startedAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();
  const futureStartResult = validateFullBackupPayload(futureStart);
  assert.equal(futureStartResult.data.activeSession, null);
  assert.match(futureStartResult.warnings.join(" "), /future/i);
});
