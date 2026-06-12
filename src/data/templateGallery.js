import { clean30DefaultTemplate } from "./defaultTemplate.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

function routine(template, routineId) {
  return clone(template.routines.find((item) => item.id === routineId));
}

function trimRoutine(source, taskLimitByPhase = 3) {
  const next = clone(source);
  next.phases = next.phases
    .map((phase) => ({
      ...phase,
      tasks: phase.tasks.slice(0, taskLimitByPhase)
    }))
    .filter((phase) => phase.tasks.length > 0);
  return next;
}

function createSmallApartmentTemplate() {
  const template = clone(clean30DefaultTemplate);
  return {
    ...template,
    id: "gallery-small-apartment",
    name: "Small Apartment",
    readOnly: true,
    profile: {
      ...template.profile,
      homeName: "Small apartment",
      apartmentSizeText: "20-40 m2",
      goalText: "Small home reset without over-cleaning"
    }
  };
}

function createMinimalistTemplate() {
  const template = clone(clean30DefaultTemplate);
  const minimalReset = trimRoutine(routine(template, "minimal-reset"), 2);
  const weeklyReset = trimRoutine(routine(template, "weekly-reset"), 3);
  const monthlyDeepClean = trimRoutine(routine(template, "monthly-deep-clean"), 2);
  const guestReset = trimRoutine(routine(template, "guest-reset"), 2);
  const dailyRules = routine(template, "daily-rules");

  monthlyDeepClean.title = "Light Monthly Deep Clean";
  monthlyDeepClean.estimatedTime = "45-75 minutes";
  monthlyDeepClean.purpose = "A lighter monthly check for people who want only the essentials.";

  return {
    ...template,
    id: "gallery-minimalist-reset",
    name: "Minimalist Reset",
    readOnly: true,
    profile: {
      ...template.profile,
      homeName: "Minimalist home",
      apartmentSizeText: "Small to medium home",
      goalText: "Essential cleaning with low overhead"
    },
    dailyRules: template.dailyRules.slice(0, 4),
    routines: [dailyRules, minimalReset, weeklyReset, guestReset, monthlyDeepClean],
    systems: {
      apartmentLaws: [
        "Clear the visible bottleneck first.",
        "Do the smallest useful reset before deep cleaning.",
        "Keep trash, dishes, clothes, and bathroom smell under control."
      ],
      bottlenecks: template.systems.bottlenecks.slice(0, 4),
      priorityOrder: template.systems.priorityOrder.slice(0, 4),
      systemSections: template.systems.systemSections.slice(0, 3)
    }
  };
}

function createFamilyHomeTemplate() {
  const template = clone(clean30DefaultTemplate);
  const weeklyReset = routine(template, "weekly-reset");
  weeklyReset.title = "Family Weekly Reset";
  weeklyReset.purpose =
    "Reset shared spaces, laundry flow, dishes, trash, bathrooms, and visible surfaces.";
  weeklyReset.phases.push({
    id: "family-shared-spaces",
    title: "Shared spaces",
    tasks: [
      {
        id: "family-living-room-reset",
        title: "Reset living room and shared surfaces",
        duration: "10-15 min",
        detail: "Return items, clear tables, and collect cups, dishes, and laundry.",
        priority: "important"
      },
      {
        id: "family-entry-reset",
        title: "Reset entrance and shoes/bags",
        duration: "5-10 min",
        detail: "Clear floor clutter so leaving and coming home is easier.",
        priority: "normal"
      },
      {
        id: "family-kids-shared-area",
        title: "Reset kids/shared area",
        duration: "10 min",
        detail: "Put toys, books, and shared items back into broad categories.",
        priority: "normal"
      }
    ]
  });

  const guestReset = routine(template, "guest-reset");
  guestReset.title = "Family Guest Reset";
  guestReset.phases.push({
    id: "family-guest-shared-room",
    title: "Shared rooms",
    tasks: [
      {
        id: "family-guest-living-room",
        title: "Clear living room sightlines",
        duration: "10 min",
        detail: "Focus on seating, tables, trash, and obvious floor clutter.",
        priority: "important"
      }
    ]
  });

  return {
    ...template,
    id: "gallery-family-home",
    name: "Family Home",
    readOnly: true,
    profile: {
      ...template.profile,
      homeName: "Family home",
      apartmentSizeText: "Larger household",
      goalText: "Shared-space reset with practical room coverage"
    },
    zones: [
      "Kitchen",
      "Bathroom",
      "Living room",
      "Bedrooms",
      "Entrance",
      "Laundry",
      "Trash/recycling",
      "Kids/shared areas",
      "Floors",
      "Windows/glass",
      "Monthly deep-clean zones"
    ].map((name, index) => ({ id: `family-zone-${index + 1}`, name })),
    routines: template.routines.map((item) => {
      if (item.id === "weekly-reset") return weeklyReset;
      if (item.id === "guest-reset") return guestReset;
      return item;
    }),
    systems: {
      ...template.systems,
      apartmentLaws: [
        ...template.systems.apartmentLaws,
        "Shared spaces get reset before private-room perfection.",
        "Laundry, dishes, and trash are household flow controls."
      ]
    }
  };
}

