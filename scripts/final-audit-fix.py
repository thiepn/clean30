from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected one match in {path}, found {count}: {old[:100]!r}")
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, replacement):
    text = read(path)
    updated, count = re.subn(
        pattern,
        lambda _match: replacement,
        text,
        count=1,
        flags=re.S
    )
    if count != 1:
        raise SystemExit(f"Expected one regex match in {path}, found {count}: {pattern[:100]!r}")
    write(path, updated)


# Home setup rejects virtual/utility names and canonicalizes preset casing.
replace_once(
    "src/components/HomeRoomsDialog.jsx",
    'import { homeRoomPresets } from "../utils/homeLibrary.js";',
    'import {\n  getCanonicalHomeRoomName,\n  homeRoomPresets,\n  isReservedHomeRoomName\n} from "../utils/homeLibrary.js";'
)
regex_once(
    "src/components/HomeRoomsDialog.jsx",
    r'function uniqueRooms\(values = \[\]\) \{.*?\n\}',
    '''function uniqueRooms(values = []) {
  const seen = new Set();
  return values
    .map(getCanonicalHomeRoomName)
    .filter((value) => {
      const key = keyOf(value);
      if (!key || isReservedHomeRoomName(value) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}'''
)
regex_once(
    "src/components/HomeRoomsDialog.jsx",
    r'  function addCustomRoom\(\) \{.*?\n  \}',
    '''  function addCustomRoom() {
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
  }'''
)
replace_once(
    "src/components/HomeRoomsDialog.jsx",
    '              placeholder="Guest room, nursery, storage room…"\n              ref={customInputRef}',
    '              maxLength={60}\n              placeholder="Guest room, nursery, storage room…"\n              ref={customInputRef}'
)

# Task Library keeps custom-task room selection in sync and avoids phantom duplicates.
replace_once(
    "src/components/TaskLibraryDialog.jsx",
    '''  const selectedItems = useMemo(
    () => allItems.filter((item) => selectedIds.has(item.id)),
    [allItems, selectedIds]
  );''',
    '''  const selectedItems = useMemo(
    () => allItems.filter((item) => selectedIds.has(item.id)),
    [allItems, selectedIds]
  );
  const customRoomOptions = useMemo(
    () => roomOptions.filter((roomName) => roomName !== "All" && roomName !== "Whole home"),
    [roomOptions]
  );'''
)
replace_once(
    "src/components/TaskLibraryDialog.jsx",
    '''    setCustomRoom(
      resolvedRoom && resolvedRoom !== "All" && resolvedRoom !== "Whole home"
        ? resolvedRoom
        : homeRooms[0] || "Other"
    );''',
    '''    setCustomRoom(
      resolvedRoom && resolvedRoom !== "All" && resolvedRoom !== "Whole home"
        ? resolvedRoom
        : customRoomOptions[0] || "Other"
    );'''
)
replace_once(
    "src/components/TaskLibraryDialog.jsx",
    '  }, [homeRooms, initialRoom, open, preselectRecommended, routines]);',
    '  }, [customRoomOptions, homeRooms, initialRoom, open, preselectRecommended, routines]);'
)
regex_once(
    "src/components/TaskLibraryDialog.jsx",
    r'  function addCustomTask\(\) \{.*?\n  \}',
    '''  function addCustomTask() {
    const item = createCustomLibraryItem(customTitle, customRoom || "Other");
    if (!item) return;
    const key = `${item.room.trim().toLowerCase()}::${item.title.trim().toLowerCase()}`;
    const existing = allItems.find(
      (candidate) =>
        `${candidate.room.trim().toLowerCase()}::${candidate.title.trim().toLowerCase()}` === key
    );
    if (existing) {
      setSelectedIds((current) => new Set([...current, existing.id]));
      setCustomTitle("");
      setMessage(`${existing.title} is already available and was selected.`);
      return;
    }
    setExtraItems((current) => [...current, item]);
    setSelectedIds((current) => new Set([...current, item.id]));
    setCustomTitle("");
    setMessage(`${item.title} selected.`);
  }'''
)
replace_once(
    "src/components/TaskLibraryDialog.jsx",
    '''                  setRoom(roomName);
                  setMessage("");''',
    '''                  setRoom(roomName);
                  if (roomName !== "All" && roomName !== "Whole home") {
                    setCustomRoom(roomName);
                  }
                  setMessage("");'''
)
replace_once(
    "src/components/TaskLibraryDialog.jsx",
    '{selectedIds.size ? (',
    '{selectedItems.length ? ('
)
replace_once(
    "src/components/TaskLibraryDialog.jsx",
    '{[...new Set([...homeRooms, "Other"])].map((roomName) => (',
    '{customRoomOptions.map((roomName) => ('
)

