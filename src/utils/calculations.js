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

export function createHistoryEntry(session, template) {
  const finishedAt = new Date().toISOString();
  const routine = session.routineSnapshot;
  const progress = getSessionProgress(session, routine);
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
    notes: session.notes || ""
  };
}

function estimateDailyRuleMinutes(dailyRules) {
  return (dailyRules || []).reduce((total, rule) => {
    const match = String(rule.duration || "").match(/(\d+(?:\.\d+)?)/);
    return total + (match ? Number(match[1]) : 0);
  }, 0);
}

export function createDailyRulesHistoryEntry({ dateKey, dailyRules, template }) {
  const completedAt = new Date().toISOString();
  const totalTasks = dailyRules.length;
  return {
    id: `daily-rules-${dateKey}`,
    kind: "daily-rules",
    source: "daily-rules",
    date: dateKey,
    completedAt,
    routineId: "daily-rules",
    routineTitle: "Daily Rules",
    templateId: template?.id || null,
    templateName: template?.name || "",
    startedAt: completedAt,
    finishedAt: completedAt,
    completedTasks: totalTasks,
    totalTasks,
    percent: totalTasks ? 100 : 0,
    estimatedDurationMinutes: estimateDailyRuleMinutes(dailyRules),
    notes: "Completed from Dashboard daily rules."
  };
}

export function hasDailyRulesHistoryEntry(history, dateKey) {
  return (history || []).some(
    (entry) =>
      entry?.id === `daily-rules-${dateKey}` ||
      ((entry?.kind === "daily-rules" || entry?.source === "daily-rules") &&
        entry?.date === dateKey)
  );
}

export function isDailyRulesHistoryEntry(entry) {
  return entry?.kind === "daily-rules" || entry?.source === "daily-rules";
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
