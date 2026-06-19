import { useEffect, useMemo, useRef, useState } from "react";
import { getRoutineTotalTasks } from "../../utils/calculations.js";
import { createPhase, createRoutine, createTask, moveItem } from "../../utils/routineUtils.js";
import { createId, priorityOptions, routineColorOptions } from "../../utils/templateUtils.js";
import DailyRulesSection from "./DailyRulesSection.jsx";

function normalizeName(value) {
  return (value || "").trim().toLowerCase();
}

function hasDuplicateName(current, allNames) {
  const name = normalizeName(current);
  return Boolean(name) && allNames.some((item) => normalizeName(item) === name);
}

function makeUniqueName(value, siblingNames, fallback) {
  const base = value.trim() || fallback;
  if (!hasDuplicateName(base, siblingNames)) return base;

  let suffix = 2;
  let next = `${base} ${suffix}`;
  while (hasDuplicateName(next, siblingNames)) {
    suffix += 1;
    next = `${base} ${suffix}`;
  }
  return next;
}

function getRoutineTitleError(routine, routines) {
  if (!routine) return "";
  if (!routine.title.trim()) return "Routine name is required.";
  const siblings = routines.filter((item) => item.id !== routine.id).map((item) => item.title);
  return hasDuplicateName(routine.title, siblings) ? "Routine name already exists." : "";
}

function getPhaseTitleError(phase, phases) {
  if (!phase) return "";
  if (!phase.title.trim()) return "Phase name is required.";
  const siblings = phases.filter((item) => item.id !== phase.id).map((item) => item.title);
  return hasDuplicateName(phase.title, siblings) ? "Phase name already exists." : "";
}

function getRoutineMinutes(routine) {
  const value = Number(routine?.estimatedMinutes);
  if (Number.isFinite(value) && value > 0) return Math.round(value);
  const match = String(routine?.estimatedTime || "").match(/(\d+)/);
  return match ? Math.max(1, Math.min(600, Number(match[1]))) : 30;
}

function getDurationError(value) {
  if (String(value).trim() === "") return "Duration is required.";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Use a number of minutes.";
  if (numeric < 1) return "Use at least 1 minute.";
  if (numeric > 600) return "Use 600 minutes or less.";
  return "";
}

function duplicateTask(task) {
  return {
    ...task,
    id: createId("task")
  };
}

function duplicatePhase(phase) {
  return {
    ...phase,
    id: createId("phase"),
    tasks: phase.tasks.map(duplicateTask)
  };
}

function createRoutineDuplicate(routine, siblingNames) {
  const title = makeUniqueName(`${routine.title} Copy`, siblingNames, "Routine Copy");
  return {
    ...routine,
    id: createId("routine"),
    title,
    archived: false,
    phases: routine.phases.map(duplicatePhase)
  };
}

