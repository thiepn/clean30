import { useEffect, useMemo, useRef, useState } from "react";
import Customize from "./components/Customize.jsx";
import Dashboard from "./components/Dashboard.jsx";
import History from "./components/History.jsx";
import Layout from "./components/Layout.jsx";
import Routines from "./components/Routines.jsx";
import Settings from "./components/Settings.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import HelpGuide from "./components/HelpGuide.jsx";
import Onboarding from "./components/Onboarding.jsx";
import {
  createSession,
  finishSessionState,
  getRoutineById,
  isDailyRulesHistoryEntry,
  isSessionForRoutine
} from "./utils/calculations.js";
import { daysBetween, getTodayKey } from "./utils/dates.js";
import {
  buildTodayTasksForDate,
  createFullBackup,
  getStorageHealth,
  hasMeaningfulTodayData,
  loadAppState,
  prepareImportedAppState,
  resetToFreshState,
  saveAppState,
  subscribeStorageHealth,
  validateFullBackupPayload
} from "./utils/storage.js";
import {
  createDefaultTemplate,
  createTemplateExport,
  normalizeTemplate,
  validateTemplatePayload
} from "./utils/templateUtils.js";
import {
  duplicateRoutineForLibrary,
  sanitizeRoutineDraft
} from "./utils/routineLibrary.js";
import { mergeHomeRoomsWithZones } from "./utils/homeLibrary.js";

function downloadJson(filename, payload) {
  let url = "";
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    console.warn("Clean30 could not start the JSON download.", error);
    return false;
  }
}