# Routine editor uses the tested pure drag helper and case-insensitive room filters.
replace_once(
    "src/components/RoutineEditorDialog.jsx",
    '  optimizeRoutineTaskOrder,\n  parseRoutineTaskText,',
    '  optimizeRoutineTaskOrder,\n  moveRoutineTaskByDrop,\n  parseRoutineTaskText,'
)
regex_once(
    "src/components/RoutineEditorDialog.jsx",
    r'  function moveDraggedTask\(targetPhaseId, targetTaskId\) \{.*?\n  \}',
    '''  function moveDraggedTask(targetPhaseId, targetTaskId) {
    if (!draggedTask) return;
    setDraft((current) =>
      moveRoutineTaskByDrop(current, draggedTask, targetPhaseId, targetTaskId)
    );
    setDraggedTask(null);
  }'''
)
replace_once(
    "src/components/RoutineEditorDialog.jsx",
    '''    const wanted = new Set(["All", "Whole home", "Other", ...homeRooms]);
    return suggestionRooms.filter((room) => wanted.has(room));''',
    '''    const wanted = new Set(
      ["All", "Whole home", "Other", ...homeRooms].map((room) =>
        String(room).trim().toLowerCase()
      )
    );
    return suggestionRooms.filter((room) => wanted.has(room.toLowerCase()));'''
)

# Routines uses active-template history and stops re-offering already archived legacy examples.
replace_once(
    "src/components/Routines.jsx",
    '          getRoomCareStatus({ room, routines, history })',
    '          getRoomCareStatus({ room, routines, history, templateId: activeTemplateId })'
)
replace_once(
    "src/components/Routines.jsx",
    '    [history, homeRooms, routines]\n  );\n  const roomsNeedingAttention = useMemo(\n    () => getRoomsNeedingAttention({ rooms: homeRooms, routines, history }),\n    [history, homeRooms, routines]',
    '    [activeTemplateId, history, homeRooms, routines]\n  );\n  const roomsNeedingAttention = useMemo(\n    () => getRoomsNeedingAttention({ rooms: homeRooms, routines, history, templateId: activeTemplateId }),\n    [activeTemplateId, history, homeRooms, routines]'
)
replace_once(
    "src/components/Routines.jsx",
    '''  const hasLegacyStarterSet =
    routines.some((routine) => routine.id === "initial-reset") &&
    legacyStarterRoutines.length >= 4;''',
    '''  const hasLegacyStarterSet =
    routines.some((routine) => routine.id === "initial-reset") &&
    legacyStarterRoutines.length >= 4 &&
    legacyStarterRoutines.some((routine) => !routine.archived);'''
)
replace_once(
    "src/components/Routines.jsx",
    '''      routines,
      history
    });''',
    '''      routines,
      history,
      templateId: activeTemplateId
    });'''
)
text = read("src/components/Routines.jsx")
text = text.replace(
    'getLastRoutineDoneLabel(history, routine.id)',
    'getLastRoutineDoneLabel(history, routine.id, activeTemplateId)'
)
text = text.replace(
    'getLastRoutineDoneLabel(history, selectedRoutine.id)',
    'getLastRoutineDoneLabel(history, selectedRoutine.id, activeTemplateId)'
)
text = text.replace(
    '      <QuickCleanDialog\n        history={history}',
    '      <QuickCleanDialog\n        activeTemplateId={activeTemplateId}\n        history={history}'
)
write("src/components/Routines.jsx", text)

# Quick Clean dialog forwards template identity into room-care ranking and plan generation.
replace_once(
    "src/components/QuickCleanDialog.jsx",
    'export default function QuickCleanDialog({\n  open,',
    'export default function QuickCleanDialog({\n  open,\n  activeTemplateId = "",'
)
replace_once(
    "src/components/QuickCleanDialog.jsx",
    '    () => rankRoomsForCare({ rooms: homeRooms, routines, history }),\n    [history, homeRooms, routines]',
    '    () => rankRoomsForCare({ rooms: homeRooms, routines, history, templateId: activeTemplateId }),\n    [activeTemplateId, history, homeRooms, routines]'
)
replace_once(
    "src/components/QuickCleanDialog.jsx",
    '    () => buildQuickCleanPlan({ minutes, rooms: selectedRooms, routines, history }),\n    [history, minutes, routines, selectedRooms]',
    '    () => buildQuickCleanPlan({ minutes, rooms: selectedRooms, routines, history, templateId: activeTemplateId }),\n    [activeTemplateId, history, minutes, routines, selectedRooms]'
)

