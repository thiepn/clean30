import { getTaskLibraryItems } from "./homeLibrary.js";
import { rankRoomsForCare } from "./roomCare.js";

export const quickCleanBudgets = [5, 10, 15, 30, 45, 60];

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function uniqueNames(values = []) {
  const seen = new Set();
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const name = String(value || "").trim();
    const key = normalized(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function minutesFor(item) {
  return Math.max(1, Math.round(Number(item?.minutes) || 3));
}

function stageFor(item) {
  const stage = Number(item?.stage);
  return Number.isFinite(stage) ? stage : 55;
}

function sourceRank(item) {
  if (item?.source === "catalog") return 0;
  if (item?.source === "routine") return 1;
  return 2;
}

function itemComparator(roomOrder = []) {
  const roomIndex = new Map(roomOrder.map((room, index) => [room, index]));
  return (first, second) => {
    const stageDifference = stageFor(first) - stageFor(second);
    if (stageDifference) return stageDifference;
    const sourceDifference = sourceRank(first) - sourceRank(second);
    if (sourceDifference) return sourceDifference;
    const minuteDifference = minutesFor(first) - minutesFor(second);
    if (minuteDifference) return minuteDifference;
    const firstRoom = roomIndex.get(first.room) ?? roomOrder.length + 1;
    const secondRoom = roomIndex.get(second.room) ?? roomOrder.length + 1;
    if (firstRoom !== secondRoom) return firstRoom - secondRoom;
    return String(first.title || "").localeCompare(String(second.title || ""));
  };
}

function dedupeByTitle(items = []) {
  const result = [];
  const seen = new Set();
  for (const item of items) {
    const key = normalized(item?.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function selectIfFits(item, selected, selectedIds, spent, target) {
  if (!item || selectedIds.has(item.id)) return spent;
  const minutes = minutesFor(item);
  if (spent + minutes > target) return spent;
  selected.push(item);
  selectedIds.add(item.id);
  return spent + minutes;
}

export function groupQuickCleanItems(items = []) {
  const groups = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const room = String(item?.room || "Other").trim() || "Other";
    if (!groups.has(room)) groups.set(room, []);
    groups.get(room).push(item);
  }
  return [...groups.entries()].map(([room, tasks]) => ({ room, tasks }));
}

export function buildQuickCleanPlan({
  minutes = 15,
  rooms = [],
  routines = [],
  history = [],
  currentDateKey
} = {}) {
  const requestedMinutes = Math.max(5, Math.min(120, Math.round(Number(minutes) || 15)));
  const selectedRooms = uniqueNames(rooms);
  const roomCare = rankRoomsForCare({
    rooms: selectedRooms,
    routines,
    history,
    currentDateKey
  });
  const prioritizedRooms = roomCare.map((item) => item.room);
  const allowedRooms = new Set(["Whole home", ...selectedRooms]);
  const roomOrder = ["Whole home", ...prioritizedRooms];
  const compareItems = itemComparator(roomOrder);

  const candidates = dedupeByTitle(
    getTaskLibraryItems({
      routines,
      homeRooms: selectedRooms,
      room: "All",
      query: ""
    })
      .filter((item) => allowedRooms.has(item.room))
      .sort(compareItems)
  );

  const selected = [];
  const selectedIds = new Set();
  let spent = 0;

  const wholeHome = candidates.filter((item) => item.room === "Whole home");
  const wholeHomeSeedLimit = Math.min(8, Math.max(2, Math.floor(requestedMinutes * 0.3)));
  for (const item of wholeHome) {
    if (spent >= wholeHomeSeedLimit) break;
    const next = selectIfFits(item, selected, selectedIds, spent, requestedMinutes);
    if (next !== spent) spent = next;
  }

  for (const room of prioritizedRooms) {
    const roomCandidates = candidates
      .filter((item) => item.room === room && !selectedIds.has(item.id))
      .sort((first, second) => {
        const earlyFirst = stageFor(first) <= 60 ? 0 : 1;
        const earlySecond = stageFor(second) <= 60 ? 0 : 1;
        if (earlyFirst !== earlySecond) return earlyFirst - earlySecond;
        const minuteDifference = minutesFor(first) - minutesFor(second);
        if (minuteDifference) return minuteDifference;
        return compareItems(first, second);
      });
    const fitting = roomCandidates.find(
      (item) => spent + minutesFor(item) <= requestedMinutes
    );
    if (fitting) {
      spent = selectIfFits(
        fitting,
        selected,
        selectedIds,
        spent,
        requestedMinutes
      );
    }
  }

  const roomCounts = new Map();
  for (const item of selected) {
    roomCounts.set(item.room, (roomCounts.get(item.room) || 0) + 1);
  }

  while (spent < requestedMinutes) {
    const fitting = candidates
      .filter(
        (item) =>
          !selectedIds.has(item.id) &&
          spent + minutesFor(item) <= requestedMinutes
      )
      .sort((first, second) => {
        const firstRoomPriority = prioritizedRooms.indexOf(first.room);
        const secondRoomPriority = prioritizedRooms.indexOf(second.room);
        const firstKnownPriority = firstRoomPriority >= 0 ? firstRoomPriority : prioritizedRooms.length;
        const secondKnownPriority = secondRoomPriority >= 0 ? secondRoomPriority : prioritizedRooms.length;
        const firstCount = roomCounts.get(first.room) || 0;
        const secondCount = roomCounts.get(second.room) || 0;

        if (first.room !== "Whole home" && second.room !== "Whole home") {
          if (firstCount !== secondCount) return firstCount - secondCount;
          if (firstKnownPriority !== secondKnownPriority) {
            return firstKnownPriority - secondKnownPriority;
          }
        }
        return compareItems(first, second);
      })[0];

    if (!fitting) break;
    spent = selectIfFits(
      fitting,
      selected,
      selectedIds,
      spent,
      requestedMinutes
    );
    roomCounts.set(fitting.room, (roomCounts.get(fitting.room) || 0) + 1);
  }

  if (!selected.length && candidates.length) {
    const smallest = [...candidates].sort(
      (first, second) => minutesFor(first) - minutesFor(second) || compareItems(first, second)
    )[0];
    selected.push(smallest);
    spent = minutesFor(smallest);
  }

  const orderedItems = [...selected].sort(compareItems);
  return {
    requestedMinutes,
    estimatedMinutes: spent,
    remainingMinutes: Math.max(0, requestedMinutes - spent),
    fitsBudget: spent <= requestedMinutes,
    selectedRooms,
    prioritizedRooms,
    roomCare,
    items: orderedItems,
    groups: groupQuickCleanItems(orderedItems)
  };
}
