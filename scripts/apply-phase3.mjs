import { readFileSync, writeFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) {
    throw new Error(`Phase 3 replacement failed: ${label}`);
  }
  return next;
}

write(
  "src/utils/routineLibrary.js",
  `import { cloneDeep, createId, normalizeRoutine, normalizeTask } from "./templateUtils.js";

function normalizedTitle(value) {
  return String(value || "").trim().toLowerCase();
}

export function getRoutineMinutes(routine) {
  const direct = Number(routine?.estimatedMinutes);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
  const match = String(routine?.estimatedTime || "").match(/(\\d+)/);
  return match ? Math.max(1, Math.min(600, Number(match[1]))) : 30;
}

export function hasDuplicateRoutineTitle(title, routines = [], ignoreId = "") {
  const candidate = normalizedTitle(title);
  if (!candidate) return false;
  return routines.some(
    (routine) => routine.id !== ignoreId && normalizedTitle(routine.title) === candidate
  );
}

export function createSimpleRoutineDraft() {
  return normalizeRoutine({
    id: createId("routine"),
    title: "",
    estimatedMinutes: 30,
    estimatedTime: "30 min",
    archived: false,
    colorLabel: "none",
    purpose: "",
    whenToUse: "",
    message: "",
    phases: [
      {
        id: createId("phase"),
        title: "Tasks",
        tasks: [
          normalizeTask({
            id: createId("task"),
            title: "",
            duration: "",
            detail: "",
            priority: "normal"
          })
        ]
      }
    ]
  });
}

export function createRoutineEditorDraft(routine) {
  return cloneDeep(routine || createSimpleRoutineDraft());
}

export function sanitizeRoutineDraft(draft) {
  const minutes = Math.max(1, Math.min(600, Math.round(Number(draft?.estimatedMinutes) || 30)));
  const phases = (Array.isArray(draft?.phases) ? draft.phases : [])
    .map((phase, phaseIndex) => ({
      ...phase,
      id: phase.id || createId("phase"),
      title: String(phase.title || "").trim() || (phaseIndex === 0 ? "Tasks" : `Section ${phaseIndex + 1}`),
      tasks: (Array.isArray(phase.tasks) ? phase.tasks : [])
        .filter((task) => String(task?.title || "").trim())
        .map((task) =>
          normalizeTask({
            ...task,
            id: task.id || createId("task"),
            title: String(task.title).trim()
          })
        )
    }))
    .filter((phase) => phase.tasks.length > 0);

  return normalizeRoutine({
    ...draft,
    id: draft?.id || createId("routine"),
    title: String(draft?.title || "").trim() || "New routine",
    estimatedMinutes: minutes,
    estimatedTime: `${minutes} min`,
    archived: Boolean(draft?.archived),
    phases: phases.length
      ? phases
      : [
          {
            id: createId("phase"),
            title: "Tasks",
            tasks: []
          }
        ]
  });
}

function makeUniqueCopyTitle(title, siblingTitles) {
  const base = `${String(title || "Routine").trim() || "Routine"} Copy`;
  const used = new Set(siblingTitles.map(normalizedTitle));
  if (!used.has(normalizedTitle(base))) return base;
  let suffix = 2;
  while (used.has(normalizedTitle(`${base} ${suffix}`))) suffix += 1;
  return `${base} ${suffix}`;
}

export function duplicateRoutineForLibrary(routine, siblingTitles = []) {
  const copy = cloneDeep(routine);
  return normalizeRoutine({
    ...copy,
    id: createId("routine"),
    title: makeUniqueCopyTitle(routine?.title, siblingTitles),
    archived: false,
    phases: (copy.phases || []).map((phase) => ({
      ...phase,
      id: createId("phase"),
      tasks: (phase.tasks || []).map((task) => ({
        ...task,
        id: createId("task")
      }))
    }))
  });
}

export function isStructuredRoutine(routine) {
  return (routine?.phases?.length || 0) > 1;
}
`
);

write(
  "src/components/RoutineEditorDialog.jsx",
  `import { useEffect, useMemo, useRef, useState } from "react";
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
    (total, phase) => total + phase.tasks.filter((task) => task.title.trim()).length,
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
          {attemptedSave && titleError ? <p className="field-error">{titleError}</p> : null}

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
                        aria-label={`Task ${taskIndex + 1}${draft.phases.length > 1 ? ` in ${phase.title}` : ""}`}
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
            {attemptedSave && taskError ? <p className="field-error">{taskError}</p> : null}
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
`
);

