import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  buildConfiguredTasks,
  buildGuestPlan,
  buildRoomPlan,
  buildTodayPlan,
  buildWeeklyReset,
  cadenceLabel,
  cadencePresets,
  completeSession,
  createCustomRoomItem,
  createCustomTask,
  createFreshV2State,
  createRoom,
  createSession,
  createV2Backup,
  dateKey,
  daysFromToday,
  futureTasks,
  loadV2StateResult,
  normalizeV2State,
  normalizeCadence,
  overdueTasks,
  realignDueDate,
  roomTypeById,
  roomTypes,
  saveV2State,
  taskHealth,
  tasksForRoom,
  tasksGroupedByRoom,
  validateV2Backup,
  weekdayLabels
} from "./model.js";

const iconPaths = {
  home: <><path d="m4 11 8-7 8 7"/><path d="M6.5 10v10h11V10"/><path d="M10 20v-6h4v6"/></>,
  plan: <><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="m8 15 2 2 5-5"/></>,
  settings: <><path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h8M16 17h4"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="17" r="2"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  weekly: <><path d="M5 6h14v14H5z"/><path d="M8 3v5M16 3v5M5 10h14"/><path d="m9 15 2 2 4-5"/></>,
  room: <><path d="M5 20V5h11v15M16 9h3v11"/><path d="M9 12h.01"/></>,
  guest: <><path d="M12 4c1 3 3 5 6 6-3 1-5 3-6 6-1-3-3-5-6-6 3-1 5-3 6-6Z"/><path d="M18 16c.5 1.5 1.5 2.5 3 3-1.5.5-2.5 1.5-3 3-.5-1.5-1.5-2.5-3-3 1.5-.5 2.5-1.5 3-3Z"/></>,
  pause: <><path d="M9 7v10M15 7v10"/></>,
  play: <path d="m9 7 8 5-8 5Z"/>,
  close: <><path d="m7 7 10 10M17 7 7 17"/></>,
  back: <><path d="m14 6-6 6 6 6"/><path d="M8 12h11"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></>,
  trash: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></>,
  edit: <><path d="m5 19 3.5-.7L18 8.8 15.2 6 5.7 15.5 5 19Z"/><path d="m13.8 7.4 2.8 2.8"/></>,
  chevron: <path d="m9 6 6 6-6 6"/>,
  moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>
};

function Icon({ name, size = 22 }) {
  return <svg aria-hidden="true" className="v2-icon" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size}>{iconPaths[name] || iconPaths.home}</svg>;
}

