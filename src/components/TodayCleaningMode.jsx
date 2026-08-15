import { useEffect, useMemo, useRef, useState } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";
import {
  getAdjacentTodayCleaningTaskId,
  getInitialTodayCleaningTaskId,
  getNextIncompleteTodayTaskId,
  getTodayCleaningProgress,
  orderTodayCleaningTasks
} from "../utils/todayCleaning.js";

function getTodayTaskSelectionKey(task) {
  const title = String(task?.text || "").trim().toLowerCase();
  const roomMatch = String(task?.note || "").match(/^Room:\s*(.+)$/i);
  const room = roomMatch?.[1]?.trim().toLowerCase() || "";
  return `${room}::${title}`;
}

export default function TodayCleaningMode({
  open,
  tasks = [],
  preferredTaskKeys = [],
  onToggleTask,
  onExit
}) {
  const primaryActionRef = useRef(null);
  const dialogRef = useDialogFocus({
    open,
    onClose: onExit,
    initialFocusRef: primaryActionRef
  });
  const preferredKeySet = useMemo(
    () => new Set((preferredTaskKeys || []).map((key) => String(key || "").trim()).filter(Boolean)),
    [preferredTaskKeys]
  );
  const scopedTasks = useMemo(
    () =>
      preferredKeySet.size
        ? tasks.filter((task) => preferredKeySet.has(getTodayTaskSelectionKey(task)))
        : tasks,
    [preferredKeySet, tasks]
  );
  const orderedTasks = useMemo(() => orderTodayCleaningTasks(scopedTasks), [scopedTasks]);
  const progress = useMemo(() => getTodayCleaningProgress(scopedTasks), [scopedTasks]);
  const [currentTaskId, setCurrentTaskId] = useState("");

  useEffect(() => {
    if (!open) return;
    setCurrentTaskId(getInitialTodayCleaningTaskId(scopedTasks));
  }, [open, preferredTaskKeys]);

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
            <p className="eyebrow">Cleaning mode</p>
            <h2 id="today-cleaning-title">Focused clean</h2>
          </div>
          <button
            aria-label="Exit focused cleaning mode"
            className="button ghost small"
            onClick={onExit}
            type="button"
          >
            Exit
          </button>
        </header>

        <div className="today-cleaning-progress">
          <div>
            <strong>
              {progress.completed}/{progress.total}
            </strong>
            <span>tasks complete</span>
          </div>
          <div
            aria-label={`${progress.percent}% of this clean complete`}
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
            <h3>No tasks in this clean</h3>
            <p>Choose some cleaning tasks before starting focused cleaning.</p>
            <button
              className="button primary"
              onClick={onExit}
              ref={primaryActionRef}
              type="button"
            >
              Back to Clean
            </button>
          </div>
        ) : allComplete ? (
          <div className="today-cleaning-complete" aria-live="polite">
            <span aria-hidden="true" className="today-cleaning-complete-mark">
              ✓
            </span>
            <h3>Clean complete</h3>
            <p>{progress.completed} tasks finished.</p>
            <button
              className="button primary"
              onClick={onExit}
              ref={primaryActionRef}
              type="button"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="today-cleaning-position" aria-live="polite">
              Task {currentIndex + 1} of {orderedTasks.length}
            </div>

            <article
              aria-atomic="true"
              aria-live="polite"
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
              ref={primaryActionRef}
              type="button"
            >
              {currentTask.completed ? "Mark not done" : "Mark done"}
            </button>

            <div className="today-cleaning-navigation" aria-label="Task navigation">
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
