import { cleaningTaskCatalog } from "../data/taskSuggestions.js";

export const MAINTENANCE_FREQUENCY_MODES = ["interval", "weekdays", "on-demand"];
export const MAINTENANCE_EFFORTS = ["light", "medium", "heavy"];
export const MAINTENANCE_COMPLETION_SOURCES = ["today", "routine", "home", "migration"];

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const RESERVED_ROOMS = new Set(["all", "floors", "other"]);

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanRoomName(zone) {
  return typeof zone === "string" ? zone.trim() : String(zone?.name || "").trim();
}

function slug(value) {
  return normalized(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "task";
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
}

function defaultIntervalDays(item) {
  const title = normalized(item?.title);

  if (
    title.includes("visible trash") ||
    title.includes("return dishes") ||
    title === "clear or wash dishes" ||
    title === "make the bed" ||
    title.includes("air out")
  ) return 1;

  if (
    title.includes("loose items") ||
    title.includes("put away clothes") ||
    title.includes("gather dirty laundry") ||
    title.includes("gather clothes for laundry") ||
    title.includes("gather laundry into baskets") ||
    title.includes("kitchen counters") ||
    title.includes("kitchen sink") ||
    title.includes("kitchen bin")
  ) return 3;

  if (
    title.includes("toilet") ||
    title.includes("bathroom sink") ||
    title.includes("bathroom mirror") ||
    title.includes("bathroom surfaces") ||
    title.includes("bathroom towels") ||
    title.includes("bathroom bin") ||
    title.includes("kitchen table") ||
    title.includes("stovetop") ||
    title.includes("old food") ||
    title.includes("vacuum the bedroom") ||
    title.includes("vacuum the living room") ||
    title.includes("entrance") ||
    title.includes("dining table") ||
    title.includes("dining-room floor") ||
    title.includes("office floor")
  ) return 7;

  if (
    title.includes("shower or bath") ||
    title.includes("shower glass") ||
    title.includes("dust visible surfaces") ||
    title.includes("dust bedroom") ||
    title.includes("dust living-room") ||
    title.includes("dust the desk") ||
    title.includes("dust dining-room") ||
    title.includes("vacuum main floors") ||
    title.includes("mop hard floors") ||
    title.includes("kitchen floor") ||
    title.includes("bathroom floor") ||
    title.includes("living-room floor") ||
    title.includes("change the bedding") ||
    title.includes("vacuum the sofa") ||
    title.includes("put away clean laundry")
  ) return 14;

  if (
    title.includes("cabinet fronts") ||
    title.includes("appliance fronts") ||
    title.includes("microwave") ||
    title.includes("refrigerator") ||
    title.includes("shower drain") ||
    title.includes("under the bed") ||
    title.includes("keyboard") ||
    title.includes("monitor") ||
    title.includes("washing machine") ||
    title.includes("detergent") ||
    title.includes("lint filter") ||
    title.includes("balcony furniture") ||
    title.includes("balcony railing")
  ) return 30;

  if (
    title.includes("interior windows") ||
    title.includes("window sills") ||
    title.includes("skirting") ||
    title.includes("high surfaces")
  ) return 90;

  return 14;
}

function defaultEnabled(item) {
  const title = normalized(item?.title);
  if (normalized(item?.room) === "other") return false;
  return !(
    title.includes("cabinet fronts") ||
    title.includes("one refrigerator shelf") ||
    title.includes("shower drain") ||
    title.includes("under the bed") ||
    title.includes("sort loose papers") ||
    title.includes("detergent area") ||
    title.includes("balcony railing")
  );
}

function effortForMinutes(minutes) {
  if (minutes <= 3) return "light";
  if (minutes <= 8) return "medium";
  return "heavy";
}

export function getCatalogMaintenanceTaskId(item) {
  return `maintenance:${slug(item?.room)}:${slug(item?.title)}`;
}

export function createCatalogMaintenanceTask(item) {
  const minutes = Math.max(1, Math.round(Number(item?.minutes) || 3));
  const id = getCatalogMaintenanceTaskId(item);
  return {
    id,
    catalogId: id,
    title: String(item?.title || "Cleaning task").trim() || "Cleaning task",
    room: String(item?.room || "Whole home").trim() || "Whole home",
    estimatedMinutes: minutes,
    stage: Math.max(0, Math.round(Number(item?.stage) || 50)),
    frequencyMode: "interval",
    intervalDays: defaultIntervalDays(item),
    weekdays: [],
    effort: effortForMinutes(minutes),
    enabled: defaultEnabled(item),
    source: "catalog"
  };
}

export function createCustomMaintenanceTask({
  id,
  title,
  room = "Whole home",
  estimatedMinutes = 3,
  stage = 50,
  intervalDays = 7,
  frequencyMode = "interval",
  weekdays = [],
  effort,
  enabled = true
} = {}) {
  const minutes = Math.max(1, Math.min(240, Math.round(Number(estimatedMinutes) || 3)));
  return {
    id: typeof id === "string" && id.trim()
      ? id.trim()
      : `maintenance:custom:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    catalogId: null,
    title: String(title || "Cleaning task").trim() || "Cleaning task",
    room: String(room || "Whole home").trim() || "Whole home",
    estimatedMinutes: minutes,
    stage: Math.max(0, Math.min(100, Math.round(Number(stage) || 50))),
    frequencyMode: MAINTENANCE_FREQUENCY_MODES.includes(frequencyMode)
      ? frequencyMode
      : "interval",
    intervalDays:
      frequencyMode === "on-demand"
        ? null
        : Math.max(1, Math.min(3650, Math.round(Number(intervalDays) || 7))),
    weekdays: uniqueStrings(weekdays).filter((day) => WEEKDAY_KEYS.includes(day.toLowerCase())).map((day) => day.toLowerCase()),
    effort: MAINTENANCE_EFFORTS.includes(effort) ? effort : effortForMinutes(minutes),
    enabled: Boolean(enabled),
    source: "custom"
  };
}

export function normalizeMaintenanceTask(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const title = String(value.title || "").trim();
  const room = String(value.room || "").trim();
  if (!title || !room) return null;
  const minutes = Math.max(1, Math.min(240, Math.round(Number(value.estimatedMinutes) || 3)));
  const source = value.source === "custom" ? "custom" : "catalog";
  const fallbackId = source === "catalog"
    ? getCatalogMaintenanceTaskId({ title, room })
    : `maintenance:custom:${slug(room)}:${slug(title)}`;
  const mode = MAINTENANCE_FREQUENCY_MODES.includes(value.frequencyMode)
    ? value.frequencyMode
    : "interval";
  const rawDays = Number(value.intervalDays);
  const intervalDays = mode === "on-demand"
    ? null
    : Math.max(1, Math.min(3650, Math.round(Number.isFinite(rawDays) ? rawDays : 7)));
  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : fallbackId,
    catalogId:
      value.catalogId === null
        ? null
        : typeof value.catalogId === "string" && value.catalogId.trim()
          ? value.catalogId.trim()
          : source === "catalog"
            ? fallbackId
            : null,
    title,
    room,
    estimatedMinutes: minutes,
    stage: Math.max(0, Math.min(100, Math.round(Number(value.stage) || 50))),
    frequencyMode: mode,
    intervalDays,
    weekdays: uniqueStrings(value.weekdays)
      .map((day) => day.toLowerCase())
      .filter((day) => WEEKDAY_KEYS.includes(day)),
    effort: MAINTENANCE_EFFORTS.includes(value.effort) ? value.effort : effortForMinutes(minutes),
    enabled: value.enabled !== false,
    source
  };
}

export function createDefaultMaintenanceTasks(zones = []) {
  const rooms = new Set(
    (Array.isArray(zones) ? zones : [])
      .map(cleanRoomName)
      .filter(Boolean)
      .map(normalized)
      .filter((room) => !RESERVED_ROOMS.has(room))
  );
  return cleaningTaskCatalog
    .filter((item) => normalized(item.room) === "whole home" || rooms.has(normalized(item.room)))
    .map(createCatalogMaintenanceTask);
}

export function normalizeMaintenanceTaskList(value, zones = []) {
  const source = Array.isArray(value) ? value : null;
  const tasks = source ? source.map(normalizeMaintenanceTask).filter(Boolean) : createDefaultMaintenanceTasks(zones);
  const used = new Set();
  return tasks.map((task, index) => {
    const base = task.id || `maintenance-${index + 1}`;
    let id = base;
    let suffix = 2;
    while (used.has(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(id);
    return { ...task, id };
  });
}

function catalogRoomForTitle(title) {
  const matches = cleaningTaskCatalog.filter((item) => normalized(item.title) === normalized(title));
  return matches.length === 1 ? matches[0].room : "";
}

export function findMaintenanceTaskId(template, { title, room = "" } = {}) {
  const tasks = Array.isArray(template?.maintenanceTasks) ? template.maintenanceTasks : [];
  const titleKey = normalized(title);
  if (!titleKey) return null;
  const roomKey = normalized(room);
  if (roomKey) {
    const exact = tasks.find(
      (task) => normalized(task.title) === titleKey && normalized(task.room) === roomKey
    );
    if (exact) return exact.id;
  }
  const titleMatches = tasks.filter((task) => normalized(task.title) === titleKey);
  if (titleMatches.length === 1) return titleMatches[0].id;
  const catalogRoom = catalogRoomForTitle(title);
  if (catalogRoom) {
    return tasks.find(
      (task) => normalized(task.title) === titleKey && normalized(task.room) === normalized(catalogRoom)
    )?.id || null;
  }
  return null;
}

function inferRoutineTaskRoom(template, task, phaseTitle) {
  const phase = String(phaseTitle || "").trim();
  const maintenanceRooms = new Set(
    (template?.maintenanceTasks || []).map((item) => normalized(item.room))
  );
  if (maintenanceRooms.has(normalized(phase))) return phase;
  return catalogRoomForTitle(task?.title) || "";
}

function linkTask(template, task, room = "") {
  const existingId = typeof task?.maintenanceTaskId === "string" ? task.maintenanceTaskId.trim() : "";
  if (existingId && template.maintenanceTasks.some((item) => item.id === existingId)) {
    return { ...task, maintenanceTaskId: existingId };
  }
  return {
    ...task,
    maintenanceTaskId: findMaintenanceTaskId(template, { title: task?.title, room })
  };
}

export function linkTemplateTasksToMaintenance(template) {
  const next = {
    ...template,
    todayDefaults: (template.todayDefaults || []).map((task) => linkTask(template, task)),
    todayWeekdayDefaults: Object.fromEntries(
      Object.entries(template.todayWeekdayDefaults || {}).map(([day, tasks]) => [
        day,
        Array.isArray(tasks) ? tasks.map((task) => linkTask(template, task)) : null
      ])
    ),
    dailyRules: (template.dailyRules || []).map((task) => linkTask(template, task)),
    routines: (template.routines || []).map((routine) => ({
      ...routine,
      phases: (routine.phases || []).map((phase) => ({
        ...phase,
        tasks: (phase.tasks || []).map((task) =>
          linkTask(template, task, inferRoutineTaskRoom(template, task, phase.title))
        )
      }))
    }))
  };
  return next;
}

export function findMaintenanceTaskIdForTodayTask(template, task) {
  const existing = typeof task?.maintenanceTaskId === "string" ? task.maintenanceTaskId.trim() : "";
  if (existing && template?.maintenanceTasks?.some((item) => item.id === existing)) return existing;
  const roomMatch = String(task?.note || "").match(/^Room:\s*(.+)$/i);
  if (roomMatch?.[1]?.trim()) {
    return findMaintenanceTaskId(template, { title: task?.text, room: roomMatch[1].trim() });
  }
  if (task?.source === "routine" && task?.routineId && task?.originalTaskId) {
    const routine = template?.routines?.find((item) => item.id === task.routineId);
    for (const phase of routine?.phases || []) {
      const routineTask = (phase.tasks || []).find((item) => item.id === task.originalTaskId);
      if (!routineTask) continue;
      if (routineTask.maintenanceTaskId) return routineTask.maintenanceTaskId;
      return findMaintenanceTaskId(template, {
        title: routineTask.title,
        room: inferRoutineTaskRoom(template, routineTask, phase.title)
      });
    }
  }
  return findMaintenanceTaskId(template, { title: task?.text });
}

export function findMaintenanceTaskIdForRoutineTask(template, task, phaseTitle = "") {
  const existing = typeof task?.maintenanceTaskId === "string" ? task.maintenanceTaskId.trim() : "";
  if (existing && template?.maintenanceTasks?.some((item) => item.id === existing)) return existing;
  return findMaintenanceTaskId(template, {
    title: task?.title,
    room: inferRoutineTaskRoom(template, task, phaseTitle)
  });
}

export function normalizeMaintenanceCompletion(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const completedAt = typeof value.completedAt === "string" ? value.completedAt : "";
  const parsed = new Date(completedAt);
  if (
    !completedAt ||
    Number.isNaN(parsed.getTime()) ||
    parsed.getTime() > Date.now() + 5 * 60 * 1000
  ) return null;
  const templateId = String(value.templateId || "").trim();
  const taskId = String(value.taskId || "").trim();
  if (!templateId || !taskId) return null;
  const source = MAINTENANCE_COMPLETION_SOURCES.includes(value.source) ? value.source : "migration";
  const sourceId = value.sourceId === null || value.sourceId === undefined
    ? null
    : String(value.sourceId).trim() || null;
  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id.trim()
        : `maintenance-completion:${templateId}:${taskId}:${parsed.getTime()}`,
    templateId,
    taskId,
    completedAt,
    source,
    sourceId
  };
}

export function normalizeMaintenanceCompletions(value, templates = []) {
  if (!Array.isArray(value)) return [];
  const templateMap = new Map(
    (Array.isArray(templates) ? templates : []).map((template) => [template.id, new Set((template.maintenanceTasks || []).map((task) => task.id))])
  );
  const usedIds = new Set();
  return value
    .map(normalizeMaintenanceCompletion)
    .filter(Boolean)
    .filter((entry) => templateMap.get(entry.templateId)?.has(entry.taskId))
    .filter((entry) => {
      if (usedIds.has(entry.id)) return false;
      usedIds.add(entry.id);
      return true;
    });
}

export function recordMaintenanceCompletion(
  completions,
  { templateId, taskId, completedAt = new Date().toISOString(), source = "home", sourceId = null } = {}
) {
  const entry = normalizeMaintenanceCompletion({
    id: `maintenance-completion:${templateId}:${taskId}:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    templateId,
    taskId,
    completedAt,
    source,
    sourceId
  });
  if (!entry) return Array.isArray(completions) ? completions : [];
  const current = Array.isArray(completions) ? completions : [];
  const withoutSameSource = entry.sourceId
    ? current.filter(
        (item) => !(item.source === entry.source && item.sourceId === entry.sourceId)
      )
    : current;
  return [...withoutSameSource, entry];
}

