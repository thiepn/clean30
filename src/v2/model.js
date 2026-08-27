export const V2_STORAGE_KEY = "clean30_v2_state";
export const V2_BACKUP_VERSION = 1;
export const TODAY_PLAN_LIMIT = 8;
export const MODE_PLAN_LIMIT = 12;
export const MIN_CADENCE_DAYS = 1;
export const MAX_CADENCE_DAYS = 730;

export const cadencePresets = [1, 2, 3, 4, 5, 7, 10, 14, 21, 30, 45, 60, 90, 180, 365];

export function normalizeCadence(value) {
  return Math.min(MAX_CADENCE_DAYS, Math.max(MIN_CADENCE_DAYS, Math.round(Number(value) || 7)));
}

export function cadenceLabel(days) {
  const normalized = normalizeCadence(days);
  if (normalized === 1) return "Daily";
  if (normalized === 2) return "Every 2 days";
  if (normalized === 3) return "Every 3 days";
  if (normalized === 4) return "Every 4 days";
  if (normalized === 5) return "Every 5 days";
  if (normalized === 7) return "Weekly";
  if (normalized === 14) return "Every 2 weeks";
  if (normalized === 21) return "Every 3 weeks";
  if (normalized === 30) return "Monthly";
  if (normalized === 60) return "Every 2 months";
  if (normalized === 90) return "Every 3 months";
  if (normalized === 180) return "Every 6 months";
  if (normalized === 365) return "Yearly";
  return `Every ${normalized} days`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const roomTypes = [
  {
    id: "kitchen",
    label: "Kitchen",
    icon: "kitchen",
    defaultFeatures: ["oven", "microwave", "refrigerator", "stovetop", "sink"],
    features: [
      ["oven", "Oven"],
      ["microwave", "Microwave"],
      ["dishwasher", "Dishwasher"],
      ["refrigerator", "Refrigerator"],
      ["stovetop", "Stovetop"],
      ["sink", "Sink"],
      ["extractor", "Extractor hood"],
      ["coffee-machine", "Coffee machine"],
      ["kettle", "Kettle"],
      ["kitchen-bin", "Bin"],
      ["pantry", "Pantry"],
      ["dining-table", "Dining table"],
      ["kitchen-window", "Window"]
    ]
  },
  {
    id: "bathroom",
    label: "Bathroom",
    icon: "bathroom",
    defaultFeatures: ["toilet", "shower", "mirror", "bathroom-sink"],
    features: [
      ["toilet", "Toilet"],
      ["shower", "Shower"],
      ["bath", "Bathtub"],
      ["shower-glass", "Shower glass"],
      ["mirror", "Mirror"],
      ["bathroom-sink", "Sink"],
      ["bathroom-bin", "Bin"],
      ["bathroom-cabinet", "Cabinet"],
      ["bathroom-window", "Window"],
      ["washing-machine", "Washing machine"],
      ["extractor-fan", "Extractor fan"]
    ]
  },
  {
    id: "bedroom",
    label: "Bedroom",
    icon: "bedroom",
    defaultFeatures: ["bed", "wardrobe"],
    features: [
      ["bed", "Bed"],
      ["wardrobe", "Wardrobe"],
      ["bedroom-mirror", "Mirror"],
      ["carpet", "Carpet"],
      ["hard-floor", "Hard floor"],
      ["bedroom-desk", "Desk"],
      ["bedroom-window", "Window"],
      ["bedroom-curtains", "Curtains / blinds"],
      ["bedroom-radiator", "Radiator"]
    ]
  },
  {
    id: "living",
    label: "Living room",
    icon: "living",
    defaultFeatures: ["sofa", "television"],
    features: [
      ["sofa", "Sofa"],
      ["television", "TV / electronics"],
      ["living-carpet", "Carpet"],
      ["living-hard-floor", "Hard floor"],
      ["living-window", "Window"],
      ["living-curtains", "Curtains / blinds"],
      ["living-shelves", "Shelving"],
      ["fireplace", "Fireplace"]
    ]
  },
  {
    id: "entrance",
    label: "Entrance",
    icon: "entrance",
    defaultFeatures: ["entrance-mat"],
    features: [
      ["entrance-mat", "Entrance mat"],
      ["shoe-storage", "Shoe storage"],
      ["entrance-hard-floor", "Hard floor"]
    ]
  },
  {
    id: "office",
    label: "Office",
    icon: "office",
    defaultFeatures: ["desk", "computer"],
    features: [
      ["desk", "Desk"],
      ["computer", "Computer setup"],
      ["office-carpet", "Carpet"],
      ["office-hard-floor", "Hard floor"]
    ]
  },
  {
    id: "dining",
    label: "Dining room",
    icon: "dining",
    defaultFeatures: ["dining-set"],
    features: [
      ["dining-set", "Table and chairs"],
      ["dining-carpet", "Carpet"],
      ["dining-hard-floor", "Hard floor"]
    ]
  },
  {
    id: "laundry",
    label: "Laundry area",
    icon: "laundry",
    defaultFeatures: ["washing-machine"],
    features: [
      ["washing-machine", "Washing machine"],
      ["dryer", "Dryer"],
      ["laundry-storage", "Laundry storage"]
    ]
  },
  {
    id: "balcony",
    label: "Balcony",
    icon: "balcony",
    defaultFeatures: ["balcony-floor"],
    features: [
      ["balcony-floor", "Floor"],
      ["balcony-furniture", "Outdoor furniture"],
      ["balcony-railing", "Railing"]
    ]
  },
  {
    id: "other",
    label: "Other room",
    icon: "other",
    defaultFeatures: [],
    features: [
      ["other-carpet", "Carpet"],
      ["other-hard-floor", "Hard floor"],
      ["other-window", "Window"],
      ["other-mirror", "Mirror"],
      ["other-shelves", "Shelving / storage"],
      ["other-desk", "Desk / work surface"]
    ]
  }
];

const task = (key, roomType, title, cadence, stage, options = {}) => ({
  key,
  roomType,
  title,
  cadence,
  stage,
  defaultEnabled: options.defaultEnabled === true,
  feature: options.feature || null,
  guest: Boolean(options.guest),
  essential: Boolean(options.essential),
  detail: options.detail || ""
});

export const taskCatalog = [
  task("kitchen-dishes", "kitchen", "Wash dishes and clear the sink", 1, 10, { guest: true, essential: true, defaultEnabled: true }),
  task("kitchen-counters", "kitchen", "Clean counters and backsplash", 7, 30, { guest: true, essential: true, defaultEnabled: true }),
  task("kitchen-sink", "kitchen", "Scrub the sink and faucet", 7, 35, { feature: "sink", guest: true, essential: true }),
  task("kitchen-stovetop", "kitchen", "Clean the stovetop", 7, 40, { feature: "stovetop", essential: true }),
  task("kitchen-fronts", "kitchen", "Wipe appliance and cabinet fronts", 30, 45),
  task("kitchen-table", "kitchen", "Clean the dining table", 7, 32, { feature: "dining-table", guest: true }),
  task("kitchen-floor", "kitchen", "Vacuum or sweep the kitchen floor", 7, 70, { guest: true, essential: true, defaultEnabled: true }),
  task("kitchen-mop", "kitchen", "Mop the kitchen floor", 7, 80, { essential: true }),
  task("kitchen-microwave", "kitchen", "Clean the microwave inside and out", 30, 50, { feature: "microwave" }),
  task("kitchen-oven", "kitchen", "Deep-clean the oven", 90, 55, { feature: "oven" }),
  task("kitchen-fridge", "kitchen", "Clean refrigerator shelves and drawers", 60, 50, { feature: "refrigerator" }),
  task("kitchen-dishwasher", "kitchen", "Clean the dishwasher filter and seals", 30, 50, { feature: "dishwasher" }),
  task("kitchen-extractor", "kitchen", "Degrease the extractor hood and filter", 30, 50, { feature: "extractor" }),
  task("kitchen-coffee", "kitchen", "Clean and descale the coffee machine", 30, 50, { feature: "coffee-machine" }),
  task("kitchen-kettle", "kitchen", "Descale the kettle", 60, 50, { feature: "kettle" }),
  task("kitchen-bin", "kitchen", "Empty and clean the kitchen bin", 3, 15, { feature: "kitchen-bin", guest: true }),
  task("kitchen-pantry", "kitchen", "Wipe pantry shelves and check spills", 60, 45, { feature: "pantry" }),
  task("kitchen-window", "kitchen", "Clean the kitchen window", 60, 45, { feature: "kitchen-window" }),

  task("bathroom-toilet", "bathroom", "Clean and disinfect the toilet", 7, 20, { feature: "toilet", guest: true, essential: true, defaultEnabled: true }),
  task("bathroom-sink", "bathroom", "Clean the sink, faucet, and counter", 7, 30, { feature: "bathroom-sink", guest: true, essential: true, defaultEnabled: true }),
  task("bathroom-mirror", "bathroom", "Clean the mirror", 7, 40, { feature: "mirror", guest: true, essential: true, defaultEnabled: true }),
  task("bathroom-shower", "bathroom", "Scrub the shower", 7, 45, { feature: "shower", essential: true, defaultEnabled: true }),
  task("bathroom-bath", "bathroom", "Scrub the bathtub", 7, 45, { feature: "bath", essential: true }),
  task("bathroom-glass", "bathroom", "Clean shower glass", 7, 50, { feature: "shower-glass" }),
  task("bathroom-surfaces", "bathroom", "Wipe shelves, handles, and fixtures", 14, 55),
  task("bathroom-bin", "bathroom", "Empty and wipe the bathroom bin", 7, 15, { feature: "bathroom-bin", guest: true }),
  task("bathroom-floor", "bathroom", "Vacuum or sweep the bathroom floor", 7, 70, { guest: true, essential: true, defaultEnabled: true }),
  task("bathroom-mop", "bathroom", "Mop the bathroom floor", 7, 80, { essential: true }),
  task("bathroom-drain", "bathroom", "Clean the shower or bath drain", 30, 60),
  task("bathroom-scale", "bathroom", "Remove limescale from fixtures", 30, 60),
  task("bathroom-cabinet", "bathroom", "Clean bathroom cabinet shelves and fronts", 30, 45, { feature: "bathroom-cabinet" }),
  task("bathroom-window", "bathroom", "Clean the bathroom window", 60, 45, { feature: "bathroom-window" }),
  task("bathroom-washer", "bathroom", "Clean the washing-machine seal and drawer", 30, 50, { feature: "washing-machine" }),
  task("bathroom-fan", "bathroom", "Dust the bathroom extractor fan", 60, 55, { feature: "extractor-fan" }),

  task("bedroom-bedding", "bedroom", "Change the bedding", 14, 10, { feature: "bed", essential: true, defaultEnabled: true }),
  task("bedroom-surfaces", "bedroom", "Dust furniture and bedside surfaces", 14, 35, { guest: true, essential: true }),
  task("bedroom-mirror", "bedroom", "Clean the mirror", 30, 45, { feature: "bedroom-mirror" }),
  task("bedroom-floor", "bedroom", "Vacuum or sweep the bedroom floor", 7, 70, { guest: true, essential: true, defaultEnabled: true }),
  task("bedroom-mop", "bedroom", "Mop the bedroom floor", 14, 80, { feature: "hard-floor" }),
  task("bedroom-under-bed", "bedroom", "Clean under the bed", 30, 75, { feature: "bed" }),
  task("bedroom-wardrobe", "bedroom", "Dust wardrobe tops and fronts", 60, 40, { feature: "wardrobe" }),
  task("bedroom-mattress", "bedroom", "Vacuum and rotate the mattress", 90, 65, { feature: "bed" }),
  task("bedroom-desk", "bedroom", "Clear and clean the desk", 7, 30, { feature: "bedroom-desk" }),
  task("bedroom-window", "bedroom", "Clean the bedroom window", 60, 45, { feature: "bedroom-window" }),
  task("bedroom-curtains", "bedroom", "Dust or wash curtains and blinds", 90, 55, { feature: "bedroom-curtains" }),
  task("bedroom-radiator", "bedroom", "Dust the radiator and surrounding wall", 60, 55, { feature: "bedroom-radiator" }),

  task("living-surfaces", "living", "Dust tables, shelves, and surfaces", 14, 30, { guest: true, essential: true, defaultEnabled: true }),
  task("living-electronics", "living", "Clean screens and electronics safely", 30, 40, { feature: "television" }),
  task("living-sofa", "living", "Vacuum the sofa and beneath cushions", 30, 55, { feature: "sofa" }),
  task("living-floor", "living", "Vacuum or sweep the living-room floor", 7, 70, { guest: true, essential: true, defaultEnabled: true }),
  task("living-mop", "living", "Mop the living-room floor", 14, 80, { feature: "living-hard-floor" }),
  task("living-under-furniture", "living", "Clean beneath movable furniture", 30, 75),
  task("living-window", "living", "Clean living-room windows", 60, 45, { feature: "living-window" }),
  task("living-curtains", "living", "Dust or wash curtains and blinds", 90, 55, { feature: "living-curtains" }),
  task("living-shelves", "living", "Dust and wipe shelving", 14, 35, { feature: "living-shelves" }),
  task("living-fireplace", "living", "Clean the fireplace surround", 30, 55, { feature: "fireplace" }),

  task("entrance-door", "entrance", "Clean the front door, handles, and switches", 30, 35, { guest: true }),
  task("entrance-mat", "entrance", "Clean the entrance mat", 14, 60, { feature: "entrance-mat", guest: true }),
  task("entrance-floor", "entrance", "Vacuum or sweep the entrance", 7, 70, { guest: true, essential: true, defaultEnabled: true }),
  task("entrance-mop", "entrance", "Mop the entrance floor", 14, 80, { feature: "entrance-hard-floor", guest: true }),

  task("office-desk", "office", "Clear and clean the desk", 7, 25, { feature: "desk", guest: true, essential: true, defaultEnabled: true }),
  task("office-equipment", "office", "Clean keyboard, mouse, and monitor", 14, 45, { feature: "computer" }),
  task("office-dust", "office", "Dust shelves and furniture", 14, 35),
  task("office-floor", "office", "Vacuum or sweep the office floor", 7, 70, { essential: true, defaultEnabled: true }),
  task("office-mop", "office", "Mop the office floor", 14, 80, { feature: "office-hard-floor" }),

  task("dining-table", "dining", "Clean the dining table and chairs", 7, 30, { feature: "dining-set", guest: true, essential: true, defaultEnabled: true }),
  task("dining-dust", "dining", "Dust dining-room surfaces", 14, 40),
  task("dining-floor", "dining", "Vacuum or sweep the dining-room floor", 7, 70, { guest: true, essential: true, defaultEnabled: true }),
  task("dining-mop", "dining", "Mop the dining-room floor", 14, 80, { feature: "dining-hard-floor" }),

  task("laundry-machine", "laundry", "Clean the washing-machine seal and drawer", 30, 45, { feature: "washing-machine", essential: true, defaultEnabled: true }),
  task("laundry-dryer", "laundry", "Clean the dryer lint filter and seals", 14, 45, { feature: "dryer", essential: true }),
  task("laundry-storage", "laundry", "Clean detergent shelves and storage", 30, 40, { feature: "laundry-storage" }),
  task("laundry-floor", "laundry", "Vacuum and mop the laundry area", 14, 75, { essential: true, defaultEnabled: true }),

  task("balcony-furniture", "balcony", "Clean balcony furniture", 30, 35, { feature: "balcony-furniture" }),
  task("balcony-railing", "balcony", "Wipe the balcony railing", 30, 45, { feature: "balcony-railing" }),
  task("balcony-floor", "balcony", "Sweep and wash the balcony floor", 14, 75, { feature: "balcony-floor", essential: true, defaultEnabled: true }),

  task("other-surfaces", "other", "Dust and wipe the main surfaces", 14, 35, { essential: true, defaultEnabled: true }),
  task("other-floor", "other", "Vacuum or sweep the floor", 7, 70, { essential: true, defaultEnabled: true }),
  task("other-mop", "other", "Mop the floor", 14, 80, { feature: "other-hard-floor" }),
  task("other-window", "other", "Clean the window", 60, 45, { feature: "other-window" }),
  task("other-mirror", "other", "Clean the mirror", 14, 40, { feature: "other-mirror" }),
  task("other-shelves", "other", "Clean shelving and storage surfaces", 30, 45, { feature: "other-shelves" }),
  task("other-desk", "other", "Clear and clean the work surface", 7, 30, { feature: "other-desk" })
];

function pad(value) {
  return String(value).padStart(2, "0");
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return new Date(year, Math.max(0, month - 1), day || 1, 12);
}

export function addDays(value, amount) {
  const date = typeof value === "string" ? fromDateKey(value) : new Date(value);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function daysFromToday(value, today = dateKey()) {
  return Math.round((fromDateKey(value) - fromDateKey(today)) / DAY_MS);
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function roomTypeById(typeId) {
  return roomTypes.find((item) => item.id === typeId) || roomTypes[0];
}

export function createRoom(typeId, existingRooms = [], customName = "") {
  const type = roomTypeById(typeId);
  const sameType = existingRooms.filter((room) => room.type === type.id).length;
  return {
    id: uid(type.id),
    type: type.id,
    name: String(customName || "").trim() || (sameType ? `${type.label} ${sameType + 1}` : type.label),
    features: [...type.defaultFeatures],
    customItems: []
  };
}

export function createCustomRoomItem(name) {
  return {
    id: uid("item"),
    name: String(name || "").trim()
  };
}

export function tasksForRoom(room) {
  const features = new Set(room?.features || []);
  const catalogTasks = taskCatalog
    .filter((item) => item.roomType === room?.type)
    .filter((item) => !item.feature || features.has(item.feature))
    .map((item) => ({
      ...item,
      id: `${room.id}:${item.key}`,
      roomId: room.id,
      roomName: room.name
    }));
  const itemTasks = (room?.customItems || []).filter((item) => item?.id && item?.name).map((item) => ({
    key: `custom-item-${item.id}`,
    roomType: room.type,
    title: `Clean ${item.name}`,
    cadence: 30,
    stage: 50,
    defaultEnabled: false,
    feature: null,
    guest: false,
    essential: false,
    detail: "",
    generatedFromItem: true,
    sourceItemId: item.id,
    id: `${room.id}:custom-item-${item.id}`,
    roomId: room.id,
    roomName: room.name
  }));
  return [...catalogTasks, ...itemTasks];
}

function nextSelectedDay(startKey, cleanDays, offset = 0) {
  const allowed = new Set(cleanDays?.length ? cleanDays : [2, 4, 6]);
  let found = 0;
  for (let delta = 0; delta < 60; delta += 1) {
    const candidate = fromDateKey(addDays(startKey, delta));
    if (!allowed.has(candidate.getDay())) continue;
    if (found === offset) return dateKey(candidate);
    found += 1;
  }
  return startKey;
}

export function nextTaskDue(startKey, cadence, cleanDays) {
  const normalizedCadence = normalizeCadence(cadence);
  const intervalDate = addDays(startKey, normalizedCadence);
  return normalizedCadence < 7 ? intervalDate : nextSelectedDay(intervalDate, cleanDays);
}

export function realignDueDate(existingDue, cadence, cleanDays, today = dateKey()) {
  if (normalizeCadence(cadence) < 7) return existingDue;
  const anchor = existingDue < today ? today : existingDue;
  return nextSelectedDay(anchor, cleanDays);
}

export function buildConfiguredTasks(rooms, cleanDays = [2, 4, 6], startKey = dateKey()) {
  const all = rooms.flatMap(tasksForRoom);
  let weeklyIndex = 0;
  let monthlyIndex = 0;
  return all.map((item) => {
    const selectedIndex = item.cadence < 7 ? 0 : item.cadence <= 14 ? weeklyIndex++ : monthlyIndex++;
    const cadenceOffset = item.cadence < 7
      ? 0
      : item.cadence <= 14
      ? selectedIndex % Math.max(1, cleanDays.length)
      : selectedIndex % Math.max(4, cleanDays.length * 4);
    return {
      ...item,
      enabled: item.defaultEnabled,
      nextDue: item.cadence < 7 ? startKey : nextSelectedDay(startKey, cleanDays, cadenceOffset)
    };
  });
}

export function createCustomTask(room, title, cadence = 7, cleanDays = [2, 4, 6], startKey = dateKey()) {
  const key = uid("custom");
  return {
    key,
    id: `${room.id}:${key}`,
    roomType: room.type,
    roomId: room.id,
    roomName: room.name,
    title: String(title || "").trim(),
    cadence: normalizeCadence(cadence),
    stage: 50,
    defaultEnabled: true,
    enabled: true,
    feature: null,
    guest: false,
    essential: false,
    detail: "",
    custom: true,
    nextDue: normalizeCadence(cadence) < 7 ? startKey : nextSelectedDay(startKey, cleanDays)
  };
}

export function createFreshV2State() {
  return {
    version: 2,
    onboardingComplete: false,
    setupDate: null,
    homeName: "My home",
    rooms: [],
    tasks: [],
    cleanDays: [2, 4, 6],
    scheduleStyle: "spread",
    activeSession: null,
    history: [],
    appearance: "light"
  };
}

function normalizeActiveSession(value, tasks) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (!value.id || !value.title || !Array.isArray(value.items) || !value.items.length) return null;
  const taskIds = new Set(tasks.map((item) => item.id));
  const items = value.items
    .filter((item) => item && taskIds.has(item.id) && item.title)
    .map((item) => ({
      ...item,
      id: String(item.id),
      title: String(item.title),
      roomName: String(item.roomName || "Room"),
      done: Boolean(item.done),
      skipped: item.done ? false : Boolean(item.skipped)
    }));
  if (!items.length) return null;
  return {
    id: String(value.id),
    title: String(value.title),
    mode: ["today", "weekly", "room", "guest"].includes(value.mode) ? value.mode : "today",
    startedAt: Number.isNaN(Date.parse(value.startedAt)) ? new Date().toISOString() : value.startedAt,
    currentIndex: Math.min(Math.max(0, Number(value.currentIndex) || 0), items.length - 1),
    items
  };
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && entry.id && entry.title && !Number.isNaN(Date.parse(entry.completedAt)))
    .map((entry) => ({
      ...entry,
      id: String(entry.id),
      title: String(entry.title),
      completedCount: Math.max(0, Number(entry.completedCount) || 0),
      totalCount: Math.max(0, Number(entry.totalCount) || 0),
      completedTaskIds: Array.isArray(entry.completedTaskIds) ? entry.completedTaskIds.map(String) : []
    }))
    .slice(-200);
}

export function normalizeV2State(value) {
  const fresh = createFreshV2State();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const rooms = Array.isArray(value.rooms)
    ? value.rooms.filter((room) => room && room.id && room.name && room.type).map((room) => ({
        id: String(room.id),
        type: String(room.type),
        name: String(room.name),
        features: Array.isArray(room.features) ? [...new Set(room.features.map(String))] : [],
        customItems: Array.isArray(room.customItems)
          ? room.customItems.filter((item) => item && item.id && String(item.name || "").trim()).map((item) => ({ id: String(item.id), name: String(item.name).trim() }))
          : []
      }))
    : [];
  const validRoomIds = new Set(rooms.map((room) => room.id));
  const tasks = Array.isArray(value.tasks)
    ? value.tasks.filter((item) => item && item.id && validRoomIds.has(item.roomId)).map((item) => ({
        ...item,
        id: String(item.id),
        title: String(item.title || "Cleaning task"),
        roomName: String(item.roomName || rooms.find((room) => room.id === item.roomId)?.name || "Room"),
        cadence: normalizeCadence(item.cadence),
        stage: Math.max(0, Number(item.stage) || 50),
        enabled: item.enabled !== false,
        nextDue: /^\d{4}-\d{2}-\d{2}$/.test(item.nextDue || "") ? item.nextDue : dateKey()
      }))
    : [];
  const cleanDays = Array.isArray(value.cleanDays)
    ? [...new Set(value.cleanDays.map(Number).filter((day) => day >= 0 && day <= 6))]
    : fresh.cleanDays;
  return {
    ...fresh,
    ...value,
    version: 2,
    homeName: String(value.homeName || fresh.homeName).trim() || fresh.homeName,
    rooms,
    tasks,
    cleanDays: cleanDays.length ? cleanDays : fresh.cleanDays,
    scheduleStyle: value.scheduleStyle === "one-day" ? "one-day" : "spread",
    appearance: value.appearance === "dark" ? "dark" : "light",
    history: normalizeHistory(value.history),
    activeSession: normalizeActiveSession(value.activeSession, tasks),
    onboardingComplete: Boolean(value.onboardingComplete && rooms.length)
  };
}

export function loadV2State() {
  return loadV2StateResult().state;
}

export function loadV2StateResult() {
  let saved = null;
  try {
    saved = window.localStorage.getItem(V2_STORAGE_KEY);
  } catch {
    return { state: createFreshV2State(), error: "Clean30 could not read saved data on this device.", recoveryPayload: null };
  }
  if (!saved) return { state: createFreshV2State(), error: null, recoveryPayload: null };
  try {
    return { state: normalizeV2State(JSON.parse(saved)), error: null, recoveryPayload: null };
  } catch {
    return {
      state: createFreshV2State(),
      error: "Clean30 found unreadable saved data and protected it from being overwritten.",
      recoveryPayload: saved
    };
  }
}

export function saveV2State(state) {
  try {
    window.localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(normalizeV2State(state)));
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "Changes could not be saved on this device. Export a backup before closing Clean30." };
  }
}