write(
  "src/components/Routines.jsx",
  `import { useEffect, useMemo, useState } from "react";
import {
  formatRoutineDuration,
  getLastRoutineDoneLabel,
  getRoutineTotalTasks
} from "../utils/calculations.js";
import Checklist from "./Checklist.jsx";
import EmptyState from "./EmptyState.jsx";
import RoutineEditorDialog from "./RoutineEditorDialog.jsx";

export default function Routines({
  routines,
  history = [],
  activeSession,
  onStartRoutine,
  onSaveRoutine,
  onDuplicateRoutine,
  onToggleArchive,
  onDeleteRoutine,
  onAdvancedEdit
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorRoutineId, setEditorRoutineId] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");

  const referenceRoutines = useMemo(
    () =>
      routines.filter(
        (routine) => routine.id !== "daily-rules" && (showArchived || !routine.archived)
      ),
    [routines, showArchived]
  );
  const selectableRoutines = referenceRoutines.filter((routine) => !routine.archived);
  const selectedRoutine =
    referenceRoutines.find((routine) => routine.id === selectedRoutineId) ||
    selectableRoutines[0] ||
    referenceRoutines[0] ||
    null;
  const editorRoutine = routines.find((routine) => routine.id === editorRoutineId) || null;

  useEffect(() => {
    if (!selectedRoutine && referenceRoutines[0]) {
      setSelectedRoutineId(referenceRoutines[0].id);
    }
  }, [referenceRoutines, selectedRoutine]);

  function openCreate() {
    setEditorRoutineId("");
    setEditorOpen(true);
    setOpenMenuId("");
  }

  function openEdit(routineId) {
    setEditorRoutineId(routineId);
    setEditorOpen(true);
    setOpenMenuId("");
  }

  function saveRoutine(routine) {
    const savedId = onSaveRoutine(routine);
    setSelectedRoutineId(savedId || routine.id);
  }

  function startRoutine(routine) {
    if (!routine || routine.archived || getRoutineTotalTasks(routine) === 0) return;
    setOpenMenuId("");
    onStartRoutine(routine.id);
  }

  return (
    <div className="screen-stack routines-screen">
      <section className="panel routines-library-panel">
        <div className="routines-page-heading">
          <div>
            <p className="eyebrow">Reusable checklists</p>
            <h2>Routines</h2>
            <p>Start a familiar clean or create a checklist you can reuse.</p>
          </div>
          <button className="button primary" onClick={openCreate} type="button">
            New routine
          </button>
        </div>

        <div className="routines-toolbar">
          <span>
            {selectableRoutines.length} active {selectableRoutines.length === 1 ? "routine" : "routines"}
          </span>
          <button
            className={showArchived ? "button edit-action small" : "button ghost small"}
            onClick={() => setShowArchived((current) => !current)}
            type="button"
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
        </div>

        {referenceRoutines.length ? (
          <div className="routine-card-grid" role="list">
            {referenceRoutines.map((routine) => {
              const taskCount = getRoutineTotalTasks(routine);
              const isCurrent =
                activeSession?.routineId === routine.id && !routine.archived;
              const menuOpen = openMenuId === routine.id;
              return (
                <article
                  className={[
                    "routine-action-card",
                    selectedRoutine?.id === routine.id ? "selected" : "",
                    routine.archived ? "archived" : "",
                    isCurrent ? "current" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={routine.id}
                  role="listitem"
                >
                  <button
                    aria-label={`View ${routine.title}`}
                    className="routine-card-main"
                    onClick={() => setSelectedRoutineId(routine.id)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`routine-color-dot color-${routine.colorLabel || "none"}`}
                    />
                    <span className="routine-card-copy">
                      <strong>{routine.title}</strong>
                      <span>
                        {taskCount} {taskCount === 1 ? "task" : "tasks"} · {formatRoutineDuration(routine)}
                      </span>
                      <small>
                        {isCurrent ? "Current clean" : getLastRoutineDoneLabel(history, routine.id)}
                      </small>
                    </span>
                    {routine.archived ? <span className="status-pill compact">Archived</span> : null}
                  </button>

                  <div className="routine-card-actions">
                    <button
                      className="button primary small"
                      disabled={routine.archived || taskCount === 0}
                      onClick={() => startRoutine(routine)}
                      type="button"
                    >
                      {isCurrent ? "Continue" : "Start"}
                    </button>
                    <button
                      aria-expanded={menuOpen}
                      className="button ghost small"
                      onClick={() => setOpenMenuId(menuOpen ? "" : routine.id)}
                      type="button"
                    >
                      More
                    </button>
                  </div>

                  {menuOpen ? (
                    <div className="routine-card-menu">
                      <button onClick={() => openEdit(routine.id)} type="button">Edit</button>
                      <button
                        onClick={() => {
                          setOpenMenuId("");
                          onAdvancedEdit(routine.id);
                        }}
                        type="button"
                      >
                        Advanced structure
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId("");
                          const duplicateId = onDuplicateRoutine(routine.id);
                          if (duplicateId) setSelectedRoutineId(duplicateId);
                        }}
                        type="button"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId("");
                          onToggleArchive(routine.id);
                        }}
                        type="button"
                      >
                        {routine.archived ? "Restore" : "Archive"}
                      </button>
                      <button
                        className="danger-menu-item"
                        onClick={() => {
                          setOpenMenuId("");
                          onDeleteRoutine(routine.id);
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={showArchived ? "No routines" : "No active routines"}
            message="Create a reusable checklist for cleaning you repeat."
          />
        )}
      </section>

      {selectedRoutine ? (
        <section className="panel routine-detail-panel">
          <div className="routine-detail-heading">
            <div>
              <p className="eyebrow">Routine</p>
              <h2>{selectedRoutine.title}</h2>
              <p>
                {getRoutineTotalTasks(selectedRoutine)} tasks · {formatRoutineDuration(selectedRoutine)} · {getLastRoutineDoneLabel(history, selectedRoutine.id)}
              </p>
            </div>
            <div className="routine-detail-actions">
              <button
                className="button primary"
                disabled={selectedRoutine.archived || getRoutineTotalTasks(selectedRoutine) === 0}
                onClick={() => startRoutine(selectedRoutine)}
                type="button"
              >
                {activeSession?.routineId === selectedRoutine.id ? "Continue cleaning" : "Start routine"}
              </button>
              <button
                className="button ghost"
                onClick={() => openEdit(selectedRoutine.id)}
                type="button"
              >
                Edit routine
              </button>
            </div>
          </div>

          {getRoutineTotalTasks(selectedRoutine) ? (
            <div className="routine-detail-checklist">
              <Checklist
                collapsible
                completedTaskIds={[]}
                readonly
                routine={selectedRoutine}
                showTaskCountOnly
                startCollapsed
              />
            </div>
          ) : (
            <EmptyState
              title="This routine has no tasks"
              message="Add at least one task before starting it."
            />
          )}
        </section>
      ) : null}

      <RoutineEditorDialog
        onAdvancedEdit={onAdvancedEdit}
        onClose={() => setEditorOpen(false)}
        onSave={saveRoutine}
        open={editorOpen}
        routine={editorRoutine}
        routines={routines.filter((routine) => routine.id !== "daily-rules")}
      />
    </div>
  );
}
`
);