export function removeMaintenanceCompletionForSource(completions, source, sourceId) {
  if (!sourceId) return Array.isArray(completions) ? completions : [];
  return (Array.isArray(completions) ? completions : []).filter(
    (item) => !(item.source === source && item.sourceId === sourceId)
  );
}

export function deriveLegacyMaintenanceCompletions({
  templates = [],
  activeTemplateId = "",
  todayTasksByDate = {},
  history = []
} = {}) {
  let result = [];
  const activeTemplate = templates.find((template) => template.id === activeTemplateId) || templates[0];

  if (activeTemplate && todayTasksByDate && typeof todayTasksByDate === "object") {
    for (const [dateKey, tasks] of Object.entries(todayTasksByDate)) {
      for (const task of Array.isArray(tasks) ? tasks : []) {
        if (!task?.completed) continue;
        const taskId = findMaintenanceTaskIdForTodayTask(activeTemplate, task);
        if (!taskId) continue;
        result = recordMaintenanceCompletion(result, {
          templateId: activeTemplate.id,
          taskId,
          completedAt: task.completedAt || `${dateKey}T12:00:00.000Z`,
          source: "migration",
          sourceId: `today:${dateKey}:${task.id}`
        });
      }
    }
  }

  for (const entry of Array.isArray(history) ? history : []) {
    if (Number(entry?.percent) < 100) continue;
    const template = templates.find((item) => item.id === entry.templateId) || null;
    const routine = template?.routines?.find((item) => item.id === entry.routineId);
    if (!template || !routine) continue;
    for (const phase of routine.phases || []) {
      for (const task of phase.tasks || []) {
        const taskId = findMaintenanceTaskIdForRoutineTask(template, task, phase.title);
        if (!taskId) continue;
        result = recordMaintenanceCompletion(result, {
          templateId: template.id,
          taskId,
          completedAt: entry.finishedAt,
          source: "migration",
          sourceId: `history:${entry.id}:${task.id}`
        });
      }
    }
  }

  return result;
}
