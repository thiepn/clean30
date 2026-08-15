import { useEffect, useMemo, useState } from "react";
import {
  formatRoutineDuration,
  getLastRoutineDoneLabel,
  getRoutineTotalTasks
} from "../utils/calculations.js";
import { getHomeRoomNames } from "../utils/homeLibrary.js";
import Checklist from "./Checklist.jsx";
import EmptyState from "./EmptyState.jsx";
import RoutineEditorDialog from "./RoutineEditorDialog.jsx";

const LEGACY_STARTER_IDS = new Set([
  "initial-reset",
  "weekly-reset",
  "minimal-reset",
  "guest-reset",
  "monthly-deep-clean"
]);

export default function Routines({
  routines,
  zones = [],
  history = [],
  activeTemplateId,
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
  const [legacyNoticeDismissed, setLegacyNoticeDismissed] = useState(false);

  const homeRooms = useMemo(() => getHomeRoomNames(zones), [zones]);
  const referenceRoutines = useMemo(
    () =>
      routines.filter(
        (routine) =>
          routine.id !== "daily-rules" && (showArchived || !routine.archived)
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
  const legacyStarterRoutines = useMemo(
    () =>
      routines.filter(
        (routine) => routine.id !== "daily-rules" && LEGACY_STARTER_IDS.has(routine.id)
      ),
    [routines]
  );
  const hasLegacyStarterSet =
    routines.some((routine) => routine.id === "initial-reset") &&
    legacyStarterRoutines.length >= 4 &&
    legacyStarterRoutines.some((routine) => !routine.archived);

  useEffect(() => {
    if (!selectedRoutine && referenceRoutines[0]) {
      setSelectedRoutineId(referenceRoutines[0].id);
    }
  }, [referenceRoutines, selectedRoutine]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") setOpenMenuId("");
    }

    function handlePointerDown(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".routine-card-menu")) return;
      if (target.closest("[data-routine-menu-trigger]")) return;
      setOpenMenuId("");
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function isCurrentRoutine(routineId) {
    return (
      activeSession?.templateId === activeTemplateId &&
      activeSession?.routineId === routineId
    );
  }

  function openCreate() {
    setEditorRoutineId("");
    setEditorOpen(true);
    setOpenMenuId("");
  }

  function openEdit(routineId) {
    if (isCurrentRoutine(routineId)) return;
    setEditorRoutineId(routineId);
    setEditorOpen(true);
    setOpenMenuId("");
  }

  function openAdvancedEdit(routineId) {
    if (isCurrentRoutine(routineId)) return;
    setOpenMenuId("");
    onAdvancedEdit(routineId);
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

  function archiveLegacyStarterExamples() {
    let firstRemainingId = "";
    for (const routine of legacyStarterRoutines) {
      if (isCurrentRoutine(routine.id)) {
        firstRemainingId = routine.id;
        continue;
      }
      onSaveRoutine({ ...routine, archived: true });
    }
    const fallback = routines.find(
      (routine) =>
        routine.id !== "daily-rules" &&
        !routine.archived &&
        !LEGACY_STARTER_IDS.has(routine.id)
    );
    setSelectedRoutineId(firstRemainingId || fallback?.id || "");
    setLegacyNoticeDismissed(true);
    setShowArchived(false);
  }

  return (
    <div className="screen-stack routines-screen routines-simple-screen">
      <section className="panel routines-library-panel">
        <div className="routines-page-heading">
          <div>
            <p className="eyebrow">Saved cleans</p>
            <h2>Routines</h2>
            <p>Routines are cleaning checklists you want to use again. Start one here, or create a new one.</p>
          </div>
          <button className="button primary" onClick={openCreate} type="button">
            + New routine
          </button>
        </div>

        <div className="routine-builder-callout routine-builder-callout-compact routine-create-explainer">
          <div>
            <strong>One place to make a routine</strong>
            <span>Choose common tasks, paste a checklist, use a starter, or type from scratch in the same editor.</span>
          </div>
          <button className="button ghost small" onClick={openCreate} type="button">
            Create routine
          </button>
        </div>

        {hasLegacyStarterSet && !legacyNoticeDismissed ? (
          <div className="legacy-routine-notice">
            <div>
              <strong>Older Clean30 starter examples found</strong>
              <p>Archive the old examples if you no longer use them. Your Progress is not deleted.</p>
            </div>
            <div className="legacy-routine-actions">
              <button className="button ghost small" onClick={archiveLegacyStarterExamples} type="button">
                Archive old examples
              </button>
              <button className="button text-button small" onClick={() => setLegacyNoticeDismissed(true)} type="button">
                Keep them
              </button>
            </div>
          </div>
        ) : null}

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
              const isCurrent = isCurrentRoutine(routine.id) && !routine.archived;
              const menuOpen = openMenuId === routine.id;
              const menuId = `routine-menu-${routine.id}`;

              return (
                <article
                  className={[
                    "routine-action-card",
                    selectedRoutine?.id === routine.id ? "selected" : "",
                    routine.archived ? "archived" : "",
                    isCurrent ? "current" : ""
                  ].filter(Boolean).join(" ")}
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
                        {isCurrent
                          ? "Current clean"
                          : getLastRoutineDoneLabel(history, routine.id, activeTemplateId)}
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
                      aria-controls={menuId}
                      aria-expanded={menuOpen}
                      className="button ghost small"
                      data-routine-menu-trigger="true"
                      onClick={() => setOpenMenuId(menuOpen ? "" : routine.id)}
                      type="button"
                    >
                      More
                    </button>
                  </div>

                  {menuOpen ? (
                    <div aria-label={`${routine.title} actions`} className="routine-card-menu" id={menuId}>
                      <button
                        disabled={isCurrent}
                        onClick={() => openEdit(routine.id)}
                        title={isCurrent ? "Finish or discard the current clean before editing this routine." : undefined}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        disabled={isCurrent}
                        onClick={() => openAdvancedEdit(routine.id)}
                        title={isCurrent ? "Finish or discard the current clean before editing this routine." : undefined}
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
            message="Create a routine from common tasks, a pasted checklist, a starter, or a blank list."
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
                {getRoutineTotalTasks(selectedRoutine)} tasks · {formatRoutineDuration(selectedRoutine)} · {getLastRoutineDoneLabel(history, selectedRoutine.id, activeTemplateId)}
              </p>
              {isCurrentRoutine(selectedRoutine.id) ? (
                <p className="muted compact-empty">
                  Finish or discard the current clean before editing this routine. Its saved checklist stays stable while cleaning is in progress.
                </p>
              ) : null}
            </div>
            <div className="routine-detail-actions">
              <button
                className="button primary"
                disabled={selectedRoutine.archived || getRoutineTotalTasks(selectedRoutine) === 0}
                onClick={() => startRoutine(selectedRoutine)}
                type="button"
              >
                {isCurrentRoutine(selectedRoutine.id) ? "Continue cleaning" : "Start cleaning"}
              </button>
              <button
                className="button ghost"
                disabled={isCurrentRoutine(selectedRoutine.id)}
                onClick={() => openEdit(selectedRoutine.id)}
                title={isCurrentRoutine(selectedRoutine.id) ? "Finish or discard the current clean before editing this routine." : undefined}
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
            <EmptyState title="This routine has no tasks" message="Add at least one task before starting it." />
          )}
        </section>
      ) : null}

      <RoutineEditorDialog
        homeRooms={homeRooms}
        onAdvancedEdit={openAdvancedEdit}
        onClose={() => setEditorOpen(false)}
        onSave={saveRoutine}
        open={editorOpen}
        routine={editorRoutine}
        routines={routines.filter((routine) => routine.id !== "daily-rules")}
      />
    </div>
  );
}
