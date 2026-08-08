import { useEffect, useMemo, useRef, useState } from "react";
import { routineStarterTemplates, suggestionRooms } from "../data/taskSuggestions.js";
import useDialogFocus from "../hooks/useDialogFocus.js";
import {
  addSuggestedTaskToDraft,
  appendParsedTaskText,
  createBlankRoutineTask,
  createRoutineDraftFromTemplate,
  createRoutineEditorDraft,
  estimateRoutineMinutes,
  getTaskSuggestions,
  hasDuplicateRoutineTitle,
  optimizeRoutineTaskOrder,
  parseRoutineTaskText,
  sanitizeRoutineDraft
} from "../utils/routineLibrary.js";

function moveItem(items, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function countTasks(phases = []) {
  return phases.reduce(
    (total, phase) =>
      total + phase.tasks.filter((task) => String(task?.title || "").trim()).length,
    0
  );
}

export default function RoutineEditorDialog({
  open,
  routine,
  routines = [],
  onSave,
  onClose,
  onAdvancedEdit
}) {
  const nameInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const firstTaskInputRef = useRef(null);
  const addTaskButtonRef = useRef(null);
  const taskInputRefs = useRef(new Map());
  const dialogRef = useDialogFocus({
    open,
    onClose,
    initialFocusRef: nameInputRef
  });
  const [draft, setDraft] = useState(() => createRoutineEditorDraft(routine));
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [suggestionRoom, setSuggestionRoom] = useState("All");
  const [autoDuration, setAutoDuration] = useState(!routine);
  const [draggedTask, setDraggedTask] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDraft(createRoutineEditorDraft(routine));
    setAttemptedSave(false);
    setBulkText("");
    setBulkMessage("");
    setSuggestionQuery("");
    setSuggestionRoom("All");
    setAutoDuration(!routine);
    setDraggedTask(null);
  }, [open, routine?.id]);

  useEffect(() => {
    if (!open || !autoDuration) return;
    const minutes = estimateRoutineMinutes(draft);
    setDraft((current) => {
      if (Number(current.estimatedMinutes) === minutes) return current;
      return {
        ...current,
        estimatedMinutes: minutes,
        estimatedTime: `${minutes} min`
      };
    });
  }, [autoDuration, draft.phases, open]);

  const titleError = useMemo(() => {
    if (!String(draft.title || "").trim()) return "Routine name is required.";
    if (hasDuplicateRoutineTitle(draft.title, routines, draft.id)) {
      return "A routine with this name already exists.";
    }
    return "";
  }, [draft.id, draft.title, routines]);

  const durationError = useMemo(() => {
    if (autoDuration) return "";
    const numeric = Number(draft.estimatedMinutes);
    if (!Number.isFinite(numeric)) return "Use a number of minutes.";
    if (numeric < 1 || numeric > 600) return "Use between 1 and 600 minutes.";
    return "";
  }, [autoDuration, draft.estimatedMinutes]);

  const taskCount = countTasks(draft.phases);
  const taskError = taskCount ? "" : "Add at least one task.";
  const canSave = !titleError && !durationError && !taskError;
  const firstRenderedTask = draft.phases
    .flatMap((phase) => phase.tasks.map((task) => ({ phaseId: phase.id, taskId: task.id })))
    .find(Boolean) || null;
  const suggestions = useMemo(
    () => getTaskSuggestions(suggestionQuery, suggestionRoom, 18),
    [suggestionQuery, suggestionRoom]
  );
  const automaticMinutes = estimateRoutineMinutes(draft);
  const bulkPreview = useMemo(() => parseRoutineTaskText(bulkText), [bulkText]);

  if (!open) return null;

  function updatePhase(phaseId, updater) {
    setDraft((current) => ({
      ...current,
      phases: current.phases.map((phase) =>
        phase.id === phaseId ? updater(phase) : phase
      )
    }));
  }

  function focusTask(taskId) {
    window.requestAnimationFrame(() => taskInputRefs.current.get(taskId)?.focus());
  }

  function addTask(phaseId, afterIndex = null) {
    const task = createBlankRoutineTask();
    updatePhase(phaseId, (phase) => {
      const tasks = [...phase.tasks];
      if (afterIndex === null || afterIndex < 0 || afterIndex >= tasks.length) tasks.push(task);
      else tasks.splice(afterIndex + 1, 0, task);
      return { ...phase, tasks };
    });
    focusTask(task.id);
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

  function moveDraggedTask(targetPhaseId, targetTaskId) {
    if (!draggedTask) return;
    setDraft((current) => {
      const next = {
        ...current,
        phases: current.phases.map((phase) => ({ ...phase, tasks: [...phase.tasks] }))
      };
      const sourcePhase = next.phases.find((phase) => phase.id === draggedTask.phaseId);
      const targetPhase = next.phases.find((phase) => phase.id === targetPhaseId);
      if (!sourcePhase || !targetPhase) return current;
      const sourceIndex = sourcePhase.tasks.findIndex((task) => task.id === draggedTask.taskId);
      if (sourceIndex < 0) return current;
      const [task] = sourcePhase.tasks.splice(sourceIndex, 1);
      let targetIndex = targetPhase.tasks.findIndex((item) => item.id === targetTaskId);
      if (targetIndex < 0) targetIndex = targetPhase.tasks.length;
      if (sourcePhase.id === targetPhase.id && sourceIndex < targetIndex) targetIndex -= 1;
      targetPhase.tasks.splice(targetIndex, 0, task);
      return next;
    });
    setDraggedTask(null);
  }

  function addBulkTasks() {
    if (!bulkPreview.taskCount) {
      setBulkMessage("Paste at least one task.");
      return;
    }
    const before = taskCount;
    setDraft((current) => appendParsedTaskText(current, bulkText));
    setBulkText("");
    window.requestAnimationFrame(() => {
      setBulkMessage(
        `${bulkPreview.taskCount} task${bulkPreview.taskCount === 1 ? "" : "s"} processed. Existing duplicates were skipped.`
      );
    });
    if (before === 0) setAttemptedSave(false);
  }

  function handleTaskPaste(event, phase, task) {
    const text = event.clipboardData?.getData("text") || "";
    if (!/\r?\n/.test(text)) return;
    event.preventDefault();
    setDraft((current) => {
      let base = current;
      if (!String(task.title || "").trim()) {
        base = {
          ...current,
          phases: current.phases.map((item) =>
            item.id === phase.id
              ? { ...item, tasks: item.tasks.filter((entry) => entry.id !== task.id) }
              : item
          )
        };
      }
      const prefixed = `${phase.title || "Tasks"}:\n${text}`;
      return appendParsedTaskText(base, prefixed);
    });
    setBulkMessage("Pasted lines were added as separate tasks.");
  }

  function applyStarterTemplate(templateId) {
    setDraft(createRoutineDraftFromTemplate(templateId));
    setAutoDuration(true);
    setAttemptedSave(false);
    setBulkMessage("Starter loaded. Edit anything before saving.");
  }

  function addSuggestion(suggestion) {
    setDraft((current) => addSuggestedTaskToDraft(current, suggestion));
  }

  function addRoomPack() {
    if (suggestionRoom === "All") return;
    const roomSuggestions = getTaskSuggestions("", suggestionRoom, 100);
    setDraft((current) =>
      roomSuggestions.reduce(
        (next, suggestion) => addSuggestedTaskToDraft(next, suggestion),
        current
      )
    );
    setBulkMessage(`Recommended ${suggestionRoom} tasks added. Existing duplicates were skipped.`);
  }

  function submit(event) {
    event.preventDefault();
    setAttemptedSave(true);
    if (!canSave) {
      window.requestAnimationFrame(() => {
        if (titleError) nameInputRef.current?.focus();
        else if (durationError) durationInputRef.current?.focus();
        else if (taskError) {
          if (firstTaskInputRef.current) firstTaskInputRef.current.focus();
          else addTaskButtonRef.current?.focus();
        }
      });
      return;
    }
    const finalDraft = autoDuration
      ? {
          ...draft,
          estimatedMinutes: automaticMinutes,
          estimatedTime: `${automaticMinutes} min`
        }
      : draft;
    onSave(sanitizeRoutineDraft(finalDraft));
    onClose();
  }

  return (
    <div className="dialog-backdrop routine-editor-backdrop" role="presentation">
      <section
        aria-labelledby="routine-editor-title"
        aria-modal="true"
        className="dialog routine-editor-dialog routine-editor-workspace"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header routine-editor-workspace-header">
          <div>
            <p className="eyebrow">{routine ? "Routine" : "New routine"}</p>
            <h2 id="routine-editor-title">
              {routine ? "Edit routine" : "Build a routine"}
            </h2>
            <p>
              Paste a whole checklist, use suggestions, or type quickly. You do not need to add tasks one by one.
            </p>
          </div>
          <button
            aria-label="Close routine editor"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="routine-editor-form routine-editor-workspace-body" onSubmit={submit} noValidate>
          {!routine ? (
            <section className="routine-fast-start" aria-labelledby="routine-fast-start-title">
              <div className="section-heading compact-heading">
                <div>
                  <h3 id="routine-fast-start-title">Start faster</h3>
                  <p>Use an example as a starting point, then change anything.</p>
                </div>
              </div>
              <div className="routine-template-grid">
                {routineStarterTemplates.map((template) => (
                  <button
                    className="routine-template-card"
                    key={template.id}
                    onClick={() => applyStarterTemplate(template.id)}
                    type="button"
                  >
                    <strong>{template.title}</strong>
                    <small>{template.description}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="routine-editor-basics">
            <label className="field-label" htmlFor="routine-editor-name">
              Routine name
              <input
                aria-describedby={attemptedSave && titleError ? "routine-name-error" : undefined}
                aria-invalid={attemptedSave && Boolean(titleError)}
                autoComplete="off"
                id="routine-editor-name"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Sunday clean"
                ref={nameInputRef}
                type="text"
                value={draft.title}
              />
            </label>
            {attemptedSave && titleError ? (
              <p className="field-error" id="routine-name-error" role="alert">
                {titleError}
              </p>
            ) : null}

            <div className="routine-duration-control">
              <div>
                <span className="field-label">Estimated time</span>
                <strong>{autoDuration ? `About ${automaticMinutes} min` : `${draft.estimatedMinutes || "—"} min`}</strong>
              </div>
              <div className="setting-segmented" role="group" aria-label="Routine time estimate">
                <button
                  aria-pressed={autoDuration}
                  className={autoDuration ? "button edit-action small" : "button ghost small"}
                  onClick={() => setAutoDuration(true)}
                  type="button"
                >
                  Automatic
                </button>
                <button
                  aria-pressed={!autoDuration}
                  className={!autoDuration ? "button edit-action small" : "button ghost small"}
                  onClick={() => setAutoDuration(false)}
                  type="button"
                >
                  Manual
                </button>
              </div>
              {!autoDuration ? (
                <label className="duration-input-row" htmlFor="routine-editor-duration">
                  <input
                    aria-describedby={attemptedSave && durationError ? "routine-duration-error" : undefined}
                    aria-invalid={attemptedSave && Boolean(durationError)}
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
                    ref={durationInputRef}
                    type="number"
                    value={draft.estimatedMinutes}
                  />
                  <span>minutes</span>
                </label>
              ) : null}
            </div>
            {attemptedSave && durationError ? (
              <p className="field-error" id="routine-duration-error" role="alert">
                {durationError}
              </p>
            ) : null}
          </div>

          <section className="routine-bulk-builder" aria-labelledby="routine-bulk-title">
            <div className="section-heading compact-heading">
              <div>
                <h3 id="routine-bulk-title">Paste a list</h3>
                <p>One task per line. Bullets, numbered lists, Markdown checkboxes, and headings such as “Kitchen:” are understood.</p>
              </div>
              {bulkPreview.taskCount ? (
                <span className="task-count">{bulkPreview.taskCount} ready</span>
              ) : null}
            </div>
            <textarea
              aria-label="Bulk routine task list"
              onChange={(event) => setBulkText(event.target.value)}
              placeholder={"Kitchen:\nClear dishes\nWipe counters\nClean sink\n\nBathroom:\n- [ ] Clean toilet\n- [ ] Clean mirror"}
              rows="7"
              value={bulkText}
            />
            <div className="routine-bulk-actions">
              <button
                className="button primary"
                disabled={!bulkPreview.taskCount}
                onClick={addBulkTasks}
                type="button"
              >
                Add {bulkPreview.taskCount || "list"} {bulkPreview.taskCount === 1 ? "task" : "tasks"}
              </button>
              <small>Duplicate task names already in this routine are skipped.</small>
            </div>
          </section>

          <details className="routine-suggestion-builder">
            <summary>
              <span>
                <strong>Pick common cleaning tasks</strong>
                <small>Search the built-in suggestions instead of typing.</small>
              </span>
              <span aria-hidden="true">+</span>
            </summary>
            <div className="routine-suggestion-body">
              <div className="routine-suggestion-controls">
                <input
                  aria-label="Search cleaning task suggestions"
                  onChange={(event) => setSuggestionQuery(event.target.value)}
                  placeholder="Search sink, mirror, vacuum…"
                  type="search"
                  value={suggestionQuery}
                />
                <select
                  aria-label="Filter suggestions by room"
                  onChange={(event) => setSuggestionRoom(event.target.value)}
                  value={suggestionRoom}
                >
                  {suggestionRooms.map((room) => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
                {suggestionRoom !== "All" ? (
                  <button className="button ghost" onClick={addRoomPack} type="button">
                    Add recommended {suggestionRoom} tasks
                  </button>
                ) : null}
              </div>
              <div className="routine-suggestion-grid">
                {suggestions.map((suggestion) => (
                  <button
                    className="routine-suggestion-card"
                    key={`${suggestion.room}-${suggestion.title}`}
                    onClick={() => addSuggestion(suggestion)}
                    type="button"
                  >
                    <span>
                      <strong>{suggestion.title}</strong>
                      <small>{suggestion.room} · ~{suggestion.minutes} min</small>
                    </span>
                    <span aria-hidden="true">+</span>
                  </button>
                ))}
              </div>
            </div>
          </details>

          <div className="routine-editor-task-area">
            <div className="section-heading compact-heading routine-task-heading">
              <div>
                <h3>Your checklist</h3>
                <p>Press Enter for another row. Paste multiple lines into any task to add them all at once.</p>
              </div>
              <div className="routine-task-heading-actions">
                <span className="task-count">{taskCount} {taskCount === 1 ? "task" : "tasks"}</span>
                {taskCount > 1 ? (
                  <button
                    className="button ghost small"
                    onClick={() => {
                      setDraft((current) => optimizeRoutineTaskOrder(current));
                      setBulkMessage("Tasks optimized into a sensible cleaning order within each section.");
                    }}
                    type="button"
                  >
                    Optimize order
                  </button>
                ) : null}
              </div>
            </div>

            {draft.phases.map((phase, phaseIndex) => (
              <section className="routine-editor-section" key={phase.id}>
                {draft.phases.length > 1 ? <h4>{phase.title}</h4> : null}
                <div className="routine-editor-task-list">
                  {phase.tasks.map((task, taskIndex) => {
                    const isFirstTask =
                      firstRenderedTask?.phaseId === phase.id &&
                      firstRenderedTask?.taskId === task.id;
                    return (
                      <div
                        className="routine-editor-task-row"
                        key={task.id}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => moveDraggedTask(phase.id, task.id)}
                      >
                        <span
                          aria-hidden="true"
                          className="routine-drag-handle"
                          draggable="true"
                          onDragEnd={() => setDraggedTask(null)}
                          onDragStart={() => setDraggedTask({ phaseId: phase.id, taskId: task.id })}
                          title="Drag to reorder"
                        >
                          ⋮⋮
                        </span>
                        <input
                          aria-describedby={attemptedSave && taskError && isFirstTask ? "routine-task-error" : undefined}
                          aria-invalid={attemptedSave && Boolean(taskError) && isFirstTask}
                          aria-label={`Task ${taskIndex + 1}${draft.phases.length > 1 ? ` in ${phase.title}` : ""}`}
                          onChange={(event) => updateTask(phase.id, task.id, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              addTask(phase.id, taskIndex);
                            }
                          }}
                          onPaste={(event) => handleTaskPaste(event, phase, task)}
                          placeholder="Add a cleaning task"
                          ref={(node) => {
                            if (node) taskInputRefs.current.set(task.id, node);
                            else taskInputRefs.current.delete(task.id);
                            if (isFirstTask) firstTaskInputRef.current = node;
                          }}
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
                    );
                  })}
                </div>
                <button
                  className="button ghost small"
                  onClick={() => addTask(phase.id)}
                  ref={phaseIndex === 0 ? addTaskButtonRef : undefined}
                  type="button"
                >
                  + Add task{draft.phases.length > 1 ? ` to ${phase.title}` : ""}
                </button>
              </section>
            ))}
            {attemptedSave && taskError ? (
              <p className="field-error" id="routine-task-error" role="alert">
                {taskError}
              </p>
            ) : null}
            {bulkMessage ? <p className="form-message" role="status">{bulkMessage}</p> : null}
          </div>

          <div className="routine-editor-footer routine-editor-sticky-footer">
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
              <span className="routine-save-summary">
                {taskCount} {taskCount === 1 ? "task" : "tasks"} · ~{autoDuration ? automaticMinutes : draft.estimatedMinutes || "—"} min
              </span>
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
