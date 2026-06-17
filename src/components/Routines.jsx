import { useEffect, useMemo, useState } from "react";
import {
  formatRoutineDuration,
  getLastRoutineDoneLabel,
  getRoutineTotalTasks
} from "../utils/calculations.js";
import Checklist from "./Checklist.jsx";
import EmptyState from "./EmptyState.jsx";

export default function Routines({ routines, history = [], onEditRoutines, onAddRoutine }) {
  const [showArchived, setShowArchived] = useState(false);
  const referenceRoutines = useMemo(
    () =>
      routines.filter(
        (routine) => routine.id !== "daily-rules" && (showArchived || !routine.archived)
      ),
    [routines, showArchived]
  );
  const [selectedRoutineId, setSelectedRoutineId] = useState(referenceRoutines[0]?.id || "");
  const selectedRoutine =
    referenceRoutines.find((routine) => routine.id === selectedRoutineId) ||
    referenceRoutines[0] ||
    null;

  const routineSummaries = useMemo(
    () =>
      referenceRoutines.map((routine) => {
        const taskCount = getRoutineTotalTasks(routine);
        return {
          routine,
          taskCount
        };
      }),
    [referenceRoutines]
  );

  useEffect(() => {
    if (!selectedRoutine && referenceRoutines[0]) setSelectedRoutineId(referenceRoutines[0].id);
  }, [referenceRoutines, selectedRoutine]);

  if (!selectedRoutine) {
    return (
      <div className="screen-stack">
        <section className="panel">
          <div className="section-heading compact-heading">
            <h2>Routines</h2>
            <div className="card-actions compact-actions">
              <button className="button edit-action small" type="button" onClick={onAddRoutine}>
                Add
              </button>
              <button
                className={showArchived ? "button edit-action small" : "button ghost small"}
                type="button"
                onClick={() => setShowArchived((current) => !current)}
              >
                Show archived
              </button>
            </div>
          </div>
        </section>
        <EmptyState
          title={showArchived ? "No routines" : "No active routines"}
          message="Today tasks live on Dashboard. Add reusable routines from the editor."
        />
      </div>
    );
  }

  const selectedSummary = routineSummaries.find((item) => item.routine.id === selectedRoutine.id);

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading compact-heading">
          <div>
            <h2>Routines</h2>
          </div>
          <div className="card-actions compact-actions">
            <button
              className={showArchived ? "button edit-action small" : "button ghost small"}
              type="button"
              onClick={() => setShowArchived((current) => !current)}
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </button>
            <button className="button edit-action small" type="button" onClick={onEditRoutines}>
              Edit
            </button>
            <button className="button edit-action small" type="button" onClick={onAddRoutine}>
              Add
            </button>
          </div>
        </div>
        <div className="routine-library-grid" role="list">
          {routineSummaries.map((item) => (
            <button
              className={
                [
                  "routine-library-card",
                  selectedRoutine.id === item.routine.id ? "active" : "",
                  item.routine.archived ? "archived" : ""
                ]
                  .filter(Boolean)
                  .join(" ")
              }
              key={item.routine.id}
              type="button"
              onClick={() => setSelectedRoutineId(item.routine.id)}
            >
              <span className={`routine-color-dot color-${item.routine.colorLabel || "none"}`} aria-hidden="true" />
              <strong>{item.routine.title}</strong>
              <span>{formatRoutineDuration(item.routine)}</span>
              <small>{getLastRoutineDoneLabel(history, item.routine.id)}</small>
              {item.routine.archived ? <small className="archive-label">Archived</small> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="panel routine-reference-panel">
        <div className="section-heading routine-guide-heading">
          <div>
            <h2>{selectedRoutine.title}</h2>
          </div>
        </div>

        <div className="routine-meta-strip" aria-label="Routine summary">
          <span>{formatRoutineDuration(selectedRoutine)}</span>
          <span>{selectedSummary?.taskCount || 0} tasks</span>
          <span>{selectedRoutine.phases.length} phases</span>
          <span>{getLastRoutineDoneLabel(history, selectedRoutine.id)}</span>
          {selectedRoutine.archived ? <span>Archived</span> : null}
        </div>
      </section>

      <section className="panel checklist-reference-panel">
        <div className="section-heading compact-heading">
          <div>
            <h2>Checklist</h2>
          </div>
        </div>
        <Checklist
          routine={selectedRoutine}
          completedTaskIds={[]}
          readonly
          collapsible
          startCollapsed
          showTaskCountOnly
        />
      </section>
    </div>
  );
}
