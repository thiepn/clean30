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
  const referenceRoutines = useMemo(
    () => routines.filter((routine) => routine.id !== "daily-rules"),
    [routines]
  );
  const [selectedRoutineId, setSelectedRoutineId] = useState(referenceRoutines[0]?.id || "");
  const [copyMessage, setCopyMessage] = useState("");
  const [checklistOpen, setChecklistOpen] = useState(false);
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

  useEffect(() => {
    setChecklistOpen(false);
    setCopyMessage("");
  }, [selectedRoutineId]);

  async function copyChecklist() {
    if (!selectedRoutine || !navigator.clipboard?.writeText) {
      setCopyMessage("Clipboard copy is not available in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(createChecklistText(selectedRoutine));
      setCopyMessage("Checklist copied.");
    } catch {
      setCopyMessage("Could not copy checklist. Check browser clipboard permissions.");
    }
  }

  if (!selectedRoutine) {
    return (
      <EmptyState
        title="No reset routines"
        message="Daily Rules are handled from Dashboard. Add reset routines in Customize to use this page."
      />
    );
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
        {routines.some((routine) => routine.id === "daily-rules") ? (
          <p className="callout small daily-routine-note">
            Tiny Rules are handled from the Dashboard. This page focuses on reset routines.
          </p>
        ) : null}
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

        <div className="routine-prep-grid compact">
          <div className="routine-guide-block">
            <p className="eyebrow">Preparation note</p>
            <p>{mindsetForRoutine(selectedRoutine)}</p>
          </div>
          <div className="routine-guide-block">
            <p className="eyebrow">Likely supplies</p>
            <div className="reference-chip-list">
              {supplies.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="routine-guide-block">
            <p className="eyebrow">Related zones</p>
            {relatedZones.length ? (
              <div className="reference-chip-list">
                {relatedZones.map((zone) => (
                  <span key={zone.id}>{zone.name}</span>
                ))}
              </div>
            ) : (
              <p className="muted">No specific zone match. Use the checklist phases as the map.</p>
            )}
          </div>
        </div>

        {selectedRoutine.message ? <p className="callout small">{selectedRoutine.message}</p> : null}

        <div className="routine-tools-panel">
          <div>
            <p className="eyebrow">Preparation tools</p>
            <h3>Use this page to prepare. Use Start to execute.</h3>
          </div>
          <div className="card-actions routine-reference-actions">
            <button className="button primary" type="button" onClick={copyChecklist}>
              Copy checklist
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => setChecklistOpen((current) => !current)}
            >
              {checklistOpen ? "Hide checklist" : "View checklist"}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => onStartRoutine(selectedRoutine.id)}
            >
              Start this routine
            </button>
          </div>
        </div>
        {copyMessage ? <p className="form-message">{copyMessage}</p> : null}
      </section>

      <details
        className="panel checklist-reference-panel"
        open={checklistOpen}
        onToggle={(event) => setChecklistOpen(event.currentTarget.open)}
      >
        <summary className="system-info-summary compact checklist-reference-summary">
          <span>
            <span className="eyebrow">Checklist reference</span>
            <strong>{selectedRoutine.title}</strong>
            <small>
              {selectedRoutine.phases.length} phases / {selectedSummary?.taskCount || 0} tasks
            </small>
          </span>
        </summary>
        <div className="card-actions routine-reference-actions">
          <button className="button ghost" type="button" onClick={copyChecklist}>
            Copy checklist
          </button>
        </div>
        <Checklist
          routine={selectedRoutine}
          completedTaskIds={[]}
          readonly
          collapsible
          startCollapsed
          showTaskCountOnly
        />
      </details>
    </div>
  );
}
