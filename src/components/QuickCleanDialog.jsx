import { useEffect, useMemo, useRef, useState } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";
import { createRoutineDraftFromLibraryItems } from "../utils/homeLibrary.js";
import { buildQuickCleanPlan, quickCleanBudgets } from "../utils/quickClean.js";
import { rankRoomsForCare } from "../utils/roomCare.js";

function uniqueNames(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean))];
}

export default function QuickCleanDialog({
  open,
  activeTemplateId = "",
  homeRooms = [],
  routines = [],
  history = [],
  onAddToToday,
  onBuildRoutine,
  onClose
}) {
  const closeButtonRef = useRef(null);
  const dialogRef = useDialogFocus({ open, onClose, initialFocusRef: closeButtonRef });
  const [minutes, setMinutes] = useState(15);
  const [selectedRooms, setSelectedRooms] = useState(() => uniqueNames(homeRooms));

  useEffect(() => {
    if (!open) return;
    setMinutes(15);
    setSelectedRooms(uniqueNames(homeRooms));
  }, [homeRooms, open]);

  const rankedRooms = useMemo(
    () => rankRoomsForCare({ rooms: homeRooms, routines, history, templateId: activeTemplateId }),
    [activeTemplateId, history, homeRooms, routines]
  );

  const plan = useMemo(
    () => buildQuickCleanPlan({ minutes, rooms: selectedRooms, routines, history, templateId: activeTemplateId }),
    [activeTemplateId, history, minutes, routines, selectedRooms]
  );

  if (!open) return null;

  function toggleRoom(room) {
    setSelectedRooms((current) =>
      current.includes(room)
        ? current.filter((item) => item !== room)
        : [...current, room]
    );
  }

  function startCleaning() {
    if (!plan.items.length) return;
    onAddToToday?.(plan.items);
    onClose();
  }

  function buildRoutine() {
    if (!plan.items.length || !onBuildRoutine) return;
    const draft = createRoutineDraftFromLibraryItems(plan.items);
    const roomLabel = selectedRooms.length === 1 ? ` ${selectedRooms[0]}` : "";
    draft.title = `${minutes}-Minute${roomLabel} Clean`;
    onBuildRoutine(draft);
    onClose();
  }

  return (
    <div className="dialog-backdrop quick-clean-backdrop" role="presentation">
      <section
        aria-labelledby="quick-clean-title"
        aria-modal="true"
        className="dialog quick-clean-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header quick-clean-header">
          <div>
            <p className="eyebrow">Choose time</p>
            <h2 id="quick-clean-title">How much time do you have?</h2>
            <p>Pick a time and any rooms that matter. Clean30 builds one focused clean that fits the window.</p>
          </div>
          <button
            aria-label="Close time planner"
            className="icon-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="quick-clean-body">
          <section className="quick-clean-step" aria-labelledby="quick-clean-time-title">
            <div className="quick-clean-step-heading">
              <div>
                <span className="quick-clean-step-number">1</span>
                <div>
                  <h3 id="quick-clean-time-title">Pick your time</h3>
                  <p>This sets the amount of work Clean30 suggests. It does not force a countdown.</p>
                </div>
              </div>
              <strong>{minutes} min</strong>
            </div>
            <div className="quick-clean-budget-grid" role="group" aria-label="Available cleaning time">
              {quickCleanBudgets.map((budget) => (
                <button
                  aria-pressed={minutes === budget}
                  className={minutes === budget ? "quick-clean-budget active" : "quick-clean-budget"}
                  key={budget}
                  onClick={() => setMinutes(budget)}
                  type="button"
                >
                  <strong>{budget}</strong>
                  <span>min</span>
                </button>
              ))}
            </div>
          </section>

          <section className="quick-clean-step" aria-labelledby="quick-clean-room-title">
            <div className="quick-clean-step-heading">
              <div>
                <span className="quick-clean-step-number">2</span>
                <div>
                  <h3 id="quick-clean-room-title">Choose rooms</h3>
                  <p>Whole-home basics are always considered. Clean30 uses completed cleans to prefer rooms that may need more attention.</p>
                </div>
              </div>
              {homeRooms.length ? (
                <button
                  className="button text-button small"
                  onClick={() =>
                    setSelectedRooms(
                      selectedRooms.length === homeRooms.length ? [] : uniqueNames(homeRooms)
                    )
                  }
                  type="button"
                >
                  {selectedRooms.length === homeRooms.length ? "Clear rooms" : "Select all"}
                </button>
              ) : null}
            </div>

            {homeRooms.length ? (
              <div className="quick-clean-room-grid" role="group" aria-label="Rooms to include">
                {rankedRooms.map((care) => {
                  const selected = selectedRooms.includes(care.room);
                  return (
                    <button
                      aria-pressed={selected}
                      className={`quick-clean-room care-${care.status}${selected ? " selected" : ""}`}
                      key={care.room}
                      onClick={() => toggleRoom(care.room)}
                      type="button"
                    >
                      <span aria-hidden="true" className="quick-clean-room-check">
                        {selected ? "✓" : ""}
                      </span>
                      <span className="quick-clean-room-copy">
                        <strong>{care.room}</strong>
                        <small>{care.statusLabel}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="quick-clean-room-empty">
                <strong>Whole-home clean</strong>
                <p>Add rooms from Settings later for more targeted suggestions.</p>
              </div>
            )}
          </section>

          <section className="quick-clean-preview" aria-labelledby="quick-clean-preview-title">
            <div className="quick-clean-preview-heading">
              <div>
                <span className="quick-clean-step-number">3</span>
                <div>
                  <h3 id="quick-clean-preview-title">Suggested clean</h3>
                  <p>Tasks stay in a practical order, from collection and tidying toward surfaces and floors.</p>
                </div>
              </div>
              <div className="quick-clean-summary" aria-live="polite">
                <strong>~{plan.estimatedMinutes} min</strong>
                <span>{plan.items.length} {plan.items.length === 1 ? "task" : "tasks"}</span>
              </div>
            </div>

            {plan.groups.length ? (
              <div className="quick-clean-plan-groups">
                {plan.groups.map((group) => (
                  <section className="quick-clean-plan-group" key={group.room}>
                    <h4>{group.room === "Whole home" ? "Start everywhere" : group.room}</h4>
                    <div className="quick-clean-task-list">
                      {group.tasks.map((task) => (
                        <div className="quick-clean-task" key={task.id}>
                          <span aria-hidden="true" className="quick-clean-task-dot" />
                          <span>
                            <strong>{task.title}</strong>
                            <small>~{task.minutes} min</small>
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="quick-clean-room-empty">
                <strong>No tasks available</strong>
                <p>Choose tasks manually from the Clean screen instead.</p>
              </div>
            )}

            <p className="quick-clean-budget-note" role="status">
              {plan.items.length
                ? plan.remainingMinutes > 0
                  ? `About ${plan.remainingMinutes} min is left unfilled so the clean does not overrun your ${plan.requestedMinutes}-minute window.`
                  : `This clean uses the full ${plan.requestedMinutes}-minute window.`
                : "No clean could be generated from the available tasks."}
            </p>
          </section>
        </div>

        <div className="quick-clean-footer">
          <div>
            <strong>{plan.items.length ? `Ready for about ${plan.estimatedMinutes} min` : "Nothing selected"}</strong>
            <span>{selectedRooms.length ? `${selectedRooms.length} ${selectedRooms.length === 1 ? "room" : "rooms"} + whole-home basics` : "Whole-home basics"}</span>
          </div>
          <div className="quick-clean-footer-actions">
            <button className="button ghost" onClick={onClose} type="button">Cancel</button>
            {onBuildRoutine ? (
              <button className="button ghost" disabled={!plan.items.length} onClick={buildRoutine} type="button">
                Save as routine
              </button>
            ) : null}
            <button className="button primary" disabled={!plan.items.length} onClick={startCleaning} type="button">
              Start cleaning
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
