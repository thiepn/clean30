function average(first, second = first) {
  return (Number(first) + Number(second)) / 2;
}

export function parseDurationMinutes(value, fallback = null) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return fallback;

  const hourRange = raw.match(
    /(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?\s*(?:hours?|hrs?|hr|h)\b/i
  );
  if (hourRange) {
    let minutes = average(hourRange[1], hourRange[2] || hourRange[1]) * 60;
    if (!hourRange[2]) {
      const tail = raw.slice((hourRange.index || 0) + hourRange[0].length);
      const minutePart = tail.match(
        /(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min|m)\b/i
      );
      if (minutePart) minutes += Number(minutePart[1]);
    }
    return Number.isFinite(minutes) && minutes > 0
      ? Math.max(1, Math.round(minutes))
      : fallback;
  }

  const minuteRange = raw.match(
    /(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?\s*(?:minutes?|mins?|min|m)\b/i
  );
  if (minuteRange) {
    const minutes = average(minuteRange[1], minuteRange[2] || minuteRange[1]);
    return Number.isFinite(minutes) && minutes > 0
      ? Math.max(1, Math.round(minutes))
      : fallback;
  }

  const numbers = raw.match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (!numbers.length) return fallback;
  const minutes = numbers.length > 1 ? average(numbers[0], numbers[1]) : numbers[0];
  return minutes > 0 ? Math.max(1, Math.round(minutes)) : fallback;
}
