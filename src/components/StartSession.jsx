import { useMemo } from "react";
import { getRoutineById, getRoutineTotalTasks, getSessionProgress } from "../utils/calculations.js";
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

const routinePurposeLabels = {
  "initial-reset": "Full baseline reset",
  "weekly-reset": "Main weekly routine",
  "minimal-reset": "Fast maintenance reset",
  "guest-reset": "Guest-ready cleanup",
  "monthly-deep-clean": "Deeper maintenance"
};

function getStartPurposeLabel(routine) {
  return routinePurposeLabels[routine.id] || "Cleaning reset";
}

export default function StartSession({
  routines,
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
  onUpdateNotes
}) {
  const startRoutines = useMemo(
    () =>
      startRoutineOrder
        .map((routineId) => getRoutineById(routines, routineId))
        .filter(Boolean),
    [routines]
  );
  const selectedRoutine = useMemo(
    () => getRoutineById(startRoutines, selectedRoutineId) || startRoutines[0],
    [startRoutines, selectedRoutineId]
  );

  if (activeSession) {
    const routine =
      activeSession.routineSnapshot || getRoutineById(routines, activeSession.routineId);
    const progress = getSessionProgress(activeSession, routine);

    return (
      <div className="screen-stack">
        <section className="panel active-session-panel">
          <div className="session-topline">
            <div>
              <p className="eyebrow">Active session</p>
              <h2>{routine.title}</h2>
              <p>{routine.purpose}</p>
              <p className="muted">
                This unfinished session is saved locally. Continue it, finish partial, or cancel it
                before starting another routine.
              </p>
            </div>
            <div className="session-meta">
              <span>{routine.estimatedTime}</span>
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
              <span>Complete</span>
              <strong>{progress.percent}%</strong>
            </div>
            <div className="metric-card">
              <span>Estimated time</span>
              <strong>{routine.estimatedTime || "Not set"}</strong>
            </div>
          </div>
          <div className="session-actions">
            <button className="button ghost" type="button" onClick={onResetSession}>
              Reset session
            </button>
            <button className="button danger-ghost" type="button" onClick={onCancelSession}>
              Discard session
            </button>
            <button className="button primary" type="button" onClick={onFinishSession}>
              Finish session
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
        <section className="panel completion-panel">
          <p className="eyebrow">Completed</p>
          <h2>{completionSummary.routineTitle}</h2>
          <p>
            Finished at {formatDateTime(completionSummary.finishedAt)} with{" "}
            {completionSummary.percent}% complete.
          </p>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Choose routine</p>
            <h2>Start Session</h2>
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
              <strong>{routine.title}</strong>
              <span>{routine.estimatedTime}</span>
              <small>{getStartPurposeLabel(routine)}</small>
            </button>
          ))}
        </div>
      </section>

      {selectedRoutine ? (
        <section className="panel start-routine-summary">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Selected reset</p>
              <h2>{selectedRoutine.title}</h2>
              <p>{selectedRoutine.purpose}</p>
            </div>
            <span className="task-count">{getRoutineTotalTasks(selectedRoutine)} tasks</span>
          </div>
          <div className="start-summary-grid">
            <div className="metric-card">
              <span>Duration</span>
              <strong>{selectedRoutine.estimatedTime || "Not set"}</strong>
            </div>
            <div className="metric-card">
              <span>Phases</span>
              <strong>{selectedRoutine.phases.length}</strong>
            </div>
            <div className="metric-card">
              <span>Use case</span>
              <strong>{getStartPurposeLabel(selectedRoutine)}</strong>
            </div>
          </div>
          {selectedRoutine.whenToUse ? <p className="muted">{selectedRoutine.whenToUse}</p> : null}
          <div className="card-actions start-summary-actions">
            <button
              className="button primary"
              type="button"
              onClick={() => onStartSession(selectedRoutine.id)}
            >
              Start {selectedRoutine.title}
            </button>
          </div>
          <p className="muted start-reference-note">
            Need to inspect the full checklist? Open Routines for the reference view.
          </p>
        </section>
      ) : null}
    </div>
  );
}
