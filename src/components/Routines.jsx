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

function averageCompletion(history, routineId) {
  const entries = history.filter((entry) => entry.routineId === routineId);
  if (!entries.length) return null;
  return Math.round(
    entries.reduce((sum, entry) => sum + (Number(entry.percent) || 0), 0) / entries.length
  );
}

function inferSupplies(routine) {
  const text = JSON.stringify(routine).toLowerCase();
  const supplies = [];
  if (text.includes("trash") || text.includes("bin")) supplies.push("trash bag");
  if (text.includes("dishes") || text.includes("sink")) supplies.push("dish soap");
  if (text.includes("floor") || text.includes("vacuum")) supplies.push("vacuum or broom");
  if (text.includes("bathroom") || text.includes("toilet")) supplies.push("bathroom cleaner");
  if (text.includes("laundry") || text.includes("clothes")) supplies.push("laundry basket");
  if (text.includes("glass") || text.includes("window")) supplies.push("glass cloth");
  return supplies.length ? supplies : ["timer", "cloth", "trash bag if needed"];
}

function inferZones(routine, zones) {
  const text = JSON.stringify(routine).toLowerCase();
  return zones
    .filter((zone) =>
      zone.name
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2)
        .some((word) => text.includes(word))
    )
    .slice(0, 6);
}

function mindsetForRoutine(routine) {
  const id = routine.id;
  if (id.includes("minimal")) return "Minimum useful reset. Stop the drift, do not perfect it.";
  if (id.includes("guest")) return "Guest damage control. Prioritize smell, sightlines, and bathroom.";
  if (id.includes("monthly")) return "Maintenance pass. Handle deeper issues without expanding scope.";
  if (id.includes("daily")) return "Tiny prevention. Keep bottlenecks from growing.";
  if (id.includes("initial")) return "Foundation reset. Work steadily and follow the order.";
  return "Full reset. Clear bottlenecks before polishing details.";
}

function createChecklistText(routine) {
  const lines = [routine.title, routine.estimatedTime, "", routine.purpose, ""].filter(Boolean);
  routine.phases.forEach((phase) => {
    lines.push(phase.title);
    phase.tasks.forEach((task) => {
      lines.push(`- ${task.title}${task.duration ? ` (${task.duration})` : ""}`);
      if (task.detail) lines.push(`  ${task.detail}`);
    });
    lines.push("");
  });
  return lines.join("\n");
}

export default function Routines({ routines, history, template, onStartRoutine }) {
  const [selectedRoutineId, setSelectedRoutineId] = useState(routines[0]?.id || "");
  const [copyMessage, setCopyMessage] = useState("");
  const selectedRoutine =
    routines.find((routine) => routine.id === selectedRoutineId) || routines[0] || null;

  const routineSummaries = useMemo(
    () =>
      routines.map((routine) => {
        const taskCount = getRoutineTotalTasks(routine);
        return {
          routine,
          taskCount,
          complexity: inferComplexity(taskCount),
          lastCompleted: getLastCompleted(history, routine.id),
          average: averageCompletion(history, routine.id)
        };
      }),
    [history, routines]
  );

  useEffect(() => {
    if (!selectedRoutine && routines[0]) setSelectedRoutineId(routines[0].id);
  }, [routines, selectedRoutine]);

  async function copyChecklist() {
    if (!selectedRoutine || !navigator.clipboard) {
      setCopyMessage("Clipboard copy is not available in this browser.");
      return;
    }
    await navigator.clipboard.writeText(createChecklistText(selectedRoutine));
    setCopyMessage("Checklist copied.");
  }

  if (!selectedRoutine) {
    return <EmptyState title="No routines" message="Add a routine in Customize to use this page." />;
  }

  const selectedSummary = routineSummaries.find((item) => item.routine.id === selectedRoutine.id);
  const relatedZones = inferZones(selectedRoutine, template.zones);
  const supplies = inferSupplies(selectedRoutine);

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Routine Library</p>
            <h2>Compare and Prepare</h2>
            <p>
              Use this page to understand routines before doing them. Start Session is still the
              main place for cleaning.
            </p>
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
              <small>
                Last: {item.lastCompleted ? formatRelativeDays(item.lastCompleted) : "Not yet"}
              </small>
              <small>Average: {item.average === null ? "Not yet" : `${item.average}%`}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel routine-reference-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Routine reference</p>
            <h2>{selectedRoutine.title}</h2>
            <p>{selectedRoutine.purpose}</p>
          </div>
          <span className="task-count">{selectedSummary?.taskCount || 0} tasks</span>
        </div>

        <div className="routine-fact-grid">
          <div className="metric-card">
            <span>Estimated time</span>
            <strong>{selectedRoutine.estimatedTime || "Not set"}</strong>
          </div>
          <div className="metric-card">
            <span>Complexity</span>
            <strong>{selectedSummary?.complexity}</strong>
          </div>
          <div className="metric-card">
            <span>Phases</span>
            <strong>{selectedRoutine.phases.length}</strong>
          </div>
          <div className="metric-card">
            <span>Last completed</span>
            <strong>
              {selectedSummary?.lastCompleted
                ? formatRelativeDays(selectedSummary.lastCompleted)
                : "Not yet"}
            </strong>
          </div>
        </div>

        {selectedRoutine.whenToUse ? (
          <div className="insight-card">
            <p className="eyebrow">When to use</p>
            <p>{selectedRoutine.whenToUse}</p>
          </div>
        ) : null}

        <div className="routine-prep-grid">
          <div className="insight-card">
            <p className="eyebrow">Before you start</p>
            <ul className="system-list compact">
              <li>{mindsetForRoutine(selectedRoutine)}</li>
              <li>Keep the routine bounded to its purpose.</li>
              <li>Stop when the main bottlenecks are controlled.</li>
            </ul>
          </div>
          <div className="insight-card">
            <p className="eyebrow">Likely supplies</p>
            <ul className="system-list compact">
              {supplies.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="insight-card">
            <p className="eyebrow">Related zones</p>
            {relatedZones.length ? (
              <div className="zone-chip-list compact">
                {relatedZones.map((zone) => (
                  <span className="date-chip" key={zone.id}>
                    {zone.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted">No specific zone match. Use the checklist phases as the map.</p>
            )}
          </div>
        </div>

        {selectedRoutine.message ? <p className="callout small">{selectedRoutine.message}</p> : null}

        <div className="card-actions routine-reference-actions">
          <button className="button ghost" type="button" onClick={copyChecklist}>
            Copy checklist
          </button>
          <button
            className="button primary"
            type="button"
            onClick={() => onStartRoutine(selectedRoutine.id)}
          >
            Start this routine
          </button>
        </div>
        {copyMessage ? <p className="form-message">{copyMessage}</p> : null}
      </section>

      <section className="panel">
        <p className="eyebrow">Checklist reference</p>
        <h2>{selectedRoutine.title}</h2>
        <Checklist routine={selectedRoutine} completedTaskIds={[]} readonly collapsible />
      </section>
    </div>
  );
}
