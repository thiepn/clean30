import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  appearancePresets,
  getAppearancePreset,
  getAppearancePresetId
} from "../src/utils/appearancePresets.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("curated appearance presets use existing Clean30 appearance values", () => {
  assert.deepEqual(appearancePresets.map((preset) => preset.id), ["light", "warm", "calm", "slate"]);
  assert.equal(getAppearancePreset("calm")?.accentColor, "green");
  assert.equal(getAppearancePreset("calm")?.backgroundColor, "mint");
  assert.equal(getAppearancePresetId({ accentColor: "brown", backgroundColor: "cream" }), "warm");
  assert.equal(getAppearancePresetId({ accentColor: "purple", backgroundColor: "cream" }), "custom");
});

test("Settings opens as a small set of understandable destinations instead of a control wall", () => {
  const settings = textFile("../src/components/Settings.jsx");
  const appearance = settings.indexOf('title="Appearance"');
  const rooms = settings.indexOf('title="Rooms"');
  const backup = settings.indexOf('title="Data and backup"');
  const help = settings.indexOf('title="Help"');
  const about = settings.indexOf('title="About"');
  const advanced = settings.indexOf('title="Advanced"');

  assert.ok(appearance >= 0);
  assert.ok(rooms > appearance);
  assert.ok(backup > rooms);
  assert.ok(help > backup);
  assert.ok(about > help);
  assert.ok(advanced > about);
  assert.match(settings, /settings-destination-list/);
  assert.doesNotMatch(settings, /<h2>Today<\/h2>/);
});

test("appearance keeps simple presets while retaining the full custom color controls", () => {
  const settings = textFile("../src/components/Settings.jsx");
  assert.match(settings, /appearancePresets\.map/);
  assert.match(settings, /Custom colors/);
  assert.match(settings, /Accent color/);
  assert.match(settings, /Background color/);
  assert.match(settings, /Text size/);
  assert.match(settings, /Layout/);
});

test("backup and privacy remain understandable without exposing data-format internals", () => {
  const settings = textFile("../src/components/Settings.jsx");
  assert.match(settings, /Export backup/);
  assert.match(settings, /Import backup/);
  assert.match(settings, /shows a preview/);
  assert.match(settings, /No account/);
  assert.match(settings, /No cloud sync/);
  assert.match(settings, /No analytics/);
  assert.match(settings, /No ads/);
  assert.doesNotMatch(settings, /backup version/i);
});

test("advanced controls are isolated from everyday Settings", () => {
  const settings = textFile("../src/components/Settings.jsx");
  assert.match(settings, /Manage regular tasks/);
  assert.match(settings, /Manage routines/);
  assert.match(settings, /Cleaning plan details/);
  assert.match(settings, /Schedule/);
  assert.match(settings, /Import and export/);
  assert.match(settings, /Restore starter/);
  assert.match(settings, /Start each day empty/);
  assert.match(settings, /Reset Progress/);
  assert.match(settings, /Reset all local data/);
  assert.match(settings, /settings-advanced-panel/);
});

test("Phase 5 styles load after Phase 4 styles", () => {
  const main = textFile("../src/main.jsx");
  const phaseFour = main.indexOf('"./styles/universal-phase4.css"');
  const phaseFive = main.indexOf('"./styles/universal-phase5.css"');
  assert.ok(phaseFour >= 0);
  assert.ok(phaseFive > phaseFour);
});

test("Help remains intentionally short and action-oriented", () => {
  const help = textFile("../src/components/HelpGuide.jsx");
  assert.match(help, /title: "Clean"/);
  assert.match(help, /title: "Routines"/);
  assert.match(help, /title: "Progress"/);
  assert.match(help, /title: "Settings"/);
  assert.doesNotMatch(help, /If It Feels Overwhelming/);
});
