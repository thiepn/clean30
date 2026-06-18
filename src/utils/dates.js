export function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function daysBetween(dateA, dateB = new Date()) {
  function calendarDayNumber(value) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      const exact = new Date(year, month - 1, day);
      if (
        exact.getFullYear() !== year ||
        exact.getMonth() !== month - 1 ||
        exact.getDate() !== day
      ) {
        return null;
      }
      return Date.UTC(year, month - 1, day) / 86400000;
    }

    const parsed = parseDate(value);
    if (!parsed) return null;
    return Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) / 86400000;
  }

  const firstDay = calendarDayNumber(dateA);
  const secondDay = calendarDayNumber(dateB);
  if (firstDay === null || secondDay === null) return null;
  return secondDay - firstDay;
}

export function isOlderThanDays(date, days) {
  const elapsed = daysBetween(date);
  return elapsed === null || elapsed > days;
}

export function formatDate(date) {
  const parsed = parseDate(date);
  if (!parsed) return "Never";
  return new Intl.DateTimeFormat("en-DE", {
    dateStyle: "medium"
  }).format(parsed);
}

export function formatDateTime(date) {
  const parsed = parseDate(date);
  if (!parsed) return "Never";
  return new Intl.DateTimeFormat("en-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

export function formatRelativeDays(date) {
  const elapsed = daysBetween(date);
  if (elapsed === null) return "Never completed";
  if (elapsed === 0) return "Today";
  if (elapsed === 1) return "Yesterday";
  return `${elapsed} days ago`;
}

export const weekdayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
