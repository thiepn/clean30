import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getWeeklyActivitySummary } from "../src/utils/activity.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("weekly Progress summary keeps measured routine time separate from estimated Today time", () => {
  const summary = getWeeklyActivitySummary(
    {
      "2026-08-03": {
        dateKey: "2026-08-03",
        todayCompleted: 2,
        sessions: [{ id: "routine-a" }],
        routineElapsedMinutes: 24,
        estimatedTodayMinutes: 8
      },
      "2026-08-05": {
        dateKey: "2026-08-05",
        todayCompleted: 1,
        sessions: [],
        routineElapsedMinutes: 0,
        estimatedTodayMinutes: 4
      }
    },
    "2026-08-05"
  );

  assert.deepEqual(summary, {
    activeDays: 2,
    todayCompleted: 3,
    routines: 1,
    routineElapsedMinutes: 24,
    estimatedTodayMinutes: 12
  });
});

test("Progress puts the weekly overview and recent activity ahead of Calendar and hides analytics in Insights", () => {
  const history = textFile("../src/components/History.jsx");
  const overview = history.indexOf("progress-overview-panel");
  const recent = history.indexOf("progress-recent-panel");
  const calendar = history.indexOf("progress-calendar-panel");
  const insights = history.indexOf("progress-insights-panel");

  assert.match(history, /<h2>Progress<\/h2>/);
  assert.ok(overview >= 0);
  assert.ok(recent > overview);
  assert.ok(calendar > recent);
  assert.ok(insights > calendar);
  assert.match(history, /<details className="panel progress-insights-panel">/);
  assert.doesNotMatch(history, /className="stats-grid"/);
});

test("Progress activity filters are secondary and routine entries remain deletable", () => {
  const history = textFile("../src/components/History.jsx");
  assert.match(history, /progress-activity-filter/);
  assert.match(history, /All activity/);
  assert.match(history, /Today tasks/);
  assert.match(history, /Delete routine entry/);
  assert.match(history, /entry\.deletable/);
});

test("Progress Calendar supports month navigation and accessible day labels", () => {
  const calendar = textFile("../src/components/ProgressCalendar.jsx");
  assert.match(calendar, /Previous month/);
  assert.match(calendar, /Next month/);
  assert.match(calendar, /formatCalendarDayLabel/);
  assert.match(calendar, /Today tasks/);
  assert.match(calendar, /Routine session/);
  assert.match(calendar, /Selected day/);
});

test("Phase 4 styles load after Phase 3 styles", () => {
  const main = textFile("../src/main.jsx");
  const phaseThree = main.indexOf('"./styles/universal-phase3.css"');
  const phaseFour = main.indexOf('"./styles/universal-phase4.css"');
  assert.ok(phaseThree >= 0);
  assert.ok(phaseFour > phaseThree);
});

test("Help describes the new Progress information hierarchy", () => {
  const help = textFile("../src/components/HelpGuide.jsx");
  assert.match(help, /Progress starts with recent activity and this week/);
  assert.match(help, /Calendar/);
  assert.match(help, /Insights/);
});
