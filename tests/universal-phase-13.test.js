import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildQuickCleanPlan } from "../src/utils/quickClean.js";
import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import {
  createDefaultTemplate,
  createTemplateExport
} from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("the app header exposes Quick clean without changing the four primary navigation destinations", () => {
  const layout = textFile("../src/components/Layout.jsx");
  const navigation = textFile("../src/components/Navigation.jsx");
  const icons = textFile("../src/components/AppIcon.jsx");

  assert.match(layout, /aria-label="Open Quick clean"/);
  assert.match(layout, /<span>Quick clean<\/span>/);
  assert.match(layout, /AppIcon name="quick"/);
  assert.match(icons, /quick:\s*\(/);
  assert.match(navigation, /Today/);
  assert.match(navigation, /Routines/);
  assert.match(navigation, /Progress/);
  assert.match(navigation, /Settings/);
});

test("global Quick clean access hands off safely to Routines whether or not Routines is already mounted", () => {
  const layout = textFile("../src/components/Layout.jsx");
  const routines = textFile("../src/components/Routines.jsx");

  assert.match(layout, /window\.clean30OpenQuickCleanRequested = true/);
  assert.match(layout, /onNavigate\?\.\("routines"\)/);
  assert.match(layout, /clean30:openQuickClean/);
  assert.match(routines, /consumeQuickCleanRequest/);
  assert.match(routines, /window\.clean30OpenQuickCleanRequested = false/);
  assert.match(routines, /addEventListener\("clean30:openQuickClean"/);
  assert.match(routines, /removeEventListener\("clean30:openQuickClean"/);
});

test("Routines offers one-tap 5, 15, and 30 minute smart plans while retaining the full planner", () => {
  const routines = textFile("../src/components/Routines.jsx");

  assert.match(routines, /instantQuickCleanBudgets = \[5, 15, 30\]/);
  assert.match(routines, /Add a \$\{minutes\}-minute smart clean to Today/);
  assert.match(routines, /onAddLibraryTasksToToday\?\.\(plan\.items\)/);
  assert.match(routines, /Plan a quick clean/);
  assert.match(routines, /Skip the planning/);
});

test("instant smart plans reuse adaptive Quick Clean rather than inventing a second planner", () => {
  const routines = textFile("../src/components/Routines.jsx");

  assert.match(routines, /buildQuickCleanPlan\(\{/);
  assert.match(routines, /rooms: homeRooms/);
  assert.match(routines, /routines,/);
  assert.match(routines, /history/);
  assert.doesNotMatch(routines, /createTodayTask|todayTasksByDate|localStorage/);
});

test("a 15-minute smart plan stays bounded and uses room-care priority", () => {
  const routines = [
    {
      id: "kitchen",
      title: "Kitchen clean",
      archived: false,
      phases: [
        {
          id: "kitchen-phase",
          title: "Kitchen",
          tasks: [{ id: "k1", title: "Wipe kitchen counters", duration: "3 min" }]
        }
      ]
    },
    {
      id: "bathroom",
      title: "Bathroom clean",
      archived: false,
      phases: [
        {
          id: "bathroom-phase",
          title: "Bathroom",
          tasks: [{ id: "b1", title: "Clean the bathroom sink", duration: "3 min" }]
        }
      ]
    }
  ];
  const history = [
    {
      id: "kitchen-recent",
      routineId: "kitchen",
      finishedAt: "2026-08-08T08:00:00.000Z",
      percent: 100
    },
    {
      id: "bathroom-old",
      routineId: "bathroom",
      finishedAt: "2026-07-28T08:00:00.000Z",
      percent: 100
    }
  ];

  const plan = buildQuickCleanPlan({
    minutes: 15,
    rooms: ["Kitchen", "Bathroom"],
    routines,
    history,
    currentDateKey: "2026-08-08"
  });

  assert.equal(plan.fitsBudget, true);
  assert.ok(plan.estimatedMinutes <= 15);
  assert.equal(plan.prioritizedRooms[0], "Bathroom");
  assert.ok(plan.items.length > 0);
});

test("Phase 13 styling loads after Phase 12 and keeps Quick clean usable on small screens", () => {
  const main = textFile("../src/main.jsx");
  const css = textFile("../src/styles/universal-phase13.css");
  const phaseTwelve = main.indexOf('"./styles/universal-phase12.css"');
  const phaseThirteen = main.indexOf('"./styles/universal-phase13.css"');

  assert.ok(phaseTwelve >= 0);
  assert.ok(phaseThirteen > phaseTwelve);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Help explains both global Quick clean access and direct smart-plan buttons", () => {
  const help = textFile("../src/components/HelpGuide.jsx");

  assert.match(help, /Quick clean is also available from the header/);
  assert.match(help, /Use Quick clean when you only know how much time you have/);
  assert.match(help, /5, 15, and 30 minute buttons can send a ready-made plan straight to Today/);
});

test("Phase 13 remains schema-free and preserves deployment and persistence invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");
  const templateExport = createTemplateExport(createDefaultTemplate());

  assert.equal(CURRENT_BACKUP_VERSION, 3);
  assert.equal(templateExport.version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(app, /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s);
  assert.doesNotMatch(app, /instantQuickClean|quickCleanHeader|smartCleanBudget/);
});
