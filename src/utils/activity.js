import { getTodayKey, parseDate } from "./dates.js";
import {
  getHistoryDurationMinutes,
  isDailyRulesHistoryEntry
} from "./calculations.js";
import { getTodayDefaultsForDate } from "./templateUtils.js";

export function historyEntryDateKey(entry) {
  if (typeof entry?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return entry.date;
  }
  const idMatch = String(entry?.id || "").match(
    /^(?:daily-rules|today-tasks)-(\d{4}-\d{2}-\d{2})$/
  );
  if (idMatch) return idMatch[1];
  const date = parseDate(entry?.finishedAt || entry?.completedAt || entry?.startedAt);
  return date ? getTodayKey(date) : null;
}

function durationTextMinutes(value) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const minutes = Number(match[1]);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

function findRoutineTask(template, routineId, taskId) {
  const routine = template?.routines?.find((item) => item.id === routineId);
  return routine?.phases
    ?.flatMap((phase) => phase.tasks || [])
    .find((task) => task.id === taskId);
}

function todayTaskEstimate(task, template, dateKey) {
  if (!task?.completed) return 0;
  const direct = Number(task.estimatedDurationMinutes);
  if (Number.isFinite(direct) && direct > 0) return direct;

  if (task.source === "default" && task.defaultTaskId) {
    const sourceTask = getTodayDefaultsForDate(template, dateKey).find(
      (item) => item.id === task.defaultTaskId
    );
    return durationTextMinutes(sourceTask?.duration) || 0;
  }

  if (task.source === "routine" && task.routineId && task.originalTaskId) {
    return (
      durationTextMinutes(
        findRoutineTask(template, task.routineId, task.originalTaskId)?.duration
      ) || 0
    );
  }
  return 0;
}

function createDerivedTodayActivity(dateKey, tasks, template) {
  const completedTasks = tasks.filter((task) => task.completed);
  if (!completedTasks.length) return null;
  const estimatedDurationMinutes = completedTasks.reduce(
    (total, task) => total + todayTaskEstimate(task, template, dateKey),
    0
  );
  const timestamp = `${dateKey}T12:00:00`;
  return {
    id: `today-activity-${dateKey}`,
    kind: "today",
    source: "today",
    date: dateKey,
    routineId: "daily-rules",
    routineTitle: "Today tasks",
    startedAt: timestamp,
    finishedAt: timestamp,
    completedTasks: completedTasks.length,
    totalTasks: tasks.length,
    percent: tasks.length
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0,
    estimatedDurationMinutes:
      estimatedDurationMinutes > 0 ? estimatedDurationMinutes : null,
    notes: "Derived from dated Today tasks.",
    derived: true,
    legacyFallback: false,
    deletable: false
  };
}

function emptyDay(dateKey, hasDatedTodayData = false) {
  return {
    dateKey,
    hasDatedTodayData,
    todayActivity: null,
    todayCompleted: 0,
    sessions: [],
    routineElapsedMinutes: 0,
    estimatedTodayMinutes: 0
  };
}

export function buildActivityByDate(
  history = [],
  todayTasksByDate = {},
  template = null
) {
  const activity = {};

  Object.entries(todayTasksByDate || {}).forEach(([dateKey, tasks]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Array.isArray(tasks)) return;
    const todayActivity = createDerivedTodayActivity(dateKey, tasks, template);
    activity[dateKey] = {
      ...emptyDay(dateKey, true),
      todayActivity,
      todayCompleted: todayActivity?.completedTasks || 0,
      estimatedTodayMinutes: todayActivity?.estimatedDurationMinutes || 0
    };
  });

  (history || []).forEach((entry) => {
    const dateKey = historyEntryDateKey(entry);
    if (!dateKey) return;
    if (!activity[dateKey]) activity[dateKey] = emptyDay(dateKey);
    const day = activity[dateKey];

    if (isDailyRulesHistoryEntry(entry)) {
      if (day.hasDatedTodayData || day.todayActivity) return;
      const estimatedTodayMinutes = Number(entry.estimatedDurationMinutes);
      day.todayActivity = {
        ...entry,
        date: dateKey,
        derived: false,
        legacyFallback: true,
        deletable: false
      };
      day.todayCompleted = Math.max(0, Number(entry.completedTasks) || 0);
      day.estimatedTodayMinutes =
        Number.isFinite(estimatedTodayMinutes) && estimatedTodayMinutes > 0
          ? estimatedTodayMinutes
          : 0;
      return;
    }

    const measuredMinutes =
      getHistoryDurationMinutes(entry, { allowEstimate: false }) || 0;
    day.sessions.push({ ...entry, deletable: true });
    day.routineElapsedMinutes += measuredMinutes;
  });

  return activity;
}

export function buildHistoryDisplayEntries(activityByDate = {}) {
  return Object.values(activityByDate).flatMap((day) => [
    ...(day.todayActivity ? [day.todayActivity] : []),
    ...day.sessions
  ]);
}

export function getWeekDateKeys(dateKey = getTodayKey()) {
  const reference = parseDate(`${dateKey}T00:00:00`) || new Date();
  const mondayOffset = (reference.getDay() + 6) % 7;
  const monday = new Date(reference);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(reference.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return getTodayKey(day);
  });
}

export function getWeeklyActivitySummary(activityByDate, dateKey = getTodayKey()) {
  const dateKeys = getWeekDateKeys(dateKey);
  return dateKeys.reduce(
    (summary, key) => {
      const activity = activityByDate[key];
      if (!activity) return summary;
      const active = activity.todayCompleted > 0 || activity.sessions.length > 0;
      return {
        activeDays: summary.activeDays + (active ? 1 : 0),
        todayCompleted: summary.todayCompleted + activity.todayCompleted,
        routines: summary.routines + activity.sessions.length,
        routineElapsedMinutes:
          summary.routineElapsedMinutes + activity.routineElapsedMinutes,
        estimatedTodayMinutes:
          summary.estimatedTodayMinutes + activity.estimatedTodayMinutes
      };
    },
    {
      activeDays: 0,
      todayCompleted: 0,
      routines: 0,
      routineElapsedMinutes: 0,
      estimatedTodayMinutes: 0
    }
  );
}

export function getActivityStreaks(activityByDate, todayKey = getTodayKey()) {
  const activeKeys = Object.values(activityByDate)
    .filter((item) => item.todayCompleted > 0 || item.sessions.length > 0)
    .map((item) => item.dateKey)
    .sort();
  if (!activeKeys.length) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let index = 1; index < activeKeys.length; index += 1) {
    const previous = parseDate(`${activeKeys[index - 1]}T00:00:00`);
    const current = parseDate(`${activeKeys[index]}T00:00:00`);
    const gap = previous && current ? Math.round((current - previous) / 86400000) : 0;
    run = gap === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const activeSet = new Set(activeKeys);
  const today = parseDate(`${todayKey}T00:00:00`) || new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  let cursor = activeSet.has(todayKey)
    ? today
    : activeSet.has(getTodayKey(yesterday))
      ? yesterday
      : null;
  let current = 0;
  while (cursor && activeSet.has(getTodayKey(cursor))) {
    current += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best };
}
