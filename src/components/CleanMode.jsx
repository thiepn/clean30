import { useEffect, useMemo, useRef, useState } from "react";
import { formatElapsedTime, getSessionProgress } from "../utils/calculations.js";
import useDialogFocus from "../hooks/useDialogFocus.js";

function flattenRoutineTasks(routine) {
  return (routine?.phases || []).flatMap((phase) =>
    (phase.tasks || []).map((task) => ({
      ...task,
      phaseId: phase.id,
      phaseTitle: phase.title || "Routine"
    }))
  );
}

function preferredTaskIndex(tasks, completedIds) {
  const firstIncomplete = tasks.findIndex((task) => !completedIds.has(task.id));
  if (firstIncomplete >= 0) return firstIncomplete;
  return tasks.length ? tasks.length - 1 : 0;
}

export default function CleanMode({
  open,
  activeSession,
  routine,
  elapsedMs,
  onToggleTask,
  onPauseSession,
  onResumeSession,
  onFinishSession,
  onExit
}) {
  const primaryActionRef = useRef(null);
  const onExitRef = useRef(onExit);
  const [currentIndex, setCurrentIndex] = useState(0);
  const tasks = useMemo(() => flattenRoutineTasks(routine), [routine]);
  const completedIds = useMemo(
    () => new Set(activeSession?.completedTaskIds || []),
    [activeSession?.completedTaskIds]
  );
  const progress = getSessionProgress(activeSession, routine);
  const allComplete = progress.total > 0 && progress.completed === progress.total;
  const currentTask = tasks[currentIndex] || null;
  const taskSignature = tasks.map((task) => task.id).join("|");

  onExitRef.current = onExit;
  const dialogRef = useDialogFocus({
    open: Boolean(open && activeSession),
    onClose: onExit,
    initialFocusRef: primaryActionRef
  });

  useEffect(() => {
    if (!open || !activeSession) return;
    setCurrentIndex(preferredTaskIndex(tasks, completedIds));
  }, [activeSession?.id, open, taskSignature]);

  useEffect(() => {
    if (open && !activeSession) onExitRef.current?.();
  }, [activeSession, open]);

  useEffect(() => {
    if (currentIndex >= tasks.length) {
      setCurrentIndex(Math.max(0, tasks.length - 1));
    }
  }, [currentIndex, tasks.length]);

  if (!open || !activeSession) return null;

  function toggleCurrentTask() {
    if (!currentTask) return;
    const wasComplete = completedIds.has(currentTask.id);
    onToggleTask(currentTask.id);

    if (!wasComplete) {
      const nextIncomplete = tasks.findIndex(
        (task, index) => index > currentIndex && !completedIds.has(task.id)
      );
      const wrappedIncomplete = tasks.findIndex(
        (task, index) => index < currentIndex && !completedIds.has(task.id)
      );
      if (nextIncomplete >= 0) setCurrentIndex(nextIncomplete);
      else if (wrappedIncomplete >= 0) setCurrentIndex(wrappedIncomplete);
    }
  }

  return (
    <div className="clean-mode-overlay" role="presentation">
      <section
        aria-labelledby="clean-mode-title"
        aria-modal="true"
        className="clean-mode-shell"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="clean-mode-header">
          <div>
            <p className="eyebrow">Cleaning mode</p>
            <h1 id="clean-mode-title">{routine?.title || "Current clean"}</h1>
          </div>
          <button
            aria-label="Exit cleaning mode"
            className="button ghost clean-mode-exit"
            type="button"
            onClick={onExit}
          >
            Exit
          </button>
        </header>

        <div className="clean-mode-status" aria-label="Current clean status">
          <div>
            <span>Elapsed</span>
            <strong>{formatElapsedTime(elapsedMs)}</strong>
          </div>
          <div>
            <span>Progress</span>
            <strong>
              {progress.completed} / {progress.total} tasks
            </strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{activeSession.paused ? "Paused" : "Cleaning"}</strong>
          </div>
        </div>

        <div
          aria-label={`${progress.percent}% of routine complete`}
          aria-valuemax="100"
          aria-valuemin="0"
          aria-valuenow={progress.percent}
          className="clean-mode-progress"
          role="progressbar"
        >
          <span style={{ width: `${progress.percent}%` }} />
        </div>

        <main className="clean-mode-focus" aria-live="polite" aria-atomic="true">
          {tasks.length === 0 ? (
            <div className="clean-mode-empty">
              <p className="eyebrow">Routine</p>
              <h2>No tasks in this routine</h2>
              <p>Exit cleaning mode to edit the routine, or save this clean as it is.</p>
            </div>
          ) : (
            <>
              {allComplete ? <p className="clean-mode-complete-label">All tasks complete</p> : null}
              <p className="clean-mode-phase">{currentTask?.phaseTitle || "Routine"}</p>
              <h2 className="clean-mode-task-title">{currentTask?.title || "Task"}</h2>
              {currentTask?.detail ? (
                <p className="clean-mode-task-detail">{currentTask.detail}</p>
              ) : null}
              <button
                aria-pressed={completedIds.has(currentTask.id)}
                className={
                  completedIds.has(currentTask.id)
                    ? "button clean-mode-complete-button done"
                    : "button primary clean-mode-complete-button"
                }
                ref={primaryActionRef}
                type="button"
                onClick={toggleCurrentTask}
              >
                {completedIds.has(currentTask.id) ? "Mark not done" : "Mark done"}
              </button>
            </>
          )}
        </main>

        <div className="clean-mode-navigation" aria-label="Task navigation">
          <button
            className="button ghost"
            type="button"
            disabled={tasks.length === 0 || currentIndex === 0}
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          >
            Previous
          </button>
          <span aria-live="polite">
            {tasks.length ? `${currentIndex + 1} of ${tasks.length}` : "0 tasks"}
          </span>
          <button
            className="button ghost"
            type="button"
            disabled={tasks.length === 0 || currentIndex === tasks.length - 1}
            onClick={() =>
              setCurrentIndex((index) => Math.min(tasks.length - 1, index + 1))
            }
          >
            Next
          </button>
        </div>

        <footer className="clean-mode-footer">
          {activeSession.paused ? (
            <button className="button ghost" type="button" onClick={onResumeSession}>
              Resume timer
            </button>
          ) : (
            <button className="button ghost" type="button" onClick={onPauseSession}>
              Pause timer
            </button>
          )}
          <button
            className={allComplete ? "button primary" : "button ghost"}
            type="button"
            onClick={onFinishSession}
          >
            {allComplete ? "Finish clean" : "Stop and save"}
          </button>
        </footer>
      </section>
    </div>
  );
}
