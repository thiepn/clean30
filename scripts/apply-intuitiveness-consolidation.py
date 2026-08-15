from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:80]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


# App wiring: Clean can send generated/selected tasks through the existing authoritative Today path.
replace_once(
    "src/App.jsx",
    "        onAddRoutineTasksToToday={addRoutineTasksToToday}\n        onResetTodayTasks={resetTodayTasks}",
    "        onAddRoutineTasksToToday={addRoutineTasksToToday}\n        onAddLibraryTasksToToday={addLibraryTasksToToday}\n        onResetTodayTasks={resetTodayTasks}",
)
replace_once(
    "src/App.jsx",
    "        activeSession={appState.activeSession}\n        onExportFullBackup={exportFullBackup}",
    "        activeSession={appState.activeSession}\n        onSaveHomeRooms={saveHomeRooms}\n        onExportFullBackup={exportFullBackup}",
)

# Dashboard: make Clean the decision hub, keep Today as a list, and focus generated cleans on the tasks just chosen.
replace_once(
    "src/components/Dashboard.jsx",
    'import CleanMode from "./CleanMode.jsx";\n',
    'import CleanMode from "./CleanMode.jsx";\nimport CleanStartPanel from "./CleanStartPanel.jsx";\n',
)
replace_once(
    "src/components/Dashboard.jsx",
    '''function getRoutineTasks(routine) {\n  return (\n    routine?.phases?.flatMap((phase) =>\n      phase.tasks.map((task) => ({\n        ...task,\n        phaseTitle: phase.title\n      }))\n    ) || []\n  );\n}\n''',
    '''function getRoutineTasks(routine) {\n  return (\n    routine?.phases?.flatMap((phase) =>\n      phase.tasks.map((task) => ({\n        ...task,\n        phaseTitle: phase.title\n      }))\n    ) || []\n  );\n}\n\nfunction getChosenTaskKey(item) {\n  const title = String(item?.title || "").trim().toLowerCase();\n  const rawRoom = String(item?.room || "").trim();\n  const room = rawRoom && rawRoom !== "Whole home" && rawRoom !== "Other"\n    ? rawRoom.toLowerCase()\n    : "";\n  return `${room}::${title}`;\n}\n''',
)
replace_once(
    "src/components/Dashboard.jsx",
    "  onAddRoutineTasksToToday,\n  onResetTodayTasks,",
    "  onAddRoutineTasksToToday,\n  onAddLibraryTasksToToday,\n  onResetTodayTasks,",
)
replace_once(
    "src/components/Dashboard.jsx",
    '  const [todayCleaningOpen, setTodayCleaningOpen] = useState(false);\n',
    '  const [todayCleaningOpen, setTodayCleaningOpen] = useState(false);\n  const [preferredTodayTaskKeys, setPreferredTodayTaskKeys] = useState([]);\n',
)
replace_once(
    "src/components/Dashboard.jsx",
    '''  function submitTask(event) {\n    event.preventDefault();\n    const trimmed = taskText.trim();\n    if (!trimmed) return;\n    onAddTodayTask(trimmed);\n    setTaskText("");\n  }''',
    '''  function submitTask(event) {\n    event.preventDefault();\n    const trimmed = taskText.trim();\n    if (!trimmed) return;\n    onAddTodayTask(trimmed);\n    setTaskText("");\n  }\n\n  function startChosenTasks(items = []) {\n    const keys = [...new Set((Array.isArray(items) ? items : []).map(getChosenTaskKey).filter((key) => !key.endsWith("::")))];\n    if (!keys.length || activeSession) return;\n    setPreferredTodayTaskKeys(keys);\n    onAddLibraryTasksToToday?.(items);\n    setTodayCleaningOpen(true);\n  }\n\n  function startTodayList() {\n    if (!incompleteTasks.length || activeSession) return;\n    setPreferredTodayTaskKeys([]);\n    setTodayCleaningOpen(true);\n  }\n\n  function closeTodayCleaning() {\n    setTodayCleaningOpen(false);\n    setPreferredTodayTaskKeys([]);\n  }''',
)
replace_once(
    "src/components/Dashboard.jsx",
    '      <section className="panel today-panel today-primary-panel">',
    '''      {!activeSession ? (\n        <CleanStartPanel\n          history={history}\n          onStartTasks={startChosenTasks}\n          template={template}\n        />\n      ) : null}\n\n      <section className="panel today-panel today-primary-panel">''',
)
replace_once(
    "src/components/Dashboard.jsx",
    "            <h2>Today</h2>",
    "            <h2>Today&apos;s list</h2>",
)
replace_once(
    "src/components/Dashboard.jsx",
    '''            disabled={!incompleteTasks.length}\n            onClick={() => setTodayCleaningOpen(true)}''',
    '''            disabled={!incompleteTasks.length || Boolean(activeSession)}\n            onClick={startTodayList}''',
)
replace_once(
    "src/components/Dashboard.jsx",
    '''            {incompleteTasks.length ? "Start cleaning" : "All done for today"}''',
    '''            {activeSession\n              ? "Finish current clean first"\n              : incompleteTasks.length\n                ? "Start cleaning"\n                : "All done for today"}''',
)
replace_once(
    "src/components/Dashboard.jsx",
    '            <p>Add one task above or use More to add tasks from a routine.</p>',
    '            <p>Use Just start, choose a time, pick a room, or add one task above.</p>',
)
replace_once(
    "src/components/Dashboard.jsx",
    '''      <TodayCleaningMode\n        onExit={() => setTodayCleaningOpen(false)}\n        onToggleTask={onToggleTodayTask}\n        open={todayCleaningOpen}\n        tasks={todayTasks}\n      />''',
    '''      <TodayCleaningMode\n        onExit={closeTodayCleaning}\n        onToggleTask={onToggleTodayTask}\n        open={todayCleaningOpen}\n        preferredTaskKeys={preferredTodayTaskKeys}\n        tasks={todayTasks}\n      />''',
)