# History/session calculations: collision-resistant IDs, template-aware recency, accurate duration units.
replace_once(
    "src/utils/calculations.js",
    'import { daysBetween, parseDate } from "./dates.js";\nimport { cloneDeep } from "./templateUtils.js";',
    'import { daysBetween, parseDate } from "./dates.js";\nimport { parseDurationMinutes } from "./duration.js";\nimport { cloneDeep, createId } from "./templateUtils.js";'
)
replace_once(
    "src/utils/calculations.js",
    '    id: `session-${Date.now()}`,',
    '    id: createId("session"),'
)
regex_once(
    "src/utils/calculations.js",
    r'export function getLastRoutineFinishedAt\(history, routineId\) \{.*?\n\}\n\nexport function getLastRoutineDoneLabel\(history, routineId\) \{.*?\n\}',
    '''export function getLastRoutineFinishedAt(history, routineId, templateId = "") {
  return (history || [])
    .filter((entry) => entry?.routineId === routineId && !isDailyRulesHistoryEntry(entry))
    .filter((entry) => !templateId || !entry?.templateId || entry.templateId === templateId)
    .filter((entry) => !Number.isNaN(new Date(entry.finishedAt).getTime()))
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))[0]?.finishedAt || null;
}

export function getLastRoutineDoneLabel(history, routineId, templateId = "") {
  const finishedAt = getLastRoutineFinishedAt(history, routineId, templateId);
  if (!finishedAt) return "Not done yet";
  const elapsed = daysBetween(finishedAt);
  if (elapsed === null) return "Not done yet";
  if (elapsed <= 0) return "Last done today";
  if (elapsed === 1) return "Last done yesterday";
  return `Last done ${elapsed} days ago`;
}'''
)
regex_once(
    "src/utils/calculations.js",
    r'function estimateTodayTaskMinutes\(tasks\) \{.*?\n\}',
    '''function estimateTodayTaskMinutes(tasks) {
  return (tasks || []).reduce(
    (total, rule) => total + (parseDurationMinutes(rule.duration, 0) || 0),
    0
  );
}'''
)

# Today activity estimates use the same duration parser.
replace_once(
    "src/utils/activity.js",
    'import { getTodayKey, parseDate } from "./dates.js";',
    'import { getTodayKey, parseDate } from "./dates.js";\nimport { parseDurationMinutes } from "./duration.js";'
)
regex_once(
    "src/utils/activity.js",
    r'function durationTextMinutes\(value\) \{.*?\n\}',
    '''function durationTextMinutes(value) {
  return parseDurationMinutes(value, null);
}'''
)

# Home snapshot forwards explicit plan identity.
replace_once(
    "src/utils/homeMotivation.js",
    '''export function getHomeCareSummary({
  rooms = [],
  routines = [],
  history = [],
  currentDateKey = getTodayKey()
} = {}) {
  const ranked = rankRoomsForCare({ rooms, routines, history, currentDateKey }).map(''',
    '''export function getHomeCareSummary({
  rooms = [],
  routines = [],
  history = [],
  currentDateKey = getTodayKey(),
  templateId = ""
} = {}) {
  const ranked = rankRoomsForCare({
    rooms,
    routines,
    history,
    currentDateKey,
    templateId
  }).map('''
)

# Progress prevents explicit history from other templates affecting room impact/filter views.
replace_once(
    "src/components/History.jsx",
    '''        history,
        currentDateKey
      }),
    [currentDateKey, history, homeRooms, routines]''',
    '''        history,
        currentDateKey,
        templateId: template?.id || ""
      }),
    [currentDateKey, history, homeRooms, routines, template?.id]'''
)
replace_once(
    "src/components/History.jsx",
    '''      filter === "all"
        ? displayEntries
        : displayEntries.filter((entry) => entry.routineId === filter),
    [displayEntries, filter]''',
    '''      filter === "all"
        ? displayEntries
        : displayEntries.filter(
            (entry) =>
              entry.routineId === filter &&
              (!entry.templateId || entry.templateId === template?.id)
          ),
    [displayEntries, filter, template?.id]'''
)
replace_once(
    "src/components/History.jsx",
    '                const impactRooms = daily ? [] : routineRoomsById.get(entry.routineId) || [];',
    '''                const impactRooms =
                  daily || (entry.templateId && entry.templateId !== template?.id)
                    ? []
                    : routineRoomsById.get(entry.routineId) || [];'''
)

