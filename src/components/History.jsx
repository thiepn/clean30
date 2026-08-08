import { useEffect, useMemo, useState } from "react";
import { getHistoryStats, isDailyRulesHistoryEntry } from "../utils/calculations.js";
import { formatRelativeDays, getTodayKey } from "../utils/dates.js";
import {
  buildActivityByDate,
  buildHistoryDisplayEntries,
  getActivityStreaks,
  getWeeklyActivitySummary,
  historyEntryDateKey
} from "../utils/activity.js";
import { getHistoryInsights, getSessionDurationMinutes } from "../utils/historyInsights.js";
import EmptyState from "./EmptyState.jsx";
import ProgressCalendar from "./ProgressCalendar.jsx";

function displayDuration(minutes) {
  if (minutes === null || minutes === undefined) return "Not available";
  const rounded = Math.round(Number(minutes) || 0);
  if (rounded <= 0) return "Not available";
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function displayDateKey(dateKey) {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map(Number);
  if (!year || !month || !day) return dateKey || "Unknown date";
  return new Intl.DateTimeFormat("en-DE", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function entryKindLabel(entry) {
  return isDailyRulesHistoryEntry(entry) ? "Today" : "Routine";
}

function entryTitle(entry) {
  return isDailyRulesHistoryEntry(entry) ? "Today tasks" : entry.routineTitle || "Routine";
}

function entryDuration(entry) {
  return isDailyRulesHistoryEntry(entry)
    ? entry.estimatedDurationMinutes
    : getSessionDurationMinutes(entry);
}

function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function History({
  history,
  todayTasksByDate = {},
  currentDateKey = getTodayKey(),
  routines,
  template,
  onDeleteEntry
}) {
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedDate, setSelectedDate] = useState(currentDateKey);
  const stats = getHistoryStats(history);
  const insights = getHistoryInsights(history, routines, template);
  const activityByDate = useMemo(
    () => buildActivityByDate(history, todayTasksByDate, template),
    [history, template, todayTasksByDate]
  );
  const displayEntries = useMemo(
    () =>
      buildHistoryDisplayEntries(activityByDate).sort(
        (first, second) => new Date(second.finishedAt) - new Date(first.finishedAt)
      ),
    [activityByDate]
  );
  const weeklyActivity = useMemo(
    () => getWeeklyActivitySummary(activityByDate, currentDateKey),
    [activityByDate, currentDateKey]
  );
  const streaks = useMemo(
    () => getActivityStreaks(activityByDate, currentDateKey),
    [activityByDate, currentDateKey]
  );
  const hasActivity = displayEntries.length > 0;

  const filterOptions = useMemo(
    () => [
      { id: "all", label: "All activity" },
      { id: "daily-rules", label: "Today tasks" },
      ...routines
        .filter((routine) => routine.id !== "daily-rules")
        .map((routine) => ({ id: routine.id, label: routine.title }))
    ],
    [routines]
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? displayEntries
        : displayEntries.filter((entry) => entry.routineId === filter),
    [displayEntries, filter]
  );
  const visibleEntries = showAll ? filtered : filtered.slice(0, 6);

  const insightFacts = [
    insights.mostUsed
      ? {
          label: "Most used routine",
          value: insights.mostUsed.title,
          detail: countLabel(insights.mostUsed.count, "session")
        }
      : null,
    insights.averageCompletion !== null
      ? {
          label: "Average routine completion",
          value: `${insights.averageCompletion}%`,
          detail: "across saved routine sessions"
        }
      : null,
    insights.averageWeeklyResetGap !== null
      ? {
          label: "Average weekly reset gap",
          value: `${insights.averageWeeklyResetGap} days`,
          detail: countLabel(insights.weeklyGapSampleSize, "measured gap")
        }
      : null,
    insights.recent7 > 0
      ? {
          label: "Last 7 days",
          value: String(insights.recent7),
          detail: "routine sessions"
        }
      : null,
    insights.recent30 > 0
      ? {
          label: "Last 30 days",
          value: String(insights.recent30),
          detail: "routine sessions"
        }
      : null,
    streaks.current > 1
      ? {
          label: "Current active-day streak",
          value: `${streaks.current} days`,
          detail: "shown here as context, not a goal"
        }
      : null,
    streaks.best > 1
      ? {
          label: "Longest active-day streak",
          value: `${streaks.best} days`,
          detail: "historical context"
        }
      : null
  ].filter(Boolean);

  useEffect(() => {
    setShowAll(false);
    setSelectedId(null);
  }, [filter]);

  useEffect(() => {
    setSelectedDate(currentDateKey);
  }, [currentDateKey]);

  return (
    <div className="screen-stack progress-screen">
      <section className="panel progress-overview-panel">
        <div className="progress-page-heading">
          <div>
            <p className="eyebrow">Cleaning activity</p>
            <h2>Progress</h2>
            <p>See what you cleaned recently without turning the app into a scoreboard.</p>
          </div>
        </div>

        {hasActivity ? (
          <div className="progress-week-summary-card">
            <div className="progress-week-primary">
              <span>This week</span>
              <strong>
                {weeklyActivity.activeDays} active {weeklyActivity.activeDays === 1 ? "day" : "days"}
              </strong>
              <small>Monday through Sunday</small>
            </div>
            <div className="progress-week-facts">
              {weeklyActivity.todayCompleted > 0 ? (
                <span>{countLabel(weeklyActivity.todayCompleted, "Today task")}</span>
              ) : null}
              {weeklyActivity.routines > 0 ? (
                <span>{countLabel(weeklyActivity.routines, "routine")}</span>
              ) : null}
              {weeklyActivity.routineElapsedMinutes > 0 ? (
                <span>
                  {displayDuration(weeklyActivity.routineElapsedMinutes)} measured routine time
                </span>
              ) : null}
              {weeklyActivity.estimatedTodayMinutes > 0 ? (
                <span>
                  {displayDuration(weeklyActivity.estimatedTodayMinutes)} estimated Today time
                </span>
              ) : null}
              {!weeklyActivity.todayCompleted && !weeklyActivity.routines ? (
                <span>No activity recorded yet this week.</span>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No progress yet"
            message="Complete a Today task or finish a routine and it will appear here."
          />
        )}
      </section>

      <section className="panel progress-recent-panel">
        <div className="progress-section-heading">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2>What you cleaned</h2>
            <p>Routine sessions stay saved. Today activity follows your dated Today lists.</p>
          </div>
          {hasActivity && filterOptions.length > 2 ? (
            <label className="progress-filter" htmlFor="progress-activity-filter">
              <span>Show</span>
              <select
                id="progress-activity-filter"
                onChange={(event) => setFilter(event.target.value)}
                value={filter}
              >
                {filterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {!hasActivity ? (
          <p className="muted progress-inline-empty">Recent cleaning will appear here.</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No activity for this filter"
            message="Choose another activity type to review recent cleaning."
          />
        ) : (
          <>
            <div className="progress-activity-list" aria-label="Recent cleaning activity">
              {visibleEntries.map((entry) => {
                const duration = entryDuration(entry);
                const selected = selectedId === entry.id;
                const daily = isDailyRulesHistoryEntry(entry);
                const dateKey = historyEntryDateKey(entry);
                return (
                  <article className={selected ? "progress-activity-item selected" : "progress-activity-item"} key={entry.id}>
                    <button
                      aria-expanded={selected}
                      className="progress-activity-button"
                      onClick={() => setSelectedId(selected ? null : entry.id)}
                      type="button"
                    >
                      <span className="progress-activity-main">
                        <span className="progress-activity-type">{entryKindLabel(entry)}</span>
                        <strong>{entryTitle(entry)}</strong>
                        <small>{formatRelativeDays(entry.finishedAt)}</small>
                      </span>
                      <span className="progress-activity-meta">
                        <span>{entry.completedTasks}/{entry.totalTasks} tasks</span>
                        {duration !== null && duration !== undefined ? (
                          <span>{daily ? "Est. " : ""}{displayDuration(duration)}</span>
                        ) : null}
                        {!daily && entry.percent < 100 ? <span>{entry.percent}% complete</span> : null}
                      </span>
                    </button>

                    {selected ? (
                      <div className="progress-entry-detail">
                        <div className="progress-detail-grid">
                          <div>
                            <span>Date</span>
                            <strong>{displayDateKey(dateKey)}</strong>
                          </div>
                          <div>
                            <span>Tasks</span>
                            <strong>{entry.completedTasks}/{entry.totalTasks}</strong>
                          </div>
                          <div>
                            <span>{daily ? "Estimated time" : "Measured time"}</span>
                            <strong>{displayDuration(duration)}</strong>
                          </div>
                        </div>
                        {!daily && entry.notes ? (
                          <div className="progress-entry-note">
                            <span>Note</span>
                            <p>{entry.notes}</p>
                          </div>
                        ) : null}
                        {daily ? (
                          <p className="progress-entry-footnote">
                            {entry.legacyFallback
                              ? "This is legacy Today activity retained for compatibility."
                              : "Today activity is derived from the dated Today list and changes if that list is changed."}
                          </p>
                        ) : null}
                        {entry.deletable ? (
                          <button
                            className="button danger-ghost small"
                            onClick={() => onDeleteEntry(entry.id)}
                            type="button"
                          >
                            Delete routine entry
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            {filtered.length > 6 ? (
              <button
                className="button ghost progress-show-more"
                onClick={() => setShowAll((current) => !current)}
                type="button"
              >
                {showAll ? "Show recent only" : `Show all ${filtered.length} entries`}
              </button>
            ) : null}
          </>
        )}
      </section>

      <section className="panel progress-calendar-panel">
        <ProgressCalendar
          activityByDate={activityByDate}
          currentDateKey={currentDateKey}
          onSelectDate={setSelectedDate}
          selectedDate={selectedDate}
        />
      </section>

      <details className="panel progress-insights-panel">
        <summary>
          <span>
            <strong>Insights</strong>
            <small>Patterns, streaks, and routine-level statistics</small>
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="progress-insights-body">
          {stats.total === 0 ? (
            <p className="muted">Finish a routine to unlock routine-specific insights.</p>
          ) : (
            <>
              {insights.warnings.length ? (
                <div className="insight-warning-list">
                  {insights.warnings.map((warning) => (
                    <div className="warning-box" key={warning.id}>
                      <strong>{warning.message}</strong>
                      <span>{warning.detail}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {insightFacts.length ? (
                <div className="progress-insight-facts">
                  {insightFacts.map((fact) => (
                    <div className="progress-insight-fact" key={fact.label}>
                      <span>{fact.label}</span>
                      <strong>{fact.value}</strong>
                      <small>{fact.detail}</small>
                    </div>
                  ))}
                </div>
              ) : null}

              {insights.lastCompletedByRoutine.some((item) => item.finishedAt) ? (
                <div className="progress-routine-recap">
                  <h3>Last completed by routine</h3>
                  <div className="insight-list">
                    {insights.lastCompletedByRoutine
                      .filter((item) => item.finishedAt)
                      .slice(0, 6)
                      .map((item) => (
                        <div key={item.routineId}>
                          <span>{item.title}</span>
                          <strong>{formatRelativeDays(item.finishedAt)}</strong>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </details>
    </div>
  );
}
