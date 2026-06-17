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

function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getRoutineTasks(routine) {
  return routine?.phases?.flatMap((phase) =>
    phase.tasks.map((task) => ({
      ...task,
      phaseTitle: phase.title
    }))
  ) || [];
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
  onUndoDeleteTodayTask,
  deletedTodayTask,
  onMoveTodayTask,
  onUpdateTodayTaskDetails,
  taskTags = [],
  onAddTaskTag,
  onAddRoutineTasksToToday,
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
  const [expandedTaskId, setExpandedTaskId] = useState("");
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false);
  const [routineSourceId, setRoutineSourceId] = useState("");
  const [selectedRoutineTaskIds, setSelectedRoutineTaskIds] = useState([]);
  const [customTagText, setCustomTagText] = useState("");
  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const displayTasks = useMemo(
    () => [...todayTasks].sort((first, second) => Number(first.completed) - Number(second.completed)),
    [todayTasks]
  );
  const routineOptions = useMemo(
    () => template.routines.filter((routine) => routine.id !== "daily-rules"),
    [template.routines]
  );
  const selectedRoutineForImport =
    routineOptions.find((routine) => routine.id === routineSourceId) || routineOptions[0] || null;
  const routineTaskOptions = useMemo(
    () => getRoutineTasks(selectedRoutineForImport),
    [selectedRoutineForImport]
  );
  const existingRoutineTaskKeys = useMemo(
    () =>
      new Set(
        todayTasks
          .filter((task) => task.source === "routine" && task.routineId && task.originalTaskId)
          .map((task) => `${task.routineId}:${task.originalTaskId}`)
      ),
    [todayTasks]
  );
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

  function toggleRoutineTask(taskId) {
    setSelectedRoutineTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
    );
  }

  function addSelectedRoutineTasks() {
    if (!selectedRoutineForImport || !selectedRoutineTaskIds.length) return;
    onAddRoutineTasksToToday(selectedRoutineForImport.id, selectedRoutineTaskIds);
    setSelectedRoutineTaskIds([]);
    setRoutinePickerOpen(false);
  }

  function addTagToTask(task, tag) {
    const cleaned = tag.trim();
    if (!cleaned || task.tags?.some((item) => item.toLowerCase() === cleaned.toLowerCase())) return;
    onAddTaskTag(cleaned);
    onUpdateTodayTaskDetails(task.id, { tags: [...(task.tags || []), cleaned] });
  }

  function removeTagFromTask(task, tag) {
    onUpdateTodayTaskDetails(task.id, {
      tags: (task.tags || []).filter((item) => item !== tag)
    });
  }

  return (
    <div className="screen-stack">
      <section className="panel today-panel">
        <div className="section-heading compact-heading">
          <h2>Today</h2>
          <div className="card-actions compact-actions">
            <button
              className="button edit-action small"
              type="button"
              onClick={() => {
                setRoutinePickerOpen((open) => !open);
                if (!routineSourceId && routineOptions[0]) setRoutineSourceId(routineOptions[0].id);
              }}
            >
              Add from routine
            </button>
            <button className="button edit-action small" type="button" onClick={onEditToday}>
              Edit
            </button>
          </div>
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

        {routinePickerOpen ? (
          <div className="routine-import-panel">
            <div className="routine-import-topline">
              <label className="field-label" htmlFor="routine-import-select">
                Routine
                <select
                  id="routine-import-select"
                  value={selectedRoutineForImport?.id || ""}
                  onChange={(event) => {
                    setRoutineSourceId(event.target.value);
                    setSelectedRoutineTaskIds([]);
                  }}
                >
                  {routineOptions.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.title}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button ghost small" type="button" onClick={() => setRoutinePickerOpen(false)}>
                Close
              </button>
            </div>
            <div className="routine-import-list">
              {routineTaskOptions.map((task) => {
                const alreadyAdded = existingRoutineTaskKeys.has(
                  `${selectedRoutineForImport.id}:${task.id}`
                );
                return (
                  <label className={alreadyAdded ? "routine-import-row disabled" : "routine-import-row"} key={task.id}>
                    <input
                      type="checkbox"
                      checked={selectedRoutineTaskIds.includes(task.id)}
                      disabled={alreadyAdded}
                      onChange={() => toggleRoutineTask(task.id)}
                    />
                    <span>
                      <strong>{task.title}</strong>
                      <small>{alreadyAdded ? "Already in Today" : task.phaseTitle}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="card-actions compact-actions">
              <button
                className="button primary small"
                type="button"
                disabled={!selectedRoutineTaskIds.length}
                onClick={addSelectedRoutineTasks}
              >
                Add selected
              </button>
            </div>
          </div>
        ) : null}

        {todayTasks.length ? (
          <div className="task-list today-task-list">
            {displayTasks.map((task) => {
              const sameGroup = displayTasks.filter(
                (item) => Boolean(item.completed) === Boolean(task.completed)
              );
              const groupIndex = sameGroup.findIndex((item) => item.id === task.id);
              const expanded = expandedTaskId === task.id;

              return (
                <div className={task.completed ? "task-row today-task-row checked" : "task-row today-task-row"} key={task.id}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTodayTask(task.id)}
                  />
                  <span className="task-copy">
                    <span className="task-title-line">
                      <strong>{task.text}</strong>
                    </span>
                    {task.source === "routine" && task.routineName ? (
                      <span className="task-detail compact-source">{task.routineName}</span>
                    ) : null}
                  </span>
                  <div className="today-row-actions">
                    <button
                      className="icon-button small"
                      type="button"
                      aria-label={`Move ${task.text} up`}
                      disabled={groupIndex === 0}
                      onClick={() => onMoveTodayTask(task.id, -1)}
                    >
                      ^
                    </button>
                    <button
                      className="icon-button small"
                      type="button"
                      aria-label={`Move ${task.text} down`}
                      disabled={groupIndex === sameGroup.length - 1}
                      onClick={() => onMoveTodayTask(task.id, 1)}
                    >
                      v
                    </button>
                    <button
                      className="button text-button small"
                      type="button"
                      onClick={() => setExpandedTaskId(expanded ? "" : task.id)}
                    >
                      Details
                    </button>
                    <button
                      className="icon-button small danger-icon"
                      type="button"
                      aria-label={`Remove ${task.text}`}
                      onClick={() => onDeleteTodayTask(task.id)}
                    >
                      X
                    </button>
                  </div>
                  {expanded ? (
                    <div className="today-task-details">
                      <label className="field-label" htmlFor={`today-note-${task.id}`}>
                        Note
                        <textarea
                          id={`today-note-${task.id}`}
                          className="textarea-small"
                          value={task.note || ""}
                          placeholder="Optional note"
                          onChange={(event) =>
                            onUpdateTodayTaskDetails(task.id, { note: event.target.value })
                          }
                        />
                      </label>
                      <div className="tag-editor">
                        <span className="field-label">Tags</span>
                        <div className="tag-chip-row">
                          {(task.tags || []).map((tag) => (
                            <button
                              className="tag-chip removable"
                              key={tag}
                              type="button"
                              onClick={() => removeTagFromTask(task, tag)}
                            >
                              {tag} X
                            </button>
                          ))}
                        </div>
                        <div className="tag-suggestion-row">
                          {taskTags
                            .filter(
                              (tag) =>
                                !(task.tags || []).some(
                                  (current) => current.toLowerCase() === tag.toLowerCase()
                                )
                            )
                            .map((tag) => (
                              <button
                                className="button ghost small"
                                key={tag}
                                type="button"
                                onClick={() => addTagToTask(task, tag)}
                              >
                                {tag}
                              </button>
                            ))}
                        </div>
                        <form
                          className="custom-tag-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            addTagToTask(task, customTagText);
                            setCustomTagText("");
                          }}
                        >
                          <input
                            type="text"
                            value={customTagText}
                            placeholder="Custom tag"
                            onChange={(event) => setCustomTagText(event.target.value)}
                          />
                          <button className="button ghost small" type="submit">
                            Add tag
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted compact-empty">No tasks yet.</p>
        )}

        {deletedTodayTask ? (
          <div className="undo-toast" role="status">
            <span>Task deleted</span>
            <button className="button ghost small" type="button" onClick={onUndoDeleteTodayTask}>
              Undo
            </button>
          </div>
        ) : null}

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
                {countLabel(selectedActivity.sessions.length, "routine")} /{" "}
                {countLabel(selectedActivity.todayCompleted, "Today task")}
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
            <p>No activity.</p>
          )}
        </div>
      </section>
    </div>
  );
}
