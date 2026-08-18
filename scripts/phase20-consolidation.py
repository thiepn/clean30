from pathlib import Path


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(text, old, new, path):
    if old not in text:
        raise RuntimeError(f"Expected text not found in {path}: {old[:120]!r}")
    if text.count(old) != 1:
        raise RuntimeError(f"Expected one match in {path}, found {text.count(old)}")
    return text.replace(old, new, 1)


# Routines: make New routine one explicit four-method flow and reuse the task chooser.
path = "src/components/Routines.jsx"
text = read(path)
text = replace_once(
    text,
    'import { getHomeRoomNames } from "../utils/homeLibrary.js";\nimport Checklist from "./Checklist.jsx";',
    'import { getHomeRoomNames } from "../utils/homeLibrary.js";\nimport { createRoutineDraftFromTemplate } from "../utils/routineLibrary.js";\nimport Checklist from "./Checklist.jsx";\nimport RoutineCreationDialog from "./RoutineCreationDialog.jsx";\nimport TaskLibraryDialog from "./TaskLibraryDialog.jsx";',
    path,
)
text = replace_once(
    text,
    '  const [editorOpen, setEditorOpen] = useState(false);\n  const [editorRoutineId, setEditorRoutineId] = useState("");',
    '  const [creationOpen, setCreationOpen] = useState(false);\n  const [taskChooserOpen, setTaskChooserOpen] = useState(false);\n  const [editorOpen, setEditorOpen] = useState(false);\n  const [editorRoutineId, setEditorRoutineId] = useState("");\n  const [editorSeedDraft, setEditorSeedDraft] = useState(null);\n  const [editorEntryMode, setEditorEntryMode] = useState("");',
    path,
)
text = replace_once(
    text,
    '''  function openCreate() {\n    setEditorRoutineId("");\n    setEditorOpen(true);\n    setOpenMenuId("");\n  }\n\n  function openEdit(routineId) {\n    if (isCurrentRoutine(routineId)) return;\n    setEditorRoutineId(routineId);\n    setEditorOpen(true);\n    setOpenMenuId("");\n  }''',
    '''  function openCreate() {\n    setCreationOpen(true);\n    setOpenMenuId("");\n  }\n\n  function openCreationEditor({ seedDraft = null, entryMode = "blank" } = {}) {\n    setCreationOpen(false);\n    setTaskChooserOpen(false);\n    setEditorRoutineId("");\n    setEditorSeedDraft(seedDraft);\n    setEditorEntryMode(entryMode);\n    setEditorOpen(true);\n    setOpenMenuId("");\n  }\n\n  function chooseTasksForRoutine() {\n    setCreationOpen(false);\n    setTaskChooserOpen(true);\n  }\n\n  function startFromStarter(templateId) {\n    openCreationEditor({\n      seedDraft: createRoutineDraftFromTemplate(templateId),\n      entryMode: "starter"\n    });\n  }\n\n  function startFromChosenTasks(seedDraft) {\n    openCreationEditor({ seedDraft, entryMode: "tasks" });\n  }\n\n  function openEdit(routineId) {\n    if (isCurrentRoutine(routineId)) return;\n    setEditorRoutineId(routineId);\n    setEditorSeedDraft(null);\n    setEditorEntryMode("edit");\n    setEditorOpen(true);\n    setOpenMenuId("");\n  }''',
    path,
)
text = replace_once(
    text,
    '''      <RoutineEditorDialog\n        homeRooms={homeRooms}\n        onAdvancedEdit={openAdvancedEdit}\n        onClose={() => setEditorOpen(false)}\n        onSave={saveRoutine}\n        open={editorOpen}\n        routine={editorRoutine}\n        routines={routines.filter((routine) => routine.id !== "daily-rules")}\n      />''',
    '''      <RoutineCreationDialog\n        onChooseTasks={chooseTasksForRoutine}\n        onClose={() => setCreationOpen(false)}\n        onPasteChecklist={() => openCreationEditor({ entryMode: "paste" })}\n        onStartBlank={() => openCreationEditor({ entryMode: "blank" })}\n        onUseStarter={startFromStarter}\n        open={creationOpen}\n      />\n\n      <TaskLibraryDialog\n        homeRooms={homeRooms}\n        onBuildRoutine={startFromChosenTasks}\n        onClose={() => setTaskChooserOpen(false)}\n        open={taskChooserOpen}\n        purpose="routine"\n        routines={routines}\n      />\n\n      <RoutineEditorDialog\n        entryMode={editorEntryMode}\n        homeRooms={homeRooms}\n        onAdvancedEdit={openAdvancedEdit}\n        onClose={() => {\n          setEditorOpen(false);\n          setEditorSeedDraft(null);\n          setEditorEntryMode("");\n        }}\n        onSave={saveRoutine}\n        open={editorOpen}\n        routine={editorRoutine}\n        routines={routines.filter((routine) => routine.id !== "daily-rules")}\n        seedDraft={editorSeedDraft}\n      />''',
    path,
)
write(path, text)


