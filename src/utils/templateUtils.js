import { clean30DefaultTemplate } from "../data/defaultTemplate.js";

export const priorityOptions = ["normal", "important", "critical", "optional"];
export const routineColorOptions = [
  "none",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "brown",
  "gray"
];
export const accentOptions = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "cyan",
  "blue",
  "navy",
  "purple",
  "pink",
  "brown",
  "charcoal"
];
export const densityOptions = ["comfortable", "compact"];
export const weekdayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberInRange(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function normalizePriority(value) {
  return priorityOptions.includes(value) ? value : "normal";
}

function parseEstimatedMinutes(value, fallback = 30) {
  const raw = typeof value === "string" ? value.toLowerCase() : "";
  const hourRange = raw.match(/(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?\s*(?:hours?|hrs?|h)\b/);
  if (hourRange) {
    const first = Number(hourRange[1]);
    const second = Number(hourRange[2] || hourRange[1]);
    if (Number.isFinite(first) && Number.isFinite(second)) {
      return Math.round(((first + second) / 2) * 60);
    }
  }

  const minuteRange = raw.match(/(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?\s*(?:minutes?|mins?|m)\b/);
  if (minuteRange) {
    const first = Number(minuteRange[1]);
    const second = Number(minuteRange[2] || minuteRange[1]);
    if (Number.isFinite(first) && Number.isFinite(second)) {
      return Math.round((first + second) / 2);
    }
  }

  const firstNumber = raw.match(/(\d+(?:\.\d+)?)/);
  if (firstNumber) {
    const parsed = Number(firstNumber[1]);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }

  return fallback;
}

function normalizeRoutineMinutes(saved) {
  const hasDirect =
    saved.estimatedMinutes !== null &&
    saved.estimatedMinutes !== undefined &&
    saved.estimatedMinutes !== "";
  const direct = hasDirect ? Number(saved.estimatedMinutes) : NaN;
  const fallback = parseEstimatedMinutes(saved.estimatedTime, 30);
  const value = Number.isFinite(direct) ? direct : fallback;
  return Math.round(Math.min(600, Math.max(1, value)));
}

function normalizeRoutineColor(value) {
  return routineColorOptions.includes(value) ? value : "none";
}

function normalizeTemplateAccent(value, fallback = "green") {
  const aliases = {
    forest: "green",
    emerald: "green",
    ocean: "cyan",
    indigo: "blue",
    violet: "purple",
    plum: "purple",
    rose: "pink",
    crimson: "red",
    copper: "brown",
    slate: "charcoal",
    gray: "charcoal"
  };
  const normalized = aliases[value] || value;
  return accentOptions.includes(normalized) ? normalized : fallback;
}

export function normalizeTask(task, fallbackTitle = "New task") {
  const saved = isPlainObject(task) ? task : {};
  const tags = Array.isArray(saved.tags)
    ? saved.tags.filter((tag) => typeof tag === "string" && tag.trim()).map((tag) => tag.trim())
    : [];
  return {
    id: text(saved.id) || createId("task"),
    title: text(saved.title, fallbackTitle) || fallbackTitle,
    duration: text(saved.duration),
    detail: text(saved.detail),
    note: text(saved.note),
    tags,
    priority: normalizePriority(saved.priority || saved.label?.toLowerCase())
  };
}

function normalizeTodayDefaults(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return (source || []).map((task) => normalizeTask(task, "Today task"));
}

export function normalizePhase(phase, fallbackTitle = "New phase") {
  const saved = isPlainObject(phase) ? phase : {};
  const tasks = Array.isArray(saved.tasks) ? saved.tasks : [];
  return {
    id: text(saved.id) || createId("phase"),
    title: text(saved.title, fallbackTitle) || fallbackTitle,
    tasks: tasks.map((task) => normalizeTask(task))
  };
}

export function normalizeRoutine(routine, fallbackTitle = "New routine") {
  const saved = isPlainObject(routine) ? routine : {};
  const phases = Array.isArray(saved.phases) ? saved.phases : [];
  const estimatedMinutes = normalizeRoutineMinutes(saved);
  return {
    id: text(saved.id) || createId("routine"),
    title: text(saved.title, fallbackTitle) || fallbackTitle,
    estimatedTime: text(saved.estimatedTime) || `${estimatedMinutes} min`,
    estimatedMinutes,
    archived: Boolean(saved.archived),
    colorLabel: normalizeRoutineColor(saved.colorLabel),
    purpose: text(saved.purpose),
    whenToUse: text(saved.whenToUse),
    message: text(saved.message),
    phases: phases.map((phase) => normalizePhase(phase))
  };
}

function normalizeZones(value) {
  const zones = Array.isArray(value) ? value : clean30DefaultTemplate.zones;
  return zones
    .map((zone, index) => {
      if (typeof zone === "string") {
        return { id: createId("zone"), name: zone || `Zone ${index + 1}` };
      }
      return {
        id: text(zone?.id) || createId("zone"),
        name: text(zone?.name, `Zone ${index + 1}`) || `Zone ${index + 1}`
      };
    })
    .filter((zone) => zone.name.trim());
}

function normalizeWeekdayDefaults(value, fallback = {}) {
  const saved = isPlainObject(value) ? value : {};
  const fallbackSource = isPlainObject(fallback) ? fallback : {};
  return Object.fromEntries(
    weekdayKeys.map((day) => [
      day,
      normalizeTodayDefaults(saved[day], Array.isArray(fallbackSource[day]) ? fallbackSource[day] : [])
    ])
  );
}

function normalizeSystems(value) {
  const saved = isPlainObject(value) ? value : {};
  const fallback = clean30DefaultTemplate.systems;
  return {
    apartmentLaws: Array.isArray(saved.apartmentLaws)
      ? saved.apartmentLaws.filter((law) => typeof law === "string")
      : cloneDeep(fallback.apartmentLaws),
    bottlenecks: Array.isArray(saved.bottlenecks)
      ? saved.bottlenecks.map((item) => ({
          problem: text(item?.problem, "Problem"),
          consequence: text(item?.consequence, "")
        }))
      : cloneDeep(fallback.bottlenecks),
    priorityOrder: Array.isArray(saved.priorityOrder)
      ? saved.priorityOrder.map((item) => ({
          title: text(item?.title, "Priority"),
          detail: text(item?.detail, "")
        }))
      : cloneDeep(fallback.priorityOrder),
    systemSections: Array.isArray(saved.systemSections)
      ? saved.systemSections.map((section) => ({
          id: text(section?.id) || createId("system"),
          title: text(section?.title, "System"),
          problem: text(section?.problem),
          items: Array.isArray(section?.items)
            ? section.items.filter((item) => typeof item === "string")
            : [],
          secondaryTitle: text(section?.secondaryTitle),
          secondaryItems: Array.isArray(section?.secondaryItems)
            ? section.secondaryItems.filter((item) => typeof item === "string")
            : []
        }))
      : cloneDeep(fallback.systemSections)
  };
}

export function syncDailyRulesRoutine(template) {
  const next = cloneDeep(template);
  next.dailyRules = cloneDeep(next.todayDefaults || next.dailyRules || []);
  const dailyRoutine = next.routines.find((routine) => routine.id === "daily-rules");
  if (!dailyRoutine) {
    next.routines.push({
      id: "daily-rules",
      title: "Today Tasks",
      estimatedTime: "Maximum 5 minutes",
      purpose: "Default tasks for the Today section.",
      whenToUse: "Use every day to keep small cleaning tasks visible.",
      message: "",
      phases: [{ id: "daily-maintenance", title: "Today defaults", tasks: next.dailyRules }]
    });
  } else {
    dailyRoutine.title = "Today Tasks";
    dailyRoutine.purpose = "Default tasks for the Today section.";
    dailyRoutine.whenToUse = "Use every day to keep small cleaning tasks visible.";
    dailyRoutine.phases = [
      {
        id: dailyRoutine.phases?.[0]?.id || "daily-maintenance",
        title: dailyRoutine.phases?.[0]?.title || "Today defaults",
        tasks: cloneDeep(next.dailyRules)
      }
    ];
  }
  return next;
}

export function normalizeTemplate(template, options = {}) {
  const fallback = options.fallback || clean30DefaultTemplate;
  const saved = isPlainObject(template) ? template : {};
  const routines = Array.isArray(saved.routines) ? saved.routines : fallback.routines;
  const todayDefaults = normalizeTodayDefaults(
    saved.todayDefaults,
    Array.isArray(saved.dailyRules) ? saved.dailyRules : fallback.todayDefaults || fallback.dailyRules
  );
  const todayWeekdayDefaults = normalizeWeekdayDefaults(
    saved.todayWeekdayDefaults,
    fallback.todayWeekdayDefaults
  );
  const profile = isPlainObject(saved.profile) ? saved.profile : {};
  const schedule = isPlainObject(saved.schedule) ? saved.schedule : {};
  const appearance = isPlainObject(saved.appearance) ? saved.appearance : {};

  const normalized = {
    id: text(saved.id) || fallback.id || createId("template"),
    name: text(saved.name, fallback.name || "Cleaning Template") || "Cleaning Template",
    readOnly: false,
    profile: {
      appDisplayName:
        text(profile.appDisplayName, fallback.profile?.appDisplayName || "Clean30") || "Clean30",
      homeName: text(profile.homeName, fallback.profile?.homeName || "Home") || "Home",
      apartmentSizeText: text(
        profile.apartmentSizeText,
        fallback.profile?.apartmentSizeText || "30 m2"
      ),
      apartmentTypeText: text(
        profile.apartmentTypeText,
        fallback.profile?.apartmentTypeText || "Erdgeschoss / ground floor"
      ),
      goalText: text(
        profile.goalText,
        fallback.profile?.goalText || "Guest-ready within 10 minutes"
      )
    },
    zones: normalizeZones(saved.zones || fallback.zones),
    todayDefaults,
    todayWeekdayDefaultsEnabled: Boolean(saved.todayWeekdayDefaultsEnabled),
    todayWeekdayDefaults,
    dailyRules: cloneDeep(todayDefaults),
    routines: routines.map((routine) => normalizeRoutine(routine, "Routine")),
    systems: normalizeSystems(saved.systems || fallback.systems),
    schedule: {
      weeklyResetDay: text(schedule.weeklyResetDay, fallback.schedule?.weeklyResetDay || "Saturday"),
      backupResetDay: text(schedule.backupResetDay, fallback.schedule?.backupResetDay || "Sunday"),
      monthlyDeepCleanInterval: numberInRange(
        schedule.monthlyDeepCleanInterval,
        fallback.schedule?.monthlyDeepCleanInterval || 30,
        14,
        90
      ),
      weeklyResetDueAfterDays: numberInRange(
        schedule.weeklyResetDueAfterDays,
        fallback.schedule?.weeklyResetDueAfterDays || 7,
        1,
        30
      ),
      minimalResetFallbackLabel: text(
        schedule.minimalResetFallbackLabel,
        fallback.schedule?.minimalResetFallbackLabel || "Sunday minimum reset"
      )
    },
    appearance: {
      accentColor: normalizeTemplateAccent(
        appearance.accentColor,
        normalizeTemplateAccent(fallback.appearance?.accentColor)
      ),
      density: densityOptions.includes(appearance.density)
        ? appearance.density
        : fallback.appearance?.density || "comfortable"
    }
  };

  if (options.readOnly !== undefined) normalized.readOnly = false;
  return syncDailyRulesRoutine(normalized);
}

export function createDefaultTemplate() {
  return normalizeTemplate(cloneDeep(clean30DefaultTemplate), { readOnly: false });
}

export function duplicateTemplate(template, name = "My Cleaning System") {
  const normalized = normalizeTemplate(template);
  return normalizeTemplate(
    {
      ...cloneDeep(normalized),
      id: createId("template-custom"),
      name,
      readOnly: false
    },
    { readOnly: false }
  );
}

export function validateTemplatePayload(payload) {
  const rawTemplate = payload?.template || payload;
  if (!isPlainObject(rawTemplate)) {
    return { ok: false, error: "Template backup must contain a template object." };
  }
  if (
    !rawTemplate.profile ||
    !Array.isArray(rawTemplate.routines) ||
    (!Array.isArray(rawTemplate.todayDefaults) && !Array.isArray(rawTemplate.dailyRules))
  ) {
    return { ok: false, error: "Template is missing required profile, routines, or Today tasks." };
  }
  return {
    ok: true,
    template: normalizeTemplate(
      {
        ...rawTemplate,
        id: createId("template-custom"),
        name: text(rawTemplate.name, "Imported Cleaning System"),
        readOnly: false
      },
      { readOnly: false }
    )
  };
}

export function createTemplateExport(template) {
  const normalized = normalizeTemplate(template);
  return {
    app: "Clean30",
    type: "template",
    version: 1,
    exportedAt: new Date().toISOString(),
    template: {
      ...normalized,
      readOnly: false
    }
  };
}