function createTodayTask(text, dateKey) {
  const createdAt = new Date().toISOString();
  return {
    id: `today-custom-${dateKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    defaultTaskId: null,
    text,
    completed: false,
    source: "custom",
    note: "",
    tags: [],
    routineId: null,
    routineName: "",
    originalTaskId: null,
    createdAt,
    completedAt: null
  };
}

function createRoutineTodayTask({ routine, task, dateKey }) {
  const createdAt = new Date().toISOString();
  return {
    id: `today-routine-${dateKey}-${routine.id}-${task.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    defaultTaskId: null,
    text: task.title || "Routine task",
    completed: false,
    source: "routine",
    note: task.detail || "",
    tags: Array.isArray(task.tags) ? task.tags : [],
    routineId: routine.id,
    routineName: routine.title,
    originalTaskId: task.id,
    createdAt,
    completedAt: null
  };
}

function createBackupPreview(data, fileName = "", warnings = []) {
  const templates = Array.isArray(data?.templates) ? data.templates : [];
  const routines = templates.flatMap((template) =>
    (template.routines || []).filter((routine) => routine.id !== "daily-rules")
  );
  const archived = routines.filter((routine) => routine.archived).length;
  const historyCount = Array.isArray(data?.history) ? data.history.length : 0;
  const todayDateCount =
    data?.todayTasksByDate && typeof data.todayTasksByDate === "object"
      ? Object.keys(data.todayTasksByDate).length
      : 0;
  const tagCount = Array.isArray(data?.appSettings?.taskTags)
    ? data.appSettings.taskTags.length
    : 0;
  return [
    fileName ? `File: ${fileName}.` : "",
    `${routines.length} routines (${archived} archived).`,
    `${historyCount} history entries.`,
    `${todayDateCount} Today dates.`,
    `${tagCount} task tags.`,
    data?.appSettings ? "App settings included." : "No app settings found.",
    ...warnings.map((warning) => `Warning: ${warning}`),
    "Importing replaces current local data."
  ]
    .filter(Boolean)
    .join(" ");
}

export default function App() {
  const [appState, setAppState] = useState(() => loadAppState());
  const [currentDateKey, setCurrentDateKey] = useState(() => getTodayKey());
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedRoutineId, setSelectedRoutineId] = useState("weekly-reset");
  const [completionSummary, setCompletionSummary] = useState(null);
  const [pendingCompletionSessionId, setPendingCompletionSessionId] = useState(null);
  const [autoOpenCleanModeSessionId, setAutoOpenCleanModeSessionId] = useState(null);
  const finishRequestTimesRef = useRef(new Map());
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deletedTodayTask, setDeletedTodayTask] = useState(null);
  const [storageHealth, setStorageHealth] = useState(() => getStorageHealth());
  const [editorContext, setEditorContext] = useState({
    origin: "dashboard",
    section: "routines",
    intent: null,
    key: 0
  });

  const activeTemplate = useMemo(() => {
    return (
      appState.templates.find((template) => template.id === appState.activeTemplateId) ||
      appState.templates[0]
    );
  }, [appState.activeTemplateId, appState.templates]);

  useEffect(() => {
    return subscribeStorageHealth(setStorageHealth);
  }, []);

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    if (!pendingCompletionSessionId) return;
    if (appState.activeSession?.id === pendingCompletionSessionId) return;
    const expectedFinishedAt = finishRequestTimesRef.current.get(
      pendingCompletionSessionId
    );
    const entry = appState.history.find(
      (item) =>
        (item.id === `session-history-${pendingCompletionSessionId}` ||
          item.sessionId === pendingCompletionSessionId) &&
        item.finishedAt === expectedFinishedAt
    );
    if (entry) setCompletionSummary(entry);
    finishRequestTimesRef.current.delete(pendingCompletionSessionId);
    setPendingCompletionSessionId(null);
  }, [appState.activeSession?.id, appState.history, pendingCompletionSessionId]);

  useEffect(() => {
    function checkForDateRollover() {
      const nextDateKey = getTodayKey();
      setCurrentDateKey((current) => (current === nextDateKey ? current : nextDateKey));
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") checkForDateRollover();
    }

    const intervalId = window.setInterval(checkForDateRollover, 60000);
    window.addEventListener("focus", checkForDateRollover);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkForDateRollover);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!deletedTodayTask) return;
    const timeoutId = window.setTimeout(() => {
      setDeletedTodayTask(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [deletedTodayTask]);

  useEffect(() => {
    function handleUpdateAvailable() {
      setUpdateAvailable(true);
    }

    window.addEventListener("clean30:updateAvailable", handleUpdateAvailable);
    return () => window.removeEventListener("clean30:updateAvailable", handleUpdateAvailable);
  }, []);

  useEffect(() => {
    if (!activeTemplate?.routines.some((routine) => routine.id === selectedRoutineId)) {
      setSelectedRoutineId(activeTemplate?.routines[0]?.id || "");
    }
  }, [activeTemplate, selectedRoutineId]);

  const hasCompletedDailyRules = Object.values(appState.dailyRuleCompletions).some(
    (ruleIds) => ruleIds.length > 0
  );
  const hasCustomTemplate = appState.templates.some(
    (template) => template.id !== "clean30-default" && !template.readOnly
  );
  const hasMeaningfulToday = hasMeaningfulTodayData(appState.todayTasksByDate);
  const onboardingAge = daysBetween(appState.onboardingCompletedAt);
  const hasMeaningfulData =
    appState.history.length > 0 ||
    hasCompletedDailyRules ||
    hasMeaningfulToday ||
    hasCustomTemplate ||
    (onboardingAge !== null && onboardingAge > 30);
  const backupReferenceDate =
    appState.lastFullBackupExportedAt ||
    appState.firstMeaningfulUseAt ||
    appState.onboardingCompletedAt;
  const backupAge = daysBetween(backupReferenceDate);
  const backupReminderInterval = Number(appState.appSettings?.backupReminderIntervalDays ?? 30);
  const backupDue =
    backupReminderInterval > 0 &&
    hasMeaningfulData &&
    backupAge !== null &&
    backupAge >= backupReminderInterval;

  const effectiveView =
    currentView === "start"
      ? "dashboard"
      : currentView === "systems"
        ? "settings"
        : currentView;
  const publicView =
    effectiveView === "customize"
      ? editorContext.origin === "settings"
        ? "settings"
        : editorContext.origin === "routines"
          ? "routines"
          : "dashboard"
      : effectiveView;
  const todayKey = currentDateKey;
  const todayTasks = useMemo(
    () =>
      buildTodayTasksForDate(
        appState.todayTasksByDate?.[todayKey],
        activeTemplate,
        todayKey,
        appState.dailyRuleCompletions?.[todayKey] || [],
        appState.appSettings
      ),
    [activeTemplate, appState.appSettings, appState.dailyRuleCompletions, appState.todayTasksByDate, todayKey]
  );

  useEffect(() => {
    setAppState((current) => {
      if (Object.prototype.hasOwnProperty.call(current.todayTasksByDate || {}, todayKey)) {
        return current;
      }
      const template = getTemplateFromState(current);
      const tasks = buildTodayTasksForDate(
        null,
        template,
        todayKey,
        current.dailyRuleCompletions?.[todayKey] || [],
        current.appSettings
      );
      return {
        ...current,
        todayTasksByDate: {
          ...(current.todayTasksByDate || {}),
          [todayKey]: tasks
        }
      };
    });
  }, [todayKey]);

  function markMeaningfulUse(state) {
    return state.firstMeaningfulUseAt
      ? state
      : { ...state, firstMeaningfulUseAt: new Date().toISOString() };
  }

  function requestConfirmation({ title, message, confirmLabel, onConfirm }) {
    setConfirmDialog({ title, message, confirmLabel, onConfirm });
  }

  function closeConfirmation() {
    setConfirmDialog(null);
  }

  function confirmCurrentAction() {
    confirmDialog?.onConfirm?.();
    closeConfirmation();
  }

  function navigateTo(viewId) {
    if (viewId === "start") {
      setCurrentView("dashboard");
      return;
    }
    if (viewId === "systems") {
      setCurrentView("settings");
      return;
    }
    if (viewId === "customize") {
      openInternalEditor("routines", "dashboard");
      return;
    }
    setCurrentView(viewId);
  }

  function openInternalEditor(section = "routines", origin = "dashboard", intent = null) {
    setEditorContext({
      origin,
      section,
      intent,
      key: Date.now()
    });
    setCurrentView("customize");
  }

  function closeInternalEditor() {
    if (editorContext.origin === "settings") {
      setCurrentView("settings");
      return;
    }
    if (editorContext.origin === "routines") {
      setCurrentView("routines");
      return;
    }
    setCurrentView("dashboard");
  }

  function updateActiveTemplate(updater) {
    setAppState((current) => {
      const template = current.templates.find((item) => item.id === current.activeTemplateId);
      if (!template) return current;
      const updated = normalizeTemplate(updater(template), { readOnly: false });
      return markMeaningfulUse({
        ...current,
        templates: current.templates.map((item) => (item.id === updated.id ? updated : item))
      });
    });
  }

  function setActiveTemplateId(templateId) {
    setAppState((current) =>
      current.templates.some((template) => template.id === templateId)
        ? { ...current, activeTemplateId: templateId }
        : current
    );
  }

  function resetCurrentTemplateToDefault() {
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

  function exportTemplate() {
    const ok = downloadJson(
      `clean30-template-${getTodayKey()}.json`,
      createTemplateExport(activeTemplate)
    );
    return ok
      ? { ok: true, message: "Template download started." }
      : { ok: false, error: "Template export could not be prepared. No data was changed." };
  }

  function importTemplate(payload) {
    const result = validateTemplatePayload(payload);
    if (!result.ok) return result;
    setAppState((current) => markMeaningfulUse({
      ...current,
      templates: [...current.templates, result.template],
      activeTemplateId: result.template.id
    }));
    setSelectedRoutineId(result.template.routines[0]?.id || "");
    return { ok: true, message: "Template imported as a new custom template." };
  }

  function exportFullBackup() {
    const exportedAt = new Date().toISOString();
    const nextState = { ...appState, lastFullBackupExportedAt: exportedAt };
    const ok = downloadJson(
      `clean30-full-backup-${getTodayKey()}.json`,
      createFullBackup(nextState)
    );
    if (!ok) {
      return {
        ok: false,
        error: "Full backup export could not be prepared. Backup health was not changed."
      };
    }
    setAppState(nextState);
    return { ok: true, message: "Full backup download started." };
  }

  function importFullBackup(payload, metadata = {}) {
    const result = validateFullBackupPayload(payload);
    if (!result.ok) return result;
    const importedState = prepareImportedAppState(result.data);
    requestConfirmation({
      title: "Review backup before import",
      message: createBackupPreview(importedState, metadata.fileName, [
        ...(result.warnings || []),
        "A new local full backup is recommended after import."
      ]),
      confirmLabel: "Import",
      onConfirm: () => {
        const importedActiveTemplate =
          importedState.templates.find(
            (template) => template.id === importedState.activeTemplateId
          ) || importedState.templates[0];
        setAppState(importedState);
        setSelectedRoutineId(importedActiveTemplate?.routines[0]?.id || "weekly-reset");
        setCompletionSummary(null);
        setPendingCompletionSessionId(null);
        finishRequestTimesRef.current.clear();
      }
    });
    return { ok: true, message: "Backup validated. Review the preview before importing." };
  }

  function saveRoutineFromLibrary(routineDraft) {
    const savedRoutine = sanitizeRoutineDraft(routineDraft);
    const exists = activeTemplate.routines.some(
      (routine) => routine.id === savedRoutine.id
    );
    updateActiveTemplate((template) => ({
      ...template,
      routines: exists
        ? template.routines.map((routine) =>
            routine.id === savedRoutine.id ? savedRoutine : routine
          )
        : [...template.routines, savedRoutine]
    }));
    setSelectedRoutineId(savedRoutine.id);
    return savedRoutine.id;
  }

  function duplicateRoutineFromLibrary(routineId) {
    const routine = getRoutineById(activeTemplate.routines, routineId);
    if (!routine) return "";
    const duplicate = duplicateRoutineForLibrary(
      routine,
      activeTemplate.routines
        .filter((item) => item.id !== "daily-rules")
        .map((item) => item.title)
    );
    updateActiveTemplate((template) => ({
      ...template,
      routines: [...template.routines, duplicate]
    }));
    setSelectedRoutineId(duplicate.id);
    return duplicate.id;
  }

  function toggleRoutineArchiveFromLibrary(routineId) {
    const routine = getRoutineById(activeTemplate.routines, routineId);
    if (!routine) return;
    if (
      appState.activeSession?.templateId === activeTemplate.id &&
      appState.activeSession?.routineId === routineId
    ) {
      requestConfirmation({
        title: "Routine is in use",
        message: `"${routine.title}" is used by the current clean. Finish or discard it before changing this routine.`,
        confirmLabel: "Keep routine",
        onConfirm: () => {}
      });
      return;
    }

    const applyArchive = () =>
      updateActiveTemplate((template) => ({
        ...template,
        routines: template.routines.map((item) =>
          item.id === routineId
            ? { ...item, archived: !routine.archived }
            : item
        )
      }));

    if (routine.archived) {
      applyArchive();
      return;
    }

    requestConfirmation({
      title: "Archive routine?",
      message: `"${routine.title}" will be hidden from the main routine list. Progress is kept.`,
      confirmLabel: "Archive routine",
      onConfirm: applyArchive
    });
  }

  function deleteRoutineFromLibrary(routineId) {
    const routine = getRoutineById(activeTemplate.routines, routineId);
    if (!routine) return;
    if (
      appState.activeSession?.templateId === activeTemplate.id &&
      appState.activeSession?.routineId === routineId
    ) {
      requestConfirmation({
        title: "Routine is in use",
        message: `"${routine.title}" is used by the current clean. Finish or discard it before deleting this routine.`,
        confirmLabel: "Keep routine",
        onConfirm: () => {}
      });
      return;
    }

    requestConfirmation({
      title: "Delete routine?",
      message: `"${routine.title}" will be removed from this cleaning plan. Existing Progress entries are kept.`,
      confirmLabel: "Delete routine",
      onConfirm: () => {
        const fallback = activeTemplate.routines.find(
          (item) =>
            item.id !== "daily-rules" &&
            item.id !== routineId &&
            !item.archived
        );
        updateActiveTemplate((template) => ({
          ...template,
          routines: template.routines.filter((item) => item.id !== routineId)
        }));
        setSelectedRoutineId(fallback?.id || "");
      }
    });
  }

  function openAdvancedRoutineEditor(routineId) {
    setSelectedRoutineId(routineId);
    openInternalEditor("routines", "routines", `routine:${routineId}`);
  }

  function startSession(routineId = selectedRoutineId) {
    const routine = getRoutineById(activeTemplate.routines, routineId);
    if (!routine) return;

    setSelectedRoutineId(routineId);

    if (appState.activeSession) {
      if (isSessionForRoutine(appState.activeSession, activeTemplate.id, routineId)) {
        setCompletionSummary(null);
        setAutoOpenCleanModeSessionId(appState.activeSession.id);
        setCurrentView("dashboard");
        return;
      }

      const hasProgress =
        (appState.activeSession.completedTaskIds || []).length > 0 ||
        Boolean(appState.activeSession.notes?.trim());
      requestConfirmation({
        title: "Replace current clean?",
        message: hasProgress
          ? "A current clean already has progress. Replacing it will discard that progress without saving it."
          : "A current clean already exists. Replacing it will discard that clean without saving it.",
        confirmLabel: "Replace clean",
        onConfirm: () => {
          const nextSession = createSession(routine, activeTemplate);
          setAppState((current) => ({
            ...current,
            activeSession: nextSession
          }));
          setCompletionSummary(null);
          setAutoOpenCleanModeSessionId(nextSession.id);
          setCurrentView("dashboard");
        }
      });
      return;
    }

    const nextSession = createSession(routine, activeTemplate);
    setAppState((current) => ({
      ...current,
      activeSession: nextSession
    }));
    setCompletionSummary(null);
    setAutoOpenCleanModeSessionId(nextSession.id);
    setCurrentView("dashboard");
  }

  function pauseSession() {
    setAppState((current) => {
      if (!current.activeSession || current.activeSession.paused) return current;
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          paused: true,
          pausedAt: new Date().toISOString()
        }
      };
    });
  }

  function resumeSession() {
    setAppState((current) => {
      const session = current.activeSession;
      if (!session || !session.paused) return current;
      const pausedAt = new Date(session.pausedAt);
      const pausedMs = Number.isNaN(pausedAt.getTime()) ? 0 : Math.max(0, Date.now() - pausedAt.getTime());
      return {
        ...current,
        activeSession: {
          ...session,
          paused: false,
          pausedAt: null,
          totalPausedMs: Math.max(0, Number(session.totalPausedMs) || 0) + pausedMs
        }
      };
    });
  }

  function toggleTask(taskId) {
    setAppState((current) => {
      if (!current.activeSession) return current;
      const completed = new Set(current.activeSession.completedTaskIds || []);
      if (completed.has(taskId)) completed.delete(taskId);
      else completed.add(taskId);
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          completedTaskIds: [...completed]
        }
      };
    });
  }

  function completePhase(taskIds) {
    setAppState((current) => {
      if (!current.activeSession) return current;
      const completed = new Set(current.activeSession.completedTaskIds || []);
      taskIds.forEach((id) => completed.add(id));
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          completedTaskIds: [...completed]
        }
      };
    });
  }

  function updateSessionNotes(notes) {
    setAppState((current) =>
      current.activeSession
        ? { ...current, activeSession: { ...current.activeSession, notes } }
        : current
    );
  }

  function resetSession() {
    requestConfirmation({
      title: "Reset session?",
      message: "This clears completed tasks and notes for the active session.",
      confirmLabel: "Reset",
      onConfirm: () => {
        setAppState((current) =>
          current.activeSession
            ? {
                ...current,
                activeSession: {
                  ...current.activeSession,
                  completedTaskIds: [],
                  notes: ""
                }
              }
            : current
        );
      }
    });
  }

  function cancelSession() {
    requestConfirmation({
      title: "Cancel session?",
      message: "The active session will be removed without saving it to history.",
      confirmLabel: "Cancel session",
      onConfirm: () => setAppState((current) => ({ ...current, activeSession: null }))
    });
  }

  function finishSession() {
    const sessionId = appState.activeSession?.id;
    if (!sessionId) return;
    const finishedAt =
      finishRequestTimesRef.current.get(sessionId) || new Date().toISOString();
    finishRequestTimesRef.current.set(sessionId, finishedAt);
    const expectsSummary = appState.activeSession?.routineId !== "daily-rules";
    setAppState((current) => finishSessionState(current, sessionId, finishedAt).state);
    setCompletionSummary(null);
    setPendingCompletionSessionId(expectsSummary ? sessionId : null);
  }

  function viewCompletionHistory() {
    setCompletionSummary(null);
    setCurrentView("history");
  }

  function clearCompletionSummary() {
    setCompletionSummary(null);
    setCurrentView("dashboard");
  }

  function getTemplateFromState(state) {
    return (
      state.templates.find((template) => template.id === state.activeTemplateId) ||
      state.templates[0] ||
      activeTemplate
    );
  }

  function getTodayTasksFromState(state, dateKey) {
    return buildTodayTasksForDate(
      state.todayTasksByDate?.[dateKey],
      getTemplateFromState(state),
      dateKey,
      state.dailyRuleCompletions?.[dateKey] || [],
      state.appSettings
    );
  }

  function getCompletedDefaultIds(tasks) {
    return tasks
      .filter((task) => task.source === "default" && task.completed && task.defaultTaskId)
      .map((task) => task.defaultTaskId);
  }

  function applyTodayTasksToState(state, dateKey, tasks) {
    return {
      ...state,
      todayTasksByDate: {
        ...(state.todayTasksByDate || {}),
        [dateKey]: tasks
      },
      dailyRuleCompletions: {
        ...state.dailyRuleCompletions,
        [dateKey]: getCompletedDefaultIds(tasks)
      }
    };
  }

  function toggleTodayTask(taskId) {
    const dateKey = getTodayKey();
    setAppState((current) => {
      const tasks = getTodayTasksFromState(current, dateKey).map((task) => {
        if (task.id !== taskId) return task;
        const completed = !task.completed;
        return {
          ...task,
          completed,
          completedAt: completed ? new Date().toISOString() : null
        };
      });
      const next = applyTodayTasksToState(current, dateKey, tasks);
      return markMeaningfulUse(next);
    });
  }

  function addTodayTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const dateKey = getTodayKey();
    setAppState((current) =>
      markMeaningfulUse(
        applyTodayTasksToState(current, dateKey, [
          ...getTodayTasksFromState(current, dateKey),
          createTodayTask(trimmed, dateKey)
        ])
      )
    );
  }

  function saveHomeRooms(roomNames) {
    updateActiveTemplate((template) => ({
      ...template,
      zones: mergeHomeRoomsWithZones(template.zones, roomNames)
    }));
  }

  function addLibraryTasksToToday(items = []) {
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
        const roomMatch = String(task.note || "").match(/^Room:\s*(.+)$/i);
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

  function deleteTodayTask(taskId) {
    const dateKey = getTodayKey();
    const currentTasks = getTodayTasksFromState(appState, dateKey);
    const deletedIndex = currentTasks.findIndex((task) => task.id === taskId);
    const deletedTask = currentTasks[deletedIndex];
    if (deletedTask) {
      setDeletedTodayTask({
        dateKey,
        task: deletedTask,
        index: deletedIndex,
        id: `${Date.now()}-${deletedTask.id}`
      });
    }
    setAppState((current) => {
      const tasks = getTodayTasksFromState(current, dateKey).filter((task) => task.id !== taskId);
      return applyTodayTasksToState(current, dateKey, tasks);
    });
  }

  function undoDeleteTodayTask() {
    if (!deletedTodayTask) return;
    setAppState((current) => {
      const tasks = getTodayTasksFromState(current, deletedTodayTask.dateKey);
      if (tasks.some((task) => task.id === deletedTodayTask.task.id)) return current;
      const nextTasks = [...tasks];
      nextTasks.splice(Math.min(deletedTodayTask.index, nextTasks.length), 0, deletedTodayTask.task);
      return markMeaningfulUse(applyTodayTasksToState(current, deletedTodayTask.dateKey, nextTasks));
    });
    setDeletedTodayTask(null);
  }

  function moveTodayTask(taskId, direction) {
    const dateKey = getTodayKey();
    setAppState((current) => {
      const tasks = getTodayTasksFromState(current, dateKey);
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return current;
      const group = tasks.filter((item) => Boolean(item.completed) === Boolean(task.completed));
      const groupIndex = group.findIndex((item) => item.id === taskId);
      const target = group[groupIndex + direction];
      if (!target) return current;

      const nextTasks = [...tasks];
      const currentIndex = nextTasks.findIndex((item) => item.id === taskId);
      const [moved] = nextTasks.splice(currentIndex, 1);
      let targetIndex = nextTasks.findIndex((item) => item.id === target.id);
      if (direction > 0) targetIndex += 1;
      nextTasks.splice(targetIndex, 0, moved);
      return markMeaningfulUse(applyTodayTasksToState(current, dateKey, nextTasks));
    });
  }

  function updateTodayTaskDetails(taskId, updates) {
    const dateKey = getTodayKey();
    setAppState((current) => {
      const tasks = getTodayTasksFromState(current, dateKey).map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
              note: typeof updates.note === "string" ? updates.note : task.note,
              tags: Array.isArray(updates.tags) ? updates.tags : task.tags
            }
          : task
      );
      return markMeaningfulUse(applyTodayTasksToState(current, dateKey, tasks));
    });
  }

  function addTaskTag(tag) {
    const cleaned = tag.trim();
    if (!cleaned) return;
    setAppState((current) => {
      const tags = current.appSettings?.taskTags || [];
      if (tags.some((item) => item.toLowerCase() === cleaned.toLowerCase())) return current;
      return {
        ...current,
        appSettings: {
          ...(current.appSettings || {}),
          taskTags: [...tags, cleaned]
        }
      };
    });
  }

  function addRoutineTasksToToday(routineId, taskIds) {
    const routine = getRoutineById(activeTemplate.routines, routineId);
    if (!routine || !taskIds.length) return;
    const dateKey = getTodayKey();
    const selectedIds = new Set(taskIds);
    const routineTasks = routine.phases.flatMap((phase) => phase.tasks);

    setAppState((current) => {
      const currentTasks = getTodayTasksFromState(current, dateKey);
      const existingRoutineKeys = new Set(
        currentTasks
          .filter((task) => task.source === "routine" && task.routineId && task.originalTaskId)
          .map((task) => `${task.routineId}:${task.originalTaskId}`)
      );
      const tasksToAdd = routineTasks
        .filter((task) => selectedIds.has(task.id))
        .filter((task) => !existingRoutineKeys.has(`${routine.id}:${task.id}`))
        .map((task) => createRoutineTodayTask({ routine, task, dateKey }));
      if (!tasksToAdd.length) return current;
      return markMeaningfulUse(
        applyTodayTasksToState(current, dateKey, [...currentTasks, ...tasksToAdd])
      );
    });
  }

  function resetTodayTasks() {
    const dateKey = getTodayKey();
    const reset = () => {
      setAppState((current) =>
        applyTodayTasksToState(
          current,
          dateKey,
          buildTodayTasksForDate(null, getTemplateFromState(current), dateKey, [], current.appSettings)
        )
      );
    };

    if (!getTodayTasksFromState(appState, dateKey).length) {
      reset();
      return;
    }

    requestConfirmation({
      title: "Reset today?",
      message: appState.appSettings?.startTodayEmpty
        ? "This clears today's tasks because Start Today empty is on."
        : "This replaces today's tasks with your current defaults.",
      confirmLabel: "Reset",
      onConfirm: reset
    });
  }

  function resetEverything() {
    requestConfirmation({
      title: "Reset all Clean30 data?",
      message: "This clears templates, Today tasks, active session, and all history.",
      confirmLabel: "Reset all",
      onConfirm: () => {
        setAppState(resetToFreshState());
        setSelectedRoutineId("weekly-reset");
        setCompletionSummary(null);
        setPendingCompletionSessionId(null);
        finishRequestTimesRef.current.clear();
      }
    });
  }

  function restartOnboarding() {
    setAppState((current) => ({ ...current, onboardingCompleted: false }));
    setCurrentView("dashboard");
  }

  function updateBackupReminderInterval(value) {
    const interval = Number(value);
    if (![0, 14, 30, 60].includes(interval)) return;
    setAppState((current) => ({
      ...current,
      appSettings: {
        ...(current.appSettings || {}),
        backupReminderIntervalDays: interval
      }
    }));
  }

  function updateStartTodayEmpty(value) {
    setAppState((current) => ({
      ...current,
      appSettings: {
        ...(current.appSettings || {}),
        startTodayEmpty: Boolean(value)
      }
    }));
  }

  function updateAppAppearance(field, value) {
    const allowedValues = {
      accentColor: [
        "red",
        "orange",
        "amber",
        "green",
        "teal",
        "cyan",
        "blue",
        "navy",
        "purple",
        "pink",
        "brown",
        "charcoal"
      ],
      backgroundColor: [
        "white",
        "light-gray",
        "cream",
        "yellow",
        "peach",
        "pink",
        "lavender",
        "sky-blue",
        "mint",
        "green",
        "sand",
        "slate"
      ],
      fontSize: ["small", "normal", "large"],
      density: ["compact", "comfortable"]
    };
    if (!allowedValues[field]?.includes(value)) return;
    setAppState((current) => ({
      ...current,
      appSettings: {
        ...(current.appSettings || {}),
        [field]: value
      }
    }));
  }

  function completeOnboarding({ setupMode }) {
    setAppState((current) => {
      const defaultTemplate =
        current.templates.find((template) => template.id === "clean30-default") ||
        createDefaultTemplate();
      const templates = current.templates.some((template) => template.id === defaultTemplate.id)
        ? current.templates
        : [defaultTemplate, ...current.templates];
      const starterTemplate = normalizeTemplate(
        setupMode === "empty-today"
          ? {
              ...defaultTemplate,
              todayDefaults: [],
              dailyRules: []
            }
          : defaultTemplate,
        { readOnly: false }
      );
      const dateKey = getTodayKey();

      return {
        ...current,
        templates: templates.map((template) =>
          template.id === starterTemplate.id ? starterTemplate : template
        ),
        activeTemplateId: starterTemplate.id,
        todayTasksByDate: {
          ...(current.todayTasksByDate || {}),
          [dateKey]: buildTodayTasksForDate(null, starterTemplate, dateKey, [], current.appSettings)
        },
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      };
    });
    setSelectedRoutineId("weekly-reset");
    setCurrentView("dashboard");
  }

  function resetOnlyHistory() {
    requestConfirmation({
      title: "Reset history?",
      message: "This clears completed sessions but keeps templates and Today tasks.",
      confirmLabel: "Reset history",
      onConfirm: () => {
        setAppState((current) => ({ ...current, history: [] }));
        setCompletionSummary(null);
      }
    });
  }

  function deleteHistoryEntry(entryId) {
    requestConfirmation({
      title: "Delete history entry?",
      message: "This removes the selected completed session from history.",
      confirmLabel: "Delete",
      onConfirm: () => {
        setAppState((current) => ({
          ...current,
          history: current.history.filter(
            (entry) => entry.id !== entryId || isDailyRulesHistoryEntry(entry)
          )
        }));
      }
    });
  }

  let content;
  if (effectiveView === "customize") {
    content = (
      <Customize
        key={editorContext.key}
        appState={appState}
        activeTemplate={activeTemplate}
        onSetActiveTemplate={setActiveTemplateId}
        onResetTemplate={resetCurrentTemplateToDefault}
        onUpdateTemplate={updateActiveTemplate}
        onExportTemplate={exportTemplate}
        onImportTemplate={importTemplate}
        onExportFullBackup={exportFullBackup}
        onImportFullBackup={importFullBackup}
        onResetHistory={resetOnlyHistory}
        onResetAll={resetEverything}
        onRequestConfirmation={requestConfirmation}
        initialSection={editorContext.section}
        entryIntent={editorContext.intent}
        onBack={closeInternalEditor}
        activeSession={appState.activeSession}
        backLabel={
          editorContext.origin === "settings"
            ? "Back to Settings"
            : editorContext.origin === "routines"
              ? "Back to Routines"
              : "Back to Today"
        }
      />
    );
  } else if (effectiveView === "routines") {
    content = (
      <Routines
        routines={activeTemplate.routines}
        zones={activeTemplate.zones}
        history={appState.history}
        activeTemplateId={activeTemplate.id}
        activeSession={appState.activeSession}
        onStartRoutine={startSession}
        onSaveRoutine={saveRoutineFromLibrary}
        onSaveHomeRooms={saveHomeRooms}
        onAddLibraryTasksToToday={addLibraryTasksToToday}
        onDuplicateRoutine={duplicateRoutineFromLibrary}
        onToggleArchive={toggleRoutineArchiveFromLibrary}
        onDeleteRoutine={deleteRoutineFromLibrary}
        onAdvancedEdit={openAdvancedRoutineEditor}
      />
    );
  } else if (effectiveView === "history") {
    content = (
      <History
        history={appState.history}
        todayTasksByDate={appState.todayTasksByDate}
        currentDateKey={todayKey}
        routines={activeTemplate.routines}
        template={activeTemplate}
        onDeleteEntry={deleteHistoryEntry}
      />
    );
  } else if (effectiveView === "settings") {
    content = (
      <Settings
        template={activeTemplate}
        activeSession={appState.activeSession}
        onExportFullBackup={exportFullBackup}
        onImportFullBackup={importFullBackup}
        lastFullBackupExportedAt={appState.lastFullBackupExportedAt}
        backupDue={backupDue}
        backupReminderIntervalDays={backupReminderInterval}
        appAppearance={appState.appSettings}
        onUpdateBackupReminderInterval={updateBackupReminderInterval}
        onUpdateAppAppearance={updateAppAppearance}
        onUpdateStartTodayEmpty={updateStartTodayEmpty}
        onRestartOnboarding={restartOnboarding}
        onOpenHelp={() => setHelpOpen(true)}
        onManageCustomize={(section = "profile", intent = null) =>
          openInternalEditor(section, "settings", intent)
        }
        onResetTemplate={resetCurrentTemplateToDefault}
        onResetAll={resetEverything}
        onResetHistory={resetOnlyHistory}
      />
    );
  } else {
    content = (
      <Dashboard
        template={activeTemplate}
        history={appState.history}
        todayTasks={todayTasks}
        todayTasksByDate={appState.todayTasksByDate}
        currentDateKey={todayKey}
        activeSession={appState.activeSession}
        completionSummary={completionSummary}
        selectedRoutineId={selectedRoutineId}
        onSelectRoutine={setSelectedRoutineId}
        onToggleTodayTask={toggleTodayTask}
        onAddTodayTask={addTodayTask}
        onDeleteTodayTask={deleteTodayTask}
        onUndoDeleteTodayTask={undoDeleteTodayTask}
        deletedTodayTask={deletedTodayTask}
        onMoveTodayTask={moveTodayTask}
        onUpdateTodayTaskDetails={updateTodayTaskDetails}
        taskTags={appState.appSettings?.taskTags || []}
        onAddTaskTag={addTaskTag}
        onAddRoutineTasksToToday={addRoutineTasksToToday}
        onResetTodayTasks={resetTodayTasks}
        onStartRoutine={startSession}
        onToggleTask={toggleTask}
        onCompletePhase={completePhase}
        onResetSession={resetSession}
        onFinishSession={finishSession}
        onCancelSession={cancelSession}
        onPauseSession={pauseSession}
        onResumeSession={resumeSession}
        onUpdateNotes={updateSessionNotes}
        onViewHistory={viewCompletionHistory}
        onClearCompletionSummary={clearCompletionSummary}
        onEditToday={() => openInternalEditor("routines", "dashboard", "today")}
        onEditRoutines={() => openInternalEditor("routines", "dashboard")}
        onAddRoutine={() => openInternalEditor("routines", "dashboard", "add-routine")}
        autoOpenCleanModeSessionId={autoOpenCleanModeSessionId}
        onAutoOpenCleanModeHandled={() => setAutoOpenCleanModeSessionId(null)}
      />
    );
  }

  return (
    <>
      {storageHealth.status === "error" ? (
        <div className="storage-warning-banner" role="alert">
          <div>
            <strong>Changes could not be saved.</strong>
            <span>
              Export a backup and check your browser storage.{" "}
              {storageHealth.errorMessage}
            </span>
          </div>
          <div className="storage-warning-actions">
            <button className="button primary small" type="button" onClick={exportFullBackup}>
              Export backup
            </button>
            <button
              className="button ghost small"
              type="button"
              onClick={() => saveAppState(appState)}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}
      <Layout
        currentView={publicView}
        onNavigate={navigateTo}
        template={activeTemplate}
        onOpenHelp={() => setHelpOpen(true)}
        appAppearance={appState.appSettings}
      >
        {content}
      </Layout>
      <HelpGuide open={helpOpen} onClose={() => setHelpOpen(false)} />
      {!appState.onboardingCompleted ? (
        <Onboarding template={activeTemplate} onComplete={completeOnboarding} />
      ) : null}
      <ConfirmDialog
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        onConfirm={confirmCurrentAction}
        onCancel={closeConfirmation}
      />
      {updateAvailable ? (
        <div className="update-toast" role="status">
          <span>Update available</span>
          <button
            className="button primary small"
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("clean30:applyUpdate"))}
          >
            Reload
          </button>
          <button
            className="icon-button small"
            type="button"
            aria-label="Dismiss update prompt"
            onClick={() => setUpdateAvailable(false)}
          >
            X
          </button>
        </div>
      ) : null}
    </>
  );
}