function planSort(first, second) {
  return first.nextDue.localeCompare(second.nextDue) || Number(second.essential) - Number(first.essential) || first.stage - second.stage;
}

export function buildTodayPlan(state, today = dateKey(), limit = TODAY_PLAN_LIMIT) {
  return (state.tasks || [])
    .filter((item) => item.enabled && item.nextDue <= today)
    .sort(planSort)
    .slice(0, Math.max(1, limit));
}

export function buildWeeklyReset(state, today = dateKey()) {
  const horizon = addDays(today, 6);
  return (state.tasks || [])
    .filter((item) => item.enabled && item.cadence >= 7 && item.nextDue <= horizon && (item.essential || item.custom))
    .sort((first, second) => Number(second.essential) - Number(first.essential) || first.roomName.localeCompare(second.roomName) || first.stage - second.stage)
    .slice(0, MODE_PLAN_LIMIT);
}

export function buildGuestPlan(state) {
  return (state.tasks || [])
    .filter((item) => item.enabled && item.guest)
    .sort((first, second) => {
      const roomOrder = ["entrance", "bathroom", "living", "kitchen", "dining", "bedroom", "office"];
      return roomOrder.indexOf(first.roomType) - roomOrder.indexOf(second.roomType) || first.stage - second.stage;
    })
    .slice(0, MODE_PLAN_LIMIT);
}