# Settings: rooms become ordinary setup infrastructure instead of a feature inside Routines.
replace_once(
    "src/components/Settings.jsx",
    'import { useRef, useState } from "react";\n',
    'import { useRef, useState } from "react";\nimport HomeRoomsDialog from "./HomeRoomsDialog.jsx";\nimport { getHomeRoomNames } from "../utils/homeLibrary.js";\n',
)
replace_once(
    "src/components/Settings.jsx",
    "  template,\n  activeSession,\n  onExportFullBackup,",
    "  template,\n  activeSession,\n  onSaveHomeRooms,\n  onExportFullBackup,",
)
replace_once(
    "src/components/Settings.jsx",
    '  const [activePage, setActivePage] = useState(null);\n  const health = backupStatus(lastFullBackupExportedAt, backupDue);',
    '  const [activePage, setActivePage] = useState(null);\n  const [roomsOpen, setRoomsOpen] = useState(false);\n  const homeRooms = getHomeRoomNames(template.zones || []);\n  const health = backupStatus(lastFullBackupExportedAt, backupDue);',
)
replace_once(
    "src/components/Settings.jsx",
    '''            <SettingsDestination\n              title="Data and backup"\n              description="Export, restore, and protect local Clean30 data."\n              meta={health.label}\n              onClick={() => setActivePage("backup")}\n            />''',
    '''            <SettingsDestination\n              title="Rooms"\n              description="Choose the rooms Clean30 uses for room-based suggestions."\n              meta={`${homeRooms.length} ${homeRooms.length === 1 ? "room" : "rooms"}`}\n              onClick={() => setActivePage("rooms")}\n            />\n            <SettingsDestination\n              title="Data and backup"\n              description="Export, restore, and protect local Clean30 data."\n              meta={health.label}\n              onClick={() => setActivePage("backup")}\n            />''',
)
replace_once(
    "src/components/Settings.jsx",
    '  if (activePage === "backup") {',
    '''  if (activePage === "rooms") {\n    return (\n      <div className="screen-stack settings-screen">\n        <section className="panel settings-focus-panel">\n          <SettingsPageHeader\n            title="Rooms"\n            description="Rooms help Clean30 suggest relevant work. They are not another cleaning mode or schedule."\n            onBack={() => setActivePage(null)}\n          />\n\n          {homeRooms.length ? (\n            <div className="settings-room-summary" aria-label="Rooms in Clean30">\n              {homeRooms.map((room) => (\n                <span className="settings-room-chip" key={room}>{room}</span>\n              ))}\n            </div>\n          ) : (\n            <div className="settings-info-box">\n              <strong>No rooms set up yet</strong>\n              <p>Add only the rooms that exist in your home.</p>\n            </div>\n          )}\n\n          <div className="settings-primary-actions">\n            <button className="button primary" onClick={() => setRoomsOpen(true)} type="button">\n              Edit rooms\n            </button>\n          </div>\n        </section>\n        <HomeRoomsDialog\n          onClose={() => setRoomsOpen(false)}\n          onSave={(roomNames) => onSaveHomeRooms?.(roomNames)}\n          open={roomsOpen}\n          rooms={homeRooms}\n        />\n      </div>\n    );\n  }\n\n  if (activePage === "backup") {''',
)
replace_once(
    "src/components/Settings.jsx",
    "                <small>Today, Routines, Progress, and local data in a few short notes.</small>",
    "                <small>Clean, Routines, Progress, and local data in a few short notes.</small>",
)
replace_once(
    "src/components/Settings.jsx",
    "              <strong>Home details</strong>\n              <small>Edit optional home labels and cleaning-plan details.</small>",
    "              <strong>Cleaning plan details</strong>\n              <small>Edit optional labels and advanced cleaning-plan details.</small>",
)

