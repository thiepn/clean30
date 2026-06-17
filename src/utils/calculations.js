import { daysBetween } from "./dates.js";
import { cloneDeep } from "./templateUtils.js";

export function getRoutineById(routines, routineId) {
  return (routines || []).find((routine) => routine.id === routineId);
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

export function createHistoryEntry(session, template) {
  const finishedAt = new Date().toISOString();
  const routine = session.routineSnapshot;
  const progress = getSessionProgress(session, routine);
  const elapsedMs = getSessionElapsedMs(session, new Date(finishedAt));
  return {
    id: `history-${Date.now()}`,
    routineId: session.routineId,
    routineTitle: routine?.title || "Routine",
    templateId: session.templateId || template?.id || null,
    templateName: template?.name || "",
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

export function createDailyRulesHistoryEntry({ dateKey, dailyRules, template }) {
  const completedAt = new Date().toISOString();
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