# Insights are plan-scoped and use soft guidance language rather than deadlines.
replace_once(
    "src/utils/historyInsights.js",
    '  const sessionEntries = entries.filter((entry) => !isDailyRulesHistoryEntry(entry));',
    '''  const sessionEntries = entries
    .filter((entry) => !isDailyRulesHistoryEntry(entry))
    .filter((entry) => !template?.id || !entry?.templateId || entry.templateId === template.id);'''
)
replace_once(
    "src/utils/historyInsights.js",
    '    const matching = entries\n      .filter((entry) => entry.routineId === routineId && validDate(entry.finishedAt))',
    '    const matching = sessionEntries\n      .filter((entry) => entry.routineId === routineId && validDate(entry.finishedAt))'
)
replace_once(
    "src/utils/historyInsights.js",
    '      id: "weekly-overdue",\n      message: "Weekly reset is overdue.",',
    '      id: "weekly-attention",\n      message: "Weekly clean may need attention.",'
)
replace_once(
    "src/utils/historyInsights.js",
    '      id: "monthly-due",\n      message: "Monthly deep clean is due.",',
    '      id: "monthly-attention",\n      message: "Deep clean may be worth considering.",'
)

# Advanced editor validates against archived routines too and creates unique default names.
replace_once(
    "src/components/customize/RoutinesSection.jsx",
    '''  const visibleRoutines = useMemo(
    () =>
      routines.filter(
        (routine) => routine.id !== "daily-rules" && (showArchived || !routine.archived)
      ),
    [routines, showArchived]
  );''',
    '''  const allEditableRoutines = useMemo(
    () => routines.filter((routine) => routine.id !== "daily-rules"),
    [routines]
  );
  const visibleRoutines = useMemo(
    () => allEditableRoutines.filter((routine) => showArchived || !routine.archived),
    [allEditableRoutines, showArchived]
  );'''
)
replace_once(
    "src/components/customize/RoutinesSection.jsx",
    '  const routineTitleError = getRoutineTitleError(selectedRoutine, visibleRoutines);',
    '  const routineTitleError = getRoutineTitleError(selectedRoutine, allEditableRoutines);'
)
replace_once(
    "src/components/customize/RoutinesSection.jsx",
    '''  function addRoutine() {
    const routine = createRoutine();''',
    '''  function addRoutine() {
    const routine = createRoutine();
    routine.title = makeUniqueName(
      routine.title,
      allEditableRoutines.map((item) => item.title),
      "New Routine"
    );'''
)
replace_once(
    "src/components/customize/RoutinesSection.jsx",
    '    const siblingNames = visibleRoutines.map((item) => item.title);',
    '    const siblingNames = allEditableRoutines.map((item) => item.title);'
)
replace_once(
    "src/components/customize/RoutinesSection.jsx",
    '      visibleRoutines.filter((routine) => routine.id !== selectedRoutine.id).map((routine) => routine.title),',
    '      allEditableRoutines.filter((routine) => routine.id !== selectedRoutine.id).map((routine) => routine.title),'
)

# Starter restore reads live React state and rechecks at mutation time.
replace_once("src/components/Settings.jsx", 'import { loadAppState } from "../utils/storage.js";\n', "")
replace_once(
    "src/components/Settings.jsx",
    'export default function Settings({\n  template,',
    'export default function Settings({\n  template,\n  activeSession,'
)
replace_once(
    "src/components/Settings.jsx",
    '''  const starterRestoreLocked = Boolean(
    loadAppState().activeSession?.templateId === template.id
  );''',
    '''  const starterRestoreLocked = Boolean(
    activeSession?.templateId === template.id
  );'''
)
replace_once(
    "src/App.jsx",
    '      <Settings\n        template={activeTemplate}',
    '      <Settings\n        template={activeTemplate}\n        activeSession={appState.activeSession}'
)
regex_once(
    "src/App.jsx",
    r'  function resetCurrentTemplateToDefault\(\) \{.*?\n  \}\n\n  function exportTemplate',
    '''  function resetCurrentTemplateToDefault() {
    if (appState.activeSession?.templateId === activeTemplate.id) {
      requestConfirmation({
        title: "Cleaning plan is in use",
        message: "Finish or discard the current clean before restoring the starter plan.",
        confirmLabel: "Keep plan",
        onConfirm: () => {}
      });
      return;
    }

    requestConfirmation({
      title: "Reset current template?",
      message:
        "This replaces the active template with the Clean30 starter content. History is kept.",
      confirmLabel: "Reset template",
      onConfirm: () => {
        setAppState((current) => {
          if (current.activeSession?.templateId === current.activeTemplateId) return current;
          const defaultTemplate = createDefaultTemplate();
          const active = current.templates.find(
            (template) => template.id === current.activeTemplateId
          );
          if (!active) return current;
          const resetTemplate = normalizeTemplate(
            {
              ...defaultTemplate,
              id: active.id,
              name: active.name,
              readOnly: false
            },
            { readOnly: false }
          );
          return {
            ...current,
            templates: current.templates.map((template) =>
              template.id === active.id ? resetTemplate : template
            )
          };
        });
      }
    });
  }

  function exportTemplate'''
)

