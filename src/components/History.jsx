import { useMemo, useState } from "react";
import { getHistoryStats, isDailyRulesHistoryEntry } from "../utils/calculations.js";
import { formatDateTime, formatRelativeDays } from "../utils/dates.js";
import { getHistoryInsights, getSessionDurationMinutes } from "../utils/historyInsights.js";
import EmptyState from "./EmptyState.jsx";
import ProgressBar from "./ProgressBar.jsx";

function displayDays(value) {
  if (value === null || value === undefined) return "Not yet";
  if (value === 0) return "Today";
  return `${value} days`;
}

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
    "daily-rules": "Daily",
    "weekly-reset": "Weekly",
    "minimal-reset": "Minimal",
    "guest-reset": "Guest",
    "monthly-deep-clean": "Monthly",
    "initial-reset": "Initial"
  };
  return labels[routine.id] || routine.title;
}

function entryKindLabel(entry) {
  return isDailyRulesHistoryEntry(entry) ? "Daily" : "Reset";
}

export default function History({ history, routines, template, onDeleteEntry }) {
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const stats = getHistoryStats(history);
  const insights = getHistoryInsights(history, routines, template);
  const filterOptions = [
    { id: "all", label: "All" },
    ...routines.map((routine) => ({ id: routine.id, label: filterLabel(routine) }))
  ];
  const hasHistory = history.length > 0;
  const mostRecent = [...history].sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))[0];

  const filtered = useMemo(() => {
    const items = filter === "all" ? history : history.filter((entry) => entry.routineId === filter);
    return [...items].sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  }, [filter, history]);

  const selected = history.find((entry) => entry.id === selectedId);
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
        {!hasHistory ? (
          <div className="history-empty-panel">
            <div>
              <h3>No cleaning history yet.</h3>
              <p>Complete Daily Rules or finish a reset to start building history.</p>
            </div>
            <div className="history-starter-stats">
              <div>
                <span>Daily rules completed</span>
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
              <span>Completed resets</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="metric-card">
              <span>Weekly resets</span>
              <strong>{stats.weekly}</strong>
            </div>
            <div className="metric-card">
              <span>Minimal resets</span>
              <strong>{stats.minimal}</strong>
            </div>
            <div className="metric-card">
              <span>Monthly deep cleans</span>
              <strong>{stats.monthly}</strong>
            </div>
            <div className="metric-card">
              <span>Daily rules completed</span>
              <strong>{stats.dailyRules}</strong>
            </div>
            <div className="metric-card">
              <span>Average completion</span>
              <strong>{stats.total ? `${stats.average}%` : "Not yet"}</strong>
            </div>
            <div className="metric-card">
              <span>Last weekly reset</span>
              <strong>{displayDays(stats.daysSinceWeekly)}</strong>
            </div>
            <div className="metric-card">
              <span>Last monthly deep clean</span>
              <strong>{displayDays(stats.daysSinceMonthly)}</strong>
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

        {history.length === 0 ? (
          <EmptyState
            title="No insights yet"
            message="Complete Daily Rules or finish a reset to reveal useful patterns."
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
          title={hasHistory ? "No entries for this filter." : "No cleaning history yet."}
          message={
            hasHistory
              ? "Try another filter to review completed entries."
              : "Complete Daily Rules or finish a reset to build cleaning history."
          }
        />
      ) : (
        <div className="history-grid">
          <section className="history-list" aria-label="Completed sessions">
            {filtered.map((entry) => (
              <button
                className={selectedId === entry.id ? "history-card active" : "history-card"}
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
              >
                <div className="history-card-topline">
                  <span>{entry.routineTitle}</span>
                  <small className="pill">{entryKindLabel(entry)}</small>
                </div>
                <strong>{formatDateTime(entry.finishedAt)}</strong>
                <ProgressBar
                  percent={entry.percent}
                  label={`${entry.completedTasks}/${entry.totalTasks} tasks`}
                />
                {entry.notes ? <small>{entry.notes.slice(0, 100)}</small> : null}
              </button>
            ))}
          </section>

          <section className="panel detail-panel">
            {selected ? (
              <>
                <p className="eyebrow">Entry details</p>
                <h2>{selected.routineTitle}</h2>
                <dl className="detail-list">
                  <div>
                    <dt>Routine</dt>
                    <dd>{selected.routineTitle}</dd>
                  </div>
                  {selectedIsDailyRules ? (
                    <div>
                      <dt>Status</dt>
                      <dd>Daily rules complete</dd>
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
                    <dt>Duration</dt>
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
                <button
                  className="button danger-ghost"
                  type="button"
                  onClick={() => onDeleteEntry(selected.id)}
                >
                  Delete entry
                </button>
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
