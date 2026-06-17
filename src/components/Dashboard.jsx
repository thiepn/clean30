import { useState } from "react";
import { getLastCompleted } from "../utils/calculations.js";
import { formatRelativeDays, getTodayKey } from "../utils/dates.js";
import ProgressBar from "./ProgressBar.jsx";
import StartSession from "./StartSession.jsx";

const lastCards = [
  { routineId: "weekly-reset", label: "Weekly Reset" },
  { routineId: "minimal-reset", label: "Minimal Reset" },
  { routineId: "monthly-deep-clean", label: "Monthly Deep Clean" },
  { routineId: "guest-reset", label: "Guest Reset" }
];

const mobileDailyRuleLabels = {
  "No food trash overnight": "No food trash",
  "Dishes returned to kitchen": "Dishes back",
  "Clothes into laundry basket": "Laundry basket",
  "Bathroom smell check": "Smell check"
};

function getMobileDailyRuleLabel(title) {
  return mobileDailyRuleLabels[title] || title;
}

export default function Dashboard({
  template,
  history = [],
  dailyRuleCompletions = {},
  dashboardTodos = [],
  activeSession,
  completionSummary,
  selectedRoutineId,
  onSelectRoutine,
  onToggleDailyRule,
  onAddDashboardTodo,
  onToggleDashboardTodo,
  onDeleteDashboardTodo,
  onClearCompletedDashboardTodos,
  onStartRoutine,
  onToggleTask,
  onCompletePhase,
  onResetSession,
  onFinishSession,
  onCancelSession,
  onUpdateNotes,
  onEditDailyRules,
  onEditRoutines,
  onAddRoutine
}) {
  const [todoText, setTodoText] = useState("");
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
  const dailyRulesComplete = dailyProgress.total > 0 && dailyProgress.completed === dailyProgress.total;
  const completedTodoCount = dashboardTodos.filter((todo) => todo.completed).length;
  const hasMaintenanceMemory = history.length > 0;
  const mostRecentSession = [...history].sort(
    (a, b) => new Date(b.finishedAt) - new Date(a.finishedAt)
  )[0];

  function submitTodo(event) {
    event.preventDefault();
    const trimmed = todoText.trim();
    if (!trimmed) return;
    onAddDashboardTodo(trimmed);
    setTodoText("");
  }

  return (
    <div className="screen-stack">
      <section className="panel dashboard-daily-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Today</p>
            <h2>Daily Rules</h2>
          </div>
          <div className="daily-panel-actions">
            <span className="daily-progress-count">
              {dailyProgress.completed}/{dailyProgress.total}
            </span>
            {dailyRulesComplete ? <span className="status-pill compact">Complete</span> : null}
            <button className="button ghost small" type="button" onClick={onEditDailyRules}>
              Edit Daily Rules
            </button>
          </div>
        </div>
        <ProgressBar
          percent={dailyProgress.percent}
          label={`${dailyProgress.completed}/${dailyProgress.total} complete`}
        />
        {dailyRulesComplete && !reviewDailyRules ? (
          <div className="daily-complete-card">
            <div>
              <strong>Daily Rules are done.</strong>
              <p>
                Small habits are handled for today. {dailyProgress.completed}/{dailyProgress.total} complete.
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
                      <strong>
                        <span className="desktop-rule-label">{rule.title}</span>
                        <span className="mobile-rule-label">
                          {getMobileDailyRuleLabel(rule.title)}
                        </span>
                      </strong>
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

      <section className="panel dashboard-todo-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Custom To-Do List</h2>
            <p>Small one-off tasks that do not belong in routine history.</p>
          </div>
          {dashboardTodos.length ? (
            <span className="status-pill compact">
              {completedTodoCount}/{dashboardTodos.length} done
            </span>
          ) : null}
        </div>
        <form className="dashboard-todo-form" onSubmit={submitTodo}>
          <input
            type="text"
            value={todoText}
            placeholder="Add a one-off task"
            onChange={(event) => setTodoText(event.target.value)}
          />
          <button className="button primary" type="submit">
            Add
          </button>
        </form>
        {dashboardTodos.length ? (
          <div className="task-list dashboard-todos">
            {dashboardTodos.map((todo) => (
              <label className={todo.completed ? "task-row checked" : "task-row"} key={todo.id}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => onToggleDashboardTodo(todo.id)}
                />
                <span className="task-copy">
                  <span className="task-title-line">
                    <strong>{todo.text}</strong>
                  </span>
                </span>
                <button
                  className="icon-button small danger-icon"
                  type="button"
                  aria-label={`Remove ${todo.text}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDeleteDashboardTodo(todo.id);
                  }}
                >
                  X
                </button>
              </label>
            ))}
          </div>
        ) : (
          <p className="muted">No custom tasks yet.</p>
        )}
        {completedTodoCount ? (
          <button className="button ghost small" type="button" onClick={onClearCompletedDashboardTodos}>
            Clear completed
          </button>
        ) : null}
      </section>

      <StartSession
        routines={template.routines}
        selectedRoutineId={selectedRoutineId}
        onSelectRoutine={onSelectRoutine}
        activeSession={activeSession}
        completionSummary={completionSummary}
        onStartSession={onStartRoutine}
        onToggleTask={onToggleTask}
        onCompletePhase={onCompletePhase}
        onResetSession={onResetSession}
        onFinishSession={onFinishSession}
        onCancelSession={onCancelSession}
        onUpdateNotes={onUpdateNotes}
        onEditRoutines={onEditRoutines}
        onAddRoutine={onAddRoutine}
      />

      {hasMaintenanceMemory ? (
        <section className="panel dashboard-memory-panel">
          <p className="eyebrow">Recent history</p>
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
              <span>Most recent</span>
              <strong>
                {mostRecentSession
                  ? `${mostRecentSession.routineTitle} - ${formatRelativeDays(mostRecentSession.finishedAt)}`
                  : "Not yet"}
              </strong>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
