import { cleaningTaskCatalog } from "../data/taskSuggestions.js";
import { daysBetween, getTodayKey } from "./dates.js";

const ROOM_CADENCE_DAYS = new Map([
  ["kitchen", 7],
  ["bathroom", 7],
  ["entrance", 7],
  ["bedroom", 10],
  ["living room", 10],
  ["office", 14],
  ["dining room", 14],
  ["laundry", 14],
  ["balcony", 21]
]);

const STATUS_PRIORITY = {
  attention: 0,
  soon: 1,
  untracked: 2,
  recent: 3
};

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function validFinishedAt(entry) {
  const parsed = new Date(entry?.finishedAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function catalogRoomForTask(title) {
  const match = cleaningTaskCatalog.find(
    (item) => normalized(item.title) === normalized(title)
  );
  return match?.room || "";
}

export function getSuggestedRoomCareDays(room) {
  return ROOM_CADENCE_DAYS.get(normalized(room)) || 14;
}

export function routineCoversRoom(
  routine,
  room,
  { includeArchived = false } = {}
) {
  const roomKey = normalized(room);
  if (
    !roomKey ||
    !routine ||
    routine.id === "daily-rules" ||
    (routine.archived && !includeArchived)
  ) {
    return false;
  }

  return (routine.phases || []).some((phase) => {
    if (normalized(phase?.title) === roomKey) return true;
    return (phase?.tasks || []).some(
      (task) => normalized(catalogRoomForTask(task?.title)) === roomKey
    );
  });
}

export function getLastFullRoomRoutineCompletion(
  room,
  routines = [],
  history = [],
  templateId = ""
) {
  const routineIds = new Set(
    (Array.isArray(routines) ? routines : [])
      .filter((routine) => routineCoversRoom(routine, room))
      .map((routine) => routine.id)
  );

  if (!routineIds.size) return null;

  return (
    (Array.isArray(history) ? history : [])
      .filter(
        (entry) =>
          routineIds.has(entry?.routineId) &&
          (!templateId || !entry?.templateId || entry.templateId === templateId) &&
          Number(entry?.percent) >= 100 &&
          validFinishedAt(entry)
      )
      .sort((first, second) => validFinishedAt(second) - validFinishedAt(first))[0]
      ?.finishedAt || null
  );
}

export function getRoomCareStatus({
  room,
  routines = [],
  history = [],
  currentDateKey = getTodayKey(),
  templateId = ""
} = {}) {
  const suggestedIntervalDays = getSuggestedRoomCareDays(room);
  const lastCompletedAt = getLastFullRoomRoutineCompletion(
    room,
    routines,
    history,
    templateId
  );

  if (!lastCompletedAt) {
    return {
      room,
      status: "untracked",
      statusLabel: "No full routine recorded",
      detail: `Suggested check-in about every ${suggestedIntervalDays} days`,
      suggestedIntervalDays,
      lastCompletedAt: null,
      daysSince: null,
      score: 1 + 1 / suggestedIntervalDays
    };
  }

  const daysSince = Math.max(0, daysBetween(lastCompletedAt, currentDateKey) ?? 0);
  const ratio = daysSince / suggestedIntervalDays;
  let status = "recent";
  let statusLabel =
    daysSince === 0
      ? "Routine cleaned today"
      : daysSince === 1
        ? "Routine cleaned yesterday"
        : `Routine cleaned ${daysSince} days ago`;
  let score = ratio;

  if (ratio >= 1) {
    status = "attention";
    statusLabel = "May need attention";
    score = 4 + ratio;
  } else if (ratio >= 0.75) {
    status = "soon";
    statusLabel = "Coming up";
    score = 3 + ratio;
  }

  return {
    room,
    status,
    statusLabel,
    detail:
      status === "recent"
        ? statusLabel
        : `${daysSince} days since a full routine · suggested about every ${suggestedIntervalDays} days`,
    suggestedIntervalDays,
    lastCompletedAt,
    daysSince,
    score
  };
}

export function rankRoomsForCare({
  rooms = [],
  routines = [],
  history = [],
  currentDateKey = getTodayKey(),
  templateId = ""
} = {}) {
  const originalOrder = new Map(
    (Array.isArray(rooms) ? rooms : []).map((room, index) => [room, index])
  );

  return (Array.isArray(rooms) ? rooms : [])
    .map((room) =>
      getRoomCareStatus({ room, routines, history, currentDateKey, templateId })
    )
    .sort((first, second) => {
      const priorityDifference =
        (STATUS_PRIORITY[first.status] ?? 9) - (STATUS_PRIORITY[second.status] ?? 9);
      if (priorityDifference) return priorityDifference;
      if (first.score !== second.score) return second.score - first.score;
      return (originalOrder.get(first.room) ?? 0) - (originalOrder.get(second.room) ?? 0);
    });
}

export function getRoomsNeedingAttention(options = {}) {
  return rankRoomsForCare(options).filter(
    (item) => item.status === "attention" || item.status === "soon"
  );
}