write(
  "src/styles/universal-phase3.css",
  `.routines-screen {
  max-width: 1080px;
  margin: 0 auto;
}

.routines-library-panel,
.routine-detail-panel {
  overflow: visible;
}

.routines-page-heading,
.routine-detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.routines-page-heading > div,
.routine-detail-heading > div:first-child {
  display: grid;
  gap: 0.35rem;
}

.routines-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.routine-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
}

.routine-action-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.85rem;
  background: var(--surface);
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.routine-action-card:hover,
.routine-action-card.selected {
  border-color: var(--accent-border-strong);
  box-shadow: 0 0 0 3px var(--selected-ring);
}

.routine-action-card.current {
  background: var(--accent-panel);
}

.routine-action-card.archived {
  opacity: 0.72;
}

.routine-card-main {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}

.routine-card-copy {
  display: grid;
  gap: 0.18rem;
}

.routine-card-copy strong {
  color: var(--text);
  font-size: 1rem;
}

.routine-card-copy span,
.routine-card-copy small {
  color: var(--muted);
}

.routine-card-actions,
.routine-detail-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.routine-card-menu {
  position: absolute;
  z-index: 10;
  top: calc(100% - 0.35rem);
  right: 0.75rem;
  display: grid;
  min-width: 190px;
  padding: 0.4rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.routine-card-menu button {
  min-height: 42px;
  border: 0;
  border-radius: 7px;
  padding: 0.6rem 0.7rem;
  background: transparent;
  color: var(--text);
  text-align: left;
}

.routine-card-menu button:hover,
.routine-card-menu button:focus-visible {
  background: var(--surface-soft);
}

.routine-card-menu .danger-menu-item {
  color: var(--danger);
}

.routine-detail-panel {
  display: grid;
  gap: 1rem;
}

.routine-detail-checklist {
  border-top: 1px solid var(--border);
  padding-top: 0.85rem;
}

.routine-editor-dialog {
  width: min(760px, calc(100vw - 2rem));
  max-height: min(88vh, 900px);
  overflow: auto;
}

.routine-editor-form,
.routine-editor-task-area,
.routine-editor-section {
  display: grid;
  gap: 0.85rem;
}

.duration-input-row {
  display: grid;
  grid-template-columns: minmax(0, 140px) auto;
  align-items: center;
  gap: 0.65rem;
}

.routine-editor-task-area {
  margin-top: 0.25rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.routine-editor-section h4 {
  margin: 0;
  color: var(--text-soft);
}

.routine-editor-task-list {
  display: grid;
  gap: 0.55rem;
}

.routine-editor-task-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;
}

.routine-editor-task-actions {
  display: flex;
  gap: 0.25rem;
}

.routine-editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.field-error {
  color: var(--danger);
  font-size: 0.85rem;
}

.session-compact-menu {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
}

@media (max-width: 760px) {
  .routine-card-grid {
    grid-template-columns: 1fr;
  }

  .routines-page-heading,
  .routine-detail-heading,
  .routine-editor-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .routines-page-heading .button.primary,
  .routine-detail-actions,
  .routine-detail-actions .button,
  .routine-editor-footer .dialog-actions,
  .routine-editor-footer .dialog-actions .button {
    width: 100%;
  }

  .routine-action-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .routine-card-actions {
    justify-content: stretch;
  }

  .routine-card-actions .button {
    flex: 1;
  }

  .routine-card-menu {
    position: fixed;
    inset: auto 0.75rem calc(var(--mobile-nav-height) + 0.75rem);
    max-height: 60vh;
    overflow: auto;
  }

  .routine-editor-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .routine-editor-dialog {
    width: 100%;
    max-height: calc(100dvh - 0.5rem);
    border-radius: 16px 16px 0 0;
  }

  .routine-editor-task-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .routine-editor-task-actions {
    justify-content: flex-end;
  }

  .session-compact-menu {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .routine-action-card {
    transition: none;
  }
}
`
);

