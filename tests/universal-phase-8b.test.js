import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("continued visual polish layer loads after the first Phase 8 layer", () => {
  const main = textFile("../src/main.jsx");
  const phaseEight = main.indexOf('"./styles/universal-phase8.css"');
  const phaseEightB = main.indexOf('"./styles/universal-phase8b.css"');
  assert.ok(phaseEight >= 0);
  assert.ok(phaseEightB > phaseEight);
});

test("Today uses a semantic custom checkbox instead of replacing the input", () => {
  const css = textFile("../src/styles/universal-phase8b.css");
  assert.match(css, /\.today-check-control input\[type="checkbox"\]/);
  assert.match(css, /appearance: none/);
  assert.match(css, /:checked::after/);
  assert.match(css, /:focus-visible/);
});

test("continued polish strengthens Current clean and routine states", () => {
  const css = textFile("../src/styles/universal-phase8b.css");
  assert.match(css, /\.session-resume-panel::before/);
  assert.match(css, /\.routine-action-card\.current::after/);
  assert.match(css, /\.routine-action-card\.selected/);
});

test("Settings destinations become card-like without changing Settings structure", () => {
  const css = textFile("../src/styles/universal-phase8b.css");
  assert.match(css, /\.settings-destination-list/);
  assert.match(css, /\.settings-destination \{/);
  assert.match(css, /border-radius: 14px/);
  assert.match(css, /\.settings-destination-tail > span/);
});

test("continued polish refines Progress and focused cleaning", () => {
  const css = textFile("../src/styles/universal-phase8b.css");
  assert.match(css, /\.progress-week-summary-card/);
  assert.match(css, /\.progress-calendar-day\.selected/);
  assert.match(css, /\.clean-mode-focus,/);
  assert.match(css, /\.today-cleaning-task-card/);
});

test("continued visual polish retains narrow-phone and reduced-motion safeguards", () => {
  const css = textFile("../src/styles/universal-phase8b.css");
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition: none/);
});
