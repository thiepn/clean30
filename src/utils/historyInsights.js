import { daysBetween, parseDate } from "./dates.js";

export const importantRoutineIds = [
  "weekly-reset",
  "minimal-reset",
  "monthly-deep-clean",
  "guest-reset",
  "initial-reset",
  "daily-rules"
];

function validDate(value) {
  return parseDate(value);
}

function sortByFinishedAt(entries) {
  return [...entries].sort((a, b) => {
    const first = validDate(a.finishedAt)?.getTime() || 0;
    const second = validDate(b.finishedAt)?.getTime() || 0;
    return first - second;
  });
}

function average(values) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return null;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function titleForRoutine(routines, routineId, fallback = "Routine") {
  return routines.find((routine) => routine.id === routineId)?.title || fallback || "Routine";
}

export function getHistoryInsights(history, routines, template) {
  const entries = Array.isArray(history) ? history : [];
  const now = new Date();
  const routineCounts = new Map();
  const routinePercents = new Map();

  entries.forEach((entry) => {
    if (!entry?.routineId) return;
    routineCounts.set(entry.routineId, (routineCounts.get(entry.routineId) || 0) + 1);
    if (!routinePercents.has(entry.routineId)) routinePercents.set(entry.routineId, []);
    routinePercents.get(entry.routineId).push(Number(entry.percent) || 0);
  });

  const mostUsed = [...routineCounts.entries()]
    .map(([routineId, count]) => ({
      routineId,
      count,
      title: titleForRoutine(routines, routineId, entries.find((entry) => entry.routineId === routineId)?.routineTitle)
    }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))[0] || null;

  const lastCompletedByRoutine = importantRoutineIds.map((routineId) => {
    const matching = entries
      .filter((entry) => entry.routineId === routineId && validDate(entry.finishedAt))
      .sort((a, b) => validDate(b.finishedAt) - validDate(a.finishedAt));
    return {
      routineId,
      title: titleForRoutine(routines, routineId, matching[0]?.routineTitle),
      finishedAt: matching[0]?.finishedAt || null
    };
  });

  const weeklyEntries = sortByFinishedAt(
    entries.filter((entry) => entry.routineId === "weekly-reset" && validDate(entry.finishedAt))
  );
  const weeklyGaps = weeklyEntries
    .slice(1)
    .map((entry, index) => daysBetween(weeklyEntries[index].finishedAt, entry.finishedAt))
    .filter((value) => value !== null);

  const recent7 = entries.filter((entry) => {
    const elapsed = daysBetween(entry.finishedAt, now);
    return elapsed !== null && elapsed <= 7;
  }).length;

  const recent30 = entries.filter((entry) => {
    const elapsed = daysBetween(entry.finishedAt, now);
    return elapsed !== null && elapsed <= 30;
  }).length;

  const averageCompletion = average(entries.map((entry) => Number(entry.percent) || 0));
  const averageCompletionByRoutine = [...routinePercents.entries()]
    .map(([routineId, percents]) => ({
      routineId,
      title: titleForRoutine(
        routines,
        routineId,
        entries.find((entry) => entry.routineId === routineId)?.routineTitle
      ),
      percent: average(percents) || 0
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const weeklyLast = lastCompletedByRoutine.find((item) => item.routineId === "weekly-reset");
  const monthlyLast = lastCompletedByRoutine.find((item) => item.routineId === "monthly-deep-clean");
  const weeklyThreshold = Number(template?.schedule?.weeklyResetDueAfterDays) || 7;
  const monthlyThreshold = Number(template?.schedule?.monthlyDeepCleanInterval) || 30;
  const weeklyAge = daysBetween(weeklyLast?.finishedAt);
  const monthlyAge = daysBetween(monthlyLast?.finishedAt);
  const warnings = [];

  if (entries.length && (weeklyAge === null || weeklyAge > weeklyThreshold)) {
    warnings.push({
      id: "weekly-overdue",
      message: "Weekly reset is overdue.",
      detail:
        weeklyAge === null
          ? "No weekly reset has been recorded yet."
          : `Last completed ${weeklyAge} days ago.`
    });
  }

  if (entries.length && (monthlyAge === null || monthlyAge > monthlyThreshold)) {
    warnings.push({
      id: "monthly-due",
      message: "Monthly deep clean is due.",
      detail:
        monthlyAge === null
          ? "No monthly deep clean has been recorded yet."
          : `Last completed ${monthlyAge} days ago.`
    });
  }

  return {
    mostUsed,
    lastCompletedByRoutine,
    averageWeeklyResetGap: average(weeklyGaps),
    weeklyGapSampleSize: weeklyGaps.length,
    recent7,
    recent30,
    averageCompletion,
    averageCompletionByRoutine,
    warnings
  };
}

export function getSessionDurationMinutes(entry) {
  const started = validDate(entry?.startedAt);
  const finished = validDate(entry?.finishedAt);
  if (!started || !finished || finished < started) return null;
  return Math.max(0, Math.round((finished - started) / 60000));
}
