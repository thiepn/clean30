import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getHomeCareSummary,
  getRoomFreshnessPresentation,
  getRoutineCoveredRooms
} from "../src/utils/homeMotivation.js";
import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import { createDefaultTemplate, createTemplateExport } from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function roomRoutine(id, room, title = `Clean ${room}`) {
  return {
    id,
    title: `${room} clean`,
    archived: false,
    phases: [{ id: `${id}-phase`, title: room, tasks: [{ id: `${id}-task`, title, duration: "3 min" }] }]
  };
}

function historyEntry(routineId, finishedAt) {
  return { id: `history-${routineId}-${finishedAt}`, routineId, finishedAt, percent: 100 };
}

test("room freshness presentation stays descriptive rather than gamified", () => {
  assert.deepEqual(getRoomFreshnessPresentation({ status: "untracked", daysSince: null }), {
    percent: null,
    segments: 0,
    label: "Not tracked yet",
    tone: "untracked"
  });
  const fresh = getRoomFreshnessPresentation({ status: "recent", daysSince: 0, suggestedIntervalDays: 7 });
  assert.equal(fresh.percent, 100);
  assert.equal(fresh.segments, 5);
  assert.equal(fresh.label, "Fresh");
  const attention = getRoomFreshnessPresentation({ status: "attention", daysSince: 10, suggestedIntervalDays: 7 });
  assert.ok(attention.percent <= 40);
  assert.equal(attention.label, "Needs attention");
});

test("Home summary points to the least-recently covered room without creating a deadline", () => {
  const routines = [roomRoutine("kitchen", "Kitchen"), roomRoutine("bathroom", "Bathroom"), roomRoutine("bedroom", "Bedroom")];
  const history = [historyEntry("kitchen", "2026-08-08T08:00:00.000Z"), historyEntry("bathroom", "2026-07-28T08:00:00.000Z")];
  const summary = getHomeCareSummary({ rooms: ["Kitchen", "Bathroom", "Bedroom"], routines, history, currentDateKey: "2026-08-08" });
  assert.equal(summary.nextRoom?.room, "Bathroom");
  assert.match(summary.headline, /could use attention/i);
  assert.match(summary.detail, /Bathroom/);
  assert.doesNotMatch(`${summary.headline} ${summary.detail}`, /overdue|deadline|required|score/i);
});

test("routine impact maps only to configured rooms the routine actually covers", () => {
  const routine = {
    id: "mixed",
    title: "Mixed clean",
    archived: false,
    phases: [
      { id: "k", title: "Kitchen", tasks: [{ id: "sink", title: "Clean the kitchen sink" }] },
      { id: "b", title: "Bathroom", tasks: [{ id: "mirror", title: "Clean the bathroom mirror" }] }
    ]
  };
  assert.deepEqual(getRoutineCoveredRooms(routine, ["Kitchen", "Bathroom", "Bedroom"]), ["Kitchen", "Bathroom"]);
});

test("Progress adds Home snapshot and room impact without moving Calendar or Insights out", () => {
  const history = textFile("../src/components/History.jsx");
  assert.match(history, /Home snapshot/);
  assert.match(history, /Room freshness overview/);
  assert.match(history, /Rooms refreshed/);
  assert.match(history, /Quick clean uses the same room priority automatically/);
  assert.match(history, /ProgressCalendar/);
  assert.match(history, /progress-insights-panel/);
});

test("Phase 14 explicitly keeps room status as maintenance context rather than a score", () => {
  const history = textFile("../src/components/History.jsx");
  const help = textFile("../src/components/HelpGuide.jsx");
  assert.match(history, /not deadlines or a score/i);
  assert.match(help, /not a score, deadline, or requirement/i);
  assert.doesNotMatch(history, /\bXP\b|\bleaderboard\b|\bachievement\b|\blevel up\b/i);
});

test("Phase 14 styling loads before the final consolidation and supports responsive and reduced-motion layouts", () => {
  const main = textFile("../src/main.jsx");
  const css = textFile("../src/styles/universal-phase14.css");
  const phaseThirteen = main.indexOf('"./styles/universal-phase13.css"');
  const phaseFourteen = main.indexOf('"./styles/universal-phase14.css"');
  const consolidation = main.indexOf('"./styles/universal-intuitiveness.css"');
  assert.ok(phaseThirteen >= 0);
  assert.ok(phaseFourteen > phaseThirteen);
  assert.ok(consolidation > phaseFourteen);
  assert.match(css, /progress-home-grid/);
  assert.match(css, /home-freshness-meter/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Phase 14 remains schema-free and preserves deployment and persistence invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");
  assert.equal(CURRENT_BACKUP_VERSION, 4);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(app, /saveAppState\(appState\);/);
  assert.doesNotMatch(app, /freshnessScore|homeScore|roomFreshnessState|homeMotivationState/);
});

test("Help keeps the Home snapshot understandable without making it a separate workflow", () => {
  const help = textFile("../src/components/HelpGuide.jsx");
  assert.match(help, /Progress shows what you completed and a lightweight room snapshot/);
  assert.match(help, /Room status is guidance from completed cleans/);
});