# Task chooser: one component, contextual final action for cleaning vs routine creation.
path = "src/components/TaskLibraryDialog.jsx"
text = read(path)
text = replace_once(
    text,
    '''  preselectRecommended = false,\n  onAddToToday,\n  onBuildRoutine,\n  onClose''',
    '''  preselectRecommended = false,\n  purpose = "clean",\n  onAddToToday,\n  onAddOnlyToToday,\n  onBuildRoutine,\n  onClose''',
    path,
)
text = replace_once(
    text,
    '''  function startCleaning() {\n    if (!selectedItems.length) return;\n    onAddToToday?.(selectedItems);\n    onClose();\n  }\n\n  function buildRoutine() {''',
    '''  function startCleaning() {\n    if (!selectedItems.length || purpose === "routine") return;\n    onAddToToday?.(selectedItems);\n    onClose();\n  }\n\n  function addToTodayOnly() {\n    if (!selectedItems.length || !onAddOnlyToToday || purpose === "routine") return;\n    onAddOnlyToToday(selectedItems);\n    onClose();\n  }\n\n  function buildRoutine() {''',
    path,
)
text = replace_once(
    text,
    '''            <p className="eyebrow">Choose tasks</p>\n            <h2 id="task-library-title">\n              {room !== "All" && room !== "Whole home" ? `Clean ${room}` : "What needs cleaning?"}\n            </h2>\n            <p>Pick the jobs you want. Clean30 will put them into one focused clean.</p>''',
    '''            <p className="eyebrow">Choose tasks</p>\n            <h2 id="task-library-title">\n              {purpose === "routine"\n                ? "Choose tasks for your routine"\n                : room !== "All" && room !== "Whole home"\n                  ? `Clean ${room}`\n                  : "What needs cleaning?"}\n            </h2>\n            <p>\n              {purpose === "routine"\n                ? "Pick the jobs you want, then continue to name and edit the reusable routine."\n                : "Pick the jobs you want. Clean30 will put them into one focused clean."}\n            </p>''',
    path,
)
old_footer = '''          <div className="task-library-footer-actions">\n            <button className="button ghost" onClick={onClose} type="button">Cancel</button>\n            {onBuildRoutine ? (\n              <button className="button ghost" disabled={!selectedItems.length} onClick={buildRoutine} type="button">\n                Save as routine\n              </button>\n            ) : null}\n            <button className="button primary" disabled={!selectedItems.length} onClick={startCleaning} type="button">\n              Start cleaning\n            </button>\n          </div>'''
new_footer = '''          <div className="task-library-footer-actions">\n            <button className="button ghost" onClick={onClose} type="button">Cancel</button>\n            {purpose === "routine" ? (\n              <button className="button primary" disabled={!selectedItems.length} onClick={buildRoutine} type="button">\n                Continue\n              </button>\n            ) : (\n              <>\n                {onAddOnlyToToday ? (\n                  <button className="button ghost" disabled={!selectedItems.length} onClick={addToTodayOnly} type="button">\n                    Add to today&apos;s list\n                  </button>\n                ) : null}\n                {onBuildRoutine ? (\n                  <button className="button ghost" disabled={!selectedItems.length} onClick={buildRoutine} type="button">\n                    Save as routine\n                  </button>\n                ) : null}\n                <button className="button primary" disabled={!selectedItems.length} onClick={startCleaning} type="button">\n                  Start cleaning\n                </button>\n              </>\n            )}\n          </div>'''
text = replace_once(text, old_footer, new_footer, path)
write(path, text)


