import { clean30DefaultTemplate } from "../data/defaultTemplate.js";

export const priorityOptions = ["normal", "important", "critical", "optional"];
export const accentOptions = ["green", "blue", "brown", "gray"];
export const densityOptions = ["comfortable", "compact"];

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

export function normalizeTask(task, fallbackTitle = "New task") {
  const saved = isPlainObject(task) ? task : {};
  return {
    id: text(saved.id) || createId("task"),
    title: text(saved.title, fallbackTitle) || fallbackTitle,
    duration: text(saved.duration),
    detail: text(saved.detail),
    priority: normalizePriority(saved.priority || saved.label?.toLowerCase())
  };
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
  return {
    id: text(saved.id) || createId("routine"),
    title: text(saved.title, fallbackTitle) || fallbackTitle,
    estimatedTime: text(saved.estimatedTime),
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
  const dailyRoutine = next.routines.find((routine) => routine.id === "daily-rules");
  if (!dailyRoutine) {
    next.routines.push({
      id: "daily-rules",
      title: "Daily Rules",
      estimatedTime: "Maximum 5 minutes",
      purpose: "Tiny rules, not daily cleaning.",
      whenToUse: "Use every day to stop the main bottlenecks from growing.",
      message: "",
      phases: [{ id: "daily-maintenance", title: "Daily maintenance", tasks: next.dailyRules }]
    });
  } else {
    dailyRoutine.phases = [
      {
        id: dailyRoutine.phases?.[0]?.id || "daily-maintenance",
        title: dailyRoutine.phases?.[0]?.title || "Daily maintenance",
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
  const dailyRules = Array.isArray(saved.dailyRules) ? saved.dailyRules : fallback.dailyRules;
  const profile = isPlainObject(saved.profile) ? saved.profile : {};
  const schedule = isPlainObject(saved.schedule) ? saved.schedule : {};
  const appearance = isPlainObject(saved.appearance) ? saved.appearance : {};

  const normalized = {
    id: text(saved.id) || fallback.id || createId("template"),
    name: text(saved.name, fallback.name || "Cleaning Template") || "Cleaning Template",
    readOnly: Boolean(saved.readOnly),
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
    dailyRules: dailyRules.map((rule) => normalizeTask(rule, "Daily rule")),
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
      accentColor: accentOptions.includes(appearance.accentColor)
        ? appearance.accentColor
        : fallback.appearance?.accentColor || "green",
      density: densityOptions.includes(appearance.density)
        ? appearance.density
        : fallback.appearance?.density || "comfortable"
    }
  };

  if (options.readOnly !== undefined) normalized.readOnly = Boolean(options.readOnly);
  return syncDailyRulesRoutine(normalized);
}

export function createDefaultTemplate() {
  return normalizeTemplate(cloneDeep(clean30DefaultTemplate), { readOnly: true });
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
  if (!rawTemplate.profile || !Array.isArray(rawTemplate.routines) || !Array.isArray(rawTemplate.dailyRules)) {
    return { ok: false, error: "Template is missing required profile, routines, or daily rules." };
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
