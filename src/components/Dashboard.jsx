import { useMemo, useState } from "react";
import { formatDate, getTodayKey } from "../utils/dates.js";
import StartSession from "./StartSession.jsx";

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function displayShortDate(dateKey) {
  return new Intl.DateTimeFormat("en-DE", {
    month: "short",
    day: "numeric"
  }).format(dateFromKey(dateKey));
}

function buildMonthCells(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const leading = first.getDay();
  const cells = Array.from({ length: leading }, (_, index) => ({
    id: `empty-${index}`,
    empty: true
  }));

  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = new Date(year, month, day);
    cells.push({
      id: getTodayKey(date),
      dateKey: getTodayKey(date),
      day
    });
  }

  return cells;
}

function buildActivityByDate(history, todayTasksByDate) {
  const activity = {};

  (history || []).forEach((entry) => {
    const dateKey = entry.date || getTodayKey(new Date(entry.finishedAt || entry.completedAt));
    if (!activity[dateKey]) activity[dateKey] = { sessions: [], todayCompleted: 0 };
    activity[dateKey].sessions.push(entry);
  });

  Object.entries(todayTasksByDate || {}).forEach(([dateKey, tasks]) => {
    const completed = Array.isArray(tasks) ? tasks.filter((task) => task.completed).length : 0;
    if (!activity[dateKey]) activity[dateKey] = { sessions: [], todayCompleted: 0 };
    activity[dateKey].todayCompleted = completed;
  });

  return activity;
}

export default function Dashboard({
  template,
  history = [],
  todayTasks = [],
  todayTasksByDate = {},
  activeSession,
  completionSummary,
  selectedRoutineId,
  onSelectRoutine,
  onToggleTodayTask,
  onAddTodayTask,
  onDeleteTodayTask,
  onResetTodayTasks,
  onStartRoutine,
  onToggleTask,
  onCompletePhase,
  onResetSession,
  onFinishSession,
  onCancelSession,
  onUpdateNotes,
  onEditToday,
  onEditRoutines,
  onAddRoutine
}) {
  const [taskText, setTaskText] = useState("");
  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const activityByDate = useMemo(
    () => buildActivityByDate(history, todayTasksByDate),
    [history, todayTasksByDate]
  );
  const calendarCells = useMemo(() => buildMonthCells(new Date()), []);
  const selectedActivity = activityByDate[selectedDate] || { sessions: [], todayCompleted: 0 };

  function submitTask(event) {
    event.preventDefault();
    const trimmed = taskText.trim();
    if (!trimmed) return;
    onAddTodayTask(trimmed);
    setTaskText("");
  }

  return (
    <div className="screen-stack">
      <section className="panel today-panel">
        <div className="section-heading compact-heading">
          <h2>Today</h2>
          <button className="button ghost small" type="button" onClick={onEditToday}>
            Edit
          </button>
        </div>

        <form className="dashboard-todo-form" onSubmit={submitTask}>
          <input
            type="text"
            value={taskText}
            placeholder="Add a task for today"
            onChange={(event) => setTaskText(event.target.value)}
          />
          <button className="button primary" type="submit">
            Add
          </button>
        </form>

        {todayTasks.length ? (
          <div className="task-list today-task-list">
            {todayTasks.map((task) => (
              <label className={task.completed ? "task-row checked" : "task-row"} key={task.id}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTodayTask(task.id)}
                />
                <span className="task-copy">
                  <span className="task-title-line">
                    <strong>{task.text}</strong>
                  </span>
                </span>
                {task.source === "custom" ? (
                  <button
                    className="icon-button small danger-icon"
                    type="button"
                    aria-label={`Remove ${task.text}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onDeleteTodayTask(task.id);
                    }}
                  >
                    X
                  </button>
                ) : null}
              </label>
            ))}
          </div>
        ) : (
          <p className="muted compact-empty">No tasks yet.</p>
        )}

        {todayTasks.length ? (
          <button className="button text-button small" type="button" onClick={onResetTodayTasks}>
            Refresh from defaults
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

      <section className="panel dashboard-calendar-panel">
        <div className="section-heading compact-heading">
          <h2>Mini Calendar</h2>
          <span className="status-pill compact">{formatDate(new Date())}</span>
        </div>

        <div className="mini-calendar" aria-label="Current month activity calendar">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <span className="calendar-weekday" key={`${day}-${index}`}>
              {day}
            </span>
          ))}
          {calendarCells.map((cell) =>
            cell.empty ? (
              <span className="calendar-empty" key={cell.id} />
            ) : (
              <button
                className={[
                  "calendar-day",
                  cell.dateKey === todayKey ? "today" : "",
                  cell.dateKey === selectedDate ? "selected" : "",
                  activityByDate[cell.dateKey]?.sessions.length ||
                  activityByDate[cell.dateKey]?.todayCompleted
                    ? "has-activity"
                    : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={cell.id}
                type="button"
                onClick={() => setSelectedDate(cell.dateKey)}
              >
                <span>{cell.day}</span>
              </button>
            )
          )}
        </div>

        <div className="calendar-detail">
          <p className="eyebrow">{displayShortDate(selectedDate)}</p>
          {selectedActivity.sessions.length || selectedActivity.todayCompleted ? (
            <>
              <strong>
                {selectedActivity.sessions.length} session
                {selectedActivity.sessions.length === 1 ? "" : "s"} /{" "}
                {selectedActivity.todayCompleted} Today task
                {selectedActivity.todayCompleted === 1 ? "" : "s"}
              </strong>
              {selectedActivity.sessions.length ? (
                <ul className="system-list compact">
                  {selectedActivity.sessions.map((entry) => (
                    <li key={entry.id}>{entry.routineTitle}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p>No activity for this day.</p>
          )}
        </div>
      </section>
    </div>
  );
}
