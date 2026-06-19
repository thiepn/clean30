import { useMemo, useState } from "react";
import {
  getHistoryStats,
  isDailyRulesHistoryEntry
} from "../utils/calculations.js";
import { formatDateTime, formatRelativeDays, getTodayKey } from "../utils/dates.js";
import {
  buildActivityByDate,
  buildHistoryDisplayEntries,
  getActivityStreaks,
  getWeeklyActivitySummary
} from "../utils/activity.js";
import { getHistoryInsights, getSessionDurationMinutes } from "../utils/historyInsights.js";
import EmptyState from "./EmptyState.jsx";

function displayInsightDate(value) {
  return value ? formatRelativeDays(value) : "Not yet";
}

function displayDuration(minutes) {
  if (minutes === null) return "Not available";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function filterLabel(routine) {
  const labels = {
    "daily-rules": "Today",
    "weekly-reset": "Weekly",
    "minimal-reset": "Minimal",
    "guest-reset": "Guest",
    "monthly-deep-clean": "Monthly",
    "initial-reset": "Initial"
  };
  return labels[routine.id] || routine.title;
}

function entryKindLabel(entry) {
  return isDailyRulesHistoryEntry(entry) ? "Today" : "Reset";
}

function entryTitle(entry) {
  return isDailyRulesHistoryEntry(entry) ? "Today tasks" : entry.routineTitle;
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
  const stats = getHistoryStats(history);
  const insights = getHistoryInsights(history, routines, template);
  const activityByDate = useMemo(
    () => buildActivityByDate(history, todayTasksByDate, template),
    [history, template, todayTasksByDate]
  );
  const streaks = useMemo(
    () => getActivityStreaks(activityByDate, currentDateKey),
    [activityByDate, currentDateKey]
  );
  const weeklyActivity = useMemo(
    () => getWeeklyActivitySummary(activityByDate, currentDateKey),
    [activityByDate, currentDateKey]
  );
  const todayActivityDays = useMemo(
    () => Object.values(activityByDate).filter((item) => item.todayCompleted > 0).length,
    [activityByDate]
  );
  const filterOptions = [
    { id: "all", label: "All" },
    ...routines.map((routine) => ({ id: routine.id, label: filterLabel(routine) }))
  ];
  const displayEntries = useMemo(
    () => buildHistoryDisplayEntries(activityByDate),
    [activityByDate]
  );
  const hasActivity = displayEntries.length > 0;
  const mostRecent = [...displayEntries].sort(
    (a, b) => new Date(b.finishedAt) - new Date(a.finishedAt)
  )[0];

  const filtered = useMemo(() => {
    const items =
      filter === "all"
        ? displayEntries
        : displayEntries.filter((entry) => entry.routineId === filter);
    return [...items].sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  }, [displayEntries, filter]);

  const selected = displayEntries.find((entry) => entry.id === selectedId);
  const selectedIsDailyRules = isDailyRulesHistoryEntry(selected);
  const selectedDuration = selectedIsDailyRules
    ? selected.estimatedDurationMinutes
    : selected
      ? getSessionDurationMinutes(selected)
      : null;

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Consistency</p>
            <h2>History</h2>
          </div>
        </div>
        {!hasActivity ? (
          <div className="history-empty-panel">
            <div>
              <h3>No history yet.</h3>
              <p>Complete Today tasks or finish a routine to start tracking.</p>
            </div>
            <div className="history-starter-stats">
              <div>
                <span>Today completed</span>
                <strong>0</strong>
              </div>
              <div>
                <span>Completed resets</span>
                <strong>0</strong>
              </div>
              <div>
                <span>Most recent</span>
                <strong>Not yet</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="metric-card">
              <span>Routine sessions</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="metric-card">
              <span>Today activity days</span>
              <strong>{todayActivityDays}</strong>
            </div>
            <div className="metric-card">
              <span>Current streak</span>
              <strong>{streaks.current} days</strong>
            </div>
            <div className="metric-card">
              <span>Best streak</span>
              <strong>{streaks.best} days</strong>
            </div>
            <div className="metric-card">
              <span>This week</span>
              <strong>{weeklyActivity.activeDays}/7 days</strong>
              <small>active-day consistency</small>
            </div>
            <div className="metric-card">
              <span>Most recent</span>
              <strong>{mostRecent ? formatRelativeDays(mostRecent.finishedAt) : "Not yet"}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Insights</p>
            <h2>Practical Pattern Check</h2>
            <p>Simple history signals without streak pressure or gamification.</p>
          </div>
        </div>

        {stats.total === 0 ? (
          <EmptyState
            title="No insights yet"
            message="Finish a routine to reveal useful patterns."
          />
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

            <div className="insight-grid">
              <div className="metric-card">
                <span>Most used routine</span>
                <strong>{insights.mostUsed?.title || "Not yet"}</strong>
                {insights.mostUsed ? <small>{insights.mostUsed.count} sessions</small> : null}
              </div>
              <div className="metric-card">
                <span>Average weekly reset gap</span>
                <strong>
                  {insights.averageWeeklyResetGap === null
                    ? "Not enough data"
                    : `${insights.averageWeeklyResetGap} days`}
                </strong>
                <small>{insights.weeklyGapSampleSize} measured gaps</small>
              </div>
              <div className="metric-card">
                <span>Last 7 days</span>
                <strong>{insights.recent7}</strong>
                <small>completed resets</small>
              </div>
              <div className="metric-card">
                <span>Last 30 days</span>
                <strong>{insights.recent30}</strong>
                <small>completed resets</small>
              </div>
              <div className="metric-card">
                <span>Average completion</span>
                <strong>
                  {insights.averageCompletion === null ? "Not yet" : `${insights.averageCompletion}%`}
                </strong>
                <small>across reset sessions</small>
              </div>
            </div>

            <div className="history-insight-columns">
              <div className="insight-card">
                <p className="eyebrow">Last completed by routine</p>
                <div className="insight-list">
                  {insights.lastCompletedByRoutine.map((item) => (
                    <div key={item.routineId}>
                      <span>{item.title}</span>
                      <strong>{displayInsightDate(item.finishedAt)}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="insight-card">
                <p className="eyebrow">Average by routine</p>
                {insights.averageCompletionByRoutine.length ? (
                  <div className="insight-list">
                    {insights.averageCompletionByRoutine.map((item) => (
                      <div key={item.routineId}>
                        <span>{item.title}</span>
                        <strong>{item.percent}%</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">Complete more sessions to compare routine completion.</p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Filter by type</p>
        <div className="tab-row history-filter-row" aria-label="History filters">
          {filterOptions.map((option) => (
            <button
              className={filter === option.id ? "tab active" : "tab"}
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title={hasActivity ? "No entries for this filter." : "No cleaning history yet."}
          message={
            hasActivity
              ? "Try another filter to review completed entries."
              : "Complete Today tasks or finish a routine to build history."
          }
        />
      ) : (
        <div className="history-grid">
          <section className="history-list" aria-label="Completed sessions">
            {filtered.map((entry) => {
              const duration = isDailyRulesHistoryEntry(entry)
                ? entry.estimatedDurationMinutes
                : getSessionDurationMinutes(entry);
              return (
              <button
                className={selectedId === entry.id ? "history-card active" : "history-card"}
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
              >
                <div className="history-card-topline">
                  <span>{entryTitle(entry)}</span>
                  <small className="pill">{entryKindLabel(entry)}</small>
                </div>
                <strong>{formatDateTime(entry.finishedAt)}</strong>
                <div className="history-card-meta">
                  <span>{entry.completedTasks}/{entry.totalTasks} tasks</span>
                  {duration !== null && duration !== undefined ? (
                    <span>{displayDuration(duration)}</span>
                  ) : null}
                  {!isDailyRulesHistoryEntry(entry) ? <span>{entry.percent}%</span> : null}
                </div>
                {entry.notes ? <small>{entry.notes.slice(0, 100)}</small> : null}
              </button>
              );
            })}
          </section>

          <section className="panel detail-panel">
            {selected ? (
              <>
                <p className="eyebrow">Entry details</p>
                <h2>{entryTitle(selected)}</h2>
                <dl className="detail-list">
                    <div>
                      <dt>Routine</dt>
                    <dd>{entryTitle(selected)}</dd>
                    </div>
                  {selectedIsDailyRules ? (
                    <div>
                      <dt>Status</dt>
                      <dd>{selected.percent >= 100 ? "Today tasks complete" : "Today activity"}</dd>
                    </div>
                  ) : selected.percent < 100 ? (
                    <div>
                      <dt>Status</dt>
                      <dd>Partial session</dd>
                    </div>
                  ) : (
                    <div>
                      <dt>Status</dt>
                      <dd>Complete session</dd>
                    </div>
                  )}
                  <div>
                    <dt>Started</dt>
                    <dd>{formatDateTime(selected.startedAt)}</dd>
                  </div>
                  <div>
                    <dt>Finished</dt>
                    <dd>{formatDateTime(selected.finishedAt)}</dd>
                  </div>
                  <div>
                    <dt>{selectedIsDailyRules ? "Estimated time" : "Duration"}</dt>
                    <dd>{displayDuration(selectedDuration)}</dd>
                  </div>
                  <div>
                    <dt>Completion</dt>
                    <dd>{selected.percent}%</dd>
                  </div>
                  <div>
                    <dt>Tasks</dt>
                    <dd>
                      {selected.completedTasks}/{selected.totalTasks}
                    </dd>
                  </div>
                  {selected.templateName ? (
                    <div>
                      <dt>Template</dt>
                      <dd>{selected.templateName}</dd>
                    </div>
                  ) : null}
                </dl>
                {selected.notes ? (
                  <div className="notes-preview">
                    <h3>Notes</h3>
                    <p>{selected.notes}</p>
                  </div>
                ) : null}
                {selectedIsDailyRules ? (
                  <p className="callout small">
                    {selected.legacyFallback
                      ? "Legacy Today activity is retained for compatibility and is not deleted like a routine session."
                      : "Today activity follows the dated Today task list and may change when that list is reset or unchecked."}
                  </p>
                ) : null}
                {selected.deletable ? (
                  <button
                    className="button danger-ghost"
                    type="button"
                    onClick={() => onDeleteEntry(selected.id)}
                  >
                    Delete entry
                  </button>
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Select a session"
                message="Open any history card to view the details."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
