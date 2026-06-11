import {
  getDashboardStatus,
  getLastCompleted,
  getRecommendedAction
} from "../utils/calculations.js";
import { formatRelativeDays, getTodayKey } from "../utils/dates.js";
import ProgressBar from "./ProgressBar.jsx";

const quickStarts = [
  "weekly-reset",
  "minimal-reset",
  "guest-reset",
  "monthly-deep-clean",
  "initial-reset"
];

const lastCards = [
  { routineId: "weekly-reset", label: "Last Weekly Reset" },
  { routineId: "minimal-reset", label: "Last Minimal Reset" },
  { routineId: "monthly-deep-clean", label: "Last Monthly Deep Clean" },
  { routineId: "guest-reset", label: "Last Guest Reset" }
];

export default function Dashboard({
  template,
  history,
  dailyRuleCompletions,
  onToggleDailyRule,
  onStartRoutine
}) {
  const todayKey = getTodayKey();
  const todayCompleted = dailyRuleCompletions[todayKey] || [];
  const dailyRules = template.dailyRules;
  const dailyProgress = {
    completed: todayCompleted.length,
    total: dailyRules.length,
    percent: dailyRules.length ? Math.round((todayCompleted.length / dailyRules.length) * 100) : 0
  };
  const status = getDashboardStatus({ history, template, dailyProgress });
  const recommendation = getRecommendedAction(status, dailyProgress);
  const recommendedRoutine = template.routines.find(
    (routine) => routine.id === recommendation.routineId
  );

  return (
    <div className="screen-stack">
      <section className={`hero-status ${status.tone}`}>
        <div>
          <p className="eyebrow">Apartment Status</p>
          <h2>{status.status}</h2>
          <p>{status.explanation}</p>
        </div>
        <div className="status-meter">
          <span>
            {dailyProgress.completed}/{dailyProgress.total}
          </span>
          <small>daily rules</small>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Today</p>
              <h2>Tiny Rules</h2>
            </div>
            <span className="date-chip">{todayKey}</span>
          </div>
          <ProgressBar
            percent={dailyProgress.percent}
            label={`${dailyProgress.completed}/${dailyProgress.total} complete`}
          />
          <div className="task-list daily">
            {dailyRules.map((rule) => (
              <label
                className={todayCompleted.includes(rule.id) ? "task-row checked" : "task-row"}
                key={rule.id}
              >
                <input
                  type="checkbox"
                  checked={todayCompleted.includes(rule.id)}
                  onChange={() => onToggleDailyRule(rule.id)}
                />
                <span className="task-copy">
                  <span className="task-title-line">
                    <strong>{rule.title}</strong>
                    {rule.duration ? <span className="duration">{rule.duration}</span> : null}
                  </span>
                  {rule.detail ? <span className="task-detail">{rule.detail}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="panel action-panel">
          <p className="eyebrow">Recommended next action</p>
          <h2>{recommendation.label}</h2>
          <p>{recommendation.detail}</p>
          {recommendedRoutine ? (
            <button
              className="button primary wide"
              type="button"
              onClick={() => onStartRoutine(recommendation.routineId)}
            >
              {recommendation.label}
            </button>
          ) : null}
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick start</p>
            <h2>Fixed Sequences</h2>
          </div>
        </div>
        <div className="quick-grid">
          {quickStarts
            .map((routineId) => template.routines.find((item) => item.id === routineId))
            .filter(Boolean)
            .map((routine) => (
              <button
                className="quick-button"
                type="button"
                key={routine.id}
                onClick={() => onStartRoutine(routine.id)}
              >
                <strong>Start {routine.title}</strong>
                <span>{routine.estimatedTime}</span>
              </button>
            ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <p className="eyebrow">Permanent principles</p>
          <h2>Apartment Laws</h2>
          <ol className="law-list">
            {template.systems.apartmentLaws.map((law) => (
              <li key={law}>{law}</li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <p className="eyebrow">Last completed</p>
          <h2>Maintenance Memory</h2>
          <div className="last-grid">
            {lastCards.map((item) => (
              <div className="metric-card" key={item.routineId}>
                <span>{item.label}</span>
                <strong>{formatRelativeDays(getLastCompleted(history, item.routineId))}</strong>
              </div>
            ))}
            <div className="metric-card">
              <span>Total completed sessions</span>
              <strong>{history.length}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
