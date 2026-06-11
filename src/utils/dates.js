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
  const first = parseDate(dateA);
  const second = parseDate(dateB);
  if (!first || !second) return null;
  const firstDay = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  const secondDay = new Date(second.getFullYear(), second.getMonth(), second.getDate());
  return Math.floor((secondDay - firstDay) / 86400000);
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
