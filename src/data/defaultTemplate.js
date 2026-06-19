import { dailyRuleItems, routines } from "./routines.js";
import { apartmentLaws, bottlenecks, priorityOrder, systemSections } from "./systems.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

const defaultZones = [
  "Trash",
  "Dishes",
  "Laundry/clothes",
  "Bathroom/toilet",
  "Kitchen",
  "Bedroom",
  "Living room",
  "Entrance/corridor",
  "Floors",
  "Windows/glass",
  "Monthly deep-clean zones"
];

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
  name: "Clean30 Default",
  readOnly: false,
  profile: {
    appDisplayName: "Clean30",
    homeName: "30 m2 apartment",
    apartmentSizeText: "30 m2",
    apartmentTypeText: "Erdgeschoss / ground floor",
    goalText: "Guest-ready within 10 minutes"
  },
  zones: defaultZones.map((name, index) => ({
    id: `zone-${index + 1}`,
    name
  })),
  todayDefaults: dailyRuleItems.map(normalizeTask),
  todayWeekdayDefaultsEnabled: false,
  todayWeekdayDefaultsExplicit: true,
  todayWeekdayDefaults: emptyWeekdayDefaults,
  dailyRules: dailyRuleItems.map(normalizeTask),
  routines: routines.map(normalizeRoutine),
  systems: {
    apartmentLaws: clone(apartmentLaws),
    bottlenecks: clone(bottlenecks),
    priorityOrder: clone(priorityOrder),
    systemSections: clone(systemSections)
  },
  schedule: {
    weeklyResetDay: "Saturday",
    backupResetDay: "Sunday",
    monthlyDeepCleanInterval: 30,
    weeklyResetDueAfterDays: 7,
    minimalResetFallbackLabel: "Sunday minimum reset"
  },
  appearance: {
    accentColor: "green",
    density: "comfortable"
  }
};
