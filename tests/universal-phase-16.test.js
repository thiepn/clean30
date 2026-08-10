import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import {
  createDefaultTemplate,
  createTemplateExport
} from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("onboarding can start the first starter clean directly without weakening returning-user protection", () => {
  const onboarding = textFile("../src/components/Onboarding.jsx");
  const dashboard = textFile("../src/components/Dashboard.jsx");

  assert.match(onboarding, /Start cleaning/);
  assert.match(onboarding, /Go to Today/);
  assert.match(onboarding, /Use starter tasks instead/);
  assert.match(onboarding, /clean30StartTodayCleaningRequested/);
  assert.match(onboarding, /clean30:startTodayCleaning/);
  assert.match(onboarding, /isReturningUser/);
  assert.match(onboarding, /Existing cleaning plans can be imported from Settings/);
  assert.match(dashboard, /clean30:startTodayCleaning/);
  assert.match(dashboard, /setTodayCleaningOpen\(true\)/);
});

test("Today More matches the final task-management scope and links to Progress", () => {
  const dashboard = textFile("../src/components/Dashboard.jsx");

  assert.match(dashboard, /Add tasks from routine/);
  assert.match(dashboard, /Reorder tasks/);
  assert.match(dashboard, /Edit regular tasks/);
  assert.match(dashboard, /Reset today/);
  assert.match(dashboard, /View weekly activity in Progress/);
  assert.doesNotMatch(dashboard, /today-routine-start-dialog/);
  assert.doesNotMatch(dashboard, />\s*Start a routine\s*</);
});

test("regular task editing opens a focused Today editor instead of the full plan editor", () => {
  const customize = textFile("../src/components/Customize.jsx");
  const routines = textFile("../src/components/customize/RoutinesSection.jsx");
  const app = textFile("../src/App.jsx");

  assert.match(customize, /focusedTodayEditor/);
  assert.match(customize, /focusedTodayOnly={focusedTodayEditor}/);
  assert.match(customize, /Edit regular tasks/);
  assert.match(routines, /focusedTodayOnly = false/);
  assert.match(routines, /focusedTodayOnly \|\| editorTab === "today"/);
  assert.match(app, /openInternalEditor\("routines", "dashboard", "today"\)/);
  assert.match(app, /Back to Today/);
});

test("Advanced Settings exposes direct cleaning-plan destinations and starter restore", () => {
  const settings = textFile("../src/components/Settings.jsx");
  const app = textFile("../src/App.jsx");

  for (const label of [
    "Manage regular tasks",
    "Manage routines",
    "Home details",
    "Schedule",
    "Import and export",
    "Restore starter",
    "Start each day empty"
  ]) {
    assert.match(settings, new RegExp(label));
  }

  assert.match(settings, /onManageCustomize\("routines", "today"\)/);
  assert.match(settings, /onManageCustomize\("routines"\)/);
  assert.match(settings, /onManageCustomize\("profile"\)/);
  assert.match(settings, /onManageCustomize\("schedule"\)/);
  assert.match(settings, /onManageCustomize\("import-export"\)/);
  assert.match(app, /onResetTemplate={resetCurrentTemplateToDefault}/);
  assert.match(app, /openInternalEditor\(section, "settings", intent\)/);
});

test("Home details use universal wording while retaining legacy field compatibility", () => {
  const profile = textFile("../src/components/customize/ProfileSection.jsx");

  assert.match(profile, /Home details/);
  assert.match(profile, /Home name/);
  assert.match(profile, /Home size text/);
  assert.match(profile, /Home type text/);
  assert.doesNotMatch(profile, /Apartment Profile/);
  assert.doesNotMatch(profile, /Apartment\/home name/);
  assert.doesNotMatch(profile, />\s*Apartment size text/);
  assert.doesNotMatch(profile, />\s*Apartment type text/);
  assert.match(profile, /apartmentSizeText/);
  assert.match(profile, /apartmentTypeText/);
});

test("Phase 16 remains schema-free and preserves deployment and persistence invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");

  assert.equal(CURRENT_BACKUP_VERSION, 3);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(
    app,
    /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s
  );
});
