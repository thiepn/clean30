import { cleaningTaskCatalog } from "../data/taskSuggestions.js";
import { parseDurationMinutes } from "./duration.js";
import { createId } from "./templateUtils.js";
import { createSimpleRoutineDraft, estimateRoutineMinutes } from "./routineLibrary.js";

const UTILITY_ZONE_NAMES = new Set(["floors", "other"]);
const VIRTUAL_ROOM_NAMES = new Set(["all", "whole home"]);
const GENERIC_SECTION_NAMES = new Set([
  "tasks",
  "task",
  "start",
  "finish",
  "final check",
  "surfaces",
  "floors",
  "daily maintenance",
  "minimum line",
  "today defaults"
]);

export const homeRoomPresets = [
  { name: "Kitchen", description: "Dishes, counters, appliances, floor" },
  { name: "Bathroom", description: "Toilet, sink, mirror, shower or bath" },
  { name: "Bedroom", description: "Bed, clothes, furniture, floor" },
  { name: "Living room", description: "Clutter, sofa, surfaces, floor" },
  { name: "Entrance", description: "Shoes, entry surfaces, floor" },
  { name: "Office", description: "Desk, electronics, shelves, floor" },
  { name: "Dining room", description: "Table, chairs, surfaces, floor" },
  { name: "Laundry", description: "Laundry area, machine, baskets" },
  { name: "Balcony", description: "Furniture, railing, outdoor floor" }
];

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

export function getCanonicalHomeRoomName(value) {
  const name = String(value || "").trim();
  if (!name) return "";
  return homeRoomPresets.find((preset) => normalized(preset.name) === normalized(name))?.name || name;
}

export function isReservedHomeRoomName(value) {
  const key = normalized(value);
  return UTILITY_ZONE_NAMES.has(key) || VIRTUAL_ROOM_NAMES.has(key);
}

function roomNameFromZone(zone) {
  return typeof zone === "string" ? zone.trim() : String(zone?.name || "").trim();
}

