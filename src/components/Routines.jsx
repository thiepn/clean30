import { useEffect, useMemo, useState } from "react";
import { getLastCompleted, getRoutineTotalTasks } from "../utils/calculations.js";
import { formatRelativeDays } from "../utils/dates.js";
import Checklist from "./Checklist.jsx";
import EmptyState from "./EmptyState.jsx";

function inferComplexity(taskCount) {
  if (taskCount <= 8) return "light";
  if (taskCount <= 18) return "balanced";
  return "detailed";
}

const routinePurposeLabels = {
  "initial-reset": "Foundation reset",
  "weekly-reset": "Main weekly routine",
  "minimal-reset": "Fast maintenance reset",
  "guest-reset": "Guest-ready cleanup",
  "monthly-deep-clean": "Deeper maintenance"
};

function getRoutinePurposeLabel(routine) {
  return routinePurposeLabels[routine.id] || "Reference routine";
}

function averageCompletion(history, routineId) {
  const entries = history.filter((entry) => entry.routineId === routineId);
  if (!entries.length) return null;
  return Math.round(
    entries.reduce((sum, entry) => sum + (Number(entry.percent) || 0), 0) / entries.length
  );
}

export default function Routines({ routines, history }) {
  const referenceRoutines = useMemo(
    () => routines.filter((routine) => routine.id !== "daily-rules"),
    [routines]
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
          taskCount,
          complexity: inferComplexity(taskCount),
          lastCompleted: getLastCompleted(history, routine.id),
          average: averageCompletion(history, routine.id)
        };
      }),
    [history, referenceRoutines]
  );

  useEffect(() => {
    if (!selectedRoutine && referenceRoutines[0]) setSelectedRoutineId(referenceRoutines[0].id);
  }, [referenceRoutines, selectedRoutine]);

  if (!selectedRoutine) {
    return (
      <EmptyState
        title="No reset routines"
        message="Daily Rules are handled from Dashboard. Add reset routines from the Dashboard routine editor."
      />
    );
  }

  const selectedSummary = routineSummaries.find((item) => item.routine.id === selectedRoutine.id);

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Routine library</p>
            <h2>Reference Checklists</h2>
            <p>Use this tab to inspect what is inside each reset routine.</p>
          </div>
        </div>
        <div className="routine-library-grid" role="list">
          {routineSummaries.map((item) => (
            <button
              className={
                selectedRoutine.id === item.routine.id
                  ? "routine-library-card active"
                  : "routine-library-card"
              }
              key={item.routine.id}
              type="button"
              onClick={() => setSelectedRoutineId(item.routine.id)}
            >
              <strong>{item.routine.title}</strong>
              <span>{item.routine.estimatedTime || "No estimate"}</span>
              <small>
                {item.taskCount} tasks / {item.complexity}
              </small>
              <small>{getRoutinePurposeLabel(item.routine)}</small>
              <small>
                {item.lastCompleted || item.average !== null
                  ? `${item.lastCompleted ? `Last: ${formatRelativeDays(item.lastCompleted)}` : ""}${
                      item.lastCompleted && item.average !== null ? " / " : ""
                    }${item.average !== null ? `Avg: ${item.average}%` : ""}`
                  : "No completions yet"}
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel routine-reference-panel">
        <div className="section-heading routine-guide-heading">
          <div>
            <p className="eyebrow">Routine reference</p>
            <h2>{selectedRoutine.title}</h2>
            <p>{selectedRoutine.purpose}</p>
          </div>
        </div>

        <div className="routine-meta-strip" aria-label="Routine summary">
          <span>{selectedRoutine.estimatedTime || "No estimate"}</span>
          <span>{selectedSummary?.taskCount || 0} tasks</span>
          <span>{selectedRoutine.phases.length} phases</span>
          <span>{selectedSummary?.complexity}</span>
          {selectedSummary?.lastCompleted || selectedSummary?.average !== null ? (
            <>
              {selectedSummary.lastCompleted ? (
                <span>Last: {formatRelativeDays(selectedSummary.lastCompleted)}</span>
              ) : null}
              {selectedSummary.average !== null ? <span>Avg: {selectedSummary.average}%</span> : null}
            </>
          ) : (
            <span>No completions yet</span>
          )}
        </div>

        {selectedRoutine.whenToUse ? (
          <div className="routine-guide-block">
            <p className="eyebrow">When to use</p>
            <p>{selectedRoutine.whenToUse}</p>
          </div>
        ) : null}

        {selectedRoutine.message ? <p className="callout small">{selectedRoutine.message}</p> : null}
      </section>

      <section className="panel checklist-reference-panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Checklist reference</p>
            <h2>{selectedRoutine.title}</h2>
            <p>
              {selectedRoutine.phases.length} phases / {selectedSummary?.taskCount || 0} tasks
            </p>
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