function createStudentDormTemplate() {
  const template = clone(clean30DefaultTemplate);
  const dailyRules = routine(template, "daily-rules");
  const minimalReset = trimRoutine(routine(template, "minimal-reset"), 2);
  const weeklyReset = trimRoutine(routine(template, "weekly-reset"), 2);
  const guestReset = trimRoutine(routine(template, "guest-reset"), 2);

  minimalReset.title = "Dorm Minimal Reset";
  weeklyReset.title = "Dorm Weekly Reset";
  guestReset.title = "Roommate/Guest Reset";

  return {
    ...template,
    id: "gallery-student-dorm",
    name: "Student Dorm",
    readOnly: true,
    profile: {
      ...template.profile,
      homeName: "Student dorm",
      apartmentSizeText: "Single room / shared spaces",
      goalText: "Keep desk, bed, laundry, trash, and dishes under control"
    },
    zones: [
      "Desk",
      "Bed",
      "Laundry",
      "Trash",
      "Dishes",
      "Shared kitchen",
      "Shared bathroom",
      "Floor"
    ].map((name, index) => ({ id: `dorm-zone-${index + 1}`, name })),
    dailyRules: template.dailyRules.slice(0, 5),
    routines: [dailyRules, minimalReset, weeklyReset, guestReset],
    systems: {
      apartmentLaws: [
        "Desk, bed, laundry, trash, and dishes decide how the room feels.",
        "Shared spaces get quick resets, not personal deep cleans.",
        "Do small resets before the room becomes hard to start."
      ],
      bottlenecks: template.systems.bottlenecks.slice(0, 4),
      priorityOrder: template.systems.priorityOrder.slice(0, 4),
      systemSections: template.systems.systemSections.slice(0, 2)
    }
  };
}

export const templateGallery = [
  {
    id: "small-apartment",
    name: "Small Apartment",
    bestFor: "20-40 m2 apartment or student apartment",
    description: "The current Clean30 system tuned for a compact home.",
    complexity: "balanced",
    template: createSmallApartmentTemplate()
  },
  {
    id: "minimalist-reset",
    name: "Minimalist Reset",
    bestFor: "Essential cleaning with fewer routines and shorter checklists",
    description: "A lighter system for people who want only the practical basics.",
    complexity: "light",
    template: createMinimalistTemplate()
  },
  {
    id: "family-home",
    name: "Family Home",
    bestFor: "Larger household with shared spaces and more rooms",
    description: "A broader template with room coverage for family/shared living.",
    complexity: "detailed",
    template: createFamilyHomeTemplate()
  },
  {
    id: "student-dorm",
    name: "Student Dorm",
    bestFor: "Single room with shared kitchen or shared bathroom",
    description: "Focused on desk, bed, laundry, trash, dishes, and shared-space resets.",
    complexity: "light",
    template: createStudentDormTemplate()
  }
];
