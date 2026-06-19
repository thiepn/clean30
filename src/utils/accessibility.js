import { parseDate } from "./dates.js";

function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatCalendarDayLabel(dateKey, activity, todayKey) {
  const date = parseDate(`${dateKey}T00:00:00`);
  const dateLabel = date
    ? new Intl.DateTimeFormat("en-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(date)
    : dateKey;
  const todayLabel = dateKey === todayKey ? ", today" : "";
  const todayCompleted = Math.max(0, Number(activity?.todayCompleted) || 0);
  const routines = Array.isArray(activity?.sessions) ? activity.sessions.length : 0;
  if (!todayCompleted && !routines) return `${dateLabel}${todayLabel}, no activity`;
  return [
    `${dateLabel}${todayLabel}`,
    countLabel(todayCompleted, "Today task completed", "Today tasks completed"),
    countLabel(routines, "routine session")
  ].join(", ");
}
