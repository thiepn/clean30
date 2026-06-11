import { useMemo, useState } from "react";
import { getHistoryStats } from "../utils/calculations.js";
import { formatDateTime } from "../utils/dates.js";
import EmptyState from "./EmptyState.jsx";
import ProgressBar from "./ProgressBar.jsx";

function displayDays(value) {
  if (value === null || value === undefined) return "Never";
  if (value === 0) return "Today";
  return `${value} days`;
}

export default function History({ history, routines, onDeleteEntry }) {
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const stats = getHistoryStats(history);
  const filterOptions = [
    { id: "all", label: "All" },
    ...routines.map((routine) => ({ id: routine.id, label: routine.title }))
  ];

  const filtered = useMemo(() => {
    const items = filter === "all" ? history : history.filter((entry) => entry.routineId === filter);
    return [...items].sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  }, [filter, history]);

  const selected = history.find((entry) => entry.id === selectedId);

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Consistency</p>
            <h2>History</h2>
          </div>
        </div>
        <div className="stats-grid">
          <div className="metric-card">
            <span>Total sessions</span>
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
            <span>Average completion</span>
            <strong>{stats.average}%</strong>
          </div>
          <div className="metric-card">
            <span>Since weekly reset</span>
            <strong>{displayDays(stats.daysSinceWeekly)}</strong>
          </div>
          <div className="metric-card">
            <span>Since monthly deep clean</span>
            <strong>{displayDays(stats.daysSinceMonthly)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Filter by type</p>
        <div className="tab-row">
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
          title="No sessions yet"
          message="Complete a routine to build cleaning history."
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
                <span>{entry.routineTitle}</span>
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
                <p className="eyebrow">Session details</p>
                <h2>{selected.routineTitle}</h2>
                <dl className="detail-list">
                  <div>
                    <dt>Started</dt>
                    <dd>{formatDateTime(selected.startedAt)}</dd>
                  </div>
                  <div>
                    <dt>Finished</dt>
                    <dd>{formatDateTime(selected.finishedAt)}</dd>
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