# Routine editor: creation methods are choices inside one routine flow, not separate products.
replace_once(
    "src/components/RoutineEditorDialog.jsx",
    '    setBulkMessage(seedDraft && !routine ? "Task Library selection loaded. Change anything before saving." : "");',
    '    setBulkMessage(seedDraft && !routine ? "Selected cleaning tasks loaded. Change anything before saving." : "");',
)
replace_once(
    "src/components/RoutineEditorDialog.jsx",
    "              Paste a whole checklist, use suggestions from your home, or type quickly. You do not need to add tasks one by one.",
    "              Choose common tasks, paste a checklist, use a starter, or type from scratch. They all create the same reusable routine.",
)
replace_once(
    "src/components/RoutineEditorDialog.jsx",
    "                  <h3 id=\"routine-fast-start-title\">Start faster</h3>\n                  <p>Use an example as a starting point, then change anything.</p>",
    "                  <h3 id=\"routine-fast-start-title\">Choose how to start</h3>\n                  <p>Use a starter here, or continue below to paste a list, choose common tasks, or type your own.</p>",
)
replace_once(
    "src/components/RoutineEditorDialog.jsx",
    "                <strong>Pick common cleaning tasks</strong>",
    "                <strong>Choose common cleaning tasks</strong>",
)

# Onboarding: teach the same Clean / Routines / Progress mental model shown by the app.
replace_once(
    "src/components/Onboarding.jsx",
    '        ? "Return to Today and continue using your existing cleaning plan."',
    '        ? "Return to Clean and continue using your existing cleaning plan."',
)
replace_once(
    "src/components/Onboarding.jsx",
    "                <p>See today&apos;s tasks.</p>\n                <p>Start a reusable routine.</p>\n                <p>Review what you finished.</p>",
    "                <p>Choose what to clean now.</p>\n                <p>Reuse saved routines when you want them.</p>\n                <p>Review what you finished.</p>",
)
replace_once(
    "src/components/Onboarding.jsx",
    "                <p>Close the introduction to return to Today.</p>",
    "                <p>Close the introduction to return to Clean.</p>",
)
replace_once(
    "src/components/Onboarding.jsx",
    "              Go to Today",
    "              Go to Clean",
)
replace_once(
    "src/components/Onboarding.jsx",
    '              {!isReturningUser && setupMode === "starter" ? "Start cleaning" : "Go to Today"}',
    '              {!isReturningUser && setupMode === "starter" ? "Start cleaning" : "Go to Clean"}',
)

print("Intuitiveness consolidation applied.")
