import { useEffect, useMemo, useRef, useState } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";
import {
  createCustomLibraryItem,
  createRoutineDraftFromLibraryItems,
  getHomeLibraryRooms,
  getRecommendedTaskIdsForRoom,
  getTaskLibraryItems
} from "../utils/homeLibrary.js";

export default function TaskLibraryDialog({
  open,
  homeRooms = [],
  routines = [],
  initialRoom = "All",
  preselectRecommended = false,
  onAddToToday,
  onBuildRoutine,
  onClose
}) {
  const searchInputRef = useRef(null);
  const dialogRef = useDialogFocus({ open, onClose, initialFocusRef: searchInputRef });
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState(initialRoom || "All");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [extraItems, setExtraItems] = useState([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customRoom, setCustomRoom] = useState(homeRooms[0] || "Other");
  const [message, setMessage] = useState("");

  const roomOptions = useMemo(
    () => getHomeLibraryRooms(homeRooms, routines),
    [homeRooms, routines]
  );
  const allItems = useMemo(
    () => getTaskLibraryItems({ routines, homeRooms, room: "All", query: "", extraItems }),
    [extraItems, homeRooms, routines]
  );
  const visibleItems = useMemo(
    () => getTaskLibraryItems({ routines, homeRooms, room, query, extraItems }),
    [extraItems, homeRooms, query, room, routines]
  );
  const selectedItems = useMemo(
    () => allItems.filter((item) => selectedIds.has(item.id)),
    [allItems, selectedIds]
  );

  useEffect(() => {
    if (!open) return;
    const resolvedRoom = getHomeLibraryRooms(homeRooms, routines).includes(initialRoom)
      ? initialRoom
      : "All";
    setQuery("");
    setRoom(resolvedRoom || "All");
    setExtraItems([]);
    setCustomTitle("");
    setCustomRoom(
      resolvedRoom && resolvedRoom !== "All" && resolvedRoom !== "Whole home"
        ? resolvedRoom
        : homeRooms[0] || "Other"
    );
    setMessage("");
    const initialIds = preselectRecommended
      ? getRecommendedTaskIdsForRoom(resolvedRoom, homeRooms, routines)
      : [];
    setSelectedIds(new Set(initialIds));
  }, [homeRooms, initialRoom, open, preselectRecommended, routines]);

  if (!open) return null;

  function toggleItem(itemId) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function addRecommended() {
    const ids = getRecommendedTaskIdsForRoom(room, homeRooms, routines);
    if (!ids.length) {
      setMessage(`No built-in pack is available for ${room}. You can still search or add a custom task.`);
      return;
    }
    setSelectedIds((current) => new Set([...current, ...ids]));
    setMessage(`${ids.length} recommended ${room} tasks selected.`);
  }

  function selectVisible() {
    setSelectedIds((current) => new Set([...current, ...visibleItems.map((item) => item.id)]));
  }

  function addCustomTask() {
    const item = createCustomLibraryItem(customTitle, customRoom || "Other");
    if (!item) return;
    setExtraItems((current) => [...current, item]);
    setSelectedIds((current) => new Set([...current, item.id]));
    setCustomTitle("");
    setMessage(`${item.title} selected.`);
  }

  function addToToday() {
    if (!selectedItems.length) return;
    onAddToToday(selectedItems);
    onClose();
  }

  function buildRoutine() {
    if (!selectedItems.length) return;
    onBuildRoutine(createRoutineDraftFromLibraryItems(selectedItems));
    onClose();
  }

  const canRecommend = room !== "All" && room !== "Other";

  return (
    <div className="dialog-backdrop task-library-backdrop" role="presentation">
      <section
        aria-labelledby="task-library-title"
        aria-modal="true"
        className="dialog task-library-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header task-library-header">
          <div>
            <p className="eyebrow">Task library</p>
            <h2 id="task-library-title">Choose what needs cleaning</h2>
            <p>Pick tasks instead of writing a cleaning plan from scratch. Your own routine tasks appear here too.</p>
          </div>
          <button aria-label="Close task library" className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="task-library-toolbar">
          <input
            aria-label="Search task library"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sink, laundry, desk, vacuum…"
            ref={searchInputRef}
            type="search"
            value={query}
          />
          <div className="task-library-room-strip" aria-label="Filter tasks by room">
            {roomOptions.map((roomName) => (
              <button
                aria-pressed={room === roomName}
                className={room === roomName ? "task-library-room active" : "task-library-room"}
                key={roomName}
                onClick={() => {
                  setRoom(roomName);
                  setMessage("");
                }}
                type="button"
              >
                {roomName}
              </button>
            ))}
          </div>
          <div className="task-library-quick-actions">
            {canRecommend ? (
              <button className="button primary small" onClick={addRecommended} type="button">
                Select recommended {room}
              </button>
            ) : null}
            {visibleItems.length ? (
              <button className="button ghost small" onClick={selectVisible} type="button">
                Select visible
              </button>
            ) : null}
            {selectedIds.size ? (
              <button className="button text-button small" onClick={() => setSelectedIds(new Set())} type="button">
                Clear selection
              </button>
            ) : null}
          </div>
        </div>

        <div className="task-library-content">
          <div className="task-library-results-heading">
            <strong>{visibleItems.length} {visibleItems.length === 1 ? "task" : "tasks"}</strong>
            <span>{selectedItems.length} selected</span>
          </div>

          {visibleItems.length ? (
            <div className="task-library-grid">
              {visibleItems.map((item) => {
                const checked = selectedIds.has(item.id);
                return (
                  <label className={checked ? "task-library-card selected" : "task-library-card"} key={item.id}>
                    <input checked={checked} onChange={() => toggleItem(item.id)} type="checkbox" />
                    <span className="task-library-card-copy">
                      <strong>{item.title}</strong>
                      <small>{item.room} · ~{item.minutes} min</small>
                      <span className="task-library-source">
                        {item.source === "catalog"
                          ? "Suggested by Clean30"
                          : item.source === "routine"
                            ? `From ${item.sourceLabel}`
                            : "Custom task"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="task-library-empty">
              <strong>No matching tasks</strong>
              <p>Try another search, switch rooms, or add a custom task below.</p>
            </div>
          )}

          <section className="task-library-custom" aria-labelledby="task-library-custom-title">
            <div>
              <h3 id="task-library-custom-title">Missing something?</h3>
              <p>Add a custom task here. It will be included in this selection immediately.</p>
            </div>
            <div className="task-library-custom-entry">
              <input
                aria-label="Custom cleaning task"
                onChange={(event) => setCustomTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomTask();
                  }
                }}
                placeholder="Clean coffee machine"
                type="text"
                value={customTitle}
              />
              <select aria-label="Custom task room" onChange={(event) => setCustomRoom(event.target.value)} value={customRoom}>
                {[...new Set([...homeRooms, "Other"])].map((roomName) => (
                  <option key={roomName} value={roomName}>{roomName}</option>
                ))}
              </select>
              <button className="button ghost" disabled={!customTitle.trim()} onClick={addCustomTask} type="button">
                Add task
              </button>
            </div>
          </section>
          {message ? <p className="form-message task-library-message" role="status">{message}</p> : null}
        </div>

        <div className="task-library-footer">
          <div>
            <strong>{selectedItems.length} selected</strong>
            <span>{selectedItems.length ? ` · about ${selectedItems.reduce((sum, item) => sum + item.minutes, 0)} min total` : ""}</span>
          </div>
          <div className="task-library-footer-actions">
            <button className="button ghost" onClick={onClose} type="button">Cancel</button>
            <button className="button ghost" disabled={!selectedItems.length} onClick={buildRoutine} type="button">
              Build routine
            </button>
            <button className="button primary" disabled={!selectedItems.length} onClick={addToToday} type="button">
              Add to Today
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
