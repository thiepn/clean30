import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildQuickCleanPlan } from "../src/utils/quickClean.js";
import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import { createDefaultTemplate, createTemplateExport } from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Clean is the first primary destination and the header no longer exposes a separate Quick clean product", () => {
  const layout = textFile("../src/components/Layout.jsx");
  const navigation = textFile("../src/components/Navigation.jsx");
  const clean = textFile("../src/components/CleanStartPanel.jsx");

  assert.doesNotMatch(layout, /Open Quick clean|<span>Quick clean<\/span>|clean30:openQuickClean/i);
  assert.match(navigation, /id: "dashboard", label: "Clean"/);
  assert.match(navigation, /Routines/);
  assert.match(navigation, /Progress/);
  assert.match(navigation, /Settings/);
  assert.match(clean, /Just start/);
});

test("Clean offers direct 5, 10, 15, and 30 minute starts while retaining more time options", () => {
  const clean = textFile("../src/components/CleanStartPanel.jsx");
  assert.match(clean, /directBudgets = \[5, 10, 15, 30\]/);
  assert.match(clean, /I have some time/);
  assert.match(clean, /More options/);
  assert.match(clean, /startTimedClean/);
  assert.match(clean, /setTimePlannerOpen\(true\)/);
});

test("instant time plans reuse adaptive planning rather than inventing a second engine", () => {
  const clean = textFile("../src/components/CleanStartPanel.jsx");
  assert.match(clean, /buildQuickCleanPlan\(\{/);
  assert.match(clean, /rooms: homeRooms/);
  assert.match(clean, /routines,/);
  assert.match(clean, /history,/);
  assert.doesNotMatch(clean, /createTodayTask|todayTasksByDate|localStorage/);
});

test("a 15-minute smart plan stays bounded and uses room-care priority", () => {
  const routines = [
    {
      id: "kitchen",
      title: "Kitchen clean",
      archived: false,
      phases: [{ id: "kitchen-phase", title: "Kitchen", tasks: [{ id: "k1", title: "Wipe kitchen counters", duration: "3 min" }] }]
    },
    {
      id: "bathroom",
      title: "Bathroom clean",
      archived: false,
      phases: [{ id: "bathroom-phase", title: "Bathroom", tasks: [{ id: "b1", title: "Clean the bathroom sink", duration: "3 min" }] }]
    }
  ];
  const history = [
    { id: "kitchen-recent", routineId: "kitchen", finishedAt: "2026-08-08T08:00:00.000Z", percent: 100 },
    { id: "bathroom-old", routineId: "bathroom", finishedAt: "2026-07-28T08:00:00.000Z", percent: 100 }
  ];
  const plan = buildQuickCleanPlan({ minutes: 15, rooms: ["Kitchen", "Bathroom"], routines, history, currentDateKey: "2026-08-08" });
  assert.equal(plan.fitsBudget, true);
  assert.ok(plan.estimatedMinutes <= 15);
  assert.equal(plan.prioritizedRooms[0], "Bathroom");
  assert.ok(plan.items.length > 0);
});

test("the consolidation styling loads after Phase 14 and protects narrow phones", () => {
  const main = textFile("../src/main.jsx");
  const css = textFile("../src/styles/universal-intuitiveness.css");
  const phaseFourteen = main.indexOf('"./styles/universal-phase14.css"');
  const consolidation = main.indexOf('"./styles/universal-intuitiveness.css"');
  assert.ok(phaseFourteen >= 0);
  assert.ok(consolidation > phaseFourteen);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /clean-time-options/);
  assert.match(css, /clean-room-grid/);
});

test("Help teaches one Clean flow instead of Quick Clean as a separate feature", () => {
  const help = textFile("../src/components/HelpGuide.jsx");
  assert.match(help, /This is where cleaning starts/);
  assert.match(help, /Just start/);
  assert.match(help, /choose how much time you have/);
  assert.match(help, /pick a room/);
  assert.doesNotMatch(help, /Quick clean is also available from the header/i);
});

test("the unified Clean surface remains schema-free and preserves deployment and persistence invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");
  const templateExport = createTemplateExport(createDefaultTemplate());
  assert.equal(CURRENT_BACKUP_VERSION, 4);
  assert.equal(templateExport.version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(app, /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s);
  assert.doesNotMatch(app, /instantQuickClean|quickCleanHeader|smartCleanBudget/);
});
