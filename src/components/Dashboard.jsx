import { useState } from "react";
import {
  getDashboardStatus,
  getLastCompleted,
  getRecommendedAction,
  getSessionProgress
} from "../utils/calculations.js";
import { formatDateTime, formatRelativeDays, getTodayKey } from "../utils/dates.js";
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
  activeSession,
  backupDue,
  lastFullBackupExportedAt,
  dismissedRecommendations = {},
  onToggleDailyRule,
  onStartRoutine,
  onDismissRecommendation,
  onResumeSession,
  onFinishPartialSession,
  onDiscardSession,
  onExportFullBackup
}) {
  const [selectedQuickStart, setSelectedQuickStart] = useState("");
  const [reviewDailyRules, setReviewDailyRules] = useState(false);
  const todayKey = getTodayKey();
  const todayCompleted = dailyRuleCompletions[todayKey] || [];
  const dailyRules = template.dailyRules;
  const validTodayCompleted = dailyRules.filter((rule) => todayCompleted.includes(rule.id));
  const dailyProgress = {
    completed: validTodayCompleted.length,
    total: dailyRules.length,
    percent: dailyRules.length ? Math.round((validTodayCompleted.length / dailyRules.length) * 100) : 0
  };
  const status = getDashboardStatus({ history, template, dailyProgress });
  const recommendation = getRecommendedAction(status, dailyProgress, { template });
  const dismissedToday = dismissedRecommendations[todayKey] || [];
  const showRecommendation = !dismissedToday.includes(recommendation.key);
  const dailyRulesComplete = dailyProgress.total > 0 && dailyProgress.completed === dailyProgress.total;
  const recommendedRoutine = template.routines.find(
    (routine) => routine.id === recommendation.routineId
  );
  const mostRecentSession = [...history].sort(
    (a, b) => new Date(b.finishedAt) - new Date(a.finishedAt)
  )[0];
  const activeRoutine = activeSession
    ? activeSession.routineSnapshot ||
      template.routines.find((routine) => routine.id === activeSession.routineId)
    : null;
  const activeProgress = activeSession
    ? getSessionProgress(activeSession, activeRoutine)
    : { completed: 0, total: 0, percent: 0 };

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

      {activeSession ? (
        <section className="panel session-resume-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Unfinished session</p>
              <h2>Unfinished session: {activeRoutine?.title || activeSession.routineId}</h2>
              <p>
                Started {formatDateTime(activeSession.startedAt)}. Progress is saved locally until
                you resume, finish partial, or discard it.
              </p>
            </div>
            <div className="status-pill">
              {activeProgress.completed}/{activeProgress.total} tasks
            </div>
          </div>
          <ProgressBar
            percent={activeProgress.percent}
            label={`${activeProgress.percent}% complete`}
          />
          <div className="session-actions">
            <button className="button primary" type="button" onClick={onResumeSession}>
              Resume
            </button>
            <button className="button ghost" type="button" onClick={onFinishPartialSession}>
              Finish partial
            </button>
            <button className="button danger-ghost" type="button" onClick={onDiscardSession}>
              Discard
            </button>
          </div>
        </section>
      ) : null}

      {backupDue ? (
        <section className="panel backup-reminder-panel">
          <div>
            <p className="eyebrow">Local backup</p>
            <h2>Gentle Backup Reminder</h2>
            <p>
              Your Clean30 data lives only in this browser. Since you have started using the app,
              it is a good time to export a full backup.
            </p>
            {lastFullBackupExportedAt ? (
              <p className="muted">Last full backup: {formatDateTime(lastFullBackupExportedAt)}</p>
            ) : (
              <p className="muted">No full backup has been exported yet.</p>
            )}
          </div>
          <button className="button primary" type="button" onClick={onExportFullBackup}>
            Export full backup now
          </button>
        </section>
      ) : null}

      <div
        className={showRecommendation ? "dashboard-grid" : "dashboard-grid dashboard-grid-single"}
      >
        <section className="panel dashboard-daily-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Today</p>
              <h2>Tiny Rules</h2>
            </div>
            <div className="daily-panel-actions">
              {dailyRulesComplete ? <span className="status-pill compact">Complete</span> : null}
              <span className="date-chip">{todayKey}</span>
            </div>
          </div>
          <ProgressBar
            percent={dailyProgress.percent}
            label={`${dailyProgress.completed}/${dailyProgress.total} complete`}
          />
          {dailyRulesComplete && !reviewDailyRules ? (
            <div className="daily-complete-card">
              <div>
                <strong>Your daily baseline is handled.</strong>
                <p>
                  Small habits done for today. {dailyProgress.completed}/{dailyProgress.total} complete.
                </p>
              </div>
              <button
                className="button ghost small"
                type="button"
                onClick={() => setReviewDailyRules(true)}
              >
                Review
              </button>
            </div>
          ) : (
            <>
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
              {dailyRulesComplete ? (
                <button
                  className="button ghost small daily-review-done"
                  type="button"
                  onClick={() => setReviewDailyRules(false)}
                >
                  Done reviewing
                </button>
              ) : null}
            </>
          )}
        </section>

        {showRecommendation ? (
          <section className="panel action-panel dashboard-action-panel">
            <button
              className="dismiss-button"
              type="button"
              aria-label="Dismiss recommendation"
              onClick={() => onDismissRecommendation(recommendation.key)}
            >
              X
            </button>
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
        ) : null}
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick start</p>
            <h2>Fixed Sequences</h2>
          </div>
          {selectedQuickStart ? (
            <span className="pill">
              {template.routines.find((routine) => routine.id === selectedQuickStart)?.title}
            </span>
          ) : null}
        </div>
        <div className="quick-grid quick-start-grid">
          {quickStarts
            .map((routineId) => template.routines.find((item) => item.id === routineId))
            .filter(Boolean)
            .map((routine) => (
              <button
                className={
                  selectedQuickStart === routine.id ? "quick-button selected" : "quick-button"
                }
                type="button"
                key={routine.id}
                onClick={() => setSelectedQuickStart(routine.id)}
              >
                <strong>{routine.title}</strong>
                <span>{routine.estimatedTime}</span>
              </button>
            ))}
          <button
            className={
              selectedQuickStart ? "quick-button quick-confirm active" : "quick-button quick-confirm"
            }
            type="button"
            disabled={!selectedQuickStart}
            onClick={() => selectedQuickStart && onStartRoutine(selectedQuickStart)}
          >
            <strong>Start</strong>
            <span>{selectedQuickStart ? "Start selected" : "Select a routine first"}</span>
          </button>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel dashboard-laws-panel">
          <p className="eyebrow">Permanent principles</p>
          <h2>Apartment Laws</h2>
          <ol className="law-list">
            {template.systems.apartmentLaws.map((law) => (
              <li key={law}>{law}</li>
            ))}
          </ol>
        </section>

        <section className="panel dashboard-memory-panel">
          <p className="eyebrow">Last completed</p>
          <h2>Maintenance Memory</h2>
          <div className="last-grid maintenance-grid">
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
            <div className="metric-card">
              <span>Most recent session</span>
              <strong>
                {mostRecentSession
                  ? `${mostRecentSession.routineTitle} - ${formatRelativeDays(mostRecentSession.finishedAt)}`
                  : "Not yet"}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
