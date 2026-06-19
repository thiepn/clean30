import { daysBetween, parseDate } from "./dates.js";
import { cloneDeep } from "./templateUtils.js";

export function getRoutineById(routines, routineId) {
  return (routines || []).find((routine) => routine.id === routineId);
}

export function isSessionForRoutine(session, templateId, routineId) {
  return Boolean(
    session &&
      session.templateId === templateId &&
      session.routineId === routineId
  );
}

export function getRoutineTaskIds(routine) {
  return routine?.phases?.flatMap((phase) => phase.tasks.map((task) => task.id)) || [];
}

export function getRoutineTotalTasks(routine) {
  return getRoutineTaskIds(routine).length;
}

export function createSession(routine, template) {
  const now = new Date().toISOString();
  return {
    id: `session-${Date.now()}`,
    routineId: routine.id,
    templateId: template.id,
    startedAt: now,
    paused: false,
    pausedAt: null,
    totalPausedMs: 0,
    completedTaskIds: [],
    notes: "",
    routineSnapshot: cloneDeep(routine)
  };
}

export function getSessionProgress(session, routine) {
  const routineSource = routine || session?.routineSnapshot;
  if (!session || !routineSource) {
    return { completed: 0, total: 0, percent: 0 };
  }
  const total = getRoutineTotalTasks(routineSource);
  const validIds = new Set(getRoutineTaskIds(routineSource));
  const completed = new Set((session.completedTaskIds || []).filter((id) => validIds.has(id))).size;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

function parseDateMs(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function getSessionElapsedMs(session, now = new Date()) {
  if (!session?.startedAt) return 0;
  const started = parseDateMs(session.startedAt);
  if (started === null) return 0;
  const nowMs = now instanceof Date ? now.getTime() : parseDateMs(now);
  const pausedAt = session.paused ? parseDateMs(session.pausedAt) : null;
  const end = pausedAt ?? nowMs;
  const pausedTotal = Number.isFinite(Number(session.totalPausedMs))
    ? Math.max(0, Number(session.totalPausedMs))
    : 0;
  if (!Number.isFinite(end) || end < started) return 0;
  return Math.max(0, end - started - pausedTotal);
}

export function formatElapsedTime(ms) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function formatRoutineDuration(routine) {
  if (routine?.estimatedTime) return routine.estimatedTime;
  const minutes = Number(routine?.estimatedMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return "No estimate";
  return `${Math.round(minutes)} min`;
}

export function getLastRoutineFinishedAt(history, routineId) {
  return (history || [])
    .filter((entry) => entry?.routineId === routineId && !isDailyRulesHistoryEntry(entry))
    .filter((entry) => !Number.isNaN(new Date(entry.finishedAt).getTime()))
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))[0]?.finishedAt || null;
}

export function getLastRoutineDoneLabel(history, routineId) {
  const finishedAt = getLastRoutineFinishedAt(history, routineId);
  if (!finishedAt) return "Not done yet";
  const elapsed = daysBetween(finishedAt);
  if (elapsed === null) return "Not done yet";
  if (elapsed === 0) return "Last done today";
  if (elapsed === 1) return "Last done yesterday";
  return `Last done ${elapsed} days ago`;
}

export function createHistoryEntry(
  session,
  template,
  finishedAt = new Date().toISOString()
) {
  const routine = session.routineSnapshot;
  const progress = getSessionProgress(session, routine);
  const elapsedMs = getSessionElapsedMs(session, new Date(finishedAt));
  return {
    id: `session-history-${session.id}`,
    sessionId: session.id,
    routineId: session.routineId,
    routineTitle: routine?.title || "Routine",
    templateId: session.templateId || null,
    templateName: session.templateId ? template?.name || "" : "",
    startedAt: session.startedAt,
    finishedAt,
    completedTasks: progress.completed,
    totalTasks: progress.total,
    percent: progress.percent,
    notes: session.notes || "",
    elapsedMs,
    estimatedDurationMinutes: Math.max(0, Math.round(elapsedMs / 60000))
  };
}

function estimateTodayTaskMinutes(tasks) {
  return (tasks || []).reduce((total, rule) => {
    const match = String(rule.duration || "").match(/(\d+(?:\.\d+)?)/);
    return total + (match ? Number(match[1]) : 0);
  }, 0);
}

export function createDailyRulesHistoryEntry({
  dateKey,
  dailyRules,
  template,
  completedAt = new Date().toISOString()
}) {
  const totalTasks = dailyRules.length;
  return {
    id: `today-tasks-${dateKey}`,
    kind: "today",
    source: "today",
    date: dateKey,
    completedAt,
    routineId: "daily-rules",
    routineTitle: "Today tasks",
    templateId: template?.id || null,
    templateName: template?.name || "",
    startedAt: completedAt,
    finishedAt: completedAt,
    completedTasks: totalTasks,
    totalTasks,
    percent: totalTasks ? 100 : 0,
    estimatedDurationMinutes: estimateTodayTaskMinutes(dailyRules),
    notes: "Completed from Dashboard Today tasks."
  };
}

function settlePausedSession(session, finishedAt) {
  if (!session?.paused) return session;
  const pausedAt = parseDate(session.pausedAt);
  const finished = parseDate(finishedAt);
  const settledPausedMs =
    pausedAt && finished ? Math.max(0, finished.getTime() - pausedAt.getTime()) : 0;
  return {
    ...session,
    paused: false,
    pausedAt: null,
    totalPausedMs: Math.max(0, Number(session.totalPausedMs) || 0) + settledPausedMs
  };
}

export function finishSessionState(
  state,
  sessionId,
  finishedAt = new Date().toISOString()
) {
  const session = state?.activeSession;
  if (!session || session.id !== sessionId) {
    return { state, accepted: false, historyEntry: null };
  }

  const sessionTemplate =
    state.templates.find((template) => template.id === session.templateId) ||
    state.templates.find((template) => template.id === state.activeTemplateId) ||
    state.templates[0];
  const meaningfulUseAt = state.firstMeaningfulUseAt || finishedAt;

  if (session.routineId === "daily-rules") {
    const finishedDate = parseDate(finishedAt) || new Date();
    const dateKey = [
      finishedDate.getFullYear(),
      String(finishedDate.getMonth() + 1).padStart(2, "0"),
      String(finishedDate.getDate()).padStart(2, "0")
    ].join("-");
    const dailyRules = sessionTemplate?.dailyRules || [];
    const validDailyRuleIds = new Set(dailyRules.map((rule) => rule.id));
    const completedRuleIds = [
      ...new Set((session.completedTaskIds || []).filter((id) => validDailyRuleIds.has(id)))
    ];
    return {
      accepted: true,
      historyEntry: null,
      state: {
        ...state,
        history: state.history,
        activeSession: null,
        dailyRuleCompletions: {
          ...state.dailyRuleCompletions,
          [dateKey]: completedRuleIds
        },
        firstMeaningfulUseAt: meaningfulUseAt
      }
    };
  }

  const settledSession = settlePausedSession(session, finishedAt);
  const entry = createHistoryEntry(settledSession, sessionTemplate, finishedAt);
  const existingEntry = state.history.find(
    (item) => item.id === entry.id || item.sessionId === sessionId
  );
  return {
    accepted: true,
    historyEntry: existingEntry || entry,
    state: {
      ...state,
      history: existingEntry ? state.history : [entry, ...state.history],
      activeSession: null,
      firstMeaningfulUseAt: meaningfulUseAt
    }
  };
}

function positiveFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function getHistoryDurationMinutes(entry, { allowEstimate = true } = {}) {
  const elapsedMs = positiveFiniteNumber(entry?.elapsedMs);
  if (elapsedMs !== null) return Math.round(elapsedMs / 60000);

  const elapsedMinutes = positiveFiniteNumber(entry?.elapsedMinutes);
  if (elapsedMinutes !== null) return Math.round(elapsedMinutes);

  const started = parseDate(entry?.startedAt);
  const finished = parseDate(entry?.finishedAt);
  if (started && finished && finished > started) {
    return Math.round((finished - started) / 60000);
  }

  if (allowEstimate) {
    const estimate = positiveFiniteNumber(entry?.estimatedDurationMinutes);
    if (estimate !== null) return Math.round(estimate);
  }
  return null;
}

export function hasDailyRulesHistoryEntry(history, dateKey) {
  return (history || []).some(
    (entry) =>
      entry?.id === `daily-rules-${dateKey}` ||
      entry?.id === `today-tasks-${dateKey}` ||
      ((entry?.kind === "daily-rules" ||
        entry?.source === "daily-rules" ||
        entry?.kind === "today" ||
        entry?.source === "today") &&
        entry?.date === dateKey)
  );
}

export function isDailyRulesHistoryEntry(entry) {
  return (
    entry?.kind === "daily-rules" ||
    entry?.source === "daily-rules" ||
    entry?.kind === "today" ||
    entry?.source === "today"
  );
}

export function getLastCompleted(history, routineId) {
  return history
    .filter((entry) => entry.routineId === routineId)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))[0]?.finishedAt || null;
}

export function getHistoryStats(history) {
  const sessionEntries = history.filter((entry) => !isDailyRulesHistoryEntry(entry));
  const total = sessionEntries.length;
  const average = total
    ? Math.round(sessionEntries.reduce((sum, entry) => sum + (entry.percent || 0), 0) / total)
    : 0;
  return {
    total,
    dailyRules: history.filter((entry) => isDailyRulesHistoryEntry(entry)).length,
    weekly: sessionEntries.filter((entry) => entry.routineId === "weekly-reset").length,
    minimal: sessionEntries.filter((entry) => entry.routineId === "minimal-reset").length,
    monthly: sessionEntries.filter((entry) => entry.routineId === "monthly-deep-clean").length,
    average,
    daysSinceWeekly: daysBetween(getLastCompleted(history, "weekly-reset")),
    daysSinceMonthly: daysBetween(getLastCompleted(history, "monthly-deep-clean"))
  };
}