export default function RoutinesSection({
  routines,
  todayDefaults = [],
  todayWeekdayDefaultsEnabled = false,
  todayWeekdayDefaults = {},
  selectedRoutine,
  selectedRoutineId,
  canEdit,
  onSelectRoutine,
  onEditTemplate,
  onConfirmEdit,
  activeSession,
  templateId,
  autoAddRoutine = false,
  initialEditorTab = "routines"
}) {
  const autoAddHandled = useRef(false);
  const [editorTab, setEditorTab] = useState(initialEditorTab);
  const [durationDraft, setDurationDraft] = useState("");
  const [routineReorderMode, setRoutineReorderMode] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [phaseEditorOpen, setPhaseEditorOpen] = useState(false);
  const visibleRoutines = useMemo(
    () =>
      routines.filter(
        (routine) => routine.id !== "daily-rules" && (showArchived || !routine.archived)
      ),
    [routines, showArchived]
  );
  const [selectedPhaseId, setSelectedPhaseId] = useState(selectedRoutine?.phases[0]?.id || "");
  const selectedPhase = useMemo(() => {
    return (
      selectedRoutine?.phases.find((phase) => phase.id === selectedPhaseId) ||
      selectedRoutine?.phases[0] ||
      null
    );
  }, [selectedRoutine, selectedPhaseId]);
  const selectedPhaseIndex = selectedPhase
    ? selectedRoutine.phases.findIndex((phase) => phase.id === selectedPhase.id)
    : -1;
  const routineTitleError = getRoutineTitleError(selectedRoutine, visibleRoutines);
  const routineDurationError = selectedRoutine ? getDurationError(durationDraft) : "";
  const phaseTitleError =
    selectedRoutine && selectedPhase
      ? getPhaseTitleError(selectedPhase, selectedRoutine.phases)
      : "";

  useEffect(() => {
    if (!selectedRoutine) {
      setSelectedPhaseId("");
      setPhaseEditorOpen(false);
      return;
    }
    if (!selectedPhase && selectedRoutine.phases[0]) {
      setSelectedPhaseId(selectedRoutine.phases[0].id);
    }
  }, [selectedRoutine, selectedPhase]);

  useEffect(() => {
    if (!autoAddRoutine || autoAddHandled.current || !canEdit) return;
    autoAddHandled.current = true;
    setEditorTab("routines");
    addRoutine();
  }, [autoAddRoutine, canEdit]);

  useEffect(() => {
    setEditorTab(initialEditorTab);
  }, [initialEditorTab]);

  useEffect(() => {
    if (!selectedRoutine) {
      setDurationDraft("");
      return;
    }
    setDurationDraft(String(getRoutineMinutes(selectedRoutine)));
  }, [selectedRoutine?.id, selectedRoutine?.estimatedMinutes]);

  useEffect(() => {
    if (selectedRoutine?.archived) {
      setShowArchived(true);
    }
  }, [selectedRoutine?.archived]);

  function editSelectedRoutine(mutator) {
    if (!selectedRoutine) return;
    onEditTemplate((draft) => {
      const routine = draft.routines.find((item) => item.id === selectedRoutine.id);
      if (routine) mutator(routine);
    });
  }

  function addRoutine() {
    const routine = createRoutine();
    onEditTemplate((draft) => {
      draft.routines.push(routine);
    });
    onSelectRoutine(routine.id);
    setSelectedPhaseId(routine.phases[0]?.id || "");
    setPhaseEditorOpen(true);
  }

  function selectRoutine(routine) {
    onSelectRoutine(routine.id);
    setSelectedPhaseId(routine.phases[0]?.id || "");
    setPhaseEditorOpen(false);
  }

  function updateRoutine(field, value) {
    editSelectedRoutine((routine) => {
      routine[field] = value;
    });
  }

  function updateRoutineDuration(value) {
    setDurationDraft(value);
    if (getDurationError(value)) return;
    const minutes = Math.round(Number(value));
    editSelectedRoutine((routine) => {
      routine.estimatedMinutes = minutes;
      routine.estimatedTime = `${minutes} min`;
    });
  }

  function normalizeRoutineDuration() {
    if (!selectedRoutine) return;
    if (getDurationError(durationDraft)) {
      setDurationDraft(String(getRoutineMinutes(selectedRoutine)));
    }
  }

  function duplicateRoutine(routine) {
    if (!routine || !canEdit) return;
    const siblingNames = visibleRoutines.map((item) => item.title);
    const duplicate = createRoutineDuplicate(routine, siblingNames);
    onEditTemplate((draft) => {
      const index = draft.routines.findIndex((item) => item.id === routine.id);
      draft.routines.splice(index + 1, 0, duplicate);
    });
    onSelectRoutine(duplicate.id);
    setSelectedPhaseId(duplicate.phases[0]?.id || "");
  }

  function archiveRoutine(routine) {
    if (!routine || !canEdit) return;
    if (
      activeSession?.templateId === templateId &&
      activeSession?.routineId === routine.id
    ) {
      onConfirmEdit({
        title: "Routine is in use",
        message: `"${routine.title}" is used by the active session. Finish or discard that session before archiving this routine.`,
        confirmLabel: "Keep routine",
        edit: () => {}
      });
      return;
    }

    onConfirmEdit({
      title: "Archive routine?",
      message: `"${routine.title}" will be hidden from Dashboard and the main Routines list. History is kept.`,
      confirmLabel: "Archive routine",
      edit: (draft) => {
        const item = draft.routines.find((candidate) => candidate.id === routine.id);
        if (item) item.archived = true;
      }
    });
  }

  function unarchiveRoutine(routine) {
    if (!routine || !canEdit) return;
    onEditTemplate((draft) => {
      const item = draft.routines.find((candidate) => candidate.id === routine.id);
      if (item) item.archived = false;
    });
  }

  function moveRoutine(index, direction) {
    const routine = visibleRoutines[index];
    const targetRoutine = visibleRoutines[index + direction];
    if (!routine || !targetRoutine) return;
    onEditTemplate((draft) => {
      const currentIndex = draft.routines.findIndex((item) => item.id === routine.id);
      const targetIndex = draft.routines.findIndex((item) => item.id === targetRoutine.id);
      if (currentIndex < 0 || targetIndex < 0) return;
      [draft.routines[currentIndex], draft.routines[targetIndex]] = [
        draft.routines[targetIndex],
        draft.routines[currentIndex]
      ];
    });
  }

  function deleteRoutine(routine, index = visibleRoutines.findIndex((item) => item.id === routine?.id)) {
    if (
      activeSession?.templateId === templateId &&
      activeSession?.routineId === routine.id
    ) {
      onConfirmEdit({
        title: "Routine is in use",
        message: `"${routine.title}" is used by the active session. Finish or discard that session before deleting this routine.`,
        confirmLabel: "Keep routine",
        edit: () => {}
      });
      return;
    }

    const originalIndex = routines.findIndex((item) => item.id === routine.id);
    const fallback = visibleRoutines[index + 1] || visibleRoutines[index - 1] || null;
    onConfirmEdit({
      title: "Delete routine?",
      message: `"${routine.title}" will be removed from this template.`,
      confirmLabel: "Delete routine",
      edit: (draft) => {
        draft.routines.splice(originalIndex, 1);
      },
      afterConfirm: () => onSelectRoutine(fallback?.id || "")
    });
  }

  function addPhase() {
    const phase = createPhase();
    editSelectedRoutine((routine) => {
      routine.phases.push(phase);
    });
    setSelectedPhaseId(phase.id);
    setPhaseEditorOpen(true);
  }

  function updatePhase(phaseIndex, value) {
    editSelectedRoutine((routine) => {
      routine.phases[phaseIndex].title = value;
    });
  }

  function normalizeRoutineTitle() {
    if (!selectedRoutine) return;
    const title = makeUniqueName(
      selectedRoutine.title,
      visibleRoutines.filter((routine) => routine.id !== selectedRoutine.id).map((routine) => routine.title),
      "New routine"
    );
    if (title !== selectedRoutine.title) updateRoutine("title", title);
  }

  function normalizePhaseTitle(phaseIndex) {
    if (!selectedRoutine) return;
    const phase = selectedRoutine.phases[phaseIndex];
    if (!phase) return;
    const title = makeUniqueName(
      phase.title,
      selectedRoutine.phases
        .filter((item) => item.id !== phase.id)
        .map((item) => item.title),
      "New phase"
    );
    if (title !== phase.title) updatePhase(phaseIndex, title);
  }

  function normalizeTaskTitle(phaseIndex, taskIndex) {
    const task = selectedRoutine?.phases?.[phaseIndex]?.tasks?.[taskIndex];
    if (!task) return;
    const title = task.title.trim() || "New task";
    if (title !== task.title) updateTask(phaseIndex, taskIndex, "title", title);
  }

  function movePhase(phaseIndex, direction) {
    editSelectedRoutine((routine) => {
      routine.phases = moveItem(routine.phases, phaseIndex, direction);
    });
  }

  function deletePhase(phase, phaseIndex) {
    const fallback = selectedRoutine.phases[phaseIndex + 1] || selectedRoutine.phases[phaseIndex - 1] || null;
    onConfirmEdit({
      title: "Delete phase?",
      message: `"${phase.title}" and its tasks will be removed from this routine.`,
      confirmLabel: "Delete phase",
      edit: (draft) => {
        const routine = draft.routines.find((item) => item.id === selectedRoutine.id);
        routine?.phases.splice(phaseIndex, 1);
      },
      afterConfirm: () => setSelectedPhaseId(fallback?.id || "")
    });
  }

  function addTask(phaseIndex) {
    editSelectedRoutine((routine) => {
      routine.phases[phaseIndex].tasks.push(createTask());
    });
  }

  function updateTask(phaseIndex, taskIndex, field, value) {
    editSelectedRoutine((routine) => {
      routine.phases[phaseIndex].tasks[taskIndex][field] = value;
    });
  }

  function moveTask(phaseIndex, taskIndex, direction) {
    editSelectedRoutine((routine) => {
      routine.phases[phaseIndex].tasks = moveItem(
        routine.phases[phaseIndex].tasks,
        taskIndex,
        direction
      );
    });
  }

  function deleteTask(task, phaseIndex, taskIndex) {
    onConfirmEdit({
      title: "Delete task?",
      message: `"${task.title}" will be removed from this routine.`,
      confirmLabel: "Delete task",
      edit: (draft) => {
        const routine = draft.routines.find((item) => item.id === selectedRoutine.id);
        routine?.phases[phaseIndex]?.tasks.splice(taskIndex, 1);
      }
    });
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Routines</p>
            <h2>Routines</h2>
            <p>Edit reusable cleaning sessions. Today defaults are in the tab beside them.</p>
          </div>
          {editorTab === "routines" ? (
            <div className="card-actions compact-actions routine-editor-toolbar">
              <button
                className={routineReorderMode ? "button edit-action small" : "button ghost small"}
                type="button"
                disabled={!canEdit || visibleRoutines.length < 2}
                onClick={() => setRoutineReorderMode((current) => !current)}
              >
                Reorder
              </button>
              <button
                className={showArchived ? "button edit-action small" : "button ghost small"}
                type="button"
                onClick={() => setShowArchived((current) => !current)}
              >
                {showArchived ? "Hide archived" : "Show archived"}
              </button>
              <button className="button edit-action small" type="button" disabled={!canEdit} onClick={addRoutine}>
                Add
              </button>
            </div>
          ) : null}
        </div>

        <div className="tab-row" role="tablist" aria-label="Routine editor sections">
          <button
            className={editorTab === "today" ? "tab active" : "tab"}
            type="button"
            onClick={() => setEditorTab("today")}
          >
            Today defaults
          </button>
          <button
            className={editorTab === "routines" ? "tab active" : "tab"}
            type="button"
            onClick={() => setEditorTab("routines")}
          >
            Routines
          </button>
        </div>
      </section>

      {editorTab === "today" ? (
        <DailyRulesSection
          dailyRules={todayDefaults}
          weekdayDefaultsEnabled={todayWeekdayDefaultsEnabled}
          weekdayDefaults={todayWeekdayDefaults}
          canEdit={canEdit}
          onEditTemplate={onEditTemplate}
          onConfirmEdit={onConfirmEdit}
        />
      ) : null}

      {editorTab === "routines" ? (
        <>
      <section className="panel">
        {visibleRoutines.length ? (
          <div className="editor-list compact-routine-list">
            {visibleRoutines.map((routine, index) => {
            return (
              <div
                className={
                  [
                    "editor-row",
                    "routine-editor-row",
                    selectedRoutineId === routine.id ? "active" : "",
                    routine.archived ? "archived" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                key={routine.id}
              >
                <button
                  className="editor-select"
                  type="button"
                  onClick={() => selectRoutine(routine)}
                >
                  <strong>{routine.title}</strong>
                  <span>
                    <span className={`routine-color-dot color-${routine.colorLabel || "none"}`} aria-hidden="true" />
                    {routine.estimatedTime || "No estimate"} / {getRoutineTotalTasks(routine)} tasks
                    {routine.archived ? " / Archived" : ""}
                  </span>
                </button>
                {routineReorderMode ? (
                  <div className="row-actions compact-row-actions">
                    <button
                      className="icon-button small"
                      type="button"
                      aria-label={`Move ${routine.title} up`}
                      disabled={!canEdit || index === 0}
                      onClick={() => moveRoutine(index, -1)}
                    >
                      ^
                    </button>
                    <button
                      className="icon-button small"
                      type="button"
                      aria-label={`Move ${routine.title} down`}
                      disabled={!canEdit || index === visibleRoutines.length - 1}
                      onClick={() => moveRoutine(index, 1)}
                    >
                      v
                    </button>
                  </div>
                ) : null}
              </div>
            );
            })}
          </div>
        ) : (
          <p className="muted compact-empty">No routines yet. Use Add to create one.</p>
        )}
      </section>

      {selectedRoutine ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Routine editor</p>
              <h2>{selectedRoutine.title}</h2>
              <p>Routine details explain why and when this checklist should be used.</p>
            </div>
            <span className="task-count">
              {selectedRoutine.archived ? "Archived / " : ""}
              {getRoutineTotalTasks(selectedRoutine)} tasks
            </span>
          </div>

          <div className="form-grid customize-card routine-detail-card compact-routine-detail">
            <label className="field-label" htmlFor="routine-title">
              Routine title
              <input
                id="routine-title"
                value={selectedRoutine.title}
                disabled={!canEdit}
                onChange={(event) => updateRoutine("title", event.target.value)}
                onBlur={normalizeRoutineTitle}
                aria-invalid={Boolean(routineTitleError)}
              />
              {routineTitleError ? <span className="validation-message">{routineTitleError}</span> : null}
            </label>
            <label className="field-label" htmlFor="routine-time">
              Duration (minutes)
              <input
                id="routine-time"
                type="number"
                min="1"
                max="600"
                step="1"
                value={durationDraft}
                disabled={!canEdit}
                onChange={(event) => updateRoutineDuration(event.target.value)}
                onBlur={normalizeRoutineDuration}
                aria-invalid={Boolean(routineDurationError)}
              />
              {routineDurationError ? <span className="validation-message">{routineDurationError}</span> : null}
            </label>
            <label className="field-label" htmlFor="routine-color">
              Color label
              <select
                id="routine-color"
                value={selectedRoutine.colorLabel || "none"}
                disabled={!canEdit}
                onChange={(event) => updateRoutine("colorLabel", event.target.value)}
              >
                {routineColorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "none" ? "None" : option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <details className="simple-detail routine-description-detail">
            <summary className="simple-summary">
              <span>
                <strong>Description and usage</strong>
                <small>Purpose, when to use it, and an optional routine message.</small>
              </span>
              <span className="button ghost small">Edit</span>
            </summary>
            <div className="form-grid compact-description-fields">
              <label className="field-label field-span" htmlFor="routine-purpose">
                Purpose
                <textarea
                  id="routine-purpose"
                  className="textarea-small"
                  value={selectedRoutine.purpose}
                  disabled={!canEdit}
                  onChange={(event) => updateRoutine("purpose", event.target.value)}
                />
              </label>
              <label className="field-label field-span" htmlFor="routine-when">
                When to use
                <textarea
                  id="routine-when"
                  className="textarea-small"
                  value={selectedRoutine.whenToUse}
                  disabled={!canEdit}
                  onChange={(event) => updateRoutine("whenToUse", event.target.value)}
                />
              </label>
              <label className="field-label field-span" htmlFor="routine-message">
                Routine message
                <textarea
                  id="routine-message"
                  className="textarea-small"
                  value={selectedRoutine.message}
                  disabled={!canEdit}
                  onChange={(event) => updateRoutine("message", event.target.value)}
                />
              </label>
            </div>
          </details>

          <div className="section-heading editor-heading">
            <div>
              <p className="eyebrow">Phases</p>
              <h3>Checklist structure</h3>
              <p>Phases group tasks into a practical cleaning order.</p>
            </div>
            <button
              className="button edit-action small"
              type="button"
              disabled={!canEdit}
              onClick={addPhase}
            >
              Add
            </button>
          </div>

          <details className="simple-summary-card routine-actions-detail">
            <summary className="simple-summary">
              <span>
                <span className="eyebrow">Secondary</span>
                <strong>More actions</strong>
                <small>Duplicate, archive, or delete this routine.</small>
              </span>
              <span className="button ghost small">Actions</span>
            </summary>
            <div className="row-actions routine-secondary-actions">
              <button
                className="button small ghost"
                type="button"
                disabled={!canEdit}
                onClick={() => duplicateRoutine(selectedRoutine)}
              >
                Duplicate
              </button>
              {selectedRoutine.archived ? (
                <button
                  className="button small ghost"
                  type="button"
                  disabled={!canEdit}
                  onClick={() => unarchiveRoutine(selectedRoutine)}
                >
                  Unarchive
                </button>
              ) : (
                <button
                  className="button small ghost"
                  type="button"
                  disabled={!canEdit}
                  onClick={() => archiveRoutine(selectedRoutine)}
                >
                  Archive
                </button>
              )}
              <button
                className="button small danger-ghost"
                type="button"
                disabled={!canEdit || visibleRoutines.length <= 1}
                onClick={() => deleteRoutine(selectedRoutine)}
              >
                Delete
              </button>
            </div>
          </details>

          <div className="editor-list phase-picker-list compact-phase-list">
            {selectedRoutine.phases.map((phase, phaseIndex) => (
              <div
                className={selectedPhase?.id === phase.id ? "editor-row active" : "editor-row"}
                key={phase.id}
              >
                <button
                  className="editor-select"
                  type="button"
                  onClick={() => {
                    setSelectedPhaseId(phase.id);
                    setPhaseEditorOpen(true);
                  }}
                >
                  <strong>{phase.title || `Phase ${phaseIndex + 1}`}</strong>
                  <span>{phase.tasks.length} tasks</span>
                </button>
                <div className="row-actions compact-row-actions">
                  <button
                    className="button text-button small"
                    type="button"
                    onClick={() => {
                      setSelectedPhaseId(phase.id);
                      setPhaseEditorOpen((current) =>
                        selectedPhase?.id === phase.id ? !current : true
                      );
                    }}
                  >
                    {selectedPhase?.id === phase.id && phaseEditorOpen ? "Close" : "Edit"}
                  </button>
                  <button
                    className="icon-button small"
                    type="button"
                    aria-label={`Move ${phase.title} up`}
                    disabled={!canEdit || phaseIndex === 0}
                    onClick={() => movePhase(phaseIndex, -1)}
                  >
                    ^
                  </button>
                  <button
                    className="icon-button small"
                    type="button"
                    aria-label={`Move ${phase.title} down`}
                    disabled={
                      !canEdit || phaseIndex === selectedRoutine.phases.length - 1
                    }
                    onClick={() => movePhase(phaseIndex, 1)}
                  >
                    v
                  </button>
                  <button
                    className="icon-button small danger-icon"
                    type="button"
                    aria-label={`Delete ${phase.title}`}
                    disabled={!canEdit}
                    onClick={() => deletePhase(phase, phaseIndex)}
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedPhase && selectedPhaseIndex >= 0 && phaseEditorOpen ? (
            <section className="editor-card phase-editor advanced-phase-detail">
              <div className="editor-card-header">
                <div className="editor-row-main">
                  <span className="editor-index">{selectedPhaseIndex + 1}</span>
                  <label className="field-label" htmlFor={`phase-${selectedPhase.id}`}>
                    Phase title
                    <input
                      id={`phase-${selectedPhase.id}`}
                      value={selectedPhase.title}
                      disabled={!canEdit}
                      onChange={(event) => updatePhase(selectedPhaseIndex, event.target.value)}
                      onBlur={() => normalizePhaseTitle(selectedPhaseIndex)}
                      aria-invalid={Boolean(phaseTitleError)}
                    />
                    {phaseTitleError ? <span className="validation-message">{phaseTitleError}</span> : null}
                  </label>
                </div>
                <span className="task-count">{selectedPhase.tasks.length} tasks</span>
              </div>

              <div className="editor-list nested compact-task-editor-list">
                {selectedPhase.tasks.map((task, taskIndex) => (
                  <details className="editor-card task-editor compact-disclosure" key={task.id}>
                    <summary className="disclosure-summary compact-task-summary">
                      <span className="task-editor-title">
                        <span className="editor-index subtle">{taskIndex + 1}</span>
                        <span>
                          <strong>{task.title || `Task ${taskIndex + 1}`}</strong>
                          <small>
                            {task.duration || "No duration"} / {task.priority || "normal"}
                          </small>
                        </span>
                      </span>
                      <span className="button ghost small">Edit</span>
                    </summary>
                    <div className="form-grid three">
                      <label className="field-label" htmlFor={`task-title-${task.id}`}>
                        Task title
                        <input
                          id={`task-title-${task.id}`}
                          value={task.title}
                          disabled={!canEdit}
                          onChange={(event) =>
                            updateTask(selectedPhaseIndex, taskIndex, "title", event.target.value)
                          }
                          onBlur={() => normalizeTaskTitle(selectedPhaseIndex, taskIndex)}
                          aria-invalid={!task.title.trim()}
                        />
                        {!task.title.trim() ? (
                          <span className="validation-message">Task name is required.</span>
                        ) : null}
                      </label>
                      <label className="field-label" htmlFor={`task-duration-${task.id}`}>
                        Duration
                        <input
                          id={`task-duration-${task.id}`}
                          value={task.duration}
                          disabled={!canEdit}
                          onChange={(event) =>
                            updateTask(
                              selectedPhaseIndex,
                              taskIndex,
                              "duration",
                              event.target.value
                            )
                          }
                        />
                      </label>
                      <label className="field-label" htmlFor={`task-priority-${task.id}`}>
                        Priority
                        <select
                          id={`task-priority-${task.id}`}
                          value={task.priority || "normal"}
                          disabled={!canEdit}
                          onChange={(event) =>
                            updateTask(
                              selectedPhaseIndex,
                              taskIndex,
                              "priority",
                              event.target.value
                            )
                          }
                        >
                          {priorityOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field-label field-span" htmlFor={`task-detail-${task.id}`}>
                        Detail/explanation
                        <textarea
                          id={`task-detail-${task.id}`}
                          className="textarea-small"
                          value={task.detail}
                          disabled={!canEdit}
                          onChange={(event) =>
                            updateTask(selectedPhaseIndex, taskIndex, "detail", event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <div className="row-actions compact-row-actions">
                      <button
                        className="icon-button small"
                        type="button"
                        aria-label={`Move task ${taskIndex + 1} up`}
                        disabled={!canEdit || taskIndex === 0}
                        onClick={() => moveTask(selectedPhaseIndex, taskIndex, -1)}
                      >
                        ^
                      </button>
                      <button
                        className="icon-button small"
                        type="button"
                        aria-label={`Move task ${taskIndex + 1} down`}
                        disabled={
                          !canEdit || taskIndex === selectedPhase.tasks.length - 1
                        }
                        onClick={() => moveTask(selectedPhaseIndex, taskIndex, 1)}
                      >
                        v
                      </button>
                      <button
                        className="button small danger-ghost"
                        type="button"
                        disabled={!canEdit}
                        onClick={() => deleteTask(task, selectedPhaseIndex, taskIndex)}
                      >
                        Delete task
                      </button>
                    </div>
                  </details>
                ))}
              </div>

              <button
                className="button edit-action small"
                type="button"
                disabled={!canEdit}
                onClick={() => addTask(selectedPhaseIndex)}
              >
                Add
              </button>
            </section>
          ) : !selectedPhase ? (
            <p className="callout small">No phases yet. Add a phase to start building this routine.</p>
          ) : null}
        </section>
      ) : null}
        </>
      ) : null}
    </>
  );
}
