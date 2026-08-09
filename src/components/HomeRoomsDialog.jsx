import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCanonicalHomeRoomName,
  homeRoomPresets,
  isReservedHomeRoomName
} from "../utils/homeLibrary.js";
import useDialogFocus from "../hooks/useDialogFocus.js";

const keyOf = (value) => String(value || "").trim().toLowerCase();

function uniqueRooms(values = []) {
  const seen = new Set();
  return values
    .map(getCanonicalHomeRoomName)
    .filter((value) => {
      const key = keyOf(value);
      if (!key || isReservedHomeRoomName(value) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export default function HomeRoomsDialog({ open, rooms = [], onSave, onClose }) {
  const customInputRef = useRef(null);
  const dialogRef = useDialogFocus({ open, onClose, initialFocusRef: customInputRef });
  const [selectedRooms, setSelectedRooms] = useState(() => uniqueRooms(rooms));
  const [customRoom, setCustomRoom] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedRooms(uniqueRooms(rooms));
    setCustomRoom("");
    setMessage("");
  }, [open, rooms]);

  const presetNames = useMemo(
    () => new Set(homeRoomPresets.map((item) => keyOf(item.name))),
    []
  );
  const customRooms = selectedRooms.filter((room) => !presetNames.has(keyOf(room)));

  if (!open) return null;

  function togglePreset(roomName) {
    const key = keyOf(roomName);
    setSelectedRooms((current) => {
      const exists = current.some((room) => keyOf(room) === key);
      return exists ? current.filter((room) => keyOf(room) !== key) : [...current, roomName];
    });
  }

  function addCustomRoom() {
    const rawName = customRoom.trim();
    if (!rawName) return;
    if (isReservedHomeRoomName(rawName)) {
      setMessage(`Choose a specific room name instead of “${rawName}”.`);
      return;
    }
    const name = getCanonicalHomeRoomName(rawName);
    if (selectedRooms.some((room) => keyOf(room) === keyOf(name))) {
      setMessage("That room is already in your home.");
      return;
    }
    setSelectedRooms((current) => [...current, name]);
    setCustomRoom("");
    setMessage(`${name} added.`);
    window.requestAnimationFrame(() => customInputRef.current?.focus());
  }

  function removeRoom(roomName) {
    setSelectedRooms((current) => current.filter((room) => keyOf(room) !== keyOf(roomName)));
  }

  function saveRooms() {
    onSave(uniqueRooms(selectedRooms));
    onClose();
  }

  return (
    <div className="dialog-backdrop home-rooms-backdrop" role="presentation">
      <section
        aria-labelledby="home-rooms-title"
        aria-modal="true"
        className="dialog home-rooms-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Your home</p>
            <h2 id="home-rooms-title">Which rooms do you clean?</h2>
            <p>Choose the spaces that actually exist. Clean30 will use them to keep suggestions relevant.</p>
          </div>
          <button aria-label="Close room setup" className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="home-room-preset-grid">
          {homeRoomPresets.map((preset) => {
            const checked = selectedRooms.some((room) => keyOf(room) === keyOf(preset.name));
            return (
              <label className={checked ? "home-room-option selected" : "home-room-option"} key={preset.name}>
                <input checked={checked} onChange={() => togglePreset(preset.name)} type="checkbox" />
                <span><strong>{preset.name}</strong><small>{preset.description}</small></span>
              </label>
            );
          })}
        </div>

        <section className="home-custom-room-section" aria-labelledby="custom-room-title">
          <div><h3 id="custom-room-title">Another room?</h3><p>Add anything that is specific to your home.</p></div>
          <div className="home-custom-room-entry">
            <input
              aria-label="Custom room name"
              onChange={(event) => setCustomRoom(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomRoom();
                }
              }}
              maxLength={60}
              placeholder="Guest room, nursery, storage room…"
              ref={customInputRef}
              type="text"
              value={customRoom}
            />
            <button className="button ghost" disabled={!customRoom.trim()} onClick={addCustomRoom} type="button">Add room</button>
          </div>
          {customRooms.length ? (
            <div className="home-custom-room-list" aria-label="Custom rooms">
              {customRooms.map((room) => (
                <span className="home-room-chip removable" key={room}>
                  {room}
                  <button aria-label={`Remove ${room}`} onClick={() => removeRoom(room)} type="button">×</button>
                </span>
              ))}
            </div>
          ) : null}
          {message ? <p className="form-message" role="status">{message}</p> : null}
        </section>

        <p className="home-room-safety-note">Removing a room here only changes Home and Task Library suggestions. It does not delete routines or Progress.</p>

        <div className="dialog-actions home-rooms-actions">
          <span>{selectedRooms.length} {selectedRooms.length === 1 ? "room" : "rooms"}</span>
          <button className="button ghost" onClick={onClose} type="button">Cancel</button>
          <button className="button primary" onClick={saveRooms} type="button">Save home</button>
        </div>
      </section>
    </div>
  );
}
