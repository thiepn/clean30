import { useMemo } from "react";
import { getRoutineById, getSessionProgress } from "../utils/calculations.js";
import { formatDateTime } from "../utils/dates.js";
import Checklist from "./Checklist.jsx";
import ProgressBar from "./ProgressBar.jsx";
import RoutineCard from "./RoutineCard.jsx";

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
  const selectedRoutine = useMemo(
    () => getRoutineById(routines, selectedRoutineId) || routines[0],
    [routines, selectedRoutineId]
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
          <div className="session-actions">
            <button className="button ghost" type="button" onClick={onResetSession}>
              Reset session
            </button>
            <button className="button danger-ghost" type="button" onClick={onCancelSession}>
              Cancel session
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
          {routines.map((routine) => (
            <button
              className={selectedRoutine?.id === routine.id ? "picker-item active" : "picker-item"}
              key={routine.id}
              type="button"
              onClick={() => onSelectRoutine(routine.id)}
            >
              <strong>{routine.title}</strong>
              <span>{routine.estimatedTime}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedRoutine ? <RoutineCard routine={selectedRoutine} onStart={onStartSession} /> : null}

      {selectedRoutine ? (
        <section className="panel">
          <p className="eyebrow">Routine overview</p>
          <h2>{selectedRoutine.title}</h2>
          <p>{selectedRoutine.purpose}</p>
          {selectedRoutine.whenToUse ? <p className="muted">{selectedRoutine.whenToUse}</p> : null}
          {selectedRoutine.message ? <p className="callout">{selectedRoutine.message}</p> : null}
          <Checklist routine={selectedRoutine} completedTaskIds={[]} readonly />
        </section>
      ) : null}
    </div>
  );
}
