import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatElapsedTime,
  getRoutineById,
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
  onAddRoutine,
  autoOpenCleanModeSessionId,
  onAutoOpenCleanModeHandled
}) {
  const sessionAnchorRef = useRef(null);
  const routinePickerCloseRef = useRef(null);
  const [taskText, setTaskText] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState("");
  const [reorderMode, setReorderMode] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [routinePicker, setRoutinePicker] = useState(closedRoutinePickerState);
  const [customTagText, setCustomTagText] = useState("");
  const [timerNow, setTimerNow] = useState(Date.now());
  const [cleanModeOpen, setCleanModeOpen] = useState(false);
  const [sessionMoreOpen, setSessionMoreOpen] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [todayCleaningOpen, setTodayCleaningOpen] = useState(false);
  const todayKey = currentDateKey || getTodayKey();

  const routinePickerDialogRef = useDialogFocus({
    open: routinePicker.open,
    onClose: closeRoutinePicker,
    initialFocusRef: routinePickerCloseRef
  });

  const incompleteTasks = useMemo(
    () => todayTasks.filter((task) => !task.completed),
    [todayTasks]
  );
  const completedTasks = useMemo(
    () => todayTasks.filter((task) => task.completed),
    [todayTasks]
  );
  const todayProgressPercent = todayTasks.length
    ? Math.round((completedTasks.length / todayTasks.length) * 100)
    : 0;
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
    setShowSessionDetails(false);
    setSessionMoreOpen(false);
  }, [activeSession?.id]);

  useEffect(() => {
    if (cleanModeOpen && !cleanModeAvailable) {
      setCleanModeOpen(false);
    }
  }, [cleanModeAvailable, cleanModeOpen]);

  useEffect(() => {
    if (!autoOpenCleanModeSessionId || !activeSession) return;
    if (activeSession.id !== autoOpenCleanModeSessionId) return;
    if (cleanModeAvailable) setCleanModeOpen(true);
    onAutoOpenCleanModeHandled?.();
  }, [
    activeSession,
    autoOpenCleanModeSessionId,
    cleanModeAvailable,
    onAutoOpenCleanModeHandled
  ]);

  useEffect(() => {
    function consumeStartTodayCleaningRequest() {
      if (typeof window === "undefined") return;
      if (!window.clean30StartTodayCleaningRequested) return;
      window.clean30StartTodayCleaningRequested = false;
      setTodayCleaningOpen(true);
    }

    consumeStartTodayCleaningRequest();
    window.addEventListener(
      "clean30:startTodayCleaning",
      consumeStartTodayCleaningRequest
    );
    return () => {
      window.removeEventListener(
        "clean30:startTodayCleaning",
        consumeStartTodayCleaningRequest
      );
    };
  }, []);

  useEffect(() => {
    setRoutinePicker((current) =>
      reconcileRoutinePickerState(current, routineOptions)
    );
  }, [routineOptions]);

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

  function scrollToSession() {
    setSessionMoreOpen(false);
    setShowSessionDetails(true);
    window.requestAnimationFrame(() => {
      sessionAnchorRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function continueRoutineCleaning() {
    if (activeSession?.paused) onResumeSession?.();
    setSessionMoreOpen(false);
    if (cleanModeAvailable) {
      setCleanModeOpen(true);
      return;
    }
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
            aria-controls={`today-task-details-${task.id}`}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} details for ${task.text}`}
            className="button text-button small"
            onClick={() => setExpandedTaskId(expanded ? "" : task.id)}
            type="button"
          >
            Details
          </button>
        </div>
        {expanded ? (
          <div className="today-task-details" id={`today-task-details-${task.id}`}>
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
                  aria-label={`New tag for ${task.text}`}
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
            <div className="today-task-detail-actions">
              <button
                className="button danger-ghost small"
                onClick={() => {
                  setExpandedTaskId("");
                  onDeleteTodayTask(task.id);
                }}
                type="button"
              >
                Remove task
              </button>
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
              <p className="eyebrow">Current clean</p>
              <h2>{activeRoutine.title}</h2>
              <p>
                {activeProgress.completed}/{activeProgress.total} tasks complete ·{" "}
                {formatElapsedTime(activeElapsed)} elapsed
              </p>
            </div>
            <span className="status-pill compact">
              {activeSession.paused ? "Paused" : "Cleaning"}
            </span>
          </div>
          <div
            aria-label={`${activeProgress.percent}% of current clean complete`}
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={activeProgress.percent}
            className="session-resume-progress"
            role="progressbar"
          >
            <span style={{ width: `${activeProgress.percent}%` }} />
          </div>
          <div className="card-actions compact-actions session-resume-actions">
            <button
              className="button primary small"
              onClick={continueRoutineCleaning}
              type="button"
            >
              {activeSession.paused ? "Resume cleaning" : "Continue cleaning"}
            </button>
            <button
              aria-controls="current-clean-more-actions"
              aria-expanded={sessionMoreOpen}
              className="button ghost small"
              onClick={() => setSessionMoreOpen((open) => !open)}
              type="button"
            >
              More
            </button>
          </div>
          {sessionMoreOpen ? (
            <div className="session-compact-menu" id="current-clean-more-actions">
              <button
                className="button ghost small"
                onClick={scrollToSession}
                type="button"
              >
                View full checklist
              </button>
              {activeSession.paused ? (
                <button
                  className="button ghost small"
                  onClick={onResumeSession}
                  type="button"
                >
                  Resume timer
                </button>
              ) : (
                <button
                  className="button ghost small"
                  onClick={onPauseSession}
                  type="button"
                >
                  Pause timer
                </button>
              )}
              <button
                className="button ghost small"
                onClick={onFinishSession}
                type="button"
              >
                {activeFinishLabel === "Finish" ? "Finish clean" : "Stop and save"}
              </button>
              <button
                className="button danger-ghost small"
                onClick={onCancelSession}
                type="button"
              >
                Discard session
              </button>
            </div>
          ) : null}
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

        {todayTasks.length ? (
          <div
            aria-label={`${todayProgressPercent}% of Today complete`}
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={todayProgressPercent}
            className="today-overall-progress"
            role="progressbar"
          >
            <span style={{ width: `${todayProgressPercent}%` }} />
          </div>
        ) : null}

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
                  : "Add a task below, then begin cleaning."}
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
            aria-controls="today-more-actions"
            aria-expanded={moreOpen}
            className={moreOpen ? "button edit-action" : "button ghost"}
            onClick={() => setMoreOpen((open) => !open)}
            type="button"
          >
            More
          </button>
        </div>

        {moreOpen ? (
          <div className="today-more-panel" aria-label="More Today actions" id="today-more-actions">
            <button className="button ghost" onClick={openRoutinePicker} type="button">
              Add tasks from routine
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
              Edit regular tasks
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
                Reset today
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
            <p>Add one task above or use More to add tasks from a routine.</p>
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

        <div className="today-weekly-activity-link">
          <button className="button text-button small" onClick={onViewHistory} type="button">
            View weekly activity in Progress
          </button>
        </div>

        {deletedTodayTask ? (
          <div className="undo-toast" role="status">
            <span>Task removed</span>
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

      {activeSession && showSessionDetails ? (
        <div className="session-details-wrapper" ref={sessionAnchorRef}>
          <div className="session-details-toolbar">
            <div>
              <p className="eyebrow">Current clean</p>
              <h3>Full checklist and notes</h3>
            </div>
            <button
              className="button ghost small"
              onClick={() => setShowSessionDetails(false)}
              type="button"
            >
              Hide details
            </button>
          </div>
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
                <h2 id="routine-import-title">Add tasks from routine</h2>
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
