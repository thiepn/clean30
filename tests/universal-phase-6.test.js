import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Phase 6 styles load after Phase 5 styles", () => {
  const main = textFile("../src/main.jsx");
  const phaseFive = main.indexOf('"./styles/universal-phase5.css"');
  const phaseSix = main.indexOf('"./styles/universal-phase6.css"');
  assert.ok(phaseFive >= 0);
  assert.ok(phaseSix > phaseFive);
});

test("Advanced Settings calls the callback App actually provides", () => {
  const settings = textFile("../src/components/Settings.jsx");
  const app = textFile("../src/App.jsx");
  assert.match(settings, /onManageCustomize,/);
  assert.match(settings, /onClick=\{onManageCustomize\}/);
  assert.doesNotMatch(settings, /onOpenAdvancedEditor/);
  assert.match(app, /onManageCustomize=\{\(\) => openInternalEditor\("profile", "settings"\)\}/);
});

test("Today keeps destructive task removal inside task details", () => {
  const dashboard = textFile("../src/components/Dashboard.jsx");
  assert.match(dashboard, /today-task-detail-actions/);
  assert.match(dashboard, /Remove task/);
  assert.match(dashboard, />\s*Details\s*</);
  const detailsButton = dashboard.indexOf("Details");
  const removeTask = dashboard.indexOf("Remove task");
  assert.ok(detailsButton >= 0);
  assert.ok(removeTask > detailsButton);
});

test("Today exposes accessible progress for both daily tasks and the current clean", () => {
  const dashboard = textFile("../src/components/Dashboard.jsx");
  assert.match(dashboard, /className="today-overall-progress"/);
  assert.match(dashboard, /className="session-resume-progress"/);
  assert.match(dashboard, /aria-valuenow=\{todayProgressPercent\}/);
  assert.match(dashboard, /aria-valuenow=\{activeProgress.percent\}/);
  assert.match(dashboard, /role="progressbar"/);
});

test("full routine checklist stays hidden until the user requests details", () => {
  const dashboard = textFile("../src/components/Dashboard.jsx");
  assert.match(dashboard, /showSessionDetails/);
  assert.match(dashboard, /View full checklist/);
  assert.match(dashboard, /activeSession && showSessionDetails \? \(/);
  assert.match(dashboard, /Hide details/);
  assert.match(dashboard, /<StartSession/);
});

test("routine Cleaning mode uses clear stop-save terminology and accessible progress", () => {
  const cleanMode = textFile("../src/components/CleanMode.jsx");
  assert.match(cleanMode, /Cleaning mode/);
  assert.match(cleanMode, /Stop and save/);
  assert.match(cleanMode, /Finish clean/);
  assert.match(cleanMode, /role="progressbar"/);
  assert.match(cleanMode, /primaryActionRef/);
  assert.doesNotMatch(cleanMode, /Finish partial/);
});

test("Today Cleaning mode focuses the primary task action and announces task changes", () => {
  const mode = textFile("../src/components/TodayCleaningMode.jsx");
  assert.match(mode, /primaryActionRef/);
  assert.match(mode, /aria-live="polite"/);
  assert.match(mode, /aria-atomic="true"/);
  assert.match(mode, /Today is complete/);
  assert.match(mode, /Mark not done/);
});

test("simple routine editor reports and focuses validation errors accessibly", () => {
  const editor = textFile("../src/components/RoutineEditorDialog.jsx");
  assert.match(editor, /aria-invalid=/);
  assert.match(editor, /aria-describedby=/);
  assert.match(editor, /role="alert"/);
  assert.match(editor, /nameInputRef\.current\?\.focus/);
  assert.match(editor, /durationInputRef\.current\?\.focus/);
  assert.match(editor, /firstTaskInputRef\.current\?\.focus/);
});

test("Phase 6 CSS covers narrow phones, large text, touch targets, safe areas, and reduced motion", () => {
  const css = textFile("../src/styles/universal-phase6.css");
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /@media \(max-width: 340px\)/);
  assert.match(css, /html\[data-font-size="large"\]/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:focus-visible/);
});

test("current-clean detail terminology no longer exposes partial-finish wording", () => {
  const startSession = textFile("../src/components/StartSession.jsx");
  assert.match(startSession, /Current clean/);
  assert.match(startSession, /Saved to Progress/);
  assert.match(startSession, /Stop and save/);
  assert.doesNotMatch(startSession, /Finish partial/);
});
