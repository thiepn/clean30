import { useEffect, useMemo, useRef, useState } from "react";
import { getRoutineTotalTasks } from "../../utils/calculations.js";
import { createPhase, createRoutine, createTask, moveItem } from "../../utils/routineUtils.js";
import { priorityOptions } from "../../utils/templateUtils.js";
import DailyRulesSection from "./DailyRulesSection.jsx";

export default function RoutinesSection({
  routines,
  todayDefaults = [],
  selectedRoutine,
  selectedRoutineId,
  canEdit,
  onSelectRoutine,
  onEditTemplate,
  onConfirmEdit,
  autoAddRoutine = false,
  initialEditorTab = "routines"
}) {
  const autoAddHandled = useRef(false);
  const [editorTab, setEditorTab] = useState(initialEditorTab);
  const visibleRoutines = useMemo(
    () => routines.filter((routine) => routine.id !== "daily-rules"),
    [routines]
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

  useEffect(() => {
    if (!selectedRoutine) {
      setSelectedPhaseId("");
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
  }

  function selectRoutine(routine) {
    onSelectRoutine(routine.id);
    setSelectedPhaseId(routine.phases[0]?.id || "");
  }

  function updateRoutine(field, value) {
    editSelectedRoutine((routine) => {
      routine[field] = value;
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

  function deleteRoutine(routine, index) {
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
  }

  function updatePhase(phaseIndex, value) {
    editSelectedRoutine((routine) => {
      routine.phases[phaseIndex].title = value;
    });
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
            <h2>Today Defaults And Routines</h2>
            <p>Today defaults start each day. Routines are reusable cleaning sessions.</p>
          </div>
          {editorTab === "routines" ? (
            <button className="button primary" type="button" disabled={!canEdit} onClick={addRoutine}>
              Add routine
            </button>
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
          canEdit={canEdit}
          onEditTemplate={onEditTemplate}
          onConfirmEdit={onConfirmEdit}
        />
      ) : null}

      {editorTab === "routines" ? (
        <>
      <section className="panel">
        <div className="editor-list">
          {visibleRoutines.map((routine, index) => {
            const canDelete = canEdit && visibleRoutines.length > 1;
            return (
              <div
                className={
                  selectedRoutineId === routine.id ? "editor-row active" : "editor-row"
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
                    {routine.estimatedTime || "No estimate"} / {getRoutineTotalTasks(routine)} tasks
                  </span>
                </button>
                <div className="row-actions">
                  <button
                    className="button small ghost"
                    type="button"
                    disabled={!canEdit || index === 0}
                    onClick={() => moveRoutine(index, -1)}
                  >
                    Move up
                  </button>
                  <button
                    className="button small ghost"
                    type="button"
                    disabled={!canEdit || index === visibleRoutines.length - 1}
                    onClick={() => moveRoutine(index, 1)}
                  >
                    Move down
                  </button>
                  <button
                    className="button small danger-ghost"
                    type="button"
                    disabled={!canDelete}
                    onClick={() => deleteRoutine(routine, index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selectedRoutine ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Routine editor</p>
              <h2>{selectedRoutine.title}</h2>
              <p>Routine details explain why and when this checklist should be used.</p>
            </div>
            <span className="task-count">{getRoutineTotalTasks(selectedRoutine)} tasks</span>
          </div>

          <div className="form-grid customize-card routine-detail-card">
            <label className="field-label" htmlFor="routine-title">
              Routine title
              <input
                id="routine-title"
                value={selectedRoutine.title}
                disabled={!canEdit}
                onChange={(event) => updateRoutine("title", event.target.value)}
              />
            </label>
            <label className="field-label" htmlFor="routine-time">
              Estimated time
              <input
                id="routine-time"
                value={selectedRoutine.estimatedTime}
                disabled={!canEdit}
                onChange={(event) => updateRoutine("estimatedTime", event.target.value)}
              />
            </label>
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

          <div className="section-heading editor-heading">
            <div>
              <p className="eyebrow">Phases</p>
              <h3>Checklist structure</h3>
              <p>Phases group tasks into a practical cleaning order.</p>
            </div>
            <button
              className="button ghost"
              type="button"
              disabled={!canEdit}
              onClick={addPhase}
            >
              Add phase
            </button>
          </div>

          <div className="editor-list phase-picker-list">
            {selectedRoutine.phases.map((phase, phaseIndex) => (
              <div
                className={selectedPhase?.id === phase.id ? "editor-row active" : "editor-row"}
                key={phase.id}
              >
                <button
                  className="editor-select"
                  type="button"
                  onClick={() => setSelectedPhaseId(phase.id)}
                >
                  <strong>{phase.title || `Phase ${phaseIndex + 1}`}</strong>
                  <span>{phase.tasks.length} tasks</span>
                </button>
                <div className="row-actions">
                  <button
                    className="button small ghost"
                    type="button"
                    disabled={!canEdit || phaseIndex === 0}
                    onClick={() => movePhase(phaseIndex, -1)}
                  >
                    Move up
                  </button>
                  <button
                    className="button small ghost"
                    type="button"
                    disabled={
                      !canEdit || phaseIndex === selectedRoutine.phases.length - 1
                    }
                    onClick={() => movePhase(phaseIndex, 1)}
                  >
                    Move down
                  </button>
                  <button
                    className="button small danger-ghost"
                    type="button"
                    disabled={!canEdit}
                    onClick={() => deletePhase(phase, phaseIndex)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedPhase && selectedPhaseIndex >= 0 ? (
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
                    />
                  </label>
                </div>
                <span className="task-count">{selectedPhase.tasks.length} tasks</span>
              </div>

              <div className="editor-list nested">
                {selectedPhase.tasks.map((task, taskIndex) => (
                  <div className="editor-card task-editor" key={task.id}>
                    <div className="task-editor-title">
                      <span className="editor-index subtle">{taskIndex + 1}</span>
                      <strong>Task {taskIndex + 1}</strong>
                    </div>
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
                        />
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
                    <div className="row-actions">
                      <button
                        className="button small ghost"
                        type="button"
                        disabled={!canEdit || taskIndex === 0}
                        onClick={() => moveTask(selectedPhaseIndex, taskIndex, -1)}
                      >
                        Move up
                      </button>
                      <button
                        className="button small ghost"
                        type="button"
                        disabled={
                          !canEdit || taskIndex === selectedPhase.tasks.length - 1
                        }
                        onClick={() => moveTask(selectedPhaseIndex, taskIndex, 1)}
                      >
                        Move down
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
                  </div>
                ))}
              </div>

              <button
                className="button ghost"
                type="button"
                disabled={!canEdit}
                onClick={() => addTask(selectedPhaseIndex)}
              >
                Add task
              </button>
            </section>
          ) : (
            <p className="callout small">No phases yet. Add a phase to start building this routine.</p>
          )}
        </section>
      ) : null}
        </>
      ) : null}
    </>
  );
}
