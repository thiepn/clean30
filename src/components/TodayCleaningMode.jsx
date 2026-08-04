import { useEffect, useMemo, useRef, useState } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";
import {
  getAdjacentTodayCleaningTaskId,
  getInitialTodayCleaningTaskId,
  getNextIncompleteTodayTaskId,
  getTodayCleaningProgress,
  orderTodayCleaningTasks
} from "../utils/todayCleaning.js";

export default function TodayCleaningMode({ open, tasks = [], onToggleTask, onExit }) {
  const closeButtonRef = useRef(null);
  const dialogRef = useDialogFocus({
    open,
    onClose: onExit,
    initialFocusRef: closeButtonRef
  });
  const orderedTasks = useMemo(() => orderTodayCleaningTasks(tasks), [tasks]);
  const progress = useMemo(() => getTodayCleaningProgress(tasks), [tasks]);
  const [currentTaskId, setCurrentTaskId] = useState("");

  useEffect(() => {
    if (!open) return;
    setCurrentTaskId(getInitialTodayCleaningTaskId(tasks));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!orderedTasks.length) {
      setCurrentTaskId("");
      return;
    }
    if (!orderedTasks.some((task) => task.id === currentTaskId)) {
      setCurrentTaskId(getInitialTodayCleaningTaskId(orderedTasks));
    }
  }, [currentTaskId, open, orderedTasks]);

  if (!open) return null;

  const currentTask =
    orderedTasks.find((task) => task.id === currentTaskId) || orderedTasks[0] || null;
  const currentIndex = currentTask
    ? orderedTasks.findIndex((task) => task.id === currentTask.id)
    : -1;
  const allComplete = progress.total > 0 && progress.completed === progress.total;

  function move(direction) {
    if (!currentTask) return;
    setCurrentTaskId(
      getAdjacentTodayCleaningTaskId(orderedTasks, currentTask.id, direction)
    );
  }

  function toggleCurrentTask() {
    if (!currentTask) return;
    const nextIncompleteId = currentTask.completed
      ? ""
      : getNextIncompleteTodayTaskId(orderedTasks, currentTask.id);
    onToggleTask(currentTask.id);
    if (nextIncompleteId) setCurrentTaskId(nextIncompleteId);
  }

  return (
    <div className="today-cleaning-backdrop" role="presentation">
      <section
        aria-labelledby="today-cleaning-title"
        aria-modal="true"
        className="today-cleaning-mode"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="today-cleaning-header">
          <div>
            <p className="eyebrow">Focus mode</p>
            <h2 id="today-cleaning-title">Today&apos;s cleaning</h2>
          </div>
          <button
            aria-label="Exit Today cleaning mode"
            className="button ghost small"
            onClick={onExit}
            ref={closeButtonRef}
            type="button"
          >
            Exit
          </button>
        </header>

        <div className="today-cleaning-progress" aria-live="polite">
          <div>
            <strong>
              {progress.completed}/{progress.total}
            </strong>
            <span>tasks complete</span>
          </div>
          <div
            aria-label={`${progress.percent}% complete`}
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={progress.percent}
            className="today-cleaning-progress-track"
            role="progressbar"
          >
            <span style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        {!currentTask ? (
          <div className="today-cleaning-empty">
            <h3>No tasks for today</h3>
            <p>Add a task to Today before starting focused cleaning.</p>
            <button className="button primary" onClick={onExit} type="button">
              Back to Today
            </button>
          </div>
        ) : allComplete ? (
          <div className="today-cleaning-complete">
            <span aria-hidden="true" className="today-cleaning-complete-mark">
              ✓
            </span>
            <h3>Today&apos;s list is complete</h3>
            <p>Every task currently on the list is marked done.</p>
            <div className="today-cleaning-complete-actions">
              <button className="button primary" onClick={onExit} type="button">
                Finish
              </button>
              <button
                className="button ghost"
                onClick={() => setCurrentTaskId(orderedTasks[0]?.id || "")}
                type="button"
              >
                Review tasks
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="today-cleaning-position">
              Task {currentIndex + 1} of {orderedTasks.length}
            </div>

            <article
              className={
                currentTask.completed
                  ? "today-cleaning-task-card completed"
                  : "today-cleaning-task-card"
              }
            >
              <span className="today-cleaning-task-state">
                {currentTask.completed ? "Completed" : "Current task"}
              </span>
              <h3>{currentTask.text}</h3>
              {currentTask.note?.trim() ? <p>{currentTask.note}</p> : null}
              {currentTask.tags?.length ? (
                <div className="today-cleaning-tags" aria-label="Task tags">
                  {currentTask.tags.map((tag) => (
                    <span className="mini-chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {currentTask.source === "routine" && currentTask.routineName ? (
                <small>From {currentTask.routineName}</small>
              ) : null}
            </article>

            <button
              className="button primary today-cleaning-main-action"
              onClick={toggleCurrentTask}
              type="button"
            >
              {currentTask.completed ? "Mark not done" : "Mark done"}
            </button>

            <div className="today-cleaning-navigation">
              <button
                className="button ghost"
                disabled={orderedTasks.length < 2}
                onClick={() => move(-1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="button ghost"
                disabled={orderedTasks.length < 2}
                onClick={() => move(1)}
                type="button"
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