# Today preserves same-titled tasks when they belong to different rooms.
regex_once(
    "src/App.jsx",
    r'  function addLibraryTasksToToday\(items = \[\]\) \{.*?\n  \}\n\n  function deleteTodayTask',
    '''  function addLibraryTasksToToday(items = []) {
    const dateKey = getTodayKey();
    setAppState((current) => {
      const currentTasks = getTodayTasksFromState(current, dateKey);
      const globalTitles = new Set();
      const roomKeys = new Set();
      const allTitles = new Set();

      for (const task of currentTasks) {
        const titleKey = String(task.text || "").trim().toLowerCase();
        if (!titleKey) continue;
        allTitles.add(titleKey);
        const roomMatch = String(task.note || "").match(/^Room:\\s*(.+)$/i);
        if (roomMatch?.[1]?.trim()) {
          roomKeys.add(`${roomMatch[1].trim().toLowerCase()}::${titleKey}`);
        } else {
          globalTitles.add(titleKey);
        }
      }

      const additions = [];
      for (const item of Array.isArray(items) ? items : []) {
        const title = String(item?.title || "").trim();
        const titleKey = title.toLowerCase();
        if (!title) continue;
        const room = String(item?.room || "").trim();
        const specificRoom = room && room !== "Whole home" && room !== "Other";
        const roomKey = specificRoom ? `${room.toLowerCase()}::${titleKey}` : "";
        if (specificRoom) {
          if (globalTitles.has(titleKey) || roomKeys.has(roomKey)) continue;
          roomKeys.add(roomKey);
        } else {
          if (allTitles.has(titleKey)) continue;
          globalTitles.add(titleKey);
        }
        allTitles.add(titleKey);
        const task = createTodayTask(title, dateKey);
        additions.push({
          ...task,
          note: specificRoom ? `Room: ${room}` : ""
        });
      }

      if (!additions.length) return current;
      return markMeaningfulUse(
        applyTodayTasksToState(current, dateKey, [...currentTasks, ...additions])
      );
    });
    setCurrentView("dashboard");
  }

  function deleteTodayTask'''
)

# Generic fallback profile text must never resurrect the old personal setup.
replace_once(
    "src/utils/templateUtils.js",
    'fallback.profile?.apartmentSizeText || "30 m2"',
    'fallback.profile?.apartmentSizeText || "Not set"'
)
replace_once(
    "src/utils/templateUtils.js",
    'fallback.profile?.apartmentTypeText || "Erdgeschoss / ground floor"',
    'fallback.profile?.apartmentTypeText || "Home"'
)
replace_once(
    "src/utils/templateUtils.js",
    'fallback.profile?.goalText || "Guest-ready within 10 minutes"',
    'fallback.profile?.goalText || "A cleaner home, one task at a time"'
)

