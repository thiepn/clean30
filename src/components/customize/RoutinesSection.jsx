import { getRoutineTotalTasks } from "../../utils/calculations.js";
import { createPhase, createRoutine, createTask, moveItem } from "../../utils/routineUtils.js";
import { priorityOptions } from "../../utils/templateUtils.js";

const coreRoutineIds = new Set([
  "weekly-reset",
  "minimal-reset",
  "monthly-deep-clean",
  "guest-reset",
  "initial-reset",
  "daily-rules"
]);

export default function RoutinesSection({
  routines,
  selectedRoutine,
  selectedRoutineId,
  canEdit,
  onSelectRoutine,
  onEditTemplate,
  onConfirmEdit
}) {
  const dailyRulesRoutineSelected = selectedRoutine?.id === "daily-rules";

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
  }

  function updateRoutine(field, value) {
    editSelectedRoutine((routine) => {
      routine[field] = value;
    });
  }

  function moveRoutine(index, direction) {
    onEditTemplate((draft) => {
      draft.routines = moveItem(draft.routines, index, direction);
    });
  }

  function deleteRoutine(routine, index) {
    const fallback = routines[index + 1] || routines[index - 1] || null;
    onConfirmEdit({
      title: "Delete routine?",
      message: `"${routine.title}" will be removed from this custom template.`,
      confirmLabel: "Delete routine",
      edit: (draft) => {
        draft.routines.splice(index, 1);
      },
      afterConfirm: () => onSelectRoutine(fallback?.id || "")
    });
  }

  function addPhase() {
    editSelectedRoutine((routine) => {
      routine.phases.push(createPhase());
    });
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
    onConfirmEdit({
      title: "Delete phase?",
      message: `"${phase.title}" and its tasks will be removed from this routine.`,
      confirmLabel: "Delete phase",
      edit: (draft) => {
        const routine = draft.routines.find((item) => item.id === selectedRoutine.id);
        routine?.phases.splice(phaseIndex, 1);
      }
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
            <h2>Routine Library</h2>
          </div>
          <button className="button primary" type="button" disabled={!canEdit} onClick={addRoutine}>
            Add routine
          </button>
        </div>

        <div className="editor-list">
          {routines.map((routine, index) => {
            const canDelete = canEdit && !coreRoutineIds.has(routine.id);
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
                  onClick={() => onSelectRoutine(routine.id)}
                >
                  <strong>{routine.title}</strong>
                  <span>
                    {routine.estimatedTime || "No estimate"} · {getRoutineTotalTasks(routine)} tasks
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
                    disabled={!canEdit || index === routines.length - 1}
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
            </div>
            <span className="task-count">{getRoutineTotalTasks(selectedRoutine)} tasks</span>
          </div>

          <div className="form-grid">
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

          {dailyRulesRoutineSelected ? (
            <p className="callout">
              Daily Rules routine tasks are generated from the Daily Rules section.
            </p>
          ) : null}

          <div className="section-heading editor-heading">
            <div>
              <p className="eyebrow">Phases</p>
              <h3>Checklist structure</h3>
            </div>
            <button
              className="button ghost"
              type="button"
              disabled={!canEdit || dailyRulesRoutineSelected}
              onClick={addPhase}
            >
              Add phase
            </button>
          </div>

          <div className="editor-list">
            {selectedRoutine.phases.map((phase, phaseIndex) => (
              <section className="editor-card" key={phase.id}>
                <div className="editor-card-header">
                  <label className="field-label" htmlFor={`phase-${phase.id}`}>
                    Phase title
                    <input
                      id={`phase-${phase.id}`}
                      value={phase.title}
                      disabled={!canEdit || dailyRulesRoutineSelected}
                      onChange={(event) => updatePhase(phaseIndex, event.target.value)}
                    />
                  </label>
                  <div className="row-actions">
                    <button
                      className="button small ghost"
                      type="button"
                      disabled={!canEdit || dailyRulesRoutineSelected || phaseIndex === 0}
                      onClick={() => movePhase(phaseIndex, -1)}
                    >
                      Move up
                    </button>
                    <button
                      className="button small ghost"
                      type="button"
                      disabled={
                        !canEdit ||
                        dailyRulesRoutineSelected ||
                        phaseIndex === selectedRoutine.phases.length - 1
                      }
                      onClick={() => movePhase(phaseIndex, 1)}
                    >
                      Move down
                    </button>
                    <button
                      className="button small danger-ghost"
                      type="button"
                      disabled={!canEdit || dailyRulesRoutineSelected}
                      onClick={() => deletePhase(phase, phaseIndex)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="editor-list nested">
                  {phase.tasks.map((task, taskIndex) => (
                    <div className="editor-card task-editor" key={task.id}>
                      <div className="form-grid three">
                        <label className="field-label" htmlFor={`task-title-${task.id}`}>
                          Task title
                          <input
                            id={`task-title-${task.id}`}
                            value={task.title}
                            disabled={!canEdit || dailyRulesRoutineSelected}
                            onChange={(event) =>
                              updateTask(phaseIndex, taskIndex, "title", event.target.value)
                            }
                          />
                        </label>
                        <label className="field-label" htmlFor={`task-duration-${task.id}`}>
                          Duration
                          <input
                            id={`task-duration-${task.id}`}
                            value={task.duration}
                            disabled={!canEdit || dailyRulesRoutineSelected}
                            onChange={(event) =>
                              updateTask(phaseIndex, taskIndex, "duration", event.target.value)
                            }
                          />
                        </label>
                        <label className="field-label" htmlFor={`task-priority-${task.id}`}>
                          Priority
                          <select
                            id={`task-priority-${task.id}`}
                            value={task.priority || "normal"}
                            disabled={!canEdit || dailyRulesRoutineSelected}
                            onChange={(event) =>
                              updateTask(phaseIndex, taskIndex, "priority", event.target.value)
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
                            disabled={!canEdit || dailyRulesRoutineSelected}
                            onChange={(event) =>
                              updateTask(phaseIndex, taskIndex, "detail", event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <div className="row-actions">
                        <button
                          className="button small ghost"
                          type="button"
                          disabled={!canEdit || dailyRulesRoutineSelected || taskIndex === 0}
                          onClick={() => moveTask(phaseIndex, taskIndex, -1)}
                        >
                          Move up
                        </button>
                        <button
                          className="button small ghost"
                          type="button"
                          disabled={
                            !canEdit ||
                            dailyRulesRoutineSelected ||
                            taskIndex === phase.tasks.length - 1
                          }
                          onClick={() => moveTask(phaseIndex, taskIndex, 1)}
                        >
                          Move down
                        </button>
                        <button
                          className="button small danger-ghost"
                          type="button"
                          disabled={!canEdit || dailyRulesRoutineSelected}
                          onClick={() => deleteTask(task, phaseIndex, taskIndex)}
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
                  disabled={!canEdit || dailyRulesRoutineSelected}
                  onClick={() => addTask(phaseIndex)}
                >
                  Add task
                </button>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
