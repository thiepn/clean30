import { getTodayKey } from "./dates.js";
import { rankRoomsForCare, routineCoversRoom } from "./roomCare.js";

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getRoomFreshnessPresentation(care) {
  if (!care || care.status === "untracked" || care.daysSince === null) {
    return {
      percent: null,
      segments: 0,
      label: "Not tracked yet",
      tone: "untracked"
    };
  }

  const interval = Math.max(1, Number(care.suggestedIntervalDays) || 14);
  const ratio = Math.max(0, Number(care.daysSince) || 0) / interval;
  const percent = clamp(Math.round(100 - ratio * 70), 10, 100);
  const segments = clamp(Math.ceil(percent / 20), 1, 5);

  if (care.status === "attention") {
    return { percent, segments, label: "Needs attention", tone: "attention" };
  }
  if (care.status === "soon") {
    return { percent, segments, label: "Could use attention", tone: "soon" };
  }
  if (percent >= 80) {
    return { percent, segments, label: "Fresh", tone: "fresh" };
  }
  return { percent, segments, label: "Looking good", tone: "good" };
}

export function getRoutineCoveredRooms(routine, rooms = []) {
  return (Array.isArray(rooms) ? rooms : []).filter((room) =>
    routineCoversRoom(routine, room, { includeArchived: true })
  );
}

export function getHomeCareSummary({
  rooms = [],
  routines = [],
  history = [],
  currentDateKey = getTodayKey()
} = {}) {
  const ranked = rankRoomsForCare({ rooms, routines, history, currentDateKey }).map(
    (care) => ({
      ...care,
      freshness: getRoomFreshnessPresentation(care)
    })
  );
  const tracked = ranked.filter((item) => item.status !== "untracked");
  const recent = ranked.filter((item) => item.status === "recent");
  const attention = ranked.filter((item) => item.status === "attention");
  const soon = ranked.filter((item) => item.status === "soon");
  const untracked = ranked.filter((item) => item.status === "untracked");
  const nextRoom = attention[0] || soon[0] || null;

  let headline = "No room history yet";
  let detail = rooms.length
    ? "Finish a room-based routine and Clean30 will start showing how recently that room was covered."
    : "Add rooms to Home to see a simple room-by-room snapshot.";

  if (attention.length) {
    headline = `${attention.length} ${attention.length === 1 ? "room could" : "rooms could"} use attention`;
    detail = nextRoom
      ? `${nextRoom.room} is the first place Clean30 would prioritize in a guided clean.`
      : "Quick clean can prioritize the least-recently covered rooms.";
  } else if (soon.length) {
    headline = `${soon.length} ${soon.length === 1 ? "room is" : "rooms are"} coming up`;
    detail = nextRoom
      ? `${nextRoom.room} is becoming a sensible next target, without creating a deadline.`
      : "Nothing needs urgent attention.";
  } else if (tracked.length) {
    headline = "Tracked rooms are looking good";
    detail = `${recent.length} ${recent.length === 1 ? "room has" : "rooms have"} a recent full-routine clean recorded.`;
  }

  return {
    rooms: ranked,
    trackedCount: tracked.length,
    recentCount: recent.length,
    attentionCount: attention.length,
    soonCount: soon.length,
    untrackedCount: untracked.length,
    nextRoom,
    headline,
    detail
  };
}