# Local History normalization rejects impossible/future sessions and caps completion counts.
regex_once(
    "src/utils/storage.js",
    r'function normalizeHistory\(value\) \{.*?\n\}\n\nfunction normalizeOptionalNonNegativeNumber',
    '''function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  const usedIds = new Set();
  const latestAllowedMs = Date.now() + MAX_CLOCK_SKEW_MS;
  return value
    .filter((entry) => {
      if (
        !isPlainObject(entry) ||
        typeof entry.id !== "string" ||
        !entry.id.trim() ||
        typeof entry.routineId !== "string" ||
        !entry.routineId.trim() ||
        typeof entry.routineTitle !== "string"
      ) {
        return false;
      }
      const startedAt = normalizeDateString(entry.startedAt);
      const finishedAt = normalizeDateString(entry.finishedAt);
      if (!startedAt || !finishedAt) return false;
      const startedAtMs = new Date(startedAt).getTime();
      const finishedAtMs = new Date(finishedAt).getTime();
      return (
        startedAtMs <= finishedAtMs &&
        startedAtMs <= latestAllowedMs &&
        finishedAtMs <= latestAllowedMs
      );
    })
    .map((entry, index) => {
      const totalTasksValue = Number(entry.totalTasks);
      const totalTasks = Number.isFinite(totalTasksValue) ? Math.max(0, totalTasksValue) : 0;
      const completedTasksValue = Number(entry.completedTasks);
      const completedTasks = Number.isFinite(completedTasksValue)
        ? Math.min(totalTasks, Math.max(0, completedTasksValue))
        : 0;
      const percent = Number(entry.percent);
      const completedAt = normalizeDateString(entry.completedAt);
      const safeCompletedAt =
        completedAt && new Date(completedAt).getTime() <= latestAllowedMs
          ? completedAt
          : null;
      return {
        id: uniqueStableId(entry.id, `history-${index + 1}`, usedIds),
        routineId: entry.routineId.trim(),
        routineTitle: entry.routineTitle,
        startedAt: normalizeDateString(entry.startedAt),
        finishedAt: normalizeDateString(entry.finishedAt),
        completedTasks,
        totalTasks,
        percent: Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0,
        notes: typeof entry.notes === "string" ? entry.notes : "",
        templateId: typeof entry.templateId === "string" ? entry.templateId : null,
        templateName: typeof entry.templateName === "string" ? entry.templateName : "",
        kind: typeof entry.kind === "string" ? entry.kind : "session",
        source: typeof entry.source === "string" ? entry.source : "session",
        date: normalizeDateKey(entry.date),
        completedAt: safeCompletedAt,
        elapsedMs: normalizeOptionalNonNegativeNumber(entry.elapsedMs),
        elapsedMinutes: normalizeOptionalNonNegativeNumber(entry.elapsedMinutes),
        estimatedDurationMinutes: normalizeOptionalNonNegativeNumber(
          entry.estimatedDurationMinutes
        )
      };
    });
}

function normalizeOptionalNonNegativeNumber'''
)
replace_once(
    "src/utils/storage.js",
    '  if (finishedAtMs < startedAtMs) return false;',
    '  if (finishedAtMs < startedAtMs) return false;\n  const latestAllowedMs = Date.now() + MAX_CLOCK_SKEW_MS;\n  if (startedAtMs > latestAllowedMs || finishedAtMs > latestAllowedMs) return false;'
)
replace_once(
    "src/utils/storage.js",
    '''      (entry.completedAt === null || Boolean(normalizeDateString(entry.completedAt)))
    );''',
    '''      (entry.completedAt === null ||
        (Boolean(normalizeDateString(entry.completedAt)) &&
          new Date(entry.completedAt).getTime() <= latestAllowedMs))
    );'''
)

# Runtime smoke test picks a free port and cleans up Windows preview process trees.
replace_once(
    "scripts/verify-runtime.mjs",
    'import { spawn } from "node:child_process";',
    'import { spawn, spawnSync } from "node:child_process";\nimport { createServer } from "node:net";'
)
replace_once(
    "scripts/verify-runtime.mjs",
    '''const host = "127.0.0.1";
const port = 4173;
const basePath = "/clean30/";
const baseUrl = `http://${host}:${port}`;
const appUrl = `${baseUrl}${basePath}`;''',
    '''const host = "127.0.0.1";
const basePath = "/clean30/";

async function findAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 4173;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

const port = await findAvailablePort();
const baseUrl = `http://${host}:${port}`;
const appUrl = `${baseUrl}${basePath}`;'''
)
replace_once(
    "scripts/verify-runtime.mjs",
    '''  if (!preview.killed) preview.kill("SIGTERM");
  await new Promise((resolveWait) => {''',
    '''  if (!preview.killed) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      preview.kill("SIGTERM");
    }
  }
  await new Promise((resolveWait) => {'''
)

# Actual deployment uses the same release gate as CI.
write(
    ".github/workflows/deploy.yml",
    '''name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Setup Node
        uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Verify release candidate
        run: npm run verify:release-candidate

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
'''
)

# Historical regression contracts updated to the hardened implementation.
replace_once(
    "tests/universal-phase-17.test.js",
    '''  assert.match(settings, /import \\{ loadAppState \\} from "\\.\\.\\/utils\\/storage\\.js"/);
  assert.match(settings, /const starterRestoreLocked = Boolean\\(/);
  assert.match(settings, /loadAppState\\(\\)\\.activeSession\\?\\.templateId === template\\.id/);''',
    '''  assert.doesNotMatch(settings, /loadAppState\\(\\)/);
  assert.match(settings, /activeSession/);
  assert.match(settings, /const starterRestoreLocked = Boolean\\(/);
  assert.match(settings, /activeSession\\?\\.templateId === template\\.id/);'''
)
regex_once(
    "tests/universal-phase-15.test.js",
    r'test\("routine drag reorder uses the post-removal target index for downward moves", \(\) => \{.*?\n\}\);',
    '''test("routine drag reorder delegates to the tested drop helper", () => {
  const editor = textFile("../src/components/RoutineEditorDialog.jsx");
  const library = textFile("../src/utils/routineLibrary.js");
  assert.match(editor, /moveRoutineTaskByDrop/);
  assert.match(library, /targetIndexBefore/);
  assert.match(library, /sourceIndex < targetIndexBefore/);
});'''
)

