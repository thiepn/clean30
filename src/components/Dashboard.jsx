import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatElapsedTime,
  formatRoutineDuration,
  getLastRoutineDoneLabel,
  getRoutineById,
  getRoutineTotalTasks,
  getSessionElapsedMs,
  getSessionProgress
} from "../utils/calculations.js";
import { formatDate, formatDateTime, getTodayKey } from "../utils/dates.js";
import useDialogFocus from "../hooks/useDialogFocus.js";
import {
  closedRoutinePickerState,
  openRoutinePickerState,
  reconcileRoutinePickerState,
  selectRoutinePickerSource,
  toggleRoutinePickerTask
} from "../utils/routinePickerState.js";
import CleanMode from "./CleanMode.jsx";
import StartSession from "./StartSession.jsx";
import TodayCleaningMode from "./TodayCleaningMode.jsx";

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function getRoutineTasks(routine) {
  return (
    routine?.phases?.flatMap((phase) =>
      phase.tasks.map((task) => ({
        ...task,
        phaseTitle: phase.title
      }))
    ) || []
  );
}

export default function Dashboard({
  template,
  history = [],
  todayTasks = [],
  currentDateKey,
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
  onPauseSession,
  onResumeSession,
  onUpdateNotes,
  onViewHistory,
  onClearCompletionSummary,
  onEditToday,
  onEditRoutines,
  onAddRoutine
}) {
  const sessionAnchorRef = useRef(null);
  const routinePickerCloseRef = useRef(null);
  const routineStartCloseRef = useRef(null);
  const [taskText, setTaskText] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState("");
  const [reorderMode, setReorderMode] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [routinePicker, setRoutinePicker] = useState(closedRoutinePickerState);
  const [routineStartOpen, setRoutineStartOpen] = useState(false);
  const [routineStartId, setRoutineStartId] = useState("");
  const [customTagText, setCustomTagText] = useState("");
  const [timerNow, setTimerNow] = useState(Date.now());
  const [cleanModeOpen, setCleanModeOpen] = useState(false);
  const [todayCleaningOpen, setTodayCleaningOpen] = useState(false);
  const todayKey = currentDateKey || getTodayKey();

  const routinePickerDialogRef = useDialogFocus({
    open: routinePicker.open,
    onClose: closeRoutinePicker,
    initialFocusRef: routinePickerCloseRef
  });
  const routineStartDialogRef = useDialogFocus({
    open: routineStartOpen,
    onClose: closeRoutineStart,
    initialFocusRef: routineStartCloseRef
  });

  const incompleteTasks = useMemo(
    () => todayTasks.filter((task) => !task.completed),
    [todayTasks]
  );
  const completedTasks = useMemo(
    () => todayTasks.filter((task) => task.completed),
    [todayTasks]
  );
  const routineOptions = useMemo(
    () =>
      template.routines.filter(
        (routine) => routine.id !== "daily-rules" && !routine.archived
      ),
    [template.routines]
  );
  const selectedRoutineForImport =
    routineOptions.find((routine) => routine.id === routinePicker.routineId) || null;
  const routineTaskOptions = useMemo(
    () => getRoutineTasks(selectedRoutineForImport),
    [selectedRoutineForImport]
  );
  const existingRoutineTaskKeys = useMemo(
    () =>
      new Set(
        todayTasks
          .filter(
            (task) => task.source === "routine" && task.routineId && task.originalTaskId
          )
          .map((task) => `${task.routineId}:${task.originalTaskId}`)
      ),
    [todayTasks]
  );
  const selectedRoutineForStart =
    routineOptions.find((routine) => routine.id === routineStartId) ||
    routineOptions[0] ||
    null;
  const activeRoutine = useMemo(
    () =>
      activeSession
        ? activeSession.routineSnapshot ||
          getRoutineById(template.routines, activeSession.routineId) || {
            id: activeSession.routineId,
            title: "Routine",
            estimatedTime: "",
            estimatedMinutes: 30,
            phases: []
          }
        : null,
    [activeSession, template.routines]
  );
  const cleanModeAvailable = Boolean(
    activeSession && activeSession.routineId !== "daily-rules"
  );
  const activeProgress = activeSession
    ? getSessionProgress(activeSession, activeRoutine)
    : null;
  const activeElapsed = activeSession
    ? getSessionElapsedMs(activeSession, new Date(timerNow))
    : 0;
  const activeFinishLabel =
    activeProgress &&
    activeProgress.total > 0 &&
    activeProgress.completed === activeProgress.total
      ? "Finish"
      : "Finish partial";

  useEffect(() => {
    if (!activeSession || activeSession.paused) return;
    setTimerNow(Date.now());
    const intervalId = window.setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeSession?.id, activeSession?.paused]);

  useEffect(() => {
    if (cleanModeOpen && !cleanModeAvailable) {
      setCleanModeOpen(false);
    }
  }, [cleanModeAvailable, cleanModeOpen]);

  useEffect(() => {
    setRoutinePicker((current) =>
      reconcileRoutinePickerState(current, routineOptions)
    );
  }, [routineOptions]);

  useEffect(() => {
    if (
      routineStartId &&
      routineOptions.some((routine) => routine.id === routineStartId)
    ) {
      return;
    }
    setRoutineStartId(
      routineOptions.find((routine) => routine.id === selectedRoutineId)?.id ||
        routineOptions[0]?.id ||
        ""
    );
  }, [routineOptions, routineStartId, selectedRoutineId]);

  function submitTask(event) {
    event.preventDefault();
    const trimmed = taskText.trim();
    if (!trimmed) return;
    onAddTodayTask(trimmed);
    setTaskText("");
  }

  function toggleRoutineTask(taskId) {
    setRoutinePicker((current) => toggleRoutinePickerTask(current, taskId));
  }

  function addSelectedRoutineTasks() {
    if (!selectedRoutineForImport || !routinePicker.selectedTaskIds.length) return;
    onAddRoutineTasksToToday(
      selectedRoutineForImport.id,
      routinePicker.selectedTaskIds
    );
    closeRoutinePicker();
  }

  function addTagToTask(task, tag) {
    const cleaned = tag.trim();
    if (
      !cleaned ||
      task.tags?.some((item) => item.toLowerCase() === cleaned.toLowerCase())
    ) {
      return;
    }
    onAddTaskTag(cleaned);
    onUpdateTodayTaskDetails(task.id, {
      tags: [...(task.tags || []), cleaned]
    });
  }

  function removeTagFromTask(task, tag) {
    onUpdateTodayTaskDetails(task.id, {
      tags: (task.tags || []).filter((item) => item !== tag)
    });
  }

  function openRoutinePicker() {
    setMoreOpen(false);
    setRoutinePicker(openRoutinePickerState(routineOptions));
  }

  function closeRoutinePicker() {
    setRoutinePicker(closedRoutinePickerState());
  }

  function openRoutineStart() {
    const initialId =
      routineOptions.find((routine) => routine.id === selectedRoutineId)?.id ||
      routineOptions[0]?.id ||
      "";
    setRoutineStartId(initialId);
    setMoreOpen(false);
    setRoutineStartOpen(true);
  }

  function closeRoutineStart() {
    setRoutineStartOpen(false);
  }

  function startSelectedRoutine() {
    if (!selectedRoutineForStart) return;
    onSelectRoutine?.(selectedRoutineForStart.id);
    closeRoutineStart();
    onStartRoutine(selectedRoutineForStart.id);
  }

  function scrollToSession() {
    sessionAnchorRef.current?.scrollIntoView?.({
      behavior: "smooth",
      block: "start"
    });
  }

  function resumeAndScroll() {
    if (activeSession?.paused) onResumeSession?.();
    scrollToSession();
  }

  function openCleanMode() {
    if (cleanModeAvailable) setCleanModeOpen(true);
  }

  function finishFromCleanMode() {
    setCleanModeOpen(false);
    onFinishSession();
  }

  function renderTaskRow(task, groupTasks) {
    const groupIndex = groupTasks.findIndex((item) => item.id === task.id);
    const expanded = expandedTaskId === task.id;
    const tags = task.tags || [];
    const firstTag = tags[0] || "";

    return (
      <div
        className={
          task.completed
            ? "task-row today-task-row checked"
            : "task-row today-task-row"
        }
        key={task.id}
      >
        <label className="today-check-control" htmlFor={`today-task-${task.id}`}>
          <input
            checked={task.completed}
            id={`today-task-${task.id}`}
            onChange={() => onToggleTodayTask(task.id)}
            type="checkbox"
          />
          <span className="sr-only">
            {task.completed ? "Mark incomplete: " : "Mark complete: "}
            {task.text}
          </span>
        </label>
        <span className="task-copy">
          <span className="task-title-line">
            <strong>{task.text}</strong>
            <span className="task-inline-meta">
              {task.note?.trim() ? <span className="mini-chip">Note</span> : null}
              {firstTag ? <span className="mini-chip">{firstTag}</span> : null}
              {tags.length > 1 ? (
                <span className="mini-chip">+{tags.length - 1}</span>
              ) : null}
            </span>
          </span>
        </span>
        <div className="today-row-actions">
          {reorderMode ? (
            <>
              <button
                aria-label={`Move ${task.text} up`}
                className="icon-button small"
                disabled={groupIndex === 0}
                onClick={() => onMoveTodayTask(task.id, -1)}
                type="button"
              >
                ↑
              </button>
              <button
                aria-label={`Move ${task.text} down`}
                className="icon-button small"
                disabled={groupIndex === groupTasks.length - 1}
                onClick={() => onMoveTodayTask(task.id, 1)}
                type="button"
              >
                ↓
              </button>
            </>
          ) : null}
          <button
            aria-label={`${expanded ? "Hide" : "Show"} details for ${task.text}`}
            className="button text-button small"
            onClick={() => setExpandedTaskId(expanded ? "" : task.id)}
            type="button"
          >
            More
          </button>
          <button
            aria-label={`Remove ${task.text}`}
            className="icon-button small danger-icon"
            onClick={() => onDeleteTodayTask(task.id)}
            type="button"
          >
            ×
          </button>
        </div>
        {expanded ? (
          <div className="today-task-details">
            {task.source === "routine" && task.routineName ? (
              <p className="muted compact-source">From {task.routineName}</p>
            ) : null}
            <label className="field-label" htmlFor={`today-note-${task.id}`}>
              Note
              <textarea
                className="textarea-small"
                id={`today-note-${task.id}`}
                onChange={(event) =>
                  onUpdateTodayTaskDetails(task.id, {
                    note: event.target.value
                  })
                }
                placeholder="Optional note"
                value={task.note || ""}
              />
            </label>
            <div className="tag-editor">
              <span className="field-label">Tags</span>
              <div className="tag-chip-row">
                {tags.map((tag) => (
                  <button
                    className="tag-chip removable"
                    key={tag}
                    onClick={() => removeTagFromTask(task, tag)}
                    type="button"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <div className="tag-suggestion-row">
                {taskTags
                  .filter(
                    (tag) =>
                      !tags.some(
                        (current) => current.toLowerCase() === tag.toLowerCase()
                      )
                  )
                  .map((tag) => (
                    <button
                      className="button ghost small"
                      key={tag}
                      onClick={() => addTagToTask(task, tag)}
                      type="button"
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
                  onChange={(event) => setCustomTagText(event.target.value)}
                  placeholder="Custom tag"
                  type="text"
                  value={customTagText}
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
  }

  return (
    <div className="screen-stack today-screen">
      {activeSession && activeRoutine ? (
        <section className="panel session-resume-panel">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Unfinished routine</p>
              <h2>{activeRoutine.title}</h2>
              <p>
                {activeProgress.completed}/{activeProgress.total} tasks complete. Elapsed{" "}
                {formatElapsedTime(activeElapsed)}.
              </p>
            </div>
            <span className="status-pill compact">
              {activeSession.paused ? "Paused" : "Active"}
            </span>
          </div>
          <div className="card-actions compact-actions session-resume-actions">
            <button
              className="button primary small"
              onClick={resumeAndScroll}
              type="button"
            >
              {activeSession.paused ? "Resume" : "Continue"}
            </button>
            {cleanModeAvailable ? (
              <button
                className="button edit-action small"
                onClick={openCleanMode}
                type="button"
              >
                Clean Mode
              </button>
            ) : null}
            <button
              className="button ghost small"
              onClick={onFinishSession}
              type="button"
            >
              {activeFinishLabel}
            </button>
            <button
              className="button danger-ghost small"
              onClick={onCancelSession}
              type="button"
            >
              Discard
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel today-panel today-primary-panel">
        <div className="today-title-row">
          <div>
            <p className="eyebrow">{formatDate(dateFromKey(todayKey))}</p>
            <h2>Today</h2>
          </div>
          <span className="today-count-summary">
            {incompleteTasks.length} left · {completedTasks.length} done
          </span>
        </div>

        <div className="today-focus-card">
          <div>
            <strong>
              {incompleteTasks.length
                ? `${incompleteTasks.length} task${
                    incompleteTasks.length === 1 ? "" : "s"
                  } ready`
                : todayTasks.length
                  ? "Everything is done"
                  : "Start with one small task"}
            </strong>
            <p>
              {incompleteTasks.length
                ? "Work through today’s list one task at a time."
                : todayTasks.length
                  ? "You can review completed tasks or add something new."
                  : "Add a task below, then begin focused cleaning."}
            </p>
          </div>
          <button
            className="button primary today-start-cleaning"
            disabled={!incompleteTasks.length}
            onClick={() => setTodayCleaningOpen(true)}
            type="button"
          >
            {incompleteTasks.length ? "Start cleaning" : "All done for today"}
          </button>
        </div>

        <div className="today-add-toolbar">
          <form className="dashboard-todo-form" onSubmit={submitTask}>
            <input
              aria-label="New Today task"
              onChange={(event) => setTaskText(event.target.value)}
              placeholder="Add a task for today"
              type="text"
              value={taskText}
            />
            <button className="button primary" type="submit">
              Add
            </button>
          </form>
          <button
            aria-expanded={moreOpen}
            className={moreOpen ? "button edit-action" : "button ghost"}
            onClick={() => setMoreOpen((open) => !open)}
            type="button"
          >
            More
          </button>
        </div>

        {moreOpen ? (
          <div className="today-more-panel" aria-label="More Today actions">
            <button className="button ghost" onClick={openRoutinePicker} type="button">
              Add from routine
            </button>
            <button
              className="button ghost"
              disabled={!routineOptions.length}
              onClick={openRoutineStart}
              type="button"
            >
              Start a routine
            </button>
            {todayTasks.length ? (
              <button
                className={reorderMode ? "button edit-action" : "button ghost"}
                onClick={() => setReorderMode((enabled) => !enabled)}
                type="button"
              >
                {reorderMode ? "Done reordering" : "Reorder tasks"}
              </button>
            ) : null}
            <button
              className="button ghost"
              onClick={() => {
                setMoreOpen(false);
                onEditToday();
              }}
              type="button"
            >
              Edit Today defaults
            </button>
            {todayTasks.length ? (
              <button
                className="button danger-ghost"
                onClick={() => {
                  setMoreOpen(false);
                  onResetTodayTasks();
                }}
                type="button"
              >
                Reset today&apos;s list
              </button>
            ) : null}
          </div>
        ) : null}

        {reorderMode ? (
          <div className="today-reorder-notice" role="status">
            Reorder mode is on. Tasks move within their To do or Completed group.
          </div>
        ) : null}

        {incompleteTasks.length ? (
          <section className="today-task-group" aria-labelledby="today-todo-heading">
            <div className="today-group-heading">
              <h3 id="today-todo-heading">To do</h3>
              <span>{incompleteTasks.length}</span>
            </div>
            <div className="task-list today-task-list">
              {incompleteTasks.map((task) => renderTaskRow(task, incompleteTasks))}
            </div>
          </section>
        ) : todayTasks.length ? (
          <div className="today-all-done-message">
            <strong>Today&apos;s list is complete.</strong>
            <p>Completed tasks are grouped below.</p>
          </div>
        ) : (
          <div className="today-empty-state">
            <h3>No tasks yet</h3>
            <p>Add one task above or use More to pull tasks from a routine.</p>
          </div>
        )}

        {completedTasks.length ? (
          <section className="today-completed-group">
            <button
              aria-controls="today-completed-list"
              aria-expanded={completedOpen}
              className="today-completed-toggle"
              onClick={() => setCompletedOpen((open) => !open)}
              type="button"
            >
              <span>
                <strong>Completed</strong>
                <small>{completedTasks.length} finished today</small>
              </span>
              <span aria-hidden="true">{completedOpen ? "−" : "+"}</span>
            </button>
            {completedOpen ? (
              <div
                className="task-list today-task-list today-completed-list"
                id="today-completed-list"
              >
                {completedTasks.map((task) =>
                  renderTaskRow(task, completedTasks)
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {deletedTodayTask ? (
          <div className="undo-toast" role="status">
            <span>Task deleted</span>
            <button
              className="button ghost small"
              onClick={onUndoDeleteTodayTask}
              type="button"
            >
              Undo
            </button>
          </div>
        ) : null}
      </section>

      {!activeSession && completionSummary ? (
        <section className="panel completion-panel completion-summary-panel">
          <div>
            <p className="eyebrow">Saved to Progress</p>
            <h2>{completionSummary.routineTitle}</h2>
            <p>
              {completionSummary.completedTasks}/{completionSummary.totalTasks} tasks complete,{" "}
              {completionSummary.percent}% total.
            </p>
          </div>
          <div className="completion-summary-meta">
            <span>Finished {formatDateTime(completionSummary.finishedAt)}</span>
            {Number.isFinite(Number(completionSummary.elapsedMs)) ? (
              <span>
                Elapsed {formatElapsedTime(Number(completionSummary.elapsedMs))}
              </span>
            ) : Number.isFinite(
                Number(completionSummary.estimatedDurationMinutes)
              ) ? (
              <span>
                Estimated{" "}
                {formatElapsedTime(
                  Number(completionSummary.estimatedDurationMinutes) * 60000
                )}
              </span>
            ) : null}
          </div>
          <div className="card-actions compact-actions">
            <button
              className="button primary small"
              onClick={onViewHistory}
              type="button"
            >
              View Progress
            </button>
            <button
              className="button ghost small"
              onClick={onClearCompletionSummary}
              type="button"
            >
              Close
            </button>
          </div>
        </section>
      ) : null}

      {activeSession ? (
        <div ref={sessionAnchorRef}>
          <StartSession
            activeSession={activeSession}
            completionSummary={completionSummary}
            elapsedMs={activeElapsed}
            history={history}
            onAddRoutine={onAddRoutine}
            onCancelSession={onCancelSession}
            onClearCompletionSummary={onClearCompletionSummary}
            onCompletePhase={onCompletePhase}
            onEditRoutines={onEditRoutines}
            onFinishSession={onFinishSession}
            onOpenCleanMode={cleanModeAvailable ? openCleanMode : null}
            onPauseSession={onPauseSession}
            onResetSession={onResetSession}
            onResumeSession={onResumeSession}
            onSelectRoutine={onSelectRoutine}
            onStartSession={onStartRoutine}
            onToggleTask={onToggleTask}
            onUpdateNotes={onUpdateNotes}
            onViewHistory={onViewHistory}
            routines={template.routines}
            selectedRoutineId={selectedRoutineId}
          />
        </div>
      ) : null}

      {routinePicker.open ? (
        <div
          className="dialog-backdrop compact-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRoutinePicker();
          }}
          role="presentation"
        >
          <section
            aria-labelledby="routine-import-title"
            aria-modal="true"
            className="dialog routine-import-dialog"
            ref={routinePickerDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Today</p>
                <h2 id="routine-import-title">Add from routine</h2>
              </div>
              <button
                aria-label="Close routine picker"
                className="icon-button"
                onClick={closeRoutinePicker}
                ref={routinePickerCloseRef}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="routine-import-topline">
              <label className="field-label" htmlFor="routine-import-select">
                Routine
                <select
                  disabled={!routineOptions.length}
                  id="routine-import-select"
                  onChange={(event) => {
                    setRoutinePicker((current) =>
                      selectRoutinePickerSource(current, event.target.value)
                    );
                  }}
                  value={selectedRoutineForImport?.id || ""}
                >
                  {routineOptions.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="routine-import-list">
              {!routineOptions.length ? (
                <p className="muted compact-empty">
                  No active routines are available.
                </p>
              ) : !routineTaskOptions.length ? (
                <p className="muted compact-empty">
                  This routine has no tasks available to add.
                </p>
              ) : (
                routineTaskOptions.map((task) => {
                  const alreadyAdded = existingRoutineTaskKeys.has(
                    `${selectedRoutineForImport.id}:${task.id}`
                  );
                  return (
                    <label
                      className={
                        alreadyAdded
                          ? "routine-import-row disabled"
                          : "routine-import-row"
                      }
                      key={task.id}
                    >
                      <input
                        checked={routinePicker.selectedTaskIds.includes(task.id)}
                        disabled={alreadyAdded}
                        onChange={() => toggleRoutineTask(task.id)}
                        type="checkbox"
                      />
                      <span>
                        <strong>{task.title}</strong>
                        <small>
                          {alreadyAdded ? "Already in Today" : task.phaseTitle}
                        </small>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="card-actions compact-actions">
              <button
                className="button primary small"
                disabled={!routinePicker.selectedTaskIds.length}
                onClick={addSelectedRoutineTasks}
                type="button"
              >
                Add selected
              </button>
              <button
                className="button ghost small"
                onClick={closeRoutinePicker}
                type="button"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {routineStartOpen ? (
        <div
          className="dialog-backdrop compact-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRoutineStart();
          }}
          role="presentation"
        >
          <section
            aria-labelledby="routine-start-title"
            aria-modal="true"
            className="dialog today-routine-start-dialog"
            ref={routineStartDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Routine</p>
                <h2 id="routine-start-title">Start a routine</h2>
              </div>
              <button
                aria-label="Close routine start dialog"
                className="icon-button"
                onClick={closeRoutineStart}
                ref={routineStartCloseRef}
                type="button"
              >
                ×
              </button>
            </div>

            {routineOptions.length ? (
              <>
                <div className="today-routine-choice-list" role="list">
                  {routineOptions.map((routine) => (
                    <button
                      className={
                        selectedRoutineForStart?.id === routine.id
                          ? "today-routine-choice active"
                          : "today-routine-choice"
                      }
                      key={routine.id}
                      onClick={() => {
                        setRoutineStartId(routine.id);
                        onSelectRoutine?.(routine.id);
                      }}
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className={`routine-color-dot color-${
                          routine.colorLabel || "none"
                        }`}
                      />
                      <span>
                        <strong>{routine.title}</strong>
                        <small>
                          {formatRoutineDuration(routine)} ·{" "}
                          {getRoutineTotalTasks(routine)} tasks
                        </small>
                        <small>{getLastRoutineDoneLabel(history, routine.id)}</small>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="card-actions today-routine-start-actions">
                  <button
                    className="button primary"
                    onClick={startSelectedRoutine}
                    type="button"
                  >
                    Start {selectedRoutineForStart?.title || "routine"}
                  </button>
                  <button
                    className="button ghost"
                    onClick={() => {
                      closeRoutineStart();
                      onEditRoutines();
                    }}
                    type="button"
                  >
                    Manage routines
                  </button>
                  <button
                    className="button ghost"
                    onClick={() => {
                      closeRoutineStart();
                      onAddRoutine();
                    }}
                    type="button"
                  >
                    Add routine
                  </button>
                </div>
              </>
            ) : (
              <div className="today-empty-state">
                <h3>No active routines</h3>
                <p>Add a routine before starting a reusable cleaning session.</p>
                <button
                  className="button primary"
                  onClick={() => {
                    closeRoutineStart();
                    onAddRoutine();
                  }}
                  type="button"
                >
                  Add routine
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}

      <TodayCleaningMode
        onExit={() => setTodayCleaningOpen(false)}
        onToggleTask={onToggleTodayTask}
        open={todayCleaningOpen}
        tasks={todayTasks}
      />

      <CleanMode
        activeSession={activeSession}
        elapsedMs={activeElapsed}
        onExit={() => setCleanModeOpen(false)}
        onFinishSession={finishFromCleanMode}
        onPauseSession={onPauseSession}
        onResumeSession={onResumeSession}
        onToggleTask={onToggleTask}
        open={cleanModeOpen && cleanModeAvailable}
        routine={activeRoutine}
      />
    </div>
  );
}
