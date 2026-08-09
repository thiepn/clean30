import { useEffect, useMemo, useState } from "react";
import {
  formatRoutineDuration,
  getLastRoutineDoneLabel,
  getRoutineTotalTasks
} from "../utils/calculations.js";
import {
  getHomeRoomNames,
  getSuggestedTaskCountForRoom
} from "../utils/homeLibrary.js";
import { buildQuickCleanPlan } from "../utils/quickClean.js";
import {
  getRoomsNeedingAttention,
  getRoomCareStatus
} from "../utils/roomCare.js";
import Checklist from "./Checklist.jsx";
import EmptyState from "./EmptyState.jsx";
import HomeRoomsDialog from "./HomeRoomsDialog.jsx";
import QuickCleanDialog from "./QuickCleanDialog.jsx";
import RoutineEditorDialog from "./RoutineEditorDialog.jsx";
import TaskLibraryDialog from "./TaskLibraryDialog.jsx";

const LEGACY_STARTER_IDS = new Set([
  "initial-reset",
  "weekly-reset",
  "minimal-reset",
  "guest-reset",
  "monthly-deep-clean"
]);

const instantQuickCleanBudgets = [5, 15, 30];

export default function Routines({
  routines,
  zones = [],
  history = [],
  activeTemplateId,
  activeSession,
  onStartRoutine,
  onSaveRoutine,
  onSaveHomeRooms,
  onAddLibraryTasksToToday,
  onDuplicateRoutine,
  onToggleArchive,
  onDeleteRoutine,
  onAdvancedEdit
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorRoutineId, setEditorRoutineId] = useState("");
  const [editorSeed, setEditorSeed] = useState(null);
  const [openMenuId, setOpenMenuId] = useState("");
  const [legacyNoticeDismissed, setLegacyNoticeDismissed] = useState(false);
  const [homeRoomsOpen, setHomeRoomsOpen] = useState(false);
  const [taskLibraryOpen, setTaskLibraryOpen] = useState(false);
  const [taskLibraryRoom, setTaskLibraryRoom] = useState("All");
  const [taskLibraryPreselect, setTaskLibraryPreselect] = useState(false);
  const [quickCleanOpen, setQuickCleanOpen] = useState(false);

  const homeRooms = useMemo(() => getHomeRoomNames(zones), [zones]);
  const roomCareByName = useMemo(
    () =>
      new Map(
        homeRooms.map((room) => [
          room,
          getRoomCareStatus({ room, routines, history })
        ])
      ),
    [history, homeRooms, routines]
  );
  const roomsNeedingAttention = useMemo(
    () => getRoomsNeedingAttention({ rooms: homeRooms, routines, history }),
    [history, homeRooms, routines]
  );
  const referenceRoutines = useMemo(
    () =>
      routines.filter(
        (routine) =>
          routine.id !== "daily-rules" && (showArchived || !routine.archived)
      ),
    [routines, showArchived]
  );
  const selectableRoutines = referenceRoutines.filter(
    (routine) => !routine.archived
  );
  const selectedRoutine =
    referenceRoutines.find((routine) => routine.id === selectedRoutineId) ||
    selectableRoutines[0] ||
    referenceRoutines[0] ||
    null;
  const editorRoutine =
    routines.find((routine) => routine.id === editorRoutineId) || null;
  const legacyStarterRoutines = useMemo(
    () =>
      routines.filter(
        (routine) => routine.id !== "daily-rules" && LEGACY_STARTER_IDS.has(routine.id)
      ),
    [routines]
  );
  const hasLegacyStarterSet =
    routines.some((routine) => routine.id === "initial-reset") &&
    legacyStarterRoutines.length >= 4;

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

  useEffect(() => {
    function consumeQuickCleanRequest() {
      if (typeof window === "undefined") return;
      if (!window.clean30OpenQuickCleanRequested) return;
      window.clean30OpenQuickCleanRequested = false;
      setQuickCleanOpen(true);
    }

    consumeQuickCleanRequest();
    window.addEventListener("clean30:openQuickClean", consumeQuickCleanRequest);
    return () => {
      window.removeEventListener("clean30:openQuickClean", consumeQuickCleanRequest);
    };
  }, []);

  function isCurrentRoutine(routineId) {
    return (
      activeSession?.templateId === activeTemplateId &&
      activeSession?.routineId === routineId
    );
  }

  function openCreate(seed = null) {
    setEditorRoutineId("");
    setEditorSeed(seed);
    setEditorOpen(true);
    setOpenMenuId("");
  }

  function openEdit(routineId) {
    if (isCurrentRoutine(routineId)) return;
    setEditorSeed(null);
    setEditorRoutineId(routineId);
    setEditorOpen(true);
    setOpenMenuId("");
  }

  function openAdvancedEdit(routineId) {
    if (isCurrentRoutine(routineId)) return;
    setOpenMenuId("");
    onAdvancedEdit(routineId);
  }

  function openTaskLibrary(room = "All", preselectRecommended = false) {
    setTaskLibraryRoom(room);
    setTaskLibraryPreselect(preselectRecommended);
    setTaskLibraryOpen(true);
  }

  function saveRoutine(routine) {
    const savedId = onSaveRoutine(routine);
    setSelectedRoutineId(savedId || routine.id);
    setEditorSeed(null);
  }

  function startRoutine(routine) {
    if (!routine || routine.archived || getRoutineTotalTasks(routine) === 0) {
      return;
    }
    setOpenMenuId("");
    onStartRoutine(routine.id);
  }

  function addInstantQuickClean(minutes) {
    const plan = buildQuickCleanPlan({
      minutes,
      rooms: homeRooms,
      routines,
      history
    });
    if (!plan.items.length) {
      setQuickCleanOpen(true);
      return;
    }
    onAddLibraryTasksToToday?.(plan.items);
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

  const quickCleanCopy = roomsNeedingAttention.length
    ? `${roomsNeedingAttention
        .slice(0, 2)
        .map((item) => item.room)
        .join(" and ")}${roomsNeedingAttention.length > 2 ? " and more" : ""} may need attention based on completed routines. Pick a time and send a ready-made plan straight to Today.`
    : "Pick 5, 15, or 30 minutes and send a ready-made plan straight to Today. Clean30 uses your rooms and completed routines to choose what deserves attention first.";

  return (
    <div className="screen-stack routines-screen">
      <section className="panel home-routines-panel">
        <div className="home-routines-heading">
          <div>
            <p className="eyebrow">Your home</p>
            <h2>Start with the room, not the setup</h2>
            <p>Tap a room to get relevant cleaning tasks. You can send them straight to Today or turn them into a reusable routine.</p>
          </div>
          <div className="home-routines-heading-actions">
            <button className="button ghost" onClick={() => setHomeRoomsOpen(true)} type="button">
              Edit rooms
            </button>
            <button className="button ghost" onClick={() => openTaskLibrary("All", false)} type="button">
              Task library
            </button>
          </div>
        </div>

        <div className="quick-clean-launch quick-clean-launch-instant">
          <div className="quick-clean-launch-copy">
            <span aria-hidden="true" className="quick-clean-launch-mark">15</span>
            <div>
              <strong>Have a few minutes? Skip the planning.</strong>
              <span>{quickCleanCopy}</span>
            </div>
          </div>
          <div className="quick-clean-launch-actions">
            <div className="quick-clean-instant-options" aria-label="Add a quick clean plan to Today" role="group">
              {instantQuickCleanBudgets.map((minutes) => (
                <button
                  aria-label={`Add a ${minutes}-minute smart clean to Today`}
                  className={minutes === 15 ? "button primary quick-clean-instant-button" : "button ghost quick-clean-instant-button"}
                  key={minutes}
                  onClick={() => addInstantQuickClean(minutes)}
                  type="button"
                >
                  {minutes} min
                </button>
              ))}
            </div>
            <button className="button text-button quick-clean-customize" onClick={() => setQuickCleanOpen(true)} type="button">
              Plan a quick clean
            </button>
          </div>
        </div>

        {homeRooms.length ? (
          <div className="home-room-grid" role="group" aria-label="Rooms in your home">
            {homeRooms.map((room) => {
              const suggestionCount = getSuggestedTaskCountForRoom(room);
              const care = roomCareByName.get(room);
              return (
                <button
                  className={`home-room-card care-${care?.status || "untracked"}`}
                  key={room}
                  onClick={() => openTaskLibrary(room, true)}
                  type="button"
                >
                  <span className="home-room-card-icon" aria-hidden="true" />
                  <span>
                    <strong>{room}</strong>
                    <small className="home-room-care-line">
                      {care?.statusLabel ||
                        (suggestionCount
                          ? `${suggestionCount} suggested tasks`
                          : "Use your own routine tasks")}
                    </small>
                    {care?.status === "attention" || care?.status === "soon" ? (
                      <small className="home-room-care-detail">{care.detail}</small>
                    ) : null}
                  </span>
                  <span className="home-room-card-action">Choose tasks</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="home-routines-empty">
            <div>
              <strong>No rooms set up yet</strong>
              <p>Add the rooms that actually exist in your home. This only takes a few taps.</p>
            </div>
            <button className="button primary" onClick={() => setHomeRoomsOpen(true)} type="button">
              Set up my home
            </button>
          </div>
        )}

        <div className="home-whole-home-action">
          <button className="button ghost small" onClick={() => openTaskLibrary("Whole home", true)} type="button">
            Choose a quick whole-home reset
          </button>
          <span>Room care is guidance from full routine completions, not a required schedule. Nothing is added to Today automatically unless you choose a quick plan.</span>
        </div>
      </section>

      <section className="panel routines-library-panel">
        <div className="routines-page-heading">
          <div>
            <p className="eyebrow">Reusable checklists</p>
            <h2>Routines</h2>
            <p>Save the cleans you repeat. Start them directly whenever you need them.</p>
          </div>
          <button className="button primary" onClick={() => openCreate()} type="button">
            Build routine
          </button>
        </div>

        <div className="routine-builder-callout routine-builder-callout-compact">
          <div>
            <strong>Already have a checklist?</strong>
            <span>Paste 10, 20, or 50 tasks at once instead of creating rows one by one.</span>
          </div>
          <button className="button ghost small" onClick={() => openCreate()} type="button">
            Paste a list
          </button>
        </div>

        {hasLegacyStarterSet && !legacyNoticeDismissed ? (
          <div className="legacy-routine-notice">
            <div>
              <strong>Older Clean30 starter examples found</strong>
              <p>
                These are the original example routines from older Clean30 versions. You can archive the old examples and keep your own routines. Archived routines and Progress are not deleted.
              </p>
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
            {selectableRoutines.length} active{" "}
            {selectableRoutines.length === 1 ? "routine" : "routines"}
          </span>
          <button
            className={
              showArchived ? "button edit-action small" : "button ghost small"
            }
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
                isCurrentRoutine(routine.id) && !routine.archived;
              const menuOpen = openMenuId === routine.id;
              const menuId = `routine-menu-${routine.id}`;

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
                      className={`routine-color-dot color-${
                        routine.colorLabel || "none"
                      }`}
                    />
                    <span className="routine-card-copy">
                      <strong>{routine.title}</strong>
                      <span>
                        {taskCount} {taskCount === 1 ? "task" : "tasks"} ·{" "}
                        {formatRoutineDuration(routine)}
                      </span>
                      <small>
                        {isCurrent
                          ? "Current clean"
                          : getLastRoutineDoneLabel(history, routine.id)}
                      </small>
                    </span>
                    {routine.archived ? (
                      <span className="status-pill compact">Archived</span>
                    ) : null}
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
                    <div
                      aria-label={`${routine.title} actions`}
                      className="routine-card-menu"
                      id={menuId}
                    >
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
            message="Build one from the Task Library or paste a checklist in one go."
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
                {getRoutineTotalTasks(selectedRoutine)} tasks ·{" "}
                {formatRoutineDuration(selectedRoutine)} ·{" "}
                {getLastRoutineDoneLabel(history, selectedRoutine.id)}
              </p>
              {isCurrentRoutine(selectedRoutine.id) ? (
                <p className="muted compact-empty">
                  Finish or discard the current clean before editing this routine. Its saved checklist stays stable while the clean is in progress.
                </p>
              ) : null}
            </div>
            <div className="routine-detail-actions">
              <button
                className="button primary"
                disabled={
                  selectedRoutine.archived ||
                  getRoutineTotalTasks(selectedRoutine) === 0
                }
                onClick={() => startRoutine(selectedRoutine)}
                type="button"
              >
                {isCurrentRoutine(selectedRoutine.id)
                  ? "Continue cleaning"
                  : "Start routine"}
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
            <EmptyState
              title="This routine has no tasks"
              message="Add at least one task before starting it."
            />
          )}
        </section>
      ) : null}

      <RoutineEditorDialog
        homeRooms={homeRooms}
        onAdvancedEdit={openAdvancedEdit}
        onClose={() => {
          setEditorOpen(false);
          setEditorSeed(null);
        }}
        onSave={saveRoutine}
        open={editorOpen}
        routine={editorRoutine}
        routines={routines.filter((routine) => routine.id !== "daily-rules")}
        seedDraft={editorSeed}
      />
      <HomeRoomsDialog
        onClose={() => setHomeRoomsOpen(false)}
        onSave={(roomNames) => onSaveHomeRooms?.(roomNames)}
        open={homeRoomsOpen}
        rooms={homeRooms}
      />
      <TaskLibraryDialog
        homeRooms={homeRooms}
        initialRoom={taskLibraryRoom}
        onAddToToday={(items) => onAddLibraryTasksToToday?.(items)}
        onBuildRoutine={(draft) => openCreate(draft)}
        onClose={() => setTaskLibraryOpen(false)}
        open={taskLibraryOpen}
        preselectRecommended={taskLibraryPreselect}
        routines={routines}
      />
      <QuickCleanDialog
        history={history}
        homeRooms={homeRooms}
        onAddToToday={(items) => onAddLibraryTasksToToday?.(items)}
        onBuildRoutine={(draft) => openCreate(draft)}
        onClose={() => setQuickCleanOpen(false)}
        open={quickCleanOpen}
        routines={routines}
      />
    </div>
  );
}