function downloadJson(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadText(payload, fileName) {
  const blob = new Blob([String(payload || "")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatLongDate(value = new Date()) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(value);
}

function relativeDueLabel(value, today = dateKey()) {
  const difference = daysFromToday(value, today);
  if (difference < 0) return `${Math.abs(difference)}d overdue`;
  if (difference === 0) return "Today";
  if (difference === 1) return "Tomorrow";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function legacyRoomSuggestions() {
  try {
    const raw = window.localStorage.getItem("clean30_appState");
    const state = raw ? JSON.parse(raw) : null;
    const template = state?.templates?.find((item) => item.id === state.activeTemplateId) || state?.templates?.[0];
    const names = (template?.zones || []).map((zone) => typeof zone === "string" ? zone : zone?.name).filter(Boolean);
    const rooms = [];
    for (const name of names) {
      const type = roomTypes.find((item) => item.label.toLowerCase() === String(name).toLowerCase());
      if (!type) continue;
      const created = createRoom(type.id, rooms);
      rooms.push({ ...created, name: String(name) });
    }
    return rooms;
  } catch {
    return [];
  }
}

function seedRooms() {
  const legacy = legacyRoomSuggestions();
  if (legacy.length) return legacy;
  return ["kitchen", "bathroom", "bedroom", "living"].reduce(
    (rooms, type) => [...rooms, createRoom(type, rooms)],
    []
  );
}

function FrequencyControl({ disabled = false, label, onChange, value }) {
  const numericValue = normalizeCadence(value);
  const [custom, setCustom] = useState(!cadencePresets.includes(numericValue));

  function chooseFrequency(event) {
    if (event.target.value === "custom") {
      setCustom(true);
      return;
    }
    setCustom(false);
    onChange(normalizeCadence(event.target.value));
  }

  return <div className="v2-frequency-control">
    <select aria-label={label} disabled={disabled} onChange={chooseFrequency} value={custom ? "custom" : numericValue}>
      {cadencePresets.map((days) => <option key={days} value={days}>{cadenceLabel(days)}</option>)}
      <option value="custom">Custom interval…</option>
    </select>
    {custom ? <label className="v2-custom-frequency"><span>Every</span><input aria-label={`${label} in days`} disabled={disabled} max="730" min="1" onChange={(event) => onChange(normalizeCadence(event.target.value))} type="number" value={numericValue}/><span>days</span></label> : null}
  </div>;
}

function SetupFlow({ initialState, onCancel, onComplete, startStep = null }) {
  const editing = Boolean(initialState?.onboardingComplete);
  const directEdit = editing && Number.isInteger(startStep);
  const initialRoomsRef = useRef(initialState?.rooms?.length ? initialState.rooms : seedRooms());
  const [step, setStep] = useState(directEdit ? startStep : editing ? 1 : 0);
  const [homeName, setHomeName] = useState(initialState?.homeName || "My home");
  const [rooms, setRooms] = useState(initialRoomsRef.current);
  const [cleanDays, setCleanDays] = useState(initialState?.cleanDays?.length ? initialState.cleanDays : [2, 4, 6]);
  const [scheduleStyle, setScheduleStyle] = useState(initialState?.scheduleStyle || "spread");
  const [taskDraft, setTaskDraft] = useState(() => {
    if (initialState?.tasks?.length) return initialState.tasks;
    return buildConfiguredTasks(initialRoomsRef.current, initialState?.cleanDays || [2, 4, 6]);
  });
  const [taskRoomId, setTaskRoomId] = useState(rooms[0]?.id || "");
  const [customTaskTitle, setCustomTaskTitle] = useState("");
  const [customTaskCadence, setCustomTaskCadence] = useState(7);
  const [customTaskError, setCustomTaskError] = useState("");
  const [customRoomName, setCustomRoomName] = useState("");
  const [customItemDrafts, setCustomItemDrafts] = useState({});
  const totalSteps = 5;

  useEffect(() => {
    if (!rooms.some((room) => room.id === taskRoomId)) setTaskRoomId(rooms[0]?.id || "");
  }, [rooms, taskRoomId]);

  useEffect(() => {
    if (!editing || !onCancel) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, onCancel]);

  function addRoom(typeId) {
    setRooms((current) => [...current, createRoom(typeId, current)]);
  }

  function addCustomRoom(event) {
    event.preventDefault();
    const name = customRoomName.trim();
    if (!name) return;
    setRooms((current) => [...current, createRoom("other", current, name)]);
    setCustomRoomName("");
  }

  function updateRoom(roomId, updates) {
    setRooms((current) => current.map((room) => room.id === roomId ? { ...room, ...updates } : room));
  }

  function removeRoom(roomId) {
    setRooms((current) => current.filter((room) => room.id !== roomId));
  }

  function toggleFeature(roomId, featureId) {
    setRooms((current) => current.map((room) => {
      if (room.id !== roomId) return room;
      const selected = room.features.includes(featureId);
      return { ...room, features: selected ? room.features.filter((item) => item !== featureId) : [...room.features, featureId] };
    }));
  }

  function addCustomItem(event, roomId) {
    event.preventDefault();
    const name = String(customItemDrafts[roomId] || "").trim();
    if (!name) return;
    setRooms((current) => current.map((room) => {
      if (room.id !== roomId) return room;
      if ((room.customItems || []).some((item) => item.name.toLowerCase() === name.toLowerCase())) return room;
      return { ...room, customItems: [...(room.customItems || []), createCustomRoomItem(name)] };
    }));
    setCustomItemDrafts((current) => ({ ...current, [roomId]: "" }));
  }

  function removeCustomItem(roomId, itemId) {
    setRooms((current) => current.map((room) => room.id === roomId
      ? { ...room, customItems: (room.customItems || []).filter((item) => item.id !== itemId) }
      : room));
  }

  function buildTasksFromHome() {
    const effectiveCleanDays = scheduleStyle === "one-day" ? [cleanDays[0]] : cleanDays;
    const generated = buildConfiguredTasks(rooms, effectiveCleanDays);
    const existing = new Map(taskDraft.map((item) => [item.id, item]));
    const scheduleChanged = scheduleStyle !== (initialState?.scheduleStyle || "spread") ||
      effectiveCleanDays.join(",") !== (initialState?.cleanDays || [2, 4, 6]).join(",");
    const mergedRecommendations = generated.map((item) => {
      const previous = existing.get(item.id);
      if (!previous) return item;
      return {
        ...item,
        enabled: previous.enabled,
        cadence: previous.cadence,
        nextDue: scheduleChanged ? realignDueDate(previous.nextDue, previous.cadence, effectiveCleanDays) : previous.nextDue,
        roomName: rooms.find((room) => room.id === item.roomId)?.name || item.roomName
      };
    });
    const roomIds = new Set(rooms.map((room) => room.id));
    const customTasks = taskDraft
      .filter((item) => item.custom && roomIds.has(item.roomId))
      .map((item) => ({
        ...item,
        roomName: rooms.find((room) => room.id === item.roomId)?.name || item.roomName,
        nextDue: scheduleChanged ? realignDueDate(item.nextDue, item.cadence, effectiveCleanDays) : item.nextDue
      }));
    const merged = [...mergedRecommendations, ...customTasks];
    setTaskDraft(merged);
    if (!taskRoomId) setTaskRoomId(rooms[0]?.id || "");
    return merged;
  }

  function goNext() {
    if (step === 2) buildTasksFromHome();
    setStep((current) => Math.min(totalSteps - 1, current + 1));
  }

  function finish(startFirstClean = false) {
    const invalidCustom = taskDraft.find((item) => item.custom && !item.title.trim());
    if (invalidCustom) {
      setCustomTaskError("Custom task names cannot be empty.");
      setTaskRoomId(invalidCustom.roomId);
      setStep(3);
      return;
    }
    const rebuilt = buildTasksFromHome();
    const effectiveCleanDays = scheduleStyle === "one-day" ? [cleanDays[0]] : cleanDays;
    onComplete({ homeName, rooms, tasks: rebuilt, cleanDays: effectiveCleanDays, scheduleStyle }, { directEdit, startFirstClean });
  }

  function chooseScheduleStyle(style) {
    setScheduleStyle(style);
    if (style === "one-day") setCleanDays((current) => [current[0] ?? 6]);
  }

  function toggleCleanDay(day) {
    if (scheduleStyle === "one-day") {
      setCleanDays([day]);
      return;
    }
    setCleanDays((current) => current.includes(day)
      ? current.length > 1 ? current.filter((item) => item !== day) : current
      : [...current, day].sort());
  }

  function addCustomTask(event) {
    event.preventDefault();
    const title = customTaskTitle.trim();
    const room = rooms.find((item) => item.id === taskRoomId);
    if (!title || !room) return;
    const duplicate = taskDraft.some((item) => item.roomId === room.id && item.title.toLowerCase() === title.toLowerCase());
    if (duplicate) {
      setCustomTaskError("That room already has a task with this name.");
      return;
    }
    const effectiveCleanDays = scheduleStyle === "one-day" ? [cleanDays[0]] : cleanDays;
    setTaskDraft((current) => [...current, createCustomTask(room, title, customTaskCadence, effectiveCleanDays)]);
    setCustomTaskTitle("");
    setCustomTaskError("");
  }

  function updateCustomTask(taskId, updates) {
    const existing = taskDraft.find((item) => item.id === taskId && item.custom);
    if (!existing) return;
    const roomId = updates.roomId || existing.roomId;
    const title = updates.title === undefined ? existing.title : updates.title;
    const duplicate = title.trim() && taskDraft.some((item) => item.id !== taskId && item.roomId === roomId && item.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (duplicate) {
      setCustomTaskError("That room already has a task with this name.");
      return;
    }
    setCustomTaskError("");
    const room = updates.roomId ? rooms.find((candidate) => candidate.id === updates.roomId) : null;
    setTaskDraft((current) => current.map((item) => item.id !== taskId ? item : {
        ...item,
        ...updates,
        ...(room ? { roomId: room.id, roomType: room.type, roomName: room.name, id: `${room.id}:${item.key}` } : {})
      }));
  }

  function removeCustomTask(taskId) {
    setTaskDraft((current) => current.filter((item) => item.id !== taskId));
    setCustomTaskError("");
  }

  const activeRoomTasks = taskDraft.filter((item) => item.roomId === taskRoomId);
  const enabledCount = taskDraft.filter((item) => item.enabled).length;

  return (
    <div className="v2-setup-shell">
      <header className="v2-setup-header">
        <div className="v2-brand"><span className="v2-brand-mark"><Icon name="check" size={19}/></span><span>Clean30</span></div>
        {editing && onCancel ? <button className="v2-icon-button" aria-label="Close setup" onClick={onCancel} type="button"><Icon name="close"/></button> : null}
      </header>

      {!directEdit ? <div className="v2-setup-progress" aria-label={`Setup step ${step + 1} of ${totalSteps}`} role="progressbar" aria-valuemin="1" aria-valuemax={totalSteps} aria-valuenow={step + 1}>
        {Array.from({ length: totalSteps }, (_, index) => <span className={index <= step ? "active" : ""} key={index}/>) }
      </div> : null}

      <main className="v2-setup-main">
        {step === 0 ? (
          <section className="v2-setup-intro">
            <span className="v2-intro-mark"><Icon name="home" size={34}/></span>
            <p className="v2-kicker">Set up once</p>
            <h1>Clean without planning every clean.</h1>
            <p className="v2-lead">Tell Clean30 what is actually in your home. It will build a realistic weekly and monthly plan, decide what is due, and guide you through one task at a time.</p>
            <div className="v2-promise-grid">
              <div><strong>Real tasks</strong><span>Only cleaning that matters in your rooms.</span></div>
              <div><strong>One clear plan</strong><span>No routines to invent or timers to choose.</span></div>
              <div><strong>Private by default</strong><span>Your home data stays on this device.</span></div>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section>
            <p className="v2-kicker">Your home</p>
            <h1>Which rooms do you clean?</h1>
            <p className="v2-lead compact">Add every separate room. You can rename duplicates such as Bedroom 1 and Bedroom 2.</p>
            <label className="v2-field-label" htmlFor="home-name">Home name</label>
            <input className="v2-text-input" id="home-name" maxLength="40" onChange={(event) => setHomeName(event.target.value)} value={homeName}/>
            <div className="v2-room-add-grid">
              {roomTypes.filter((type) => type.id !== "other").map((type) => <button className="v2-room-add" key={type.id} onClick={() => addRoom(type.id)} type="button"><span>+</span>{type.label}</button>)}
            </div>
            <form className="v2-custom-room-form" onSubmit={addCustomRoom}>
              <div><strong>Add any other room</strong><span>Hallway, children’s room, garage, storage, or anything unique to your home.</span></div>
              <input aria-label="Custom room name" maxLength="40" onChange={(event) => setCustomRoomName(event.target.value)} placeholder="e.g. Hallway" value={customRoomName}/>
              <button className="v2-button secondary" disabled={!customRoomName.trim()} type="submit">Add room</button>
            </form>
            <div className="v2-room-list">
              {rooms.map((room) => (
                <div className="v2-room-row" key={room.id}>
                  <span className="v2-room-dot"/>
                  <input aria-label={`Name for ${roomTypeById(room.type).label}`} maxLength="40" onChange={(event) => updateRoom(room.id, { name: event.target.value })} value={room.name}/>
                  <button aria-label={`Remove ${room.name}`} className="v2-icon-button subtle" onClick={() => removeRoom(room.id)} type="button"><Icon name="trash" size={18}/></button>
                </div>
              ))}
              {!rooms.length ? <div className="v2-empty-inline">Add at least one room to continue.</div> : null}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <p className="v2-kicker">Home details</p>
            <h1>What is actually in each room?</h1>
            <p className="v2-lead compact">Common items are already selected. Remove anything you do not have; add what is missing.</p>
            <div className="v2-feature-rooms">
              {rooms.map((room) => {
                const type = roomTypeById(room.type);
                return <article className="v2-feature-card" key={room.id}>
                  <div><h2>{room.name}</h2><span>{type.label}</span></div>
                  <div className="v2-chip-grid">
                    {type.features.map(([id, label]) => <button aria-pressed={room.features.includes(id)} className={room.features.includes(id) ? "v2-choice-chip selected" : "v2-choice-chip"} key={id} onClick={() => toggleFeature(room.id, id)} type="button"><span className="v2-chip-check">{room.features.includes(id) ? "✓" : "+"}</span>{label}</button>)}
                    {(room.customItems || []).map((item) => <span className="v2-custom-item-chip" key={item.id}>{item.name}<button aria-label={`Remove ${item.name} from ${room.name}`} onClick={() => removeCustomItem(room.id, item.id)} type="button"><Icon name="close" size={14}/></button></span>)}
                  </div>
                  <form className="v2-custom-item-form" onSubmit={(event) => addCustomItem(event, room.id)}>
                    <input aria-label={`Add an item or surface to ${room.name}`} maxLength="60" onChange={(event) => setCustomItemDrafts((current) => ({ ...current, [room.id]: event.target.value }))} placeholder="Add any item or surface…" value={customItemDrafts[room.id] || ""}/>
                    <button className="v2-button secondary" disabled={!String(customItemDrafts[room.id] || "").trim()} type="submit">Add</button>
                  </form>
                </article>;
              })}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <p className="v2-kicker">Recommended plan</p>
            <h1>Keep only the work your home needs.</h1>
            <p className="v2-lead compact">Clean30 selected practical recurring tasks from your rooms and home features. Remove anything irrelevant or add work unique to your home.</p>
            <div className="v2-room-tabs" role="tablist" aria-label="Rooms">
              {rooms.map((room) => <button aria-selected={room.id === taskRoomId} className={room.id === taskRoomId ? "active" : ""} key={room.id} onClick={() => setTaskRoomId(room.id)} role="tab" type="button">{room.name}</button>)}
            </div>
            <div className="v2-task-review-list">
              {activeRoomTasks.filter((item) => item.enabled).map((item) => (
                <div className={`v2-task-review${item.enabled ? " enabled" : ""}${item.custom ? " custom" : ""}`} key={item.id}>
                  <button aria-label={`${item.enabled ? "Remove" : "Add"} ${item.title}`} aria-pressed={item.enabled} className="v2-task-toggle" onClick={() => setTaskDraft((current) => current.map((task) => task.id === item.id ? { ...task, enabled: !task.enabled } : task))} type="button">{item.enabled ? "✓" : "+"}</button>
                  <div>{item.custom ? <input aria-label={`Name for ${item.title}`} className="v2-task-title-input" maxLength="90" onChange={(event) => updateCustomTask(item.id, { title: event.target.value })} value={item.title}/> : <strong>{item.title}</strong>}<span>{item.custom ? "Your task" : item.generatedFromItem ? "Suggested from your room items" : item.feature ? "Matched to your home" : "Recommended for this room"}</span></div>
                  {item.custom ? <select aria-label={`Room for ${item.title}`} disabled={!item.enabled} onChange={(event) => updateCustomTask(item.id, { roomId: event.target.value })} value={item.roomId}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select> : null}
                  <FrequencyControl disabled={!item.enabled} label={`Frequency for ${item.title}`} onChange={(cadence) => setTaskDraft((current) => current.map((task) => task.id === item.id ? { ...task, cadence } : task))} value={item.cadence}/>
                  {item.custom ? <button aria-label={`Delete ${item.title}`} className="v2-icon-button subtle" onClick={() => removeCustomTask(item.id)} type="button"><Icon name="trash" size={18}/></button> : null}
                </div>
              ))}
            </div>
            {activeRoomTasks.some((item) => !item.enabled) ? <details className="v2-optional-tasks">
              <summary>Add optional tasks <span>{activeRoomTasks.filter((item) => !item.enabled).length}</span></summary>
              <div className="v2-task-review-list">
                {activeRoomTasks.filter((item) => !item.enabled).map((item) => <div className="v2-task-review" key={item.id}>
                  <button aria-label={`Add ${item.title}`} aria-pressed="false" className="v2-task-toggle" onClick={() => setTaskDraft((current) => current.map((task) => task.id === item.id ? { ...task, enabled: true } : task))} type="button">+</button>
                  <div><strong>{item.title}</strong><span>{item.generatedFromItem ? "Suggested from your room items" : item.feature ? "Matched to your home" : "Optional for this room"}</span></div>
                </div>)}
              </div>
            </details> : null}
            <form className="v2-custom-task-form" onSubmit={addCustomTask}>
              <div><strong>Add your own task</strong><span>For {rooms.find((room) => room.id === taskRoomId)?.name || "this room"}</span></div>
              <input aria-label="Custom cleaning task" maxLength="90" onChange={(event) => setCustomTaskTitle(event.target.value)} placeholder="e.g. Clean the coffee machine" value={customTaskTitle}/>
              <FrequencyControl label="Custom task frequency" onChange={setCustomTaskCadence} value={customTaskCadence}/>
              <button className="v2-button secondary" disabled={!customTaskTitle.trim()} type="submit">Add task</button>
            </form>
            {customTaskError ? <p className="v2-inline-error" role="alert">{customTaskError}</p> : null}
            <p className="v2-review-summary">{enabledCount} recurring tasks selected across {rooms.length} rooms.</p>
          </section>
        ) : null}

        {step === 4 ? (
          <section>
            <p className="v2-kicker">Your schedule</p>
            <h1>When should cleaning appear?</h1>
            <p className="v2-lead compact">Choose days when you realistically do larger cleaning. Daily and frequent tasks follow their own interval, while weekly and monthly work lands on these days.</p>
            <div className="v2-schedule-options">
              <button aria-pressed={scheduleStyle === "spread"} className={scheduleStyle === "spread" ? "selected" : ""} onClick={() => chooseScheduleStyle("spread")} type="button"><strong>Spread it through the week</strong><span>A few meaningful tasks on each cleaning day. Recommended.</span></button>
              <button aria-pressed={scheduleStyle === "one-day"} className={scheduleStyle === "one-day" ? "selected" : ""} onClick={() => chooseScheduleStyle("one-day")} type="button"><strong>One main cleaning day</strong><span>Keep weekly work together on one chosen day.</span></button>
            </div>
            <h2 className="v2-subheading">Cleaning days</h2>
            <div className="v2-weekdays">
              {weekdayLabels.map((label, day) => <button aria-pressed={cleanDays.includes(day)} className={cleanDays.includes(day) ? "selected" : ""} key={label} onClick={() => toggleCleanDay(day)} type="button"><span>{label.slice(0, 1)}</span>{label}</button>)}
            </div>
            <div className="v2-ready-card"><span className="v2-ready-check"><Icon name="check"/></span><div><strong>Your plan is ready</strong><p>{enabledCount} tasks · {rooms.length} rooms · {cleanDays.length} cleaning {cleanDays.length === 1 ? "day" : "days"}</p></div></div>
          </section>
        ) : null}
      </main>

      <footer className="v2-setup-footer">
        {directEdit ? <button className="v2-button secondary" onClick={onCancel} type="button">Cancel</button> : step > (editing ? 1 : 0) ? <button className="v2-button secondary" onClick={() => setStep((current) => Math.max(editing ? 1 : 0, current - 1))} type="button"><Icon name="back" size={18}/>Back</button> : <span/>}
        {directEdit ? <button className="v2-button primary" disabled={step === 1 && !rooms.length} onClick={() => finish(false)} type="button">Save changes<Icon name="check" size={18}/></button> : step < totalSteps - 1 ? <button className="v2-button primary" disabled={step === 1 && !rooms.length} onClick={goNext} type="button">{step === 0 ? "Set up my home" : "Continue"}<Icon name="arrow" size={18}/></button> : editing ? <button className="v2-button primary" onClick={() => finish(false)} type="button">Save changes<Icon name="check" size={18}/></button> : <div className="v2-setup-finish-actions"><button className="v2-button secondary" onClick={() => finish(false)} type="button">Create for later</button><button className="v2-button primary" onClick={() => finish(true)} type="button">Create and start<Icon name="arrow" size={18}/></button></div>}
      </footer>
    </div>
  );
}

function TaskPreview({ items, limit = 5 }) {
  const grouped = tasksGroupedByRoom(items);
  return <div className="v2-task-preview">
    {grouped.slice(0, 3).map((group) => <div key={group.roomId}><span>{group.roomName}</span><strong>{group.items.length} {group.items.length === 1 ? "task" : "tasks"}</strong></div>)}
    {grouped.length > 3 ? <div><span>More rooms</span><strong>+{grouped.length - 3}</strong></div> : null}
    {items.length && items.length <= limit ? <ul>{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul> : null}
  </div>;
}

function HomeView({ state, onDiscardSession, onOpenRoomPicker, onStart, onViewPlan }) {
  const todayPlan = useMemo(() => buildTodayPlan(state), [state]);
  const weeklyPlan = useMemo(() => buildWeeklyReset(state), [state]);
  const guestPlan = useMemo(() => buildGuestPlan(state), [state]);
  const health = useMemo(() => taskHealth(state), [state]);

  if (state.activeSession) {
    const handled = state.activeSession.items.filter((item) => item.done || item.skipped).length;
    return <main className="v2-main v2-home">
      <section className="v2-active-clean-card">
        <p className="v2-kicker">Cleaning in progress</p>
        <h1>{state.activeSession.title}</h1>
        <p>{handled} of {state.activeSession.items.length} tasks reviewed. Your place is saved.</p>
        <div className="v2-progress-track"><span style={{ width: `${state.activeSession.items.length ? Math.round(handled / state.activeSession.items.length * 100) : 0}%` }}/></div>
        <div className="v2-active-clean-actions"><button className="v2-button primary large" onClick={() => onStart(null, true)} type="button"><Icon name="play"/>Continue cleaning</button><button className="v2-button quiet danger-text" onClick={onDiscardSession} type="button">Discard clean</button></div>
      </section>
    </main>;
  }

  return <main className="v2-main v2-home">
    <section className="v2-today-hero">
      <div className="v2-hero-copy">
        <p className="v2-kicker">{formatLongDate()}</p>
        {todayPlan.length ? <>
          <h1>Your clean is ready.</h1>
          <p>Clean30 selected what needs attention. You do not need to plan or choose tasks.</p>
          <div className="v2-plan-stat"><strong>{todayPlan.length}</strong><span>tasks across {tasksGroupedByRoom(todayPlan).length} {tasksGroupedByRoom(todayPlan).length === 1 ? "room" : "rooms"}</span></div>
          {health.overdue + health.dueToday > todayPlan.length ? <p className="v2-plan-limit-note">Showing the next {todayPlan.length} of {health.overdue + health.dueToday} due tasks. The next batch will be ready after this clean.</p> : null}
          <TaskPreview items={todayPlan}/>
          <button className="v2-button primary hero" onClick={() => onStart({ title: "Today’s clean", mode: "today", items: todayPlan })} type="button">Start today’s clean<Icon name="arrow"/></button>
        </> : <>
          <span className="v2-on-track-mark"><Icon name="check" size={28}/></span>
          <h1>You’re on track.</h1>
          <p>Nothing in your plan is due today. Clean a room if something needs attention, or leave it until the next scheduled day.</p>
          <button className="v2-button secondary hero" onClick={onViewPlan} type="button">See upcoming plan<Icon name="arrow"/></button>
        </>}
      </div>
      <aside className="v2-home-status">
        <span>Home status</span>
        <strong>{health.overdue ? `${health.overdue} overdue` : health.dueToday ? `${health.dueToday} due today` : "Plan clear"}</strong>
        <p>{health.enabled} recurring tasks managed automatically.</p>
      </aside>
    </section>

    <section className="v2-start-section">
      <div className="v2-section-heading"><div><p className="v2-kicker">Other ways to clean</p><h2>Choose only when today’s plan is not what you need.</h2></div></div>
      <div className="v2-mode-grid">
        <button className="v2-mode-card" disabled={!weeklyPlan.length} onClick={() => onStart({ title: "Weekly reset", mode: "weekly", items: weeklyPlan })} type="button"><span className="v2-mode-icon"><Icon name="weekly"/></span><div><strong>Weekly reset</strong><p>Complete the essential weekly work across your home.</p><small>{weeklyPlan.length ? `${weeklyPlan.length} tasks` : "No weekly tasks selected"}</small></div><Icon name="chevron" size={19}/></button>
        <button className="v2-mode-card" onClick={onOpenRoomPicker} type="button"><span className="v2-mode-icon"><Icon name="room"/></span><div><strong>Clean a room</strong><p>Choose one room and complete its real cleaning checklist.</p><small>{state.rooms.length} rooms set up</small></div><Icon name="chevron" size={19}/></button>
        <button className="v2-mode-card" disabled={!guestPlan.length} onClick={() => onStart({ title: "Guests are coming", mode: "guest", items: guestPlan })} type="button"><span className="v2-mode-icon"><Icon name="guest"/></span><div><strong>Guests are coming</strong><p>Prioritize the entrance, bathroom, shared rooms, and kitchen.</p><small>{guestPlan.length ? `${guestPlan.length} priority tasks` : "No guest tasks selected"}</small></div><Icon name="chevron" size={19}/></button>
      </div>
    </section>
  </main>;
}

function PlanView({ state }) {
  const overdue = useMemo(() => overdueTasks(state), [state]);
  const firstWeek = useMemo(() => futureTasks(state, 0, 6), [state]);
  const nextMonth = useMemo(() => futureTasks(state, 7, 30), [state]);
  const later = useMemo(() => futureTasks(state, 31), [state]);
  const history = [...state.history].sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt))).slice(0, 5);
  const days = Array.from({ length: 7 }, (_, offset) => addDays(dateKey(), offset));

  return <main className="v2-main v2-plan-page">
    <section className="v2-page-heading"><p className="v2-kicker">Automatic plan</p><h1>Your cleaning, already decided.</h1><p>Tasks return when they are due. Completing something reschedules it automatically.</p></section>
    <section className="v2-week-strip">
      {days.map((day, index) => {
        const count = firstWeek.filter((item) => item.nextDue === day).length;
        return <div className={index === 0 ? "today" : ""} key={day}><span>{index === 0 ? "Today" : weekdayLabels[new Date(`${day}T12:00:00`).getDay()]}</span><strong>{new Date(`${day}T12:00:00`).getDate()}</strong><small>{count ? `${count} tasks` : "—"}</small></div>;
      })}
    </section>
    {overdue.length ? <section className="v2-panel v2-overdue-panel"><div className="v2-panel-heading"><div><p className="v2-kicker">Needs attention</p><h2>{overdue.length} overdue {overdue.length === 1 ? "task" : "tasks"}</h2></div></div><div className="v2-due-list">{overdue.map((item) => <div key={item.id}><span className="v2-due-dot overdue"/><div><strong>{item.title}</strong><span>{item.roomName}</span></div><small>{relativeDueLabel(item.nextDue)}</small></div>)}</div></section> : null}
    <div className="v2-plan-columns">
      <section className="v2-panel">
        <div className="v2-panel-heading"><div><p className="v2-kicker">Next 7 days</p><h2>{firstWeek.length ? `${firstWeek.length} tasks planned` : "No work scheduled"}</h2></div></div>
        <div className="v2-due-list">
          {firstWeek.map((item) => <div key={item.id}><span className={item.nextDue < dateKey() ? "v2-due-dot overdue" : "v2-due-dot"}/><div><strong>{item.title}</strong><span>{item.roomName}</span></div><small>{relativeDueLabel(item.nextDue)}</small></div>)}
          {!firstWeek.length ? <div className="v2-empty-panel"><Icon name="check"/><strong>The next seven days are clear.</strong></div> : null}
        </div>
      </section>
      <section className="v2-panel">
        <div className="v2-panel-heading"><div><p className="v2-kicker">Next 30 days</p><h2>{nextMonth.length} tasks</h2></div></div>
        <div className="v2-due-list compact">
          {nextMonth.map((item) => <div key={item.id}><span className="v2-due-dot future"/><div><strong>{item.title}</strong><span>{item.roomName}</span></div><small>{relativeDueLabel(item.nextDue)}</small></div>)}
          {!nextMonth.length ? <div className="v2-empty-panel"><strong>No work scheduled in the next 30 days.</strong></div> : null}
        </div>
      </section>
    </div>
    {later.length ? <section className="v2-panel"><div className="v2-panel-heading"><div><p className="v2-kicker">Long-term care</p><h2>{later.length} seasonal and later tasks</h2></div></div><div className="v2-due-list compact">{later.map((item) => <div key={item.id}><span className="v2-due-dot future"/><div><strong>{item.title}</strong><span>{item.roomName}</span></div><small>{relativeDueLabel(item.nextDue)}</small></div>)}</div></section> : null}
    <section className="v2-panel v2-history-panel">
      <div className="v2-panel-heading"><div><p className="v2-kicker">Recently finished</p><h2>Cleaning history</h2></div></div>
      {history.length ? <div className="v2-history-list">{history.map((entry) => <div key={entry.id}><span className="v2-history-check"><Icon name="check" size={16}/></span><div><strong>{entry.title}</strong><span>{entry.completedCount} tasks completed</span></div><small>{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(entry.completedAt))}</small></div>)}</div> : <div className="v2-empty-panel"><strong>Your completed cleans will appear here.</strong></div>}
    </section>
  </main>;
}

function SettingsView({ state, onEditSetup, onImport, onReset, onToggleAppearance }) {
  const inputRef = useRef(null);
  return <main className="v2-main v2-settings-page">
    <section className="v2-page-heading"><p className="v2-kicker">Settings</p><h1>Home and data.</h1><p>Change the setup that drives your plan or protect the local data on this device.</p></section>
    <section className="v2-settings-group">
      <h2>Your home</h2>
      <button className="v2-settings-row" onClick={() => onEditSetup(1)} type="button"><span className="v2-settings-icon"><Icon name="home"/></span><div><strong>Rooms</strong><span>{state.homeName} · {state.rooms.length} rooms</span></div><Icon name="chevron"/></button>
      <button className="v2-settings-row" onClick={() => onEditSetup(2)} type="button"><span className="v2-settings-icon"><Icon name="room"/></span><div><strong>Room details</strong><span>Appliances, fixtures, and surfaces</span></div><Icon name="chevron"/></button>
      <button className="v2-settings-row" onClick={() => onEditSetup(3)} type="button"><span className="v2-settings-icon"><Icon name="check"/></span><div><strong>Cleaning tasks</strong><span>{state.tasks.filter((item) => item.enabled).length} recurring tasks</span></div><Icon name="chevron"/></button>
      <button className="v2-settings-row" onClick={() => onEditSetup(4)} type="button"><span className="v2-settings-icon"><Icon name="plan"/></span><div><strong>Cleaning schedule</strong><span>{state.cleanDays.map((day) => weekdayLabels[day]).join(", ")} · {state.scheduleStyle === "spread" ? "Spread through week" : "One main day"}</span></div><Icon name="chevron"/></button>
    </section>
    <section className="v2-settings-group">
      <h2>Appearance</h2>
      <button className="v2-settings-row" onClick={onToggleAppearance} type="button"><span className="v2-settings-icon"><Icon name={state.appearance === "dark" ? "moon" : "sun"}/></span><div><strong>{state.appearance === "dark" ? "Dark" : "Light"} appearance</strong><span>Switch to {state.appearance === "dark" ? "light" : "dark"}</span></div><Icon name="chevron"/></button>
    </section>
    <section className="v2-settings-group">
      <h2>Local data</h2>
      <button className="v2-settings-row" onClick={() => downloadJson(createV2Backup(state), `clean30-backup-${dateKey()}.json`)} type="button"><span className="v2-settings-icon"><Icon name="download"/></span><div><strong>Export backup</strong><span>Save your home, plan, and history as a JSON file.</span></div><Icon name="chevron"/></button>
      <button className="v2-settings-row" onClick={() => inputRef.current?.click()} type="button"><span className="v2-settings-icon"><Icon name="upload"/></span><div><strong>Restore backup</strong><span>Replace this device’s Clean30 data from a backup.</span></div><Icon name="chevron"/></button>
      <input accept="application/json,.json" className="v2-hidden-input" onChange={(event) => onImport(event.target.files?.[0], () => { event.target.value = ""; })} ref={inputRef} type="file"/>
    </section>
    <section className="v2-settings-group danger">
      <h2>Reset</h2>
      <button className="v2-settings-row" onClick={onReset} type="button"><span className="v2-settings-icon"><Icon name="trash"/></span><div><strong>Start over</strong><span>Erase the v2 setup and build a new plan.</span></div><Icon name="chevron"/></button>
    </section>
    <p className="v2-privacy-note">Clean30 has no account, cloud sync, analytics, advertising, or remote database. Data stays in this browser unless you export it.</p>
  </main>;
}

function useModalFocus(containerRef, onClose) {
  useEffect(() => {
    const previous = document.activeElement;
    const container = containerRef.current;
    const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const initial = container?.querySelector("[autofocus]") || container?.querySelector(focusableSelector);
    initial?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !container) return;
      const focusable = [...container.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previous?.focus?.();
    };
  }, [containerRef, onClose]);
}

function RoomPicker({ rooms, onClose, onSelect, state }) {
  const dialogRef = useRef(null);
  useModalFocus(dialogRef, onClose);
  return <div className="v2-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation"><section aria-labelledby="room-picker-title" aria-modal="true" className="v2-sheet" ref={dialogRef} role="dialog"><header><div><p className="v2-kicker">Choose a room</p><h2 id="room-picker-title">What needs cleaning?</h2></div><button aria-label="Close room picker" autoFocus className="v2-icon-button" onClick={onClose} type="button"><Icon name="close"/></button></header><div className="v2-picker-list">{rooms.map((room) => { const count = buildRoomPlan(state, room.id).length; return <button disabled={!count} key={room.id} onClick={() => onSelect(room)} type="button"><span className="v2-room-dot"/><div><strong>{room.name}</strong><span>{count ? `${count} selected cleaning tasks` : "No tasks selected"}</span></div><Icon name="chevron"/></button>; })}</div></section></div>;
}

function ConfirmModal({ confirmLabel = "Confirm", message, onCancel, onConfirm, title }) {
  const dialogRef = useRef(null);
  useModalFocus(dialogRef, onCancel);
  return <div className="v2-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }} role="presentation"><section aria-labelledby="confirm-title" aria-modal="true" className="v2-confirm" ref={dialogRef} role="alertdialog"><h2 id="confirm-title">{title}</h2><p>{message}</p><div><button autoFocus className="v2-button secondary" onClick={onCancel} type="button">Cancel</button><button className="v2-button danger" onClick={onConfirm} type="button">{confirmLabel}</button></div></section></div>;
}

function RecoveryScreen({ onDownload, onStartFresh }) {
  return <main className="v2-recovery-screen">
    <section>
      <span className="v2-intro-mark"><Icon name="download" size={30}/></span>
      <p className="v2-kicker">Recovery needed</p>
      <h1>Your saved Clean30 data could not be read.</h1>
      <p>Clean30 has not overwritten it. Download the original data before starting fresh so it may still be recoverable later.</p>
      <div><button className="v2-button primary" onClick={onDownload} type="button"><Icon name="download"/>Download recovery data</button><button className="v2-button secondary" onClick={onStartFresh} type="button">Start with a fresh setup</button></div>
    </section>
  </main>;
}

function FocusedClean({ backgroundInert = false, session, onChange, onDiscard, onFinish, onPause }) {
  const [reviewing, setReviewing] = useState(false);
  const handled = session.items.filter((item) => item.done || item.skipped).length;
  const completed = session.items.filter((item) => item.done).length;
  const current = session.items[session.currentIndex] || null;
  const finished = handled === session.items.length && !reviewing;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onPause();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPause]);

  function advance(items, currentIndex) {
    for (let offset = 1; offset <= items.length; offset += 1) {
      const index = (currentIndex + offset) % items.length;
      if (!items[index].done && !items[index].skipped) return index;
    }
    return currentIndex;
  }

  function mark(field) {
    const items = session.items.map((item, index) => index === session.currentIndex ? { ...item, [field]: true, ...(field === "done" ? { skipped: false } : { done: false }) } : item);
    onChange({ ...session, items, currentIndex: advance(items, session.currentIndex) });
  }

  function clearChoice() {
    const items = session.items.map((item, index) => index === session.currentIndex ? { ...item, done: false, skipped: false } : item);
    onChange({ ...session, items });
  }

  function move(direction) {
    onChange({ ...session, currentIndex: (session.currentIndex + direction + session.items.length) % session.items.length });
  }

  return <div className="v2-focus-shell" inert={backgroundInert ? true : undefined}>
    <header className="v2-focus-header"><button className="v2-button quiet" onClick={onPause} type="button"><Icon name="pause" size={18}/>Pause</button><div><span>{session.title}</span><strong>{handled}/{session.items.length}</strong></div><button className="v2-button quiet danger-text" onClick={onDiscard} type="button">Discard</button></header>
    <div className="v2-focus-progress"><span style={{ width: `${session.items.length ? Math.round(handled / session.items.length * 100) : 0}%` }}/></div>
    {finished ? <main className="v2-focus-complete"><span className="v2-complete-mark"><Icon name="check" size={40}/></span><p className="v2-kicker">Clean complete</p><h1>{completed} tasks finished.</h1><p>Clean30 will reschedule the completed work automatically. Skipped tasks remain in the plan.</p><div className="v2-complete-actions"><button className="v2-button secondary" onClick={() => { setReviewing(true); onChange({ ...session, currentIndex: 0 }); }} type="button">Review choices</button><button className="v2-button primary hero" onClick={onFinish} type="button">Save and finish<Icon name="check"/></button></div></main> : current ? <main aria-live="polite" className="v2-focus-main"><div className="v2-focus-position"><span>{current.roomName}</span><strong>Task {session.currentIndex + 1} of {session.items.length}</strong></div><article className="v2-focus-task"><p>{reviewing ? current.done ? "Marked done" : current.skipped ? "Skipped" : "Needs a choice" : "Do this now"}</p><h1>{current.title}</h1>{current.detail ? <span>{current.detail}</span> : null}</article><div className="v2-focus-actions"><button className="v2-button primary done" onClick={() => mark("done")} type="button"><Icon name="check"/>Done</button><button className="v2-button secondary" onClick={() => mark("skipped")} type="button">Skip for now</button>{reviewing && (current.done || current.skipped) ? <button className="v2-button quiet" onClick={clearChoice} type="button">Clear choice</button> : null}</div><div className="v2-focus-navigation"><button disabled={session.items.length < 2} onClick={() => move(-1)} type="button"><Icon name="back"/>Previous</button><button disabled={session.items.length < 2} onClick={() => move(1)} type="button">Next<Icon name="arrow"/></button></div>{reviewing && handled === session.items.length ? <button className="v2-button primary" onClick={() => setReviewing(false)} type="button">Return to summary</button> : null}</main> : <main className="v2-focus-complete"><h1>No tasks in this clean.</h1><button className="v2-button primary" onClick={onPause} type="button">Back home</button></main>}
  </div>;
}