export function buildRoomPlan(state, roomId, today = dateKey()) {
  return (state.tasks || [])
    .filter((item) => item.enabled && item.roomId === roomId && (item.cadence <= 7 || item.nextDue <= today))
    .sort((first, second) => first.stage - second.stage);
}

export function createSession(title, mode, items) {
  return {
    id: uid("clean"),
    title,
    mode,
    startedAt: new Date().toISOString(),
    currentIndex: 0,
    items: items.map((item) => ({ ...item, done: false, skipped: false }))
  };
}

export function completeSession(state, session, completedAt = new Date().toISOString()) {
  const sessionItems = Array.isArray(session?.items) ? session.items : [];
  const completedIds = new Set(sessionItems.filter((item) => item.done).map((item) => item.id));
  const completedKey = dateKey(new Date(completedAt));
  return normalizeV2State({
    ...state,
    tasks: state.tasks.map((item) =>
      completedIds.has(item.id)
        ? { ...item, nextDue: nextTaskDue(completedKey, item.cadence, state.cleanDays) }
        : item
    ),
    history: completedIds.size ? [
      ...state.history,
      {
        id: `history:${session.id}`,
        title: session.title,
        mode: session.mode,
        startedAt: session.startedAt,
        completedAt,
        completedTaskIds: [...completedIds],
        completedCount: completedIds.size,
        totalCount: sessionItems.length
      }
    ] : state.history,
    activeSession: null
  });
}

