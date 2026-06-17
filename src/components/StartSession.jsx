import { useEffect, useMemo, useState } from "react";
import {
  formatElapsedTime,
  formatRoutineDuration,
  getLastRoutineDoneLabel,
  getRoutineById,
  getRoutineTotalTasks,
  getSessionElapsedMs,
  getSessionProgress
} from "../utils/calculations.js";
import { formatDateTime } from "../utils/dates.js";
import Checklist from "./Checklist.jsx";
import ProgressBar from "./ProgressBar.jsx";

const startRoutineOrder = [
  "initial-reset",
  "weekly-reset",
  "minimal-reset",
  "guest-reset",
  "monthly-deep-clean"
];

export default function StartSession({
  routines,
  history = [],
  selectedRoutineId,
  onSelectRoutine,
  activeSession,
  completionSummary,
  onStartSession,
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
  onEditRoutines,
  onAddRoutine
}) {
  const [timerNow, setTimerNow] = useState(Date.now());
  const startRoutines = useMemo(
    () => {
      const activeRoutines = routines.filter(
        (routine) => routine.id !== "daily-rules" && !routine.archived
      );
      const ordered = startRoutineOrder
        .map((routineId) => getRoutineById(routines, routineId))
        .filter((routine) => routine && !routine.archived);
      const orderedIds = new Set(ordered.map((routine) => routine.id));
      return [...ordered, ...activeRoutines.filter((routine) => !orderedIds.has(routine.id))];
    },
    [routines]
  );
  const selectedRoutine = useMemo(
    () => getRoutineById(startRoutines, selectedRoutineId) || startRoutines[0],
    [startRoutines, selectedRoutineId]
  );

  useEffect(() => {
    if (!activeSession || activeSession.paused) return;
    setTimerNow(Date.now());
    const intervalId = window.setInterval(() => {
      setTimerNow(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeSession?.id, activeSession?.paused]);

  if (activeSession) {
    const routine =
      activeSession.routineSnapshot ||
      getRoutineById(routines, activeSession.routineId) || {
        id: activeSession.routineId,
        title: "Routine",
        estimatedTime: "",
        estimatedMinutes: 30,
        phases: []
      };
    const progress = getSessionProgress(activeSession, routine);
    const elapsed = getSessionElapsedMs(activeSession, new Date(timerNow));

    return (
      <div className="screen-stack">
        <section className="panel active-session-panel">
          <div className="session-topline">
            <div>
              <p className="eyebrow">Active session</p>
              <h2>{routine.title}</h2>
              <p className="muted">
                {activeSession.paused
                  ? "Paused locally. Resume when you are ready, or finish partial to save progress."
                  : "Saved locally. Continue, pause, finish partial, or discard before starting another routine."}
              </p>
            </div>
            <div className="session-meta">
              <span className="status-pill compact">{activeSession.paused ? "Paused" : "Active"}</span>
              <span>{formatRoutineDuration(routine)}</span>
              <span>Started {formatDateTime(activeSession.startedAt)}</span>
            </div>
          </div>
          <ProgressBar
            percent={progress.percent}
            label={`${progress.completed}/${progress.total} tasks complete`}
          />
          <div className="active-session-summary">
            <div className="metric-card">
              <span>Progress</span>
              <strong>
                {progress.completed}/{progress.total}
              </strong>
            </div>
            <div className="metric-card">
              <span>Elapsed</span>
              <strong>{formatElapsedTime(elapsed)}</strong>
            </div>
            <div className="metric-card">
              <span>Status</span>
              <strong>{activeSession.paused ? "Paused" : "Cleaning"}</strong>
            </div>
          </div>
          <div className="session-actions">
            {activeSession.paused ? (
              <button className="button primary" type="button" onClick={onResumeSession}>
                Resume
              </button>
            ) : (
              <button className="button ghost" type="button" onClick={onPauseSession}>
                Pause
              </button>
            )}
            <button className="button ghost" type="button" onClick={onResetSession}>
              Reset
            </button>
            <button className="button danger-ghost" type="button" onClick={onCancelSession}>
              Discard
            </button>
            <button className="button primary" type="button" onClick={onFinishSession}>
              Finish partial
            </button>
          </div>
        </section>

        <Checklist
          routine={routine}
          completedTaskIds={activeSession.completedTaskIds}
          onToggleTask={onToggleTask}
          onCompletePhase={onCompletePhase}
          collapsible
          focusFirstIncomplete
        />

        <section className="panel">
          <label className="field-label" htmlFor="session-notes">
            Session notes
          </label>
          <textarea
            id="session-notes"
            value={activeSession.notes || ""}
            placeholder="What helped, what blocked the routine, or what should be handled next time."
            onChange={(event) => onUpdateNotes(event.target.value)}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      {completionSummary ? (
        <section className="panel completion-panel completion-summary-panel">
          <div>
            <p className="eyebrow">Saved to History</p>
            <h2>{completionSummary.routineTitle}</h2>
            <p>
              {completionSummary.completedTasks}/{completionSummary.totalTasks} tasks complete,{" "}
              {completionSummary.percent}% total.
            </p>
          </div>
          <div className="completion-summary-meta">
            <span>Finished {formatDateTime(completionSummary.finishedAt)}</span>
            {Number.isFinite(Number(completionSummary.elapsedMs)) ? (
              <span>Elapsed {formatElapsedTime(Number(completionSummary.elapsedMs))}</span>
            ) : Number.isFinite(Number(completionSummary.estimatedDurationMinutes)) ? (
              <span>
                Elapsed {formatElapsedTime(Number(completionSummary.estimatedDurationMinutes) * 60000)}
              </span>
            ) : null}
          </div>
          <div className="card-actions compact-actions">
            <button className="button primary small" type="button" onClick={onViewHistory}>
              View History
            </button>
            <button className="button ghost small" type="button" onClick={onClearCompletionSummary}>
              Close
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading compact-heading">
          <h2>Choose a routine</h2>
          <div className="card-actions compact-actions">
            <button className="button edit-action small" type="button" onClick={onEditRoutines}>
              Edit
            </button>
            <button className="button edit-action small" type="button" onClick={onAddRoutine}>
              Add
            </button>
          </div>
        </div>
        <div className="routine-picker">
          {startRoutines.map((routine) => (
            <button
              className={selectedRoutine?.id === routine.id ? "picker-item active" : "picker-item"}
              key={routine.id}
              type="button"
              onClick={() => onSelectRoutine(routine.id)}
            >
              <span className={`routine-color-dot color-${routine.colorLabel || "none"}`} aria-hidden="true" />
              <strong>{routine.title}</strong>
              <span>{formatRoutineDuration(routine)}</span>
              <small>{getLastRoutineDoneLabel(history, routine.id)}</small>
            </button>
          ))}
        </div>
      </section>

      {selectedRoutine ? (
        <section className="panel start-routine-summary">
          <div className="section-heading compact-heading">
            <div>
              <h2>{selectedRoutine.title}</h2>
            </div>
            <span className="task-count">{getRoutineTotalTasks(selectedRoutine)} tasks</span>
          </div>
          <div className="start-summary-grid">
            <div className="metric-card">
              <span>Duration</span>
              <strong>{formatRoutineDuration(selectedRoutine)}</strong>
            </div>
            <div className="metric-card">
              <span>Tasks</span>
              <strong>{getRoutineTotalTasks(selectedRoutine)}</strong>
            </div>
            <div className="metric-card">
              <span>Last done</span>
              <strong>{getLastRoutineDoneLabel(history, selectedRoutine.id).replace("Last done ", "")}</strong>
            </div>
          </div>
          <div className="card-actions start-summary-actions">
            <button
              className="button primary"
              type="button"
              onClick={() => onStartSession(selectedRoutine.id)}
            >
              Start {selectedRoutine.title}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