# Full time chooser: starting is primary, adding to Today's list is an optional secondary action.
path = "src/components/QuickCleanDialog.jsx"
text = read(path)
text = replace_once(
    text,
    '''  history = [],\n  onAddToToday,\n  onBuildRoutine,''',
    '''  history = [],\n  onAddToToday,\n  onAddOnlyToToday,\n  onBuildRoutine,''',
    path,
)
text = replace_once(
    text,
    '''  function startCleaning() {\n    if (!plan.items.length) return;\n    onAddToToday?.(plan.items);\n    onClose();\n  }\n\n  function buildRoutine() {''',
    '''  function startCleaning() {\n    if (!plan.items.length) return;\n    onAddToToday?.(plan.items);\n    onClose();\n  }\n\n  function addToTodayOnly() {\n    if (!plan.items.length || !onAddOnlyToToday) return;\n    onAddOnlyToToday(plan.items);\n    onClose();\n  }\n\n  function buildRoutine() {''',
    path,
)
text = replace_once(
    text,
    '''            <button className="button ghost" onClick={onClose} type="button">Cancel</button>\n            {onBuildRoutine ? (''',
    '''            <button className="button ghost" onClick={onClose} type="button">Cancel</button>\n            {onAddOnlyToToday ? (\n              <button className="button ghost" disabled={!plan.items.length} onClick={addToTodayOnly} type="button">\n                Add to today&apos;s list\n              </button>\n            ) : null}\n            {onBuildRoutine ? (''',
    path,
)
write(path, text)


# Clean hub wires both immediate-start and add-only paths to the same underlying chooser/planner.
path = "src/components/CleanStartPanel.jsx"
text = read(path)
text = replace_once(
    text,
    'export default function CleanStartPanel({ template, history = [], onStartTasks }) {',
    'export default function CleanStartPanel({ template, history = [], onStartTasks, onAddTasks }) {',
    path,
)
text = replace_once(
    text,
    '''        onAddToToday={startItems}\n        onClose={() => setTaskChooserOpen(false)}''',
    '''        onAddOnlyToToday={onAddTasks}\n        onAddToToday={startItems}\n        onClose={() => setTaskChooserOpen(false)}''',
    path,
)
text = replace_once(
    text,
    '''        onAddToToday={startItems}\n        onClose={() => setTimePlannerOpen(false)}''',
    '''        onAddOnlyToToday={onAddTasks}\n        onAddToToday={startItems}\n        onClose={() => setTimePlannerOpen(false)}''',
    path,
)
write(path, text)


# Dashboard passes the existing authoritative Today mutation path into the Clean hub.
path = "src/components/Dashboard.jsx"
text = read(path)
text = replace_once(
    text,
    '''        <CleanStartPanel\n          history={history}\n          onStartTasks={startChosenTasks}\n          template={template}\n        />''',
    '''        <CleanStartPanel\n          history={history}\n          onAddTasks={onAddLibraryTasksToToday}\n          onStartTasks={startChosenTasks}\n          template={template}\n        />''',
    path,
)
write(path, text)


