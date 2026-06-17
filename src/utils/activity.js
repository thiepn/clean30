import { getTodayKey, parseDate } from "./dates.js";
import { isDailyRulesHistoryEntry } from "./calculations.js";

function entryDateKey(entry) {
  if (typeof entry?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return entry.date;
  }
  const date = parseDate(entry?.finishedAt || entry?.completedAt || entry?.startedAt);
  return date ? getTodayKey(date) : null;
}

function entryDurationMinutes(entry) {
  const saved = Number(entry?.estimatedDurationMinutes);
  if (Number.isFinite(saved)) return Math.max(0, saved);
  const started = parseDate(entry?.startedAt);
  const finished = parseDate(entry?.finishedAt);
  if (!started || !finished || finished < started) return 0;
  return Math.max(0, Math.round((finished - started) / 60000));
}

export function buildActivityByDate(history = [], todayTasksByDate = {}) {
  const activity = {};

  Object.entries(todayTasksByDate || {}).forEach(([dateKey, tasks]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
    activity[dateKey] = {
      dateKey,
      todayCompleted: Array.isArray(tasks) ? tasks.filter((task) => task.completed).length : 0,
      sessions: [],
      cleaningMinutes: 0
    };
  });

  (history || []).forEach((entry) => {
    const dateKey = entryDateKey(entry);
    if (!dateKey) return;
    if (!activity[dateKey]) {
      activity[dateKey] = {
        dateKey,
        todayCompleted: 0,
        sessions: [],
        cleaningMinutes: 0
      };
    }

    if (isDailyRulesHistoryEntry(entry)) {
      if (activity[dateKey].todayCompleted === 0) {
        activity[dateKey].todayCompleted = Math.max(0, Number(entry.completedTasks) || 0);
      }
    } else {
      activity[dateKey].sessions.push(entry);
    }
    activity[dateKey].cleaningMinutes += entryDurationMinutes(entry);
  });

  return activity;
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
        cleaningMinutes: summary.cleaningMinutes + activity.cleaningMinutes
      };
    },
    { activeDays: 0, todayCompleted: 0, routines: 0, cleaningMinutes: 0 }
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
  let cursor = activeSet.has(todayKey) ? today : activeSet.has(getTodayKey(yesterday)) ? yesterday : null;
  let current = 0;
  while (cursor && activeSet.has(getTodayKey(cursor))) {
    current += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best };
}