write(
  "tests/universal-phase-3.test.js",
  `import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createSimpleRoutineDraft,
  duplicateRoutineForLibrary,
  hasDuplicateRoutineTitle,
  sanitizeRoutineDraft
} from "../src/utils/routineLibrary.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("simple routine drafts save into one ordinary Tasks section", () => {
  const draft = createSimpleRoutineDraft();
  draft.title = "Sunday clean";
  draft.estimatedMinutes = 25;
  draft.phases[0].tasks[0].title = "Clean shower";
  const saved = sanitizeRoutineDraft(draft);
  assert.equal(saved.title, "Sunday clean");
  assert.equal(saved.estimatedMinutes, 25);
  assert.equal(saved.phases.length, 1);
  assert.equal(saved.phases[0].title, "Tasks");
  assert.equal(saved.phases[0].tasks[0].title, "Clean shower");
});

test("routine editing preserves multiple existing sections", () => {
  const saved = sanitizeRoutineDraft({
    id: "routine-a",
    title: "Weekly clean",
    estimatedMinutes: 40,
    phases: [
      { id: "phase-a", title: "Kitchen", tasks: [{ id: "task-a", title: "Wipe counters" }] },
      { id: "phase-b", title: "Bathroom", tasks: [{ id: "task-b", title: "Clean sink" }] }
    ]
  });
  assert.deepEqual(saved.phases.map((phase) => phase.title), ["Kitchen", "Bathroom"]);
  assert.deepEqual(saved.phases.map((phase) => phase.tasks.length), [1, 1]);
});

test("routine duplicate receives independent routine, section, and task IDs", () => {
  const original = sanitizeRoutineDraft({
    id: "routine-a",
    title: "Weekly clean",
    estimatedMinutes: 40,
    phases: [{ id: "phase-a", title: "Tasks", tasks: [{ id: "task-a", title: "Vacuum" }] }]
  });
  const duplicate = duplicateRoutineForLibrary(original, [original.title, "Weekly clean Copy"]);
  assert.equal(duplicate.title, "Weekly clean Copy 2");
  assert.notEqual(duplicate.id, original.id);
  assert.notEqual(duplicate.phases[0].id, original.phases[0].id);
  assert.notEqual(duplicate.phases[0].tasks[0].id, original.phases[0].tasks[0].id);
});

test("routine title comparison is case-insensitive and ignores the current routine", () => {
  const routines = [
    { id: "a", title: "Weekly Clean" },
    { id: "b", title: "Quick tidy" }
  ];
  assert.equal(hasDuplicateRoutineTitle(" weekly clean ", routines), true);
  assert.equal(hasDuplicateRoutineTitle("weekly clean", routines, "a"), false);
});

test("Routines exposes direct Start and a simple editor while retaining Advanced structure", () => {
  const routines = textFile("../src/components/Routines.jsx");
  const editor = textFile("../src/components/RoutineEditorDialog.jsx");
  assert.match(routines, />Start</);
  assert.match(routines, /New routine/);
  assert.match(routines, /Advanced structure/);
  assert.match(routines, /onStartRoutine\(routine.id\)/);
  assert.match(editor, /Routine name/);
  assert.match(editor, /Estimated time/);
  assert.match(editor, /Create routine/);
  assert.doesNotMatch(editor, /Template|Today defaults/);
});

test("starting a routine requests focused cleaning on Today", () => {
  const app = textFile("../src/App.jsx");
  const dashboard = textFile("../src/components/Dashboard.jsx");
  assert.match(app, /autoOpenCleanModeSessionId/);
  assert.match(app, /setAutoOpenCleanModeSessionId\(nextSession.id\)/);
  assert.match(dashboard, /onAutoOpenCleanModeHandled/);
  assert.match(dashboard, /setCleanModeOpen\(true\)/);
});

test("Phase 3 styles load after earlier universal styles", () => {
  const main = textFile("../src/main.jsx");
  const phaseTwo = main.indexOf('"./styles/universal-phase2.css"');
  const phaseThree = main.indexOf('"./styles/universal-phase3.css"');
  assert.ok(phaseTwo >= 0);
  assert.ok(phaseThree > phaseTwo);
});
`
);