# Focused behavior tests for every bug fixed by the final audit.
write(
    "tests/final-release-audit.test.js",
    r'''import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createSession, getLastRoutineFinishedAt } from "../src/utils/calculations.js";
import { parseDurationMinutes } from "../src/utils/duration.js";
import {
  createRoutineDraftFromLibraryItems,
  getCanonicalHomeRoomName,
  getHomeRoomNames,
  getTaskLibraryItems,
  isReservedHomeRoomName
} from "../src/utils/homeLibrary.js";
import { buildQuickCleanPlan } from "../src/utils/quickClean.js";
import { getLastFullRoomRoutineCompletion } from "../src/utils/roomCare.js";
import {
  appendParsedTaskText,
  createSimpleRoutineDraft,
  moveRoutineTaskByDrop,
  parseRoutineTaskText
} from "../src/utils/routineLibrary.js";
import { CURRENT_BACKUP_VERSION, normalizeAppState } from "../src/utils/storage.js";
import { createDefaultTemplate, createTemplateExport } from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function roomRoutine(id, room, title = "Polish shelf") {
  return {
    id,
    title: `${room} clean`,
    archived: false,
    estimatedMinutes: 5,
    estimatedTime: "5 min",
    phases: [
      {
        id: `${id}-phase`,
        title: room,
        tasks: [{ id: `${id}-task`, title, duration: "2 min" }]
      }
    ]
  };
}

test("duration parser handles hour units, compound durations, and ranges", () => {
  assert.equal(parseDurationMinutes("90 min"), 90);
  assert.equal(parseDurationMinutes("1h 30m"), 90);
  assert.equal(parseDurationMinutes("1-2 hr"), 90);
  assert.equal(parseDurationMinutes("30-45 min"), 38);
});

test("routine parser preserves the same action in different rooms but dedupes within a room", () => {
  const parsed = parseRoutineTaskText(
    "Bedroom:\nVacuum floor\nVacuum floor\n\nLiving room:\nVacuum floor"
  );
  assert.equal(parsed.taskCount, 2);
  assert.deepEqual(parsed.sections.map((section) => section.tasks), [
    ["Vacuum floor"],
    ["Vacuum floor"]
  ]);

  const draft = createSimpleRoutineDraft();
  draft.phases[0].title = "Bedroom";
  draft.phases[0].tasks[0].title = "Vacuum floor";
  const appended = appendParsedTaskText(
    draft,
    "Bedroom:\nVacuum floor\nLiving room:\nVacuum floor"
  );
  assert.equal(
    appended.phases
      .flatMap((phase) => phase.tasks)
      .filter((task) => task.title === "Vacuum floor").length,
    2
  );
});

test("library routine drafts preserve same-named tasks that belong to different rooms", () => {
  const draft = createRoutineDraftFromLibraryItems([
    { id: "bed", title: "Vacuum floor", room: "Bedroom", minutes: 3 },
    { id: "living", title: "Vacuum floor", room: "Living room", minutes: 4 }
  ]);
  assert.equal(draft.phases.length, 2);
  assert.equal(draft.phases.flatMap((phase) => phase.tasks).length, 2);
});

test("explicit routine room wins over catalog-title inference", () => {
  const routine = roomRoutine("office-custom", "Office", "Wipe electronics");
  const items = getTaskLibraryItems({
    routines: [routine],
    homeRooms: ["Office", "Living room"],
    room: "Office"
  });
  const item = items.find((candidate) => candidate.title === "Wipe electronics");
  assert.ok(item);
  assert.equal(item.room, "Office");
  assert.equal(item.source, "routine");
});

test("Home canonicalizes preset casing and hides reserved virtual or utility room names", () => {
  assert.equal(getCanonicalHomeRoomName("kItChEn"), "Kitchen");
  for (const name of ["All", "Whole home", "Other", "Floors"]) {
    assert.equal(isReservedHomeRoomName(name), true);
  }
  assert.deepEqual(
    getHomeRoomNames(["kitchen", "All", "Whole home", "Floors", "Other", "Guest room"]),
    ["Kitchen", "Guest room"]
  );
  const kitchenItems = getTaskLibraryItems({ routines: [], homeRooms: ["kitchen"], room: "KITCHEN" });
  assert.ok(kitchenItems.some((item) => item.title === "Clean the kitchen sink"));
});

test("Quick Clean keeps same-named custom tasks in two selected rooms", () => {
  const routines = [roomRoutine("studio", "Studio"), roomRoutine("guest", "Guest room")];
  const plan = buildQuickCleanPlan({
    minutes: 30,
    rooms: ["Studio", "Guest room"],
    routines,
    history: []
  });
  const matching = plan.items.filter((item) => item.title === "Polish shelf");
  assert.equal(matching.length, 2);
  assert.deepEqual(new Set(matching.map((item) => item.room)), new Set(["Studio", "Guest room"]));
});

test("dragging down onto the next task moves it after the target", () => {
  const draft = createSimpleRoutineDraft();
  draft.phases[0].tasks = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
    { id: "c", title: "C" }
  ];
  const phaseId = draft.phases[0].id;
  const down = moveRoutineTaskByDrop(
    draft,
    { phaseId, taskId: "b" },
    phaseId,
    "c"
  );
  assert.deepEqual(down.phases[0].tasks.map((task) => task.id), ["a", "c", "b"]);
  const up = moveRoutineTaskByDrop(
    down,
    { phaseId, taskId: "b" },
    phaseId,
    "a"
  );
  assert.deepEqual(up.phases[0].tasks.map((task) => task.id), ["b", "a", "c"]);
});

test("explicit template identity prevents shared routine IDs from changing another plan's recency", () => {
  const routine = roomRoutine("shared-id", "Kitchen", "Clean the kitchen sink");
  const history = [
    { routineId: "shared-id", templateId: "other", percent: 100, finishedAt: "2026-08-09T10:00:00.000Z" },
    { routineId: "shared-id", templateId: "current", percent: 100, finishedAt: "2026-08-01T10:00:00.000Z" }
  ];
  assert.equal(
    getLastFullRoomRoutineCompletion("Kitchen", [routine], history, "current"),
    "2026-08-01T10:00:00.000Z"
  );
  assert.equal(
    getLastRoutineFinishedAt(history, "shared-id", "current"),
    "2026-08-01T10:00:00.000Z"
  );
});

test("session IDs remain unique even when sessions begin in the same millisecond", () => {
  const template = createDefaultTemplate();
  const routine = template.routines.find((item) => item.id !== "daily-rules");
  const originalNow = Date.now;
  Date.now = () => 123456789;
  try {
    const first = createSession(routine, template);
    const second = createSession(routine, template);
    assert.notEqual(first.id, second.id);
    assert.match(first.id, /^session-/);
  } finally {
    Date.now = originalNow;
  }
});

test("local normalization drops impossible or future History and caps impossible completion counts", () => {
  const template = createDefaultTemplate();
  const state = normalizeAppState({
    templates: [template],
    activeTemplateId: template.id,
    history: [
      {
        id: "future",
        routineId: "x",
        routineTitle: "X",
        startedAt: "2999-01-01T00:00:00.000Z",
        finishedAt: "2999-01-01T00:10:00.000Z",
        completedTasks: 1,
        totalTasks: 1,
        percent: 100
      },
      {
        id: "backwards",
        routineId: "x",
        routineTitle: "X",
        startedAt: "2026-08-08T12:00:00.000Z",
        finishedAt: "2026-08-08T11:00:00.000Z",
        completedTasks: 1,
        totalTasks: 1,
        percent: 100
      },
      {
        id: "valid",
        routineId: "x",
        routineTitle: "X",
        startedAt: "2026-08-08T10:00:00.000Z",
        finishedAt: "2026-08-08T10:10:00.000Z",
        completedTasks: 9,
        totalTasks: 2,
        percent: 100
      }
    ]
  });
  assert.deepEqual(state.history.map((entry) => entry.id), ["valid"]);
  assert.equal(state.history[0].completedTasks, 2);
});

test("starter restore is guarded by live active-session state at UI and mutation boundaries", () => {
  const app = textFile("../src/App.jsx");
  const settings = textFile("../src/components/Settings.jsx");
  assert.match(app, /appState\.activeSession\?\.templateId === activeTemplate\.id/);
  assert.match(app, /current\.activeSession\?\.templateId === current\.activeTemplateId/);
  assert.match(app, /activeSession=\{appState\.activeSession\}/);
  assert.doesNotMatch(settings, /loadAppState\(\)/);
  assert.match(settings, /activeSession\?\.templateId === template\.id/);
});

test("final release deployment and runtime verification are hardened", () => {
  const deploy = textFile("../.github/workflows/deploy.yml");
  const runtime = textFile("../scripts/verify-runtime.mjs");
  assert.match(deploy, /actions\/checkout@v7/);
  assert.match(deploy, /actions\/setup-node@v7/);
  assert.match(deploy, /npm run verify:release-candidate/);
  assert.match(runtime, /findAvailablePort/);
  assert.match(runtime, /server\.listen\(0, host/);
  assert.doesNotMatch(runtime, /const port = 4173;/);
});

test("final audit remains schema-free and preserves deployment and persistence invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");
  assert.equal(CURRENT_BACKUP_VERSION, 3);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(
    app,
    /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s
  );
});
'''
)

print("Final release audit fixes applied.")
