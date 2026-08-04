import {
  starterDailyRuleItems,
  starterRoutines,
  starterSystems,
  starterZones
} from "./starterData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

const emptyWeekdayDefaults = {
  sunday: null,
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null
};

function priorityFromLabel(label = "") {
  const normalized = label.toLowerCase();
  if (normalized === "critical") return "critical";
  if (normalized === "optional") return "optional";
  if (normalized) return "important";
  return "normal";
}

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title,
    duration: task.duration || "",
    detail: task.detail || "",
    note: "",
    tags: [],
    priority: task.priority || priorityFromLabel(task.label)
  };
}

function normalizeRoutine(routine) {
  return {
    id: routine.id,
    title: routine.title,
    estimatedTime: routine.estimatedTime || "",
    purpose: routine.purpose || "",
    whenToUse: routine.whenToUse || "",
    message: routine.message || "",
    phases: routine.phases.map((phase) => ({
      id: phase.id,
      title: phase.title,
      tasks: phase.tasks.map(normalizeTask)
    }))
  };
}

export const clean30DefaultTemplate = {
  id: "clean30-default",
  name: "Clean30 Starter Plan",
  readOnly: false,
  profile: {
    appDisplayName: "Clean30",
    homeName: "My home",
    apartmentSizeText: "Not set",
    apartmentTypeText: "Home",
    goalText: "A cleaner home, one task at a time"
  },
  zones: starterZones.map((name, index) => ({
    id: `zone-${index + 1}`,
    name
  })),
  todayDefaults: starterDailyRuleItems.map(normalizeTask),
  todayWeekdayDefaultsEnabled: false,
  todayWeekdayDefaultsExplicit: true,
  todayWeekdayDefaults: emptyWeekdayDefaults,
  dailyRules: starterDailyRuleItems.map(normalizeTask),
  routines: starterRoutines.map(normalizeRoutine),
  systems: clone(starterSystems),
  schedule: {
    weeklyResetDay: "Saturday",
    backupResetDay: "Sunday",
    monthlyDeepCleanInterval: 30,
    weeklyResetDueAfterDays: 7,
    minimalResetFallbackLabel: "Short reset"
  },
  appearance: {
    accentColor: "green",
    density: "comfortable"
  }
};
