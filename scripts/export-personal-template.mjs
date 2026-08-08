import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { dailyRuleItems, routines } from "../src/data/routines.js";
import {
  apartmentLaws,
  bottlenecks,
  priorityOrder,
  systemSections
} from "../src/data/systems.js";
import { createTemplateExport } from "../src/utils/templateUtils.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(
  currentDir,
  "../local-templates/clean30-personal-30m2-template.json"
);

const zones = [
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
].map((name, index) => ({ id: `zone-${index + 1}`, name }));

const weekdayDefaults = {
  sunday: null,
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null
};

const personalTemplate = {
  id: "clean30-personal-30m2",
  name: "Jonathan's 30 m2 Apartment System",
  readOnly: false,
  profile: {
    appDisplayName: "Clean30",
    homeName: "30 m2 apartment",
    apartmentSizeText: "30 m2",
    apartmentTypeText: "Erdgeschoss / ground floor",
    goalText: "Guest-ready within 10 minutes"
  },
  zones,
  todayDefaults: dailyRuleItems,
  todayWeekdayDefaultsEnabled: false,
  todayWeekdayDefaultsExplicit: true,
  todayWeekdayDefaults: weekdayDefaults,
  dailyRules: dailyRuleItems,
  routines,
  systems: {
    apartmentLaws,
    bottlenecks,
    priorityOrder,
    systemSections
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

const payload = createTemplateExport(personalTemplate);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Personal Clean30 template exported to ${outputPath}`);