export function tasksGroupedByRoom(tasks = []) {
  const groups = new Map();
  for (const item of tasks) {
    if (!groups.has(item.roomId)) groups.set(item.roomId, { roomId: item.roomId, roomName: item.roomName, items: [] });
    groups.get(item.roomId).items.push(item);
  }
  return [...groups.values()];
}

export function upcomingTasks(state, days = 7, today = dateKey()) {
  const end = addDays(today, days - 1);
  return (state.tasks || [])
    .filter((item) => item.enabled && item.nextDue >= today && item.nextDue <= end)
    .sort((first, second) => first.nextDue.localeCompare(second.nextDue) || first.stage - second.stage);
}

export function overdueTasks(state, today = dateKey()) {
  return (state.tasks || [])
    .filter((item) => item.enabled && item.nextDue < today)
    .sort(planSort);
}

export function futureTasks(state, afterDays = 0, withinDays = Number.POSITIVE_INFINITY, today = dateKey()) {
  const start = addDays(today, afterDays);
  const end = Number.isFinite(withinDays) ? addDays(today, withinDays) : null;
  return (state.tasks || [])
    .filter((item) => item.enabled && item.nextDue >= start && (!end || item.nextDue <= end))
    .sort(planSort);
}

export function taskHealth(state, today = dateKey()) {
  const enabled = (state.tasks || []).filter((item) => item.enabled);
  const overdue = enabled.filter((item) => item.nextDue < today).length;
  const dueToday = enabled.filter((item) => item.nextDue === today).length;
  return { enabled: enabled.length, overdue, dueToday };
}

export function createV2Backup(state) {
  return {
    app: "Clean30",
    type: "clean30-v2-backup",
    version: V2_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: normalizeV2State(state)
  };
}

export function validateV2Backup(value) {
  return Boolean(
    value &&
    value.app === "Clean30" &&
    value.type === "clean30-v2-backup" &&
    value.version === V2_BACKUP_VERSION &&
    value.data &&
    Array.isArray(value.data.rooms) &&
    value.data.rooms.length > 0 &&
    Array.isArray(value.data.tasks) &&
    value.data.tasks.every((item) => item && item.id && item.roomId && item.title)
  );
}