let app = read("src/App.jsx");
app = replaceOnce(
  app,
  `import {\n  createDefaultTemplate,\n  createTemplateExport,\n  normalizeTemplate,\n  validateTemplatePayload\n} from "./utils/templateUtils.js";`,
  `import {\n  createDefaultTemplate,\n  createTemplateExport,\n  normalizeTemplate,\n  validateTemplatePayload\n} from "./utils/templateUtils.js";\nimport {\n  duplicateRoutineForLibrary,\n  sanitizeRoutineDraft\n} from "./utils/routineLibrary.js";`,
  "App routine library import"
);
app = replaceOnce(
  app,
  `  const [pendingCompletionSessionId, setPendingCompletionSessionId] = useState(null);`,
  `  const [pendingCompletionSessionId, setPendingCompletionSessionId] = useState(null);\n  const [autoOpenCleanModeSessionId, setAutoOpenCleanModeSessionId] = useState(null);`,
  "App auto-open state"
);
app = replaceOnce(
  app,
  /  function startSession\(routineId = selectedRoutineId\) \{[\s\S]*?\n  \}\n\n  function pauseSession\(\) \{/,
  `  function saveRoutineFromLibrary(routineDraft) {\n    const savedRoutine = sanitizeRoutineDraft(routineDraft);\n    const exists = activeTemplate.routines.some((routine) => routine.id === savedRoutine.id);\n    updateActiveTemplate((template) => ({\n      ...template,\n      routines: exists\n        ? template.routines.map((routine) =>\n            routine.id === savedRoutine.id ? savedRoutine : routine\n          )\n        : [...template.routines, savedRoutine]\n    }));\n    setSelectedRoutineId(savedRoutine.id);\n    return savedRoutine.id;\n  }\n\n  function duplicateRoutineFromLibrary(routineId) {\n    const routine = getRoutineById(activeTemplate.routines, routineId);\n    if (!routine) return \"\";\n    const duplicate = duplicateRoutineForLibrary(\n      routine,\n      activeTemplate.routines\n        .filter((item) => item.id !== \"daily-rules\")\n        .map((item) => item.title)\n    );\n    updateActiveTemplate((template) => ({\n      ...template,\n      routines: [...template.routines, duplicate]\n    }));\n    setSelectedRoutineId(duplicate.id);\n    return duplicate.id;\n  }\n\n  function toggleRoutineArchiveFromLibrary(routineId) {\n    const routine = getRoutineById(activeTemplate.routines, routineId);\n    if (!routine) return;\n    if (\n      appState.activeSession?.templateId === activeTemplate.id &&\n      appState.activeSession?.routineId === routineId\n    ) {\n      requestConfirmation({\n        title: \"Routine is in use\",\n        message: `\"${routine.title}\" is used by the current clean. Finish or discard it before changing this routine.`,\n        confirmLabel: \"Keep routine\",\n        onConfirm: () => {}\n      });\n      return;\n    }\n\n    const applyArchive = () =>\n      updateActiveTemplate((template) => ({\n        ...template,\n        routines: template.routines.map((item) =>\n          item.id === routineId ? { ...item, archived: !routine.archived } : item\n        )\n      }));\n\n    if (routine.archived) {\n      applyArchive();\n      return;\n    }\n\n    requestConfirmation({\n      title: \"Archive routine?\",\n      message: `\"${routine.title}\" will be hidden from the main routine list. Progress is kept.`,\n      confirmLabel: \"Archive routine\",\n      onConfirm: applyArchive\n    });\n  }\n\n  function deleteRoutineFromLibrary(routineId) {\n    const routine = getRoutineById(activeTemplate.routines, routineId);\n    if (!routine) return;\n    if (\n      appState.activeSession?.templateId === activeTemplate.id &&\n      appState.activeSession?.routineId === routineId\n    ) {\n      requestConfirmation({\n        title: \"Routine is in use\",\n        message: `\"${routine.title}\" is used by the current clean. Finish or discard it before deleting this routine.`,\n        confirmLabel: \"Keep routine\",\n        onConfirm: () => {}\n      });\n      return;\n    }\n\n    requestConfirmation({\n      title: \"Delete routine?\",\n      message: `\"${routine.title}\" will be removed from this cleaning plan. Existing Progress entries are kept.`,\n      confirmLabel: \"Delete routine\",\n      onConfirm: () => {\n        const fallback = activeTemplate.routines.find(\n          (item) => item.id !== \"daily-rules\" && item.id !== routineId && !item.archived\n        );\n        updateActiveTemplate((template) => ({\n          ...template,\n          routines: template.routines.filter((item) => item.id !== routineId)\n        }));\n        setSelectedRoutineId(fallback?.id || \"\");\n      }\n    });\n  }\n\n  function openAdvancedRoutineEditor(routineId) {\n    setSelectedRoutineId(routineId);\n    openInternalEditor(\"routines\", \"routines\", `routine:${routineId}`);\n  }\n\n  function startSession(routineId = selectedRoutineId) {\n    const routine = getRoutineById(activeTemplate.routines, routineId);\n    if (!routine) return;\n\n    setSelectedRoutineId(routineId);\n\n    if (appState.activeSession) {\n      if (isSessionForRoutine(appState.activeSession, activeTemplate.id, routineId)) {\n        setCompletionSummary(null);\n        setAutoOpenCleanModeSessionId(appState.activeSession.id);\n        setCurrentView(\"dashboard\");\n        return;\n      }\n\n      const hasProgress =\n        (appState.activeSession.completedTaskIds || []).length > 0 ||\n        Boolean(appState.activeSession.notes?.trim());\n      requestConfirmation({\n        title: \"Replace current clean?\",\n        message: hasProgress\n          ? \"A current clean already has progress. Replacing it will discard that progress without saving it.\"\n          : \"A current clean already exists. Replacing it will discard that clean without saving it.\",\n        confirmLabel: \"Replace clean\",\n        onConfirm: () => {\n          const nextSession = createSession(routine, activeTemplate);\n          setAppState((current) => ({\n            ...current,\n            activeSession: nextSession\n          }));\n          setCompletionSummary(null);\n          setAutoOpenCleanModeSessionId(nextSession.id);\n          setCurrentView(\"dashboard\");\n        }\n      });\n      return;\n    }\n\n    const nextSession = createSession(routine, activeTemplate);\n    setAppState((current) => ({\n      ...current,\n      activeSession: nextSession\n    }));\n    setCompletionSummary(null);\n    setAutoOpenCleanModeSessionId(nextSession.id);\n    setCurrentView(\"dashboard\");\n  }\n\n  function pauseSession() {`,
  "App routine handlers and start flow"
);
app = replaceOnce(
  app,
  `      <Routines\n        routines={activeTemplate.routines}\n        history={appState.history}\n        onEditRoutines={() => openInternalEditor("routines", "routines")}\n        onAddRoutine={() => openInternalEditor("routines", "routines", "add-routine")}\n      />`,
  `      <Routines\n        routines={activeTemplate.routines}\n        history={appState.history}\n        activeSession={appState.activeSession}\n        onStartRoutine={startSession}\n        onSaveRoutine={saveRoutineFromLibrary}\n        onDuplicateRoutine={duplicateRoutineFromLibrary}\n        onToggleArchive={toggleRoutineArchiveFromLibrary}\n        onDeleteRoutine={deleteRoutineFromLibrary}\n        onAdvancedEdit={openAdvancedRoutineEditor}\n      />`,
  "App Routines props"
);
app = replaceOnce(
  app,
  `        onAddRoutine={() => openInternalEditor("routines", "dashboard", "add-routine")}\n      />`,
  `        onAddRoutine={() => openInternalEditor("routines", "dashboard", "add-routine")}\n        autoOpenCleanModeSessionId={autoOpenCleanModeSessionId}\n        onAutoOpenCleanModeHandled={() => setAutoOpenCleanModeSessionId(null)}\n      />`,
  "App Dashboard auto-open props"
);
write("src/App.jsx", app);

let customize = read("src/components/Customize.jsx");
customize = replaceOnce(
  customize,
  `function normalizeEditorSection(section) {`,
  `function getRoutineIntentId(entryIntent) {\n  return typeof entryIntent === \"string\" && entryIntent.startsWith(\"routine:\")\n    ? entryIntent.slice(8)\n    : \"\";\n}\n\nfunction normalizeEditorSection(section) {`,
  "Customize intent helper"
);
customize = replaceOnce(
  customize,
  `  const [selectedRoutineId, setSelectedRoutineId] = useState(\n    activeTemplate.routines.find((routine) => routine.id !== "daily-rules")?.id || ""\n  );`,
  `  const [selectedRoutineId, setSelectedRoutineId] = useState(() => {\n    const requestedId = getRoutineIntentId(entryIntent);\n    return (\n      activeTemplate.routines.find((routine) => routine.id === requestedId)?.id ||\n      activeTemplate.routines.find((routine) => routine.id !== \"daily-rules\")?.id ||\n      \"\"\n    );\n  });`,
  "Customize selected routine intent"
);
customize = replaceOnce(
  customize,
  `  useEffect(() => {\n    setActiveSection(normalizeEditorSection(initialSection));\n  }, [initialSection]);`,
  `  useEffect(() => {\n    setActiveSection(normalizeEditorSection(initialSection));\n    const requestedId = getRoutineIntentId(entryIntent);\n    if (requestedId && activeTemplate.routines.some((routine) => routine.id === requestedId)) {\n      setSelectedRoutineId(requestedId);\n    }\n  }, [activeTemplate.routines, entryIntent, initialSection]);`,
  "Customize intent effect"
);
write("src/components/Customize.jsx", customize);

let dashboard = read("src/components/Dashboard.jsx");
dashboard = replaceOnce(
  dashboard,
  `  onEditRoutines,\n  onAddRoutine\n}) {`,
  `  onEditRoutines,\n  onAddRoutine,\n  autoOpenCleanModeSessionId,\n  onAutoOpenCleanModeHandled\n}) {`,
  "Dashboard auto-open props"
);
dashboard = replaceOnce(
  dashboard,
  `  const [cleanModeOpen, setCleanModeOpen] = useState(false);`,
  `  const [cleanModeOpen, setCleanModeOpen] = useState(false);\n  const [sessionMoreOpen, setSessionMoreOpen] = useState(false);`,
  "Dashboard session more state"
);
dashboard = replaceOnce(
  dashboard,
  `  useEffect(() => {\n    if (cleanModeOpen && !cleanModeAvailable) {\n      setCleanModeOpen(false);\n    }\n  }, [cleanModeAvailable, cleanModeOpen]);`,
  `  useEffect(() => {\n    if (cleanModeOpen && !cleanModeAvailable) {\n      setCleanModeOpen(false);\n    }\n  }, [cleanModeAvailable, cleanModeOpen]);\n\n  useEffect(() => {\n    if (!autoOpenCleanModeSessionId || !activeSession) return;\n    if (activeSession.id !== autoOpenCleanModeSessionId) return;\n    if (cleanModeAvailable) setCleanModeOpen(true);\n    onAutoOpenCleanModeHandled?.();\n  }, [\n    activeSession,\n    autoOpenCleanModeSessionId,\n    cleanModeAvailable,\n    onAutoOpenCleanModeHandled\n  ]);`,
  "Dashboard auto-open effect"
);
dashboard = replaceOnce(
  dashboard,
  `  function resumeAndScroll() {\n    if (activeSession?.paused) onResumeSession?.();\n    scrollToSession();\n  }`,
  `  function continueRoutineCleaning() {\n    if (activeSession?.paused) onResumeSession?.();\n    setSessionMoreOpen(false);\n    if (cleanModeAvailable) {\n      setCleanModeOpen(true);\n      return;\n    }\n    scrollToSession();\n  }`,
  "Dashboard continue cleaning function"
);
dashboard = replaceOnce(
  dashboard,
  /          <div className="card-actions compact-actions session-resume-actions">[\s\S]*?          <\/div>\n        <\/section>/,
  `          <div className="card-actions compact-actions session-resume-actions">\n            <button\n              className="button primary small"\n              onClick={continueRoutineCleaning}\n              type="button"\n            >\n              {activeSession.paused ? \"Resume cleaning\" : \"Continue cleaning\"}\n            </button>\n            <button\n              aria-expanded={sessionMoreOpen}\n              className="button ghost small"\n              onClick={() => setSessionMoreOpen((open) => !open)}\n              type="button"\n            >\n              More\n            </button>\n          </div>\n          {sessionMoreOpen ? (\n            <div className="session-compact-menu">\n              <button className="button ghost small" onClick={scrollToSession} type="button">\n                View full checklist\n              </button>\n              {activeSession.paused ? (\n                <button className="button ghost small" onClick={onResumeSession} type="button">\n                  Resume timer\n                </button>\n              ) : (\n                <button className="button ghost small" onClick={onPauseSession} type="button">\n                  Pause timer\n                </button>\n              )}\n              <button className="button ghost small" onClick={onFinishSession} type="button">\n                {activeFinishLabel === \"Finish\" ? \"Finish clean\" : \"Stop and save\"}\n              </button>\n              <button className="button danger-ghost small" onClick={onCancelSession} type="button">\n                Discard session\n              </button>\n            </div>\n          ) : null}\n        </section>`,
  "Dashboard compact current clean card"
);
write("src/components/Dashboard.jsx", dashboard);

let main = read("src/main.jsx");
main = replaceOnce(
  main,
  `import "./styles/universal-phase2.css";`,
  `import "./styles/universal-phase2.css";\nimport "./styles/universal-phase3.css";`,
  "main Phase 3 style import"
);
write("src/main.jsx", main);

let help = read("src/components/HelpGuide.jsx");
help = help.replace(
  "Routines are reusable cleaning checklists. Start them from Today → More → Start a routine, or edit them from Routines.",
  "Routines are reusable cleaning checklists. Start, create, or edit them directly from Routines."
);
write("src/components/HelpGuide.jsx", help);

console.log("Phase 3 source transformation completed.");
