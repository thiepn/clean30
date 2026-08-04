import { useEffect, useMemo, useRef, useState } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";
import { createId, normalizeTask } from "../utils/templateUtils.js";
import {
  createRoutineEditorDraft,
  hasDuplicateRoutineTitle,
  sanitizeRoutineDraft
} from "../utils/routineLibrary.js";

function moveItem(items, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function RoutineEditorDialog({
  open,
  routine,
  routines = [],
  onSave,
  onClose,
  onAdvancedEdit
}) {
  const closeButtonRef = useRef(null);
  const dialogRef = useDialogFocus({
    open,
    onClose,
    initialFocusRef: closeButtonRef
  });
  const [draft, setDraft] = useState(() => createRoutineEditorDraft(routine));
  const [attemptedSave, setAttemptedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(createRoutineEditorDraft(routine));
    setAttemptedSave(false);
  }, [open, routine?.id]);

  const titleError = useMemo(() => {
    if (!String(draft.title || "").trim()) return "Routine name is required.";
    if (hasDuplicateRoutineTitle(draft.title, routines, draft.id)) {
      return "A routine with this name already exists.";
    }
    return "";
  }, [draft.id, draft.title, routines]);

  const durationError = useMemo(() => {
    const numeric = Number(draft.estimatedMinutes);
    if (!Number.isFinite(numeric)) return "Use a number of minutes.";
    if (numeric < 1 || numeric > 600) return "Use between 1 and 600 minutes.";
    return "";
  }, [draft.estimatedMinutes]);

  const taskCount = draft.phases.reduce(
    (total, phase) =>
      total + phase.tasks.filter((task) => task.title.trim()).length,
    0
  );
  const taskError = taskCount ? "" : "Add at least one task.";
  const canSave = !titleError && !durationError && !taskError;

  if (!open) return null;

  function updatePhase(phaseId, updater) {
    setDraft((current) => ({
      ...current,
      phases: current.phases.map((phase) =>
        phase.id === phaseId ? updater(phase) : phase
      )
    }));
  }

  function addTask(phaseId) {
    updatePhase(phaseId, (phase) => ({
      ...phase,
      tasks: [
        ...phase.tasks,
        normalizeTask({
          id: createId("task"),
          title: "",
          duration: "",
          detail: "",
          priority: "normal"
        })
      ]
    }));
  }

  function updateTask(phaseId, taskId, title) {
    updatePhase(phaseId, (phase) => ({
      ...phase,
      tasks: phase.tasks.map((task) =>
        task.id === taskId ? { ...task, title } : task
      )
    }));
  }

  function removeTask(phaseId, taskId) {
    updatePhase(phaseId, (phase) => ({
      ...phase,
      tasks: phase.tasks.filter((task) => task.id !== taskId)
    }));
  }

  function moveTask(phaseId, taskIndex, direction) {
    updatePhase(phaseId, (phase) => ({
      ...phase,
      tasks: moveItem(phase.tasks, taskIndex, direction)
    }));
  }

  function submit(event) {
    event.preventDefault();
    setAttemptedSave(true);
    if (!canSave) return;
    onSave(sanitizeRoutineDraft(draft));
    onClose();
  }

  return (
    <div
      className="dialog-backdrop routine-editor-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="routine-editor-title"
        aria-modal="true"
        className="dialog routine-editor-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{routine ? "Routine" : "New routine"}</p>
            <h2 id="routine-editor-title">
              {routine ? "Edit routine" : "Create a routine"}
            </h2>
          </div>
          <button
            aria-label="Close routine editor"
            className="icon-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="routine-editor-form" onSubmit={submit}>
          <label className="field-label" htmlFor="routine-editor-name">
            Routine name
            <input
              autoComplete="off"
              id="routine-editor-name"
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Sunday clean"
              type="text"
              value={draft.title}
            />
          </label>
          {attemptedSave && titleError ? (
            <p className="field-error">{titleError}</p>
          ) : null}

          <label className="field-label" htmlFor="routine-editor-duration">
            Estimated time
            <span className="duration-input-row">
              <input
                id="routine-editor-duration"
                inputMode="numeric"
                max="600"
                min="1"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    estimatedMinutes: event.target.value
                  }))
                }
                type="number"
                value={draft.estimatedMinutes}
              />
              <span>minutes</span>
            </span>
          </label>
          {attemptedSave && durationError ? (
            <p className="field-error">{durationError}</p>
          ) : null}

          <div className="routine-editor-task-area">
            <div className="section-heading compact-heading">
              <div>
                <h3>Tasks</h3>
                <p>Keep the list short and write one clear action per task.</p>
              </div>
              <span className="task-count">{taskCount} tasks</span>
            </div>

            {draft.phases.map((phase) => (
              <section className="routine-editor-section" key={phase.id}>
                {draft.phases.length > 1 ? <h4>{phase.title}</h4> : null}
                <div className="routine-editor-task-list">
                  {phase.tasks.map((task, taskIndex) => (
                    <div className="routine-editor-task-row" key={task.id}>
                      <input
                        aria-label={`Task ${taskIndex + 1}${
                          draft.phases.length > 1 ? ` in ${phase.title}` : ""
                        }`}
                        onChange={(event) =>
                          updateTask(phase.id, task.id, event.target.value)
                        }
                        placeholder="Add a cleaning task"
                        type="text"
                        value={task.title}
                      />
                      <div className="routine-editor-task-actions">
                        <button
                          aria-label={`Move ${task.title || `task ${taskIndex + 1}`} up`}
                          className="icon-button small"
                          disabled={taskIndex === 0}
                          onClick={() => moveTask(phase.id, taskIndex, -1)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`Move ${task.title || `task ${taskIndex + 1}`} down`}
                          className="icon-button small"
                          disabled={taskIndex === phase.tasks.length - 1}
                          onClick={() => moveTask(phase.id, taskIndex, 1)}
                          type="button"
                        >
                          ↓
                        </button>
                        <button
                          aria-label={`Remove ${task.title || `task ${taskIndex + 1}`}`}
                          className="icon-button small danger-icon"
                          onClick={() => removeTask(phase.id, task.id)}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="button ghost small"
                  onClick={() => addTask(phase.id)}
                  type="button"
                >
                  + Add task{draft.phases.length > 1 ? ` to ${phase.title}` : ""}
                </button>
              </section>
            ))}
            {attemptedSave && taskError ? (
              <p className="field-error">{taskError}</p>
            ) : null}
          </div>

          <div className="routine-editor-footer">
            <div>
              {routine && onAdvancedEdit ? (
                <button
                  className="button text-button"
                  onClick={() => {
                    onClose();
                    onAdvancedEdit(routine.id);
                  }}
                  type="button"
                >
                  Advanced structure
                </button>
              ) : null}
            </div>
            <div className="dialog-actions">
              <button className="button ghost" onClick={onClose} type="button">
                Cancel
              </button>
              <button className="button primary" type="submit">
                {routine ? "Save changes" : "Create routine"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
