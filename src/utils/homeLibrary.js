import { cleaningTaskCatalog } from "../data/taskSuggestions.js";
import { createId } from "./templateUtils.js";
import { createSimpleRoutineDraft, estimateRoutineMinutes } from "./routineLibrary.js";

const UTILITY_ZONE_NAMES = new Set(["floors", "other"]);
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

function parseMinutes(value, fallback = 3) {
  const matches = String(value || "").match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return fallback;
  const numbers = matches.map(Number).filter((item) => Number.isFinite(item) && item > 0);
  if (!numbers.length) return fallback;
  if (numbers.length > 1) return Math.max(1, Math.round((numbers[0] + numbers[1]) / 2));
  return Math.max(1, Math.round(numbers[0]));
}

export function getHomeRoomNames(zones = []) {
  return uniqueNames(
    (Array.isArray(zones) ? zones : [])
      .map(roomNameFromZone)
      .filter((name) => !UTILITY_ZONE_NAMES.has(normalized(name)))
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

  return uniqueNames([...roomNames, ...utilityNames]).map((name) => {
    const existing = existingByName.get(normalized(name));
    return {
      id: existing?.id || createId("zone"),
      name
    };
  });
}

function inferTaskRoom(task, phaseTitle, homeRooms) {
  const suggestion = cleaningTaskCatalog.find(
    (item) => normalized(item.title) === normalized(task?.title)
  );
  if (suggestion) return suggestion.room;

  const phase = String(phaseTitle || "").trim();
  const homeMatch = homeRooms.find((room) => normalized(room) === normalized(phase));
  if (homeMatch) return homeMatch;
  if (phase && !GENERIC_SECTION_NAMES.has(normalized(phase))) return phase;
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
        items.push({
          id: `routine:${routine.id}:${task.id}`,
          title,
          room: inferTaskRoom(task, phase.title, homeRooms),
          minutes: parseMinutes(task.duration, 3),
          stage: 55,
          keywords: [routine.title, phase.title].filter(Boolean),
          source: "routine",
          sourceLabel: routine.title,
          recommended: false
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
  const inferred = routineTaskItems(routines, homeRooms)
    .map((item) => item.room)
    .filter((room) => room && room !== "Other" && room !== "Whole home");
  return ["All", "Whole home", ...uniqueNames([...homeRooms, ...inferred]), "Other"];
}

export function getTaskLibraryItems({
  routines = [],
  homeRooms = [],
  room = "All",
  query = "",
  extraItems = []
} = {}) {
  const allowedRooms = new Set(["Whole home", "Other", ...homeRooms]);
  const builtIns = builtInTaskItems().filter(
    (item) => !homeRooms.length || allowedRooms.has(item.room)
  );
  const combined = [...extraItems, ...builtIns, ...routineTaskItems(routines, homeRooms)];
  const deduped = [];
  const seen = new Set();

  for (const item of combined) {
    const title = String(item?.title || "").trim();
    const itemRoom = String(item?.room || "Other").trim() || "Other";
    if (!title) continue;
    const key = `${normalized(itemRoom)}::${normalized(title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
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
  return deduped
    .filter((item) => room === "All" || item.room === room)
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
  if (!room || room === "All" || room === "Other") return [];
  return getTaskLibraryItems({ routines, homeRooms, room })
    .filter((item) => item.source === "catalog")
    .sort((first, second) => (first.stage || 55) - (second.stage || 55))
    .slice(0, room === "Whole home" ? 7 : 10)
    .map((item) => item.id);
}

export function getSuggestedTaskCountForRoom(room) {
  return cleaningTaskCatalog.filter((item) => item.room === room).length;
}

export function createCustomLibraryItem(title, room = "Other") {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) return null;
  return {
    id: createId("library-custom"),
    title: cleanTitle,
    room: String(room || "Other").trim() || "Other",
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
    if (!title) continue;
    const key = normalized(title);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  const draft = createSimpleRoutineDraft();
  if (!unique.length) return draft;

  const groups = new Map();
  for (const item of unique) {
    const room = String(item.room || "Other").trim() || "Other";
    if (!groups.has(room)) groups.set(room, []);
    groups.get(room).push(item);
  }

  const onlyRoom = groups.size === 1 ? [...groups.keys()][0] : "";
  draft.title = onlyRoom && onlyRoom !== "Whole home" && onlyRoom !== "Other"
    ? `${onlyRoom} clean`
    : "My clean";
  draft.phases = [...groups.entries()].map(([room, roomItems]) => ({
    id: createId("phase"),
    title: room === "Whole home" ? "Tasks" : room,
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
