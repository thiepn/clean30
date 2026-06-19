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
  const exitButtonRef = useRef(null);
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
  const finishLabel = allComplete ? "Finish" : "Finish partial";
  const taskSignature = tasks.map((task) => task.id).join("|");

  onExitRef.current = onExit;
  const dialogRef = useDialogFocus({
    open: Boolean(open && activeSession),
    onClose: onExit,
    initialFocusRef: exitButtonRef
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
            <p className="eyebrow">Clean Mode</p>
            <h1 id="clean-mode-title">{routine?.title || "Active routine"}</h1>
          </div>
          <button
            className="button ghost clean-mode-exit"
            type="button"
            onClick={onExit}
            ref={exitButtonRef}
          >
            Exit
          </button>
        </header>

        <div className="clean-mode-status" aria-label="Session status">
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

        <div className="clean-mode-progress" aria-hidden="true">
          <span style={{ width: `${progress.percent}%` }} />
        </div>

        <main className="clean-mode-focus" aria-live="polite">
          {tasks.length === 0 ? (
            <div className="clean-mode-empty">
              <p className="eyebrow">Routine</p>
              <h2>No tasks in this routine</h2>
              <p>Exit Clean Mode to edit the routine or finish this empty session.</p>
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
                type="button"
                onClick={toggleCurrentTask}
              >
                {completedIds.has(currentTask.id) ? "Undo done" : "Mark done"}
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
          <span>{tasks.length ? `${currentIndex + 1} of ${tasks.length}` : "0 tasks"}</span>
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
            <button className="button primary" type="button" onClick={onResumeSession}>
              Resume
            </button>
          ) : (
            <button className="button ghost" type="button" onClick={onPauseSession}>
              Pause
            </button>
          )}
          <button className="button primary" type="button" onClick={onFinishSession}>
            {finishLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
