import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  onboardingSetupOptions,
  onboardingSteps,
  starterPreviewTasks
} from "../src/data/onboarding.js";
import { createDefaultTemplate, normalizeTemplate } from "../src/utils/templateUtils.js";
import { resetToFreshState } from "../src/utils/storage.js";

const forbiddenStarterTerms = [
  "30 m2",
  "ground floor",
  "guest-ready",
  "bathroom smell",
  "drying rack",
  "bring laundry downstairs",
  "mold check"
];

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("fresh Clean30 state uses neutral universal starter content", () => {
  const state = resetToFreshState();
  const template = state.templates.find((item) => item.id === "clean30-default");
  assert.ok(template);
  assert.equal(template.name, "Clean30 Starter Plan");
  assert.equal(template.profile.appDisplayName, "Clean30");
  assert.equal(template.profile.homeName, "My home");
  assert.equal(template.profile.goalText, "A cleaner home, one task at a time");
  const serialized = JSON.stringify(template).toLowerCase();
  forbiddenStarterTerms.forEach((term) => assert.equal(serialized.includes(term), false, term));
});

test("starter Today tasks are concise and generally applicable", () => {
  const template = createDefaultTemplate();
  assert.deepEqual(template.todayDefaults.map((task) => task.title), [
    "Clear visible trash",
    "Return dishes to the kitchen",
    "Put away loose clothes or items",
    "Wipe one visibly dirty surface"
  ]);
  assert.deepEqual(template.dailyRules, template.todayDefaults);
});

test("starter routines cover short, weekly, and deeper cleaning", () => {
  const template = createDefaultTemplate();
  const routines = template.routines.filter((routine) => routine.id !== "daily-rules");
  assert.deepEqual(routines.map((routine) => routine.title), ["5-Minute Reset", "15-Minute Tidy", "Weekly Clean", "Deep Clean"]);
  assert.ok(routines.find((routine) => routine.id === "weekly-reset"));
  assert.ok(routines.every((routine) => routine.phases.length > 0));
  assert.ok(routines.every((routine) => routine.phases.some((phase) => phase.tasks.length > 0)));
});

test("legacy systems are neutral but retain strict canonical shape", () => {
  const systems = createDefaultTemplate().systems;
  assert.deepEqual(systems.apartmentLaws, []);
  assert.deepEqual(systems.bottlenecks, []);
  assert.deepEqual(systems.priorityOrder, []);
  assert.equal(systems.systemSections.length, 1);
  assert.deepEqual(systems.systemSections[0], {
    id: "starter-guidance",
    title: "Cleaning guidance",
    problem: "",
    items: [],
    secondaryTitle: "",
    secondaryItems: []
  });
});

test("existing custom templates keep their own content when normalized", () => {
  const starter = createDefaultTemplate();
  const custom = normalizeTemplate({
    ...starter,
    id: "custom-existing-plan",
    name: "Existing plan",
    profile: { ...starter.profile, homeName: "Existing home", goalText: "Existing goal" },
    todayDefaults: [{
      id: "custom-task",
      title: "Keep my existing task",
      duration: "",
      detail: "",
      note: "",
      tags: [],
      priority: "normal"
    }]
  });
  assert.equal(custom.id, "custom-existing-plan");
  assert.equal(custom.profile.homeName, "Existing home");
  assert.equal(custom.profile.goalText, "Existing goal");
  assert.equal(custom.todayDefaults[0].title, "Keep my existing task");
});

test("onboarding has three clear steps and two distinct setup choices", () => {
  assert.equal(onboardingSteps.length, 3);
  assert.deepEqual(onboardingSteps.map((step) => step.id), ["welcome", "setup", "first-clean"]);
  assert.deepEqual(onboardingSetupOptions.map((option) => option.id), ["starter", "empty-today"]);
  assert.equal(starterPreviewTasks.length, 4);
});

test("onboarding can import a plan and protects returning users from setup replacement", () => {
  const onboarding = textFile("../src/components/Onboarding.jsx");
  assert.match(onboarding, /validateTemplatePayload/);
  assert.match(onboarding, /Import a cleaning plan/);
  assert.match(onboarding, /isReturningUser/);
  assert.match(onboarding, /Your current setup stays unchanged/);
  assert.match(onboarding, /onboardingCompletedAt/);
  assert.match(onboarding, /saveAppState/);
});

test("public labels use Clean and Progress without changing route IDs", () => {
  const navigation = textFile("../src/components/Navigation.jsx");
  assert.match(navigation, /id: "dashboard", label: "Clean"/);
  assert.match(navigation, /id: "history", label: "Progress"/);
  assert.doesNotMatch(navigation, /label: "Dashboard"/);
  assert.doesNotMatch(navigation, /label: "History"/);
});

test("header and onboarding no longer present the personal reset system", () => {
  const layout = textFile("../src/components/Layout.jsx");
  const onboarding = textFile("../src/components/Onboarding.jsx");
  assert.doesNotMatch(layout, /Apartment Reset System/);
  assert.doesNotMatch(layout, /header-target/);
  assert.doesNotMatch(onboarding, /History derives Today activity/);
  assert.doesNotMatch(onboarding, /Reusable cleaning plans/);
});

test("the original personal source remains exportable outside the app bundle", () => {
  const script = textFile("../scripts/export-personal-template.mjs");
  const gitignore = textFile("../.gitignore");
  assert.match(script, /src\/data\/routines\.js/);
  assert.match(script, /src\/data\/systems\.js/);
  assert.match(script, /local-templates\/clean30-personal-30m2-template\.json/);
  assert.match(gitignore, /local-templates\//);
});
