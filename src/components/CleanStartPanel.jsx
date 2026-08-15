import { useMemo, useState } from "react";
import { getHomeRoomNames } from "../utils/homeLibrary.js";
import { buildQuickCleanPlan } from "../utils/quickClean.js";
import { rankRoomsForCare } from "../utils/roomCare.js";
import QuickCleanDialog from "./QuickCleanDialog.jsx";
import TaskLibraryDialog from "./TaskLibraryDialog.jsx";

const directBudgets = [5, 10, 15, 30];

export default function CleanStartPanel({ template, history = [], onStartTasks }) {
  const [taskChooserOpen, setTaskChooserOpen] = useState(false);
  const [taskChooserRoom, setTaskChooserRoom] = useState("All");
  const [timePlannerOpen, setTimePlannerOpen] = useState(false);
  const homeRooms = useMemo(() => getHomeRoomNames(template?.zones || []), [template?.zones]);
  const routines = template?.routines || [];
  const rankedRooms = useMemo(
    () =>
      rankRoomsForCare({
        rooms: homeRooms,
        routines,
        history,
        templateId: template?.id
      }),
    [history, homeRooms, routines, template?.id]
  );

  function startItems(items = []) {
    if (!items.length) return;
    onStartTasks?.(items);
  }

  function startTimedClean(minutes) {
    const plan = buildQuickCleanPlan({
      minutes,
      rooms: homeRooms,
      routines,
      history,
      templateId: template?.id
    });
    if (!plan.items.length) {
      setTimePlannerOpen(true);
      return;
    }
    startItems(plan.items);
  }

  function openRoom(room) {
    setTaskChooserRoom(room);
    setTaskChooserOpen(true);
  }

  return (
    <>
      <section className="panel clean-start-panel" aria-labelledby="clean-start-title">
        <div className="clean-start-heading">
          <div>
            <p className="eyebrow">Clean</p>
            <h2 id="clean-start-title">What do you want to clean?</h2>
            <p>Choose one simple way to begin. Clean30 handles the checklist and opens focused cleaning.</p>
          </div>
        </div>

        <button className="clean-just-start-card" onClick={() => startTimedClean(10)} type="button">
          <span className="clean-just-start-mark" aria-hidden="true">→</span>
          <span>
            <strong>Just start</strong>
            <small>Let Clean30 choose a useful short clean for you.</small>
          </span>
          <span className="clean-start-action">Start cleaning</span>
        </button>

        <div className="clean-choice-section">
          <div className="clean-choice-heading">
            <div>
              <h3>I have some time</h3>
              <p>Pick a window. Clean30 chooses work that fits.</p>
            </div>
            <button className="button text-button small" onClick={() => setTimePlannerOpen(true)} type="button">
              More options
            </button>
          </div>
          <div className="clean-time-options" role="group" aria-label="Choose available cleaning time">
            {directBudgets.map((minutes) => (
              <button
                className={minutes === 15 ? "clean-time-button recommended" : "clean-time-button"}
                key={minutes}
                onClick={() => startTimedClean(minutes)}
                type="button"
              >
                <strong>{minutes}</strong>
                <span>min</span>
              </button>
            ))}
          </div>
        </div>

        <div className="clean-choice-section clean-room-section">
          <div className="clean-choice-heading">
            <div>
              <h3>Clean a room</h3>
              <p>Choose the place. Clean30 shows relevant tasks.</p>
            </div>
            <button className="button text-button small" onClick={() => openRoom("All")} type="button">
              Choose any tasks
            </button>
          </div>

          {rankedRooms.length ? (
            <div className="clean-room-grid" role="group" aria-label="Choose a room to clean">
              {rankedRooms.map((care) => (
                <button
                  className={`clean-room-button care-${care.status}`}
                  key={care.room}
                  onClick={() => openRoom(care.room)}
                  type="button"
                >
                  <span>
                    <strong>{care.room}</strong>
                    <small>{care.statusLabel}</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="clean-room-empty">
              <strong>No rooms set up yet</strong>
              <p>You can still use Just start or choose a time. Add rooms from Settings when you want room-specific suggestions.</p>
            </div>
          )}
        </div>
      </section>

      <TaskLibraryDialog
        homeRooms={homeRooms}
        initialRoom={taskChooserRoom}
        onAddToToday={startItems}
        onClose={() => setTaskChooserOpen(false)}
        open={taskChooserOpen}
        preselectRecommended={taskChooserRoom !== "All"}
        routines={routines}
      />

      <QuickCleanDialog
        activeTemplateId={template?.id || ""}
        history={history}
        homeRooms={homeRooms}
        onAddToToday={startItems}
        onClose={() => setTimePlannerOpen(false)}
        open={timePlannerOpen}
        routines={routines}
      />
    </>
  );
}