function AppShell({ backgroundInert = false, children, currentView, onNavigate, state }) {
  const navItems = [["home", "Home"], ["plan", "Plan"], ["settings", "Settings"]];
  return <div className="v2-app-shell" inert={backgroundInert ? true : undefined}>
    <header className="v2-app-header"><div className="v2-brand"><span className="v2-brand-mark"><Icon name="check" size={19}/></span><div><strong>Clean30</strong><small>{state.homeName}</small></div></div><span className="v2-date">{formatLongDate()}</span></header>
    <nav aria-label="Primary navigation" className="v2-nav">{navItems.map(([id, label]) => <button aria-current={currentView === id ? "page" : undefined} className={currentView === id ? "active" : ""} key={id} onClick={() => onNavigate(id)} type="button"><Icon name={id}/><span>{label}</span></button>)}</nav>
    {children}
  </div>;
}

export default function AppV2() {
  const initialLoadRef = useRef(null);
  if (!initialLoadRef.current) initialLoadRef.current = loadV2StateResult();
  const [state, setState] = useState(initialLoadRef.current.state);
  const [recoveryPayload, setRecoveryPayload] = useState(initialLoadRef.current.recoveryPayload || null);
  const [view, setView] = useState("home");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(null);
  const [roomPickerOpen, setRoomPickerOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(Boolean(state.activeSession));
  const [confirmation, setConfirmation] = useState(null);
  const [notice, setNotice] = useState(initialLoadRef.current.error || "");
  const [storageError, setStorageError] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const persistenceReadyRef = useRef(!initialLoadRef.current.recoveryPayload);

  useEffect(() => {
    if (!persistenceReadyRef.current) return;
    const result = saveV2State(state);
    setStorageError(result.ok ? "" : result.error);
    document.documentElement.dataset.clean30Theme = state.appearance;
  }, [state]);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener("clean30:updateAvailable", handleUpdate);
    return () => window.removeEventListener("clean30:updateAvailable", handleUpdate);
  }, []);

  useEffect(() => {
    if (!state.onboardingComplete) return;
    navigator.storage?.persist?.().catch(() => {});
  }, [state.onboardingComplete]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!storageError) return undefined;
    const protectUnsavedChanges = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectUnsavedChanges);
    return () => window.removeEventListener("beforeunload", protectUnsavedChanges);
  }, [storageError]);

  function completeSetup(config, { directEdit = false, startFirstClean = false } = {}) {
    setState((current) => {
      const configured = normalizeV2State({
        ...current,
        ...config,
        setupDate: current.setupDate || dateKey(),
        onboardingComplete: true,
        activeSession: null
      });
      if (!startFirstClean) return configured;
      const firstItems = buildTodayPlan(configured);
      const fallbackItems = firstItems.length ? firstItems : buildWeeklyReset(configured);
      return fallbackItems.length
        ? { ...configured, activeSession: createSession("First clean", "today", fallbackItems) }
        : configured;
    });
    setSetupOpen(false);
    setSetupStep(null);
    setView(directEdit ? "settings" : "home");
    if (startFirstClean) setFocusOpen(true);
  }

  function startClean(plan, resume = false) {
    if (resume && state.activeSession) {
      setFocusOpen(true);
      return;
    }
    if (!plan?.items?.length) {
      setNotice("No selected tasks are available for that clean.");
      return;
    }
    const session = createSession(plan.title, plan.mode, plan.items);
    setState((current) => ({ ...current, activeSession: session }));
    setFocusOpen(true);
  }

  function finishClean() {
    if (!state.activeSession) return;
    setState((current) => completeSession(current, current.activeSession));
    setFocusOpen(false);
    setView("home");
    setNotice("Clean saved. Your plan has been updated.");
  }

  async function importBackup(file, cleanup) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!validateV2Backup(payload)) throw new Error("Not a valid Clean30 v2 backup.");
      setConfirmation({
        title: "Restore this backup?",
        message: "This replaces the current v2 home setup, plan, active clean, and history on this device.",
        confirmLabel: "Restore backup",
        onConfirm: () => {
          const restored = normalizeV2State(payload.data);
          setState(restored);
          setFocusOpen(false);
          setView("home");
          setNotice("Backup restored.");
        }
      });
    } catch (error) {
      setNotice(error?.message || "The backup could not be read.");
    } finally {
      cleanup?.();
    }
  }

  function requestReset() {
    setConfirmation({
      title: "Start over?",
      message: "This erases the Clean30 v2 setup and history from this browser. Export a backup first if you may need it.",
      confirmLabel: "Erase and restart",
      onConfirm: () => {
        setState(createFreshV2State());
        setFocusOpen(false);
        setSetupOpen(false);
        setSetupStep(null);
        setView("home");
      }
    });
  }

  function requestEditSetup(step) {
    if (state.activeSession) {
      setNotice("Finish or discard the active clean before changing your home setup.");
      return;
    }
    setSetupStep(step);
    setSetupOpen(true);
  }

  function requestDiscardSession() {
    if (!state.activeSession) return;
    setConfirmation({
      title: "Discard this clean?",
      message: "Progress in this clean will be removed. The tasks stay in your plan with their existing due dates.",
      confirmLabel: "Discard clean",
      onConfirm: () => {
        setState((current) => ({ ...current, activeSession: null }));
        setFocusOpen(false);
        setView("home");
        setNotice("Clean discarded. No tasks were rescheduled.");
      }
    });
  }

  function startFreshAfterRecovery() {
    persistenceReadyRef.current = true;
    setRecoveryPayload(null);
    setState(createFreshV2State());
    setNotice("Fresh setup opened. Your recovery download remains separate.");
  }

  if (recoveryPayload) return <div className="v2-app" data-theme={state.appearance}><RecoveryScreen onDownload={() => downloadText(recoveryPayload, `clean30-recovery-${dateKey()}.txt`)} onStartFresh={startFreshAfterRecovery}/></div>;

  if (!state.onboardingComplete) return <div className="v2-app" data-theme={state.appearance}>{storageError ? <div className="v2-storage-warning" role="alert">{storageError}</div> : null}<SetupFlow initialState={state} onComplete={completeSetup}/>{notice ? <div aria-live="polite" className="v2-toast" role="status">{notice}</div> : null}</div>;

  return <div className="v2-app" data-theme={state.appearance}>
    {storageError ? <div className="v2-storage-warning" role="alert">{storageError}</div> : null}
    {focusOpen && state.activeSession ? <FocusedClean backgroundInert={Boolean(confirmation)} session={state.activeSession} onChange={(activeSession) => setState((current) => ({ ...current, activeSession }))} onDiscard={requestDiscardSession} onFinish={finishClean} onPause={() => setFocusOpen(false)}/> : <AppShell backgroundInert={setupOpen || roomPickerOpen || Boolean(confirmation)} currentView={view} onNavigate={setView} state={state}>
      {view === "home" ? <HomeView state={state} onDiscardSession={requestDiscardSession} onOpenRoomPicker={() => setRoomPickerOpen(true)} onStart={startClean} onViewPlan={() => setView("plan")}/> : null}
      {view === "plan" ? <PlanView state={state}/> : null}
      {view === "settings" ? <SettingsView state={state} onEditSetup={requestEditSetup} onImport={importBackup} onReset={requestReset} onToggleAppearance={() => setState((current) => ({ ...current, appearance: current.appearance === "dark" ? "light" : "dark" }))}/> : null}
    </AppShell>}

    {setupOpen ? <SetupFlow initialState={state} onCancel={() => { setSetupOpen(false); setSetupStep(null); }} onComplete={completeSetup} startStep={setupStep}/> : null}
    {roomPickerOpen ? <RoomPicker rooms={state.rooms} state={state} onClose={() => setRoomPickerOpen(false)} onSelect={(room) => { setRoomPickerOpen(false); startClean({ title: room.name, mode: "room", items: buildRoomPlan(state, room.id) }); }}/> : null}
    {confirmation ? <ConfirmModal confirmLabel={confirmation.confirmLabel} message={confirmation.message} onCancel={() => setConfirmation(null)} onConfirm={() => { confirmation.onConfirm?.(); setConfirmation(null); }} title={confirmation.title}/> : null}
    {notice ? <div aria-live="polite" className="v2-toast" role="status">{notice}</div> : null}
    {updateAvailable ? <div className="v2-update-toast" role="status"><div><strong>Clean30 update ready</strong><span>Reload to use the newest version.</span></div><button className="v2-button primary" onClick={() => window.dispatchEvent(new CustomEvent("clean30:applyUpdate"))} type="button">Update now</button><button aria-label="Dismiss update" className="v2-icon-button" onClick={() => setUpdateAvailable(false)} type="button"><Icon name="close" size={18}/></button></div> : null}
  </div>;
}