function uniqueNames(values = []) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const name = String(value || "").trim();
    const key = normalized(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function catalogTaskForTitle(title) {
  return cleaningTaskCatalog.find(
    (item) => normalized(item.title) === normalized(title)
  ) || null;
}

export function getHomeRoomNames(zones = []) {
  return uniqueNames(
    (Array.isArray(zones) ? zones : [])
      .map(roomNameFromZone)
      .map(getCanonicalHomeRoomName)
      .filter((name) => name && !isReservedHomeRoomName(name))
  );
}

export function mergeHomeRoomsWithZones(currentZones = [], roomNames = []) {
  const current = Array.isArray(currentZones) ? currentZones : [];
  const existingByName = new Map(
    current
      .map((zone) => {
        const name = roomNameFromZone(zone);
        return [normalized(name), typeof zone === "string" ? null : zone];
      })
      .filter(([key]) => key)
  );
  const utilityNames = current
    .map(roomNameFromZone)
    .filter((name) => UTILITY_ZONE_NAMES.has(normalized(name)));
  const safeRooms = uniqueNames(
    (Array.isArray(roomNames) ? roomNames : [])
      .map(getCanonicalHomeRoomName)
      .filter((name) => name && !isReservedHomeRoomName(name))
  );

  return uniqueNames([...safeRooms, ...utilityNames]).map((name) => {
    const existing = existingByName.get(normalized(name));
    return {
      id: existing?.id || createId("zone"),
      name
    };
  });
}

function inferTaskRoom(task, phaseTitle, homeRooms) {
  const phase = String(phaseTitle || "").trim();
  const homeMatch = homeRooms.find((room) => normalized(room) === normalized(phase));
  if (homeMatch) return homeMatch;
  if (phase && !GENERIC_SECTION_NAMES.has(normalized(phase)) && !isReservedHomeRoomName(phase)) {
    return getCanonicalHomeRoomName(phase);
  }

  const suggestion = catalogTaskForTitle(task?.title);
  if (suggestion) {
    return homeRooms.find((room) => normalized(room) === normalized(suggestion.room)) || suggestion.room;
  }
  return "Other";
}

function routineTaskItems(routines = [], homeRooms = []) {
  const items = [];
  for (const routine of Array.isArray(routines) ? routines : []) {
    if (routine.id === "daily-rules" || routine.archived) continue;
    for (const phase of routine.phases || []) {
      for (const task of phase.tasks || []) {
        const title = String(task?.title || "").trim();
        if (!title) continue;
        const room = inferTaskRoom(task, phase.title, homeRooms);
        const suggestion = catalogTaskForTitle(title);
        items.push({
          id: `routine:${routine.id}:${task.id}`,
          title,
          room,
          minutes: parseDurationMinutes(task.duration, 3),
          stage: suggestion?.stage ?? 55,
          keywords: [routine.title, phase.title, ...(suggestion?.keywords || [])].filter(Boolean),
          source: "routine",
          sourceLabel: routine.title,
          recommended: Boolean(suggestion && normalized(suggestion.room) === normalized(room))
        });
      }
    }
  }
  return items;
}

function builtInTaskItems() {
  return cleaningTaskCatalog.map((task, index) => ({
    ...task,
    id: `catalog:${index}:${normalized(task.room)}:${normalized(task.title)}`,
    source: "catalog",
    sourceLabel: "Clean30 suggestions",
    recommended: true
  }));
}

export function getHomeLibraryRooms(homeRooms = [], routines = []) {
  const configured = uniqueNames(
    homeRooms
      .map(getCanonicalHomeRoomName)
      .filter((room) => room && !isReservedHomeRoomName(room))
  );
  const inferred = routineTaskItems(routines, configured)
    .map((item) => item.room)
    .filter((room) => room && !isReservedHomeRoomName(room));
  return uniqueNames(["All", "Whole home", ...configured, ...inferred, "Other"]);
}

export function getTaskLibraryItems({
  routines = [],
  homeRooms = [],
  room = "All",
  query = "",
  extraItems = []
} = {}) {
  const configured = uniqueNames(
    homeRooms
      .map(getCanonicalHomeRoomName)
      .filter((name) => name && !isReservedHomeRoomName(name))
  );
  const configuredByKey = new Map(configured.map((name) => [normalized(name), name]));
  const allowedRoomKeys = new Set(["whole home", "other", ...configuredByKey.keys()]);
  const builtIns = builtInTaskItems()
    .filter((item) => !configured.length || allowedRoomKeys.has(normalized(item.room)))
    .map((item) => ({
      ...item,
      room: configuredByKey.get(normalized(item.room)) || item.room
    }));
  const routineItems = routineTaskItems(routines, configured);
  const combined = [...extraItems, ...routineItems, ...builtIns];
  const deduped = [];
  const indexByKey = new Map();

  for (const item of combined) {
    const title = String(item?.title || "").trim();
    const itemRoom = getCanonicalHomeRoomName(item?.room || "Other") || "Other";
    if (!title) continue;
    const key = `${normalized(itemRoom)}::${normalized(title)}`;
    const existingIndex = indexByKey.get(key);
    if (existingIndex !== undefined) {
      const existing = deduped[existingIndex];
      if (existing.source !== "catalog" && item.source === "catalog") {
        existing.recommended = true;
        existing.stage = item.stage ?? existing.stage;
        existing.keywords = [
          ...new Set([...(existing.keywords || []), ...(item.keywords || [])])
        ];
      }
      continue;
    }
    indexByKey.set(key, deduped.length);
    deduped.push({
      ...item,
      id: item.id || createId("library-task"),
      title,
      room: itemRoom,
      minutes: Math.max(1, Math.round(Number(item.minutes) || 3)),
      source: item.source || "custom",
      sourceLabel: item.sourceLabel || "Custom task",
      recommended: Boolean(item.recommended)
    });
  }

  const needle = normalized(query);
  const roomKey = normalized(room);
  return deduped
    .filter((item) => roomKey === "all" || normalized(item.room) === roomKey)
    .filter((item) => {
      if (!needle) return true;
      return [item.title, item.room, item.sourceLabel, ...(item.keywords || [])]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    })
    .sort((first, second) => {
      if (first.room !== second.room) return first.room.localeCompare(second.room);
      if (first.recommended !== second.recommended) return first.recommended ? -1 : 1;
      return first.title.localeCompare(second.title);
    });
}

export function getRecommendedTaskIdsForRoom(room, homeRooms = [], routines = []) {
  const roomKey = normalized(room);
  if (!room || roomKey === "all" || roomKey === "other") return [];
  return getTaskLibraryItems({ routines, homeRooms, room })
    .filter((item) => item.recommended)
    .sort((first, second) => (first.stage || 55) - (second.stage || 55))
    .slice(0, roomKey === "whole home" ? 7 : 10)
    .map((item) => item.id);
}

export function getSuggestedTaskCountForRoom(room) {
  const roomKey = normalized(room);
  return cleaningTaskCatalog.filter((item) => normalized(item.room) === roomKey).length;
}

export function createCustomLibraryItem(title, room = "Other") {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) return null;
  return {
    id: createId("library-custom"),
    title: cleanTitle,
    room: getCanonicalHomeRoomName(room) || "Other",
    minutes: 3,
    stage: 55,
    keywords: [],
    source: "custom",
    sourceLabel: "Custom task",
    recommended: false
  };
}

export function createRoutineDraftFromLibraryItems(items = []) {
  const unique = [];
  const seen = new Set();
  for (const item of items) {
    const title = String(item?.title || "").trim();
    const room = getCanonicalHomeRoomName(item?.room || "Other") || "Other";
    if (!title) continue;
    const key = `${normalized(room)}::${normalized(title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...item, title, room });
  }

  const draft = createSimpleRoutineDraft();
  if (!unique.length) return draft;

  const groups = new Map();
  for (const item of unique) {
    if (!groups.has(item.room)) groups.set(item.room, []);
    groups.get(item.room).push(item);
  }

  const onlyRoom = groups.size === 1 ? [...groups.keys()][0] : "";
  draft.title =
    onlyRoom && onlyRoom !== "Whole home" && onlyRoom !== "Other"
      ? `${onlyRoom} clean`
      : "My clean";
  draft.phases = [...groups.entries()].map(([roomName, roomItems]) => ({
    id: createId("phase"),
    title: roomName === "Whole home" ? "Tasks" : roomName,
    tasks: roomItems.map((item) => ({
      id: createId("task"),
      title: item.title,
      duration: `${Math.max(1, Math.round(Number(item.minutes) || 3))} min`,
      detail: "",
      note: "",
      tags: [],
      priority: "normal"
    }))
  }));
  const minutes = estimateRoutineMinutes(draft);
  draft.estimatedMinutes = minutes;
  draft.estimatedTime = `${minutes} min`;
  return draft;
}