# Routine editor: respect the chosen creation method instead of asking the user to choose again.
path = "src/components/RoutineEditorDialog.jsx"
text = read(path)
text = replace_once(
    text,
    '''  routine,\n  seedDraft = null,\n  homeRooms = [],''',
    '''  routine,\n  seedDraft = null,\n  entryMode = "",\n  homeRooms = [],''',
    path,
)
text = replace_once(
    text,
    '''  const durationInputRef = useRef(null);\n  const firstTaskInputRef = useRef(null);''',
    '''  const durationInputRef = useRef(null);\n  const bulkInputRef = useRef(null);\n  const firstTaskInputRef = useRef(null);''',
    path,
)
text = replace_once(
    text,
    '''    open,\n    onClose,\n    initialFocusRef: nameInputRef''',
    '''    open,\n    onClose,\n    initialFocusRef: entryMode === "paste" ? bulkInputRef : nameInputRef''',
    path,
)
text = replace_once(
    text,
    '''    setBulkText("");\n    setBulkMessage(seedDraft && !routine ? "Selected cleaning tasks loaded. Change anything before saving." : "");''',
    '''    setBulkText("");\n    setBulkMessage(\n      seedDraft && !routine\n        ? entryMode === "starter"\n          ? "Starter loaded. Change anything before saving."\n          : "Selected cleaning tasks loaded. Change anything before saving."\n        : entryMode === "paste"\n          ? "Paste your checklist below. Clean30 will split it into tasks and rooms."\n          : ""\n    );''',
    path,
)
text = replace_once(
    text,
    '  }, [open, routine?.id, seedDraft?.id]);',
    '  }, [entryMode, open, routine?.id, seedDraft?.id]);',
    path,
)
text = replace_once(
    text,
    '''              Choose common cleaning tasks, paste a checklist, use a starter, or type from scratch. They all create the same reusable routine.''',
    '''              {routine\n                ? "Change the saved checklist. Your existing Progress stays intact."\n                : entryMode === "paste"\n                  ? "Paste your checklist, give the routine a name, and adjust anything before saving."\n                  : entryMode === "starter"\n                    ? "A starter is loaded below. Rename it or change any task before saving."\n                    : entryMode === "tasks"\n                      ? "Your chosen tasks are loaded below. Name the routine and make any final changes."\n                      : "Name the routine and add only the cleaning tasks you want to reuse."}''',
    path,
)
text = replace_once(
    text,
    '          {!routine && !seedDraft ? (',
    '          {!routine && !seedDraft && !entryMode ? (',
    path,
)
text = replace_once(
    text,
    '<section className="routine-bulk-builder" aria-labelledby="routine-bulk-title">',
    '<section className={entryMode === "paste" ? "routine-bulk-builder entry-highlight" : "routine-bulk-builder"} aria-labelledby="routine-bulk-title">',
    path,
)
text = replace_once(
    text,
    '''              rows="7"\n              value={bulkText}''',
    '''              ref={bulkInputRef}\n              rows="7"\n              value={bulkText}''',
    path,
)
write(path, text)


# Settings: keep advanced wording understandable without exposing internal cleaning-plan jargon unnecessarily.
path = "src/components/Settings.jsx"
text = read(path)
text = text.replace(
    'description="Detailed cleaning-plan controls that are not required for everyday use."',
    'description="Detailed routine and daily-task controls that are not required for everyday use."',
)
text = text.replace(
    '<strong>Cleaning plan details</strong>\n              <small>Edit optional labels and advanced cleaning-plan details.</small>',
    '<strong>Home details</strong>\n              <small>Edit optional labels and advanced home details.</small>',
)
write(path, text)


# Intuitiveness layer: style the method chooser and emphasize the selected creation path.
path = "src/styles/universal-intuitiveness.css"
text = read(path)
addition = r'''

/* Phase 20 completion: one routine-creation gateway, shared task chooser. */
.routine-creation-dialog {
  width: min(620px, calc(100vw - 32px));
  display: grid;
  gap: 16px;
}

.routine-creation-methods,
.routine-creation-starters {
  display: grid;
  gap: 10px;
}

.routine-creation-method,
.routine-creation-starter {
  width: 100%;
  min-height: 72px;
  padding: 14px 15px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-soft);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  text-align: left;
  cursor: pointer;
}

.routine-creation-method > span:first-child,
.routine-creation-starter > span:first-child {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.routine-creation-method small,
.routine-creation-starter small {
  color: var(--muted);
  line-height: 1.4;
}

.routine-creation-method > span:last-child,
.routine-creation-starter > span:last-child {
  color: var(--accent-strong);
  font-size: 1.25rem;
}

.routine-creation-method:hover,
.routine-creation-starter:hover,
.routine-creation-method.recommended {
  border-color: var(--accent-border-strong);
  background: color-mix(in srgb, var(--accent-soft) 30%, var(--surface));
}

.routine-creation-method.recommended strong {
  color: var(--accent-strong);
}

.routine-creation-back {
  justify-self: start;
}

.routine-bulk-builder.entry-highlight {
  border-color: var(--accent-border-strong);
  background: color-mix(in srgb, var(--accent-soft) 20%, var(--surface));
}

@media (max-width: 560px) {
  .routine-creation-dialog {
    width: 100%;
    max-width: none;
    min-height: 100dvh;
    border-radius: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .routine-creation-method,
  .routine-creation-starter {
    transition: none !important;
    animation: none !important;
  }
}
'''
if "/* Phase 20 completion: one routine-creation gateway" not in text:
    text += addition
write(path, text)

print("Phase 20 intuitiveness consolidation applied.")
