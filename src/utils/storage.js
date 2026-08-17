import { getTodayKey } from "./dates.js";
import {
  accentOptions,
  createDefaultTemplate,
  densityOptions,
  duplicateTemplate,
  getTodayDefaultsForDate,
  normalizeRoutine,
  normalizeTemplate,
  priorityOptions,
  routineColorOptions
} from "./templateUtils.js";
import {
  MAINTENANCE_COMPLETION_SOURCES,
  MAINTENANCE_EFFORTS,
  MAINTENANCE_FREQUENCY_MODES,
  deriveLegacyMaintenanceCompletions,
  normalizeMaintenanceCompletions,
  normalizeMaintenanceTaskList
} from "./maintenanceTasks.js";

export const STORAGE_KEYS = {
  appState: "clean30_appState",
  settings: "clean30_settings",
  dailyRules: "clean30_dailyRules",
  activeSession: "clean30_activeSession",
  history: "clean30_history"
};

export const CURRENT_BACKUP_VERSION = 4;

const storageHealthListeners = new Set();
let storageHealth = {
  status: "ok",
  errorMessage: null
};

function reportStorageHealth(status, errorMessage = null) {
  if (
    storageHealth.status === status &&
    storageHealth.errorMessage === errorMessage
  ) {
    return;
  }
  storageHealth = { status, errorMessage };
  storageHealthListeners.forEach((listener) => listener(storageHealth));
}

export function getStorageHealth() {
  return { ...storageHealth };
}

export function subscribeStorageHealth(listener) {
  if (typeof listener !== "function") return () => {};
  storageHealthListeners.add(listener);
  listener(getStorageHealth());
  return () => {
    storageHealthListeners.delete(listener);
  };
}

function getStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function canUseStorage() {
  return Boolean(getStorage());
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readJson(key, fallback) {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  const storage = getStorage();
  if (!storage) {
    reportStorageHealth(
      "error",
      "Browser storage is unavailable. Changes will be lost if this page reloads."
    );
    return false;
  }
  try {
    storage.setItem(key, JSON.stringify(value));
    reportStorageHealth("ok");
    return true;
  } catch (error) {
    console.warn(`Clean30 could not save local data for ${key}.`, error);
    reportStorageHealth(
      "error",
      "Browser storage rejected the latest save. Changes will be lost if this page reloads."
    );
    return false;
  }
}

function hasStoredValue(key) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    return Boolean(storage.getItem(key));
  } catch {
    return false;
  }
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string"))];
}

function uniqueStableId(value, fallback, usedIds) {
  const base = typeof value === "string" && value.trim() ? value.trim() : fallback;
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  usedIds.add(candidate);
  return candidate;
}

const DEFAULT_TASK_TAGS = ["Kitchen", "Bathroom", "Laundry", "Trash", "Floor", "Quick"];
const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const BACKUP_REMINDER_INTERVALS = [0, 14, 30, 60];
const BACKGROUND_OPTIONS = [
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
];
const FONT_SIZE_OPTIONS = ["small", "normal", "large"];
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function cleanTags(value) {
  return uniqueStrings(value)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function normalizeDateString(value) {
  if (typeof value !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value) && !normalizeDateKey(value.slice(0, 10))) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

function normalizeDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return value;
}

function earliestHistoryDate(history) {
  const dates = history
    .map((entry) => normalizeDateString(entry.finishedAt || entry.startedAt))
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b));
  return dates[0] || null;
}

export function hasMeaningfulTodayData(todayTasksByDate) {
  if (!isPlainObject(todayTasksByDate)) return false;
  return Object.values(todayTasksByDate).some(
    (tasks) =>
      Array.isArray(tasks) &&
      tasks.some(
        (task) =>
          isPlainObject(task) &&
          (task.source === "custom" ||
            task.source === "routine" ||
            Boolean(task.completed) ||
            Boolean(typeof task.note === "string" && task.note.trim()) ||
            (Array.isArray(task.tags) &&
              task.tags.some((tag) => typeof tag === "string" && tag.trim())))
      )
  );
}

function earliestMeaningfulTodayDate(todayTasksByDate) {
  if (!isPlainObject(todayTasksByDate)) return null;
  const candidates = [];
  Object.entries(todayTasksByDate).forEach(([dateKey, tasks]) => {
    if (!normalizeDateKey(dateKey) || !Array.isArray(tasks)) return;
    tasks.forEach((task) => {
      if (!hasMeaningfulTodayData({ [dateKey]: [task] })) return;
      const timestamp =
        normalizeDateString(task?.completedAt) ||
        normalizeDateString(task?.createdAt) ||
        normalizeDateString(`${dateKey}T00:00:00`);
      if (timestamp) candidates.push(timestamp);
    });
  });
  return candidates.sort((a, b) => new Date(a) - new Date(b))[0] || null;
}

function hasCustomTemplate(templates) {
  return templates.some((template) => template.id !== "clean30-default" && !template.readOnly);
}

function inferFirstMeaningfulUse(
  value,
  templates,
  history,
  dailyRuleCompletions,
  todayTasksByDate = {}
) {
  const saved = normalizeDateString(value?.firstMeaningfulUseAt);
  if (saved) return saved;
  const historyDate = earliestHistoryDate(history);
  if (historyDate) return historyDate;
  const todayDate = earliestMeaningfulTodayDate(todayTasksByDate);
  if (todayDate) return todayDate;
  const hasDailyRules = Object.values(dailyRuleCompletions).some((ruleIds) => ruleIds.length > 0);
  if (hasDailyRules || hasCustomTemplate(templates)) return new Date().toISOString();
  return null;
}

function normalizeDailyRuleCompletions(value) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([dateKey, ruleIds]) => normalizeDateKey(dateKey) && Array.isArray(ruleIds))
      .map(([dateKey, ruleIds]) => [dateKey, uniqueStrings(ruleIds)])
  );
}

function normalizeDismissedRecommendations(value) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([dateKey, recommendationKeys]) =>
        normalizeDateKey(dateKey) && Array.isArray(recommendationKeys)
      )
      .map(([dateKey, recommendationKeys]) => [dateKey, uniqueStrings(recommendationKeys)])
  );
}

function normalizeDashboardTodos(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((todo) => isPlainObject(todo) && typeof todo.text === "string" && todo.text.trim())
    .map((todo, index) => {
      const createdAt = normalizeDateString(todo.createdAt) || new Date().toISOString();
      const completed = Boolean(todo.completed);
      return {
        id: typeof todo.id === "string" && todo.id
          ? todo.id
          : `dashboard-todo-${createdAt}-${index}`,
        text: todo.text.trim(),
        completed,
        note: typeof todo.note === "string" ? todo.note : "",
        tags: cleanTags(todo.tags),
        createdAt,
        completedAt: completed ? normalizeDateString(todo.completedAt) || createdAt : null
      };
    });
}

function unwrapLegacyTodayDefaultId(value, dateKey) {
  if (typeof value !== "string" || !value) return null;
  const prefixes = [
    `today-default-${dateKey}-`,
    `daily-rule-${dateKey}-`,
    `daily-rules-${dateKey}-`
  ];
  const prefix = prefixes.find((item) => value.startsWith(item));
  return prefix ? value.slice(prefix.length) || null : value;
}

function normalizeTodayTask(value, index, dateKey, templateDefaults = [], completedDefaultIds = []) {
  const saved = isPlainObject(value) ? value : {};
  const textValue =
    typeof saved.text === "string"
      ? saved.text
      : typeof saved.title === "string"
        ? saved.title
        : "";
  if (!textValue.trim()) return null;
  const createdAt = normalizeDateString(saved.createdAt) || `${dateKey}T00:00:00.000Z`;
  const source = ["custom", "default", "routine"].includes(saved.source) ? saved.source : "default";
  const savedDefaultTaskId =
    typeof saved.defaultTaskId === "string"
      ? unwrapLegacyTodayDefaultId(saved.defaultTaskId, dateKey)
      : typeof saved.ruleId === "string"
        ? unwrapLegacyTodayDefaultId(saved.ruleId, dateKey)
        : source === "default" && typeof saved.id === "string"
          ? unwrapLegacyTodayDefaultId(saved.id, dateKey)
          : null;
  const matchingDefault =
    source === "default"
      ? templateDefaults.find((task) => task.id === savedDefaultTaskId) ||
        templateDefaults.find(
          (task) =>
            typeof task.title === "string" &&
            task.title.trim().toLowerCase() === textValue.trim().toLowerCase()
        ) ||
        null
      : null;
  const defaultTaskId =
    source === "default"
      ? matchingDefault?.id || savedDefaultTaskId || `legacy-default-${index + 1}`
      : null;
  const completed =
    Boolean(saved.completed) ||
    (source === "default" && new Set(uniqueStrings(completedDefaultIds)).has(defaultTaskId));

  return {
    id:
      typeof saved.id === "string" && saved.id
        ? saved.id
        : `today-${source}-${dateKey}-${index}`,
    defaultTaskId,
    text: textValue.trim(),
    completed,
    source,
    note: typeof saved.note === "string" ? saved.note : "",
    tags: cleanTags(saved.tags),
    routineId: typeof saved.routineId === "string" ? saved.routineId : null,
    routineName: typeof saved.routineName === "string" ? saved.routineName : "",
    originalTaskId: typeof saved.originalTaskId === "string" ? saved.originalTaskId : null,
    createdAt,
    completedAt: completed ? normalizeDateString(saved.completedAt) || createdAt : null
  };
}

export function buildTodayTasksForDate(existingTasks, template, dateKey, completedDefaultIds = [], appSettings = {}) {
  if (Array.isArray(existingTasks)) {
    const templateDefaults = getTodayDefaultsForDate(template, dateKey);
    const usedIds = new Set();
    return existingTasks
      .map((task, index) =>
        normalizeTodayTask(task, index, dateKey, templateDefaults, completedDefaultIds)
      )
      .filter(Boolean)
      .map((task, index) => ({
        ...task,
        id: uniqueStableId(task.id, `today-task-${dateKey}-${index + 1}`, usedIds)
      }));
  }

  if (appSettings?.startTodayEmpty) return [];

  const completed = new Set(uniqueStrings(completedDefaultIds));
  const defaults = getTodayDefaultsForDate(template, dateKey);
  return defaults.map((task, index) => {
    const isCompleted = completed.has(task.id);
    return {
      id: `today-default-${dateKey}-${task.id || index}`,
      defaultTaskId: task.id || null,
      text: task.title || task.text || `Task ${index + 1}`,
      completed: isCompleted,
      source: "default",
      note: typeof task.note === "string" ? task.note : "",
      tags: cleanTags(task.tags),
      routineId: null,
      routineName: "",
      originalTaskId: null,
      createdAt: `${dateKey}T00:00:00.000Z`,
      completedAt: isCompleted ? `${dateKey}T12:00:00.000Z` : null
    };
  });
}

function normalizeTodayTasksByDate(value, template, dailyRuleCompletions, dashboardTodos, appSettings = {}) {
  const result = {};
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([dateKey, tasks]) => {
      if (normalizeDateKey(dateKey)) {
        result[dateKey] = buildTodayTasksForDate(
          tasks,
          template,
          dateKey,
          dailyRuleCompletions[dateKey] || [],
          appSettings
        );
      }
    });
  }

  const todayKey = getTodayKey();
  const migratedTodoIds = new Set();
  const migratedTodos = normalizeDashboardTodos(dashboardTodos).map((todo, index) => ({
    id: uniqueStableId(todo.id, `today-custom-${todayKey}-${index + 1}`, migratedTodoIds),
    defaultTaskId: null,
    text: todo.text,
    completed: todo.completed,
    source: "custom",
    note: todo.note,
    tags: todo.tags,
    routineId: null,
    routineName: "",
    originalTaskId: null,
    createdAt: todo.createdAt,
    completedAt: todo.completedAt
  }));

  if (!Object.prototype.hasOwnProperty.call(result, todayKey)) {
    const defaults = buildTodayTasksForDate(
      null,
      template,
      todayKey,
      dailyRuleCompletions[todayKey] || [],
      appSettings
    );
    result[todayKey] = [...defaults, ...migratedTodos];
  } else if (result[todayKey].length === 0 && migratedTodos.length > 0) {
    result[todayKey] = migratedTodos;
  }

  return result;
}

function normalizeAppSettings(value) {
  const interval = Number(value?.backupReminderIntervalDays);
  const accentAliases = {
    forest: "green",
    emerald: "green",
    ocean: "cyan",
    indigo: "blue",
    violet: "purple",
    plum: "purple",
    rose: "pink",
    crimson: "red",
    copper: "brown",
    slate: "charcoal",
    gray: "charcoal"
  };
  const backgroundAliases = {
    "soft-blue": "sky-blue",
    sky: "sky-blue",
    "cool-gray": "light-gray",
    "warm-cream": "cream",
    "soft-mint": "mint",
    sage: "green",
    "pale-green": "green",
    lilac: "lavender",
    blush: "pink",
    "pale-yellow": "yellow"
  };
  const rawAccentColor = typeof value?.accentColor === "string" ? value.accentColor : "green";
  const rawBackgroundColor =
    typeof value?.backgroundColor === "string" ? value.backgroundColor : "cream";
  const accentColor = accentAliases[rawAccentColor] || rawAccentColor;
  const backgroundColor = backgroundAliases[rawBackgroundColor] || rawBackgroundColor;
  return {
    backupReminderIntervalDays: BACKUP_REMINDER_INTERVALS.includes(interval) ? interval : 30,
    accentColor: accentOptions.includes(accentColor) ? accentColor : "green",
    backgroundColor: BACKGROUND_OPTIONS.includes(backgroundColor) ? backgroundColor : "cream",
    fontSize: FONT_SIZE_OPTIONS.includes(value?.fontSize)
      ? value.fontSize
      : "normal",
    density: densityOptions.includes(value?.density)
      ? value.density
      : "comfortable",
    startTodayEmpty: Boolean(value?.startTodayEmpty),
    taskTags: cleanTags(value?.taskTags).length ? cleanTags(value.taskTags) : DEFAULT_TASK_TAGS
  };
}

function normalizeHistory(value) {
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

function normalizeOptionalNonNegativeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

function findRoutine(templates, templateId, routineId) {
  const template = templates.find((item) => item.id === templateId);
  return template?.routines?.find((routine) => routine.id === routineId) || null;
}

function getRoutineTaskIds(routine) {
  return (routine?.phases || []).flatMap((phase) =>
    (phase?.tasks || [])
      .map((task) => (typeof task?.id === "string" ? task.id.trim() : ""))
      .filter(Boolean)
  );
}

const CURRENT_ACTIVE_SESSION_FIELDS = [
  "id",
  "routineId",
  "templateId",
  "startedAt",
  "paused",
  "pausedAt",
  "totalPausedMs",
  "completedTaskIds",
  "notes",
  "routineSnapshot"
];

function isSafeSnapshotOnlySession(snapshot, routineId) {
  return (
    routineId !== "daily-rules" &&
    isValidCurrentRoutineBackupShape(snapshot) &&
    snapshot.id.trim() === routineId
  );
}

function normalizeActiveSessionWithReport(
  value,
  templates,
  activeTemplateId,
  { forImport = false, strictIdentity = false } = {}
) {
  const warnings = [];
  if (value === null || value === undefined) {
    return { session: null, warnings };
  }
  if (!isPlainObject(value)) {
    return {
      session: null,
      warnings: ["Active session could not be restored and will be discarded."]
    };
  }
  if (
    strictIdentity &&
    !CURRENT_ACTIVE_SESSION_FIELDS.every((field) => hasOwn(value, field))
  ) {
    return {
      session: null,
      warnings: [
        "Active session is incomplete and could not be restored, so it will be discarded."
      ]
    };
  }
  if (
    strictIdentity &&
    (typeof value.totalPausedMs !== "number" ||
      !Number.isFinite(value.totalPausedMs) ||
      !Array.isArray(value.completedTaskIds) ||
      !value.completedTaskIds.every((id) => typeof id === "string") ||
      typeof value.notes !== "string")
  ) {
    return {
      session: null,
      warnings: [
        "Active session contains invalid saved progress and will be discarded."
      ]
    };
  }
  if (typeof value.routineId !== "string" || !value.routineId.trim()) {
    return {
      session: null,
      warnings: ["Active session could not be restored and will be discarded."]
    };
  }

  const routineId = value.routineId.trim();
  const sessionId =
    typeof value.id === "string" && value.id.trim()
      ? value.id.trim()
      : `session-import-${Date.now()}`;
  if (strictIdentity && !(typeof value.id === "string" && value.id.trim())) {
    return {
      session: null,
      warnings: [
        "Active session has an invalid session ID and could not be restored, so it will be discarded."
      ]
    };
  }
  if (!(typeof value.id === "string" && value.id.trim())) {
    warnings.push("Active session was assigned a missing session ID.");
  }

  const requestedTemplateId =
    typeof value.templateId === "string" ? value.templateId.trim() : "";
  const requestedTemplate = templates.find(
    (template) => template.id === requestedTemplateId
  );
  const requestedRoutine = requestedTemplate?.routines?.find(
    (routine) => routine.id === routineId
  );
  const matchingTemplates = templates.filter((template) =>
    template?.routines?.some((routine) => routine.id === routineId)
  );
  const rawSnapshot = isPlainObject(value.routineSnapshot) ? value.routineSnapshot : null;
  const validSnapshot = rawSnapshot && isValidRoutineBackupShape(rawSnapshot);
  const snapshotRoutineId =
    typeof rawSnapshot?.id === "string" ? rawSnapshot.id.trim() : "";
  const compatibleSnapshot =
    validSnapshot && (!snapshotRoutineId || snapshotRoutineId === routineId);
  let templateId = null;
  let referencedRoutine = null;
  let snapshotSource = null;

  if (strictIdentity) {
    if (value.templateId === null) {
      if (
        matchingTemplates.length > 0 ||
        !isSafeSnapshotOnlySession(rawSnapshot, routineId)
      ) {
        return {
          session: null,
          warnings: [
            "Active session has no valid template and routine match, so it will be discarded."
          ]
        };
      }
      snapshotSource = rawSnapshot;
      warnings.push(
        "Active session template is unavailable; the session will continue from its saved snapshot without a template."
      );
    } else if (!requestedTemplate || !requestedRoutine) {
      return {
        session: null,
        warnings: [
          "Active session template and routine do not match, so the session will be discarded."
        ]
      };
    } else if (
      !isValidCurrentRoutineBackupShape(rawSnapshot) ||
      rawSnapshot.id.trim() !== routineId
    ) {
      return {
        session: null,
        warnings: [
          "Active session routine snapshot does not match its routine and the session will be discarded."
        ]
      };
    } else {
      templateId = requestedTemplate.id;
      referencedRoutine = requestedRoutine;
      snapshotSource = rawSnapshot;
    }
  } else if (requestedRoutine) {
    templateId = requestedTemplate.id;
    referencedRoutine = requestedRoutine;
  } else if (matchingTemplates.length === 1) {
    const inferredRoutine = matchingTemplates[0].routines.find(
      (routine) => routine.id === routineId
    );
    if (compatibleSnapshot || !rawSnapshot) {
      templateId = matchingTemplates[0].id;
      referencedRoutine = inferredRoutine;
      warnings.push(`Active session template inferred as "${templateId}".`);
    }
  } else if (matchingTemplates.length > 1 && forImport) {
    return {
      session: null,
      warnings: [
        "Active session template identity is ambiguous and the session will be discarded."
      ]
    };
  }

  const startedAt =
    normalizeDateString(value.startedAt) || normalizeDateString(value.createdAt);
  if (!startedAt) {
    return {
      session: null,
      warnings: ["Active session has an invalid start time and will be discarded."]
    };
  }
  if (!normalizeDateString(value.startedAt) && normalizeDateString(value.createdAt)) {
    warnings.push("Active session start time was restored from its legacy creation time.");
  }
  const nowMs = Date.now();
  const startedAtMs = new Date(startedAt).getTime();
  if (startedAtMs > nowMs + MAX_CLOCK_SKEW_MS) {
    return {
      session: null,
      warnings: [
        "Active session has a start time too far in the future and will be discarded."
      ]
    };
  }

  const paused = typeof value.paused === "boolean" ? value.paused : false;
  if (strictIdentity && typeof value.paused !== "boolean") {
    return {
      session: null,
      warnings: [
        "Active session has an invalid pause state and will be discarded."
      ]
    };
  }
  if (typeof value.paused !== "boolean") {
    warnings.push("Active session pause state defaulted to running.");
  }
  const pausedAt = paused ? normalizeDateString(value.pausedAt) : null;
  const pausedAtMs = pausedAt ? new Date(pausedAt).getTime() : null;
  if (
    paused &&
    (!pausedAt ||
      pausedAtMs < startedAtMs ||
      pausedAtMs > nowMs + MAX_CLOCK_SKEW_MS)
  ) {
    return {
      session: null,
      warnings: [
        "Paused active session has an invalid or future pause time and will be discarded."
      ]
    };
  }
  if (!paused && value.pausedAt !== null && value.pausedAt !== undefined) {
    warnings.push("Inactive pause time was cleared from the active session.");
  }

  const totalPausedMs =
    value.totalPausedMs === null || value.totalPausedMs === undefined || value.totalPausedMs === ""
      ? 0
      : Number(value.totalPausedMs);
  const maximumPossiblePausedMs =
    (pausedAtMs ?? nowMs + MAX_CLOCK_SKEW_MS) - startedAtMs;
  if (
    !Number.isFinite(totalPausedMs) ||
    totalPausedMs < 0 ||
    totalPausedMs > maximumPossiblePausedMs
  ) {
    return {
      session: null,
      warnings: ["Active session has invalid paused time and will be discarded."]
    };
  }
  if (
    value.totalPausedMs === null ||
    value.totalPausedMs === undefined ||
    value.totalPausedMs === ""
  ) {
    warnings.push("Active session paused time defaulted to zero.");
  }

  if (!strictIdentity) {
    if (templateId) {
      if (compatibleSnapshot) {
        snapshotSource = rawSnapshot;
      } else if (referencedRoutine) {
        snapshotSource = referencedRoutine;
        warnings.push("Active session routine snapshot was restored from its matching routine.");
      }
    } else if (isSafeSnapshotOnlySession(rawSnapshot, routineId)) {
      snapshotSource = rawSnapshot;
      warnings.push(
        "Active session template is unavailable; the saved snapshot was preserved without a template."
      );
    }
  }
  if (!snapshotSource) {
    return {
      session: null,
      warnings: ["Active session routine could not be restored and will be discarded."]
    };
  }

  const routineSnapshot = normalizeRoutine(snapshotSource);
  const validTaskIds = new Set(getRoutineTaskIds(routineSnapshot));
  if (validTaskIds.size === 0 && !referencedRoutine) {
    return {
      session: null,
      warnings: [
        "Active session has no restorable task universe and will be discarded."
      ]
    };
  }
  const requestedCompletedIds = uniqueStrings(value.completedTaskIds);
  const completedTaskIds = requestedCompletedIds.filter((id) => validTaskIds.has(id));
  if (
    value.completedTaskIds !== undefined &&
    !Array.isArray(value.completedTaskIds)
  ) {
    warnings.push("Active session completed tasks defaulted to empty.");
  }
  if (completedTaskIds.length !== requestedCompletedIds.length) {
    warnings.push("Unknown completed task IDs were removed from the active session.");
  }

  return {
    session: {
      id: sessionId,
      routineId,
      templateId,
      startedAt,
      paused,
      pausedAt,
      totalPausedMs,
      completedTaskIds,
      notes: typeof value.notes === "string" ? value.notes : "",
      routineSnapshot
    },
    warnings
  };
}

function normalizeActiveSession(value, templates, activeTemplateId) {
  const result = normalizeActiveSessionWithReport(value, templates, activeTemplateId);
  return result?.session || null;
}

function applyLegacySettings(template, settings) {
  if (!isPlainObject(settings)) return template;
  return normalizeTemplate(
    {
      ...template,
      profile: {
        ...template.profile,
        homeName: settings.displayName || template.profile.homeName,
        apartmentSizeText: settings.apartmentSize || template.profile.apartmentSizeText,
        apartmentTypeText: settings.apartmentType || template.profile.apartmentTypeText,
        goalText: settings.weeklyTarget || template.profile.goalText
      },
      schedule: {
        ...template.schedule,
        weeklyResetDay: settings.weeklyResetDay || template.schedule.weeklyResetDay,
        backupResetDay: settings.backupResetDay || template.schedule.backupResetDay,
        monthlyDeepCleanInterval:
          settings.monthlyDeepCleanInterval || template.schedule.monthlyDeepCleanInterval
      }
    },
    { readOnly: false }
  );
}

function createLegacyState() {
  const defaultTemplate = createDefaultTemplate();
  if (!canUseStorage()) {
    return {
      templates: [defaultTemplate],
      activeTemplateId: defaultTemplate.id,
      history: [],
      activeSession: null,
      dailyRuleCompletions: {},
      todayTasksByDate: {},
      dashboardTodos: [],
      dismissedRecommendations: {},
      appSettings: normalizeAppSettings(),
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      lastFullBackupExportedAt: null,
      firstMeaningfulUseAt: null
    };
  }

  const hasLegacyData =
    hasStoredValue(STORAGE_KEYS.settings) ||
    hasStoredValue(STORAGE_KEYS.dailyRules) ||
    hasStoredValue(STORAGE_KEYS.activeSession) ||
    hasStoredValue(STORAGE_KEYS.history);

  if (!hasLegacyData) {
    return {
      templates: [defaultTemplate],
      activeTemplateId: defaultTemplate.id,
      history: [],
      activeSession: null,
      dailyRuleCompletions: {},
      todayTasksByDate: {},
      dashboardTodos: [],
      dismissedRecommendations: {},
      appSettings: normalizeAppSettings(),
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      lastFullBackupExportedAt: null,
      firstMeaningfulUseAt: null
    };
  }

  const legacySettings = readJson(STORAGE_KEYS.settings, {});
  const customTemplate = applyLegacySettings(
    duplicateTemplate(defaultTemplate, legacySettings?.displayName || "My Cleaning System"),
    legacySettings
  );
  const templates = [defaultTemplate, customTemplate];
  const activeTemplateId = customTemplate.id;
  const history = normalizeHistory(readJson(STORAGE_KEYS.history, []));
  const dailyRuleCompletions = normalizeDailyRuleCompletions(readJson(STORAGE_KEYS.dailyRules, {}));
  const appSettings = normalizeAppSettings();

  return {
    templates,
    activeTemplateId,
    history,
    activeSession: normalizeActiveSession(
      readJson(STORAGE_KEYS.activeSession, null),
      templates,
      activeTemplateId
    ),
    dailyRuleCompletions,
    todayTasksByDate: normalizeTodayTasksByDate({}, customTemplate, dailyRuleCompletions, [], appSettings),
    dashboardTodos: [],
    dismissedRecommendations: {},
    appSettings,
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    lastFullBackupExportedAt: null,
    firstMeaningfulUseAt: inferFirstMeaningfulUse({}, templates, history, dailyRuleCompletions)
  };
}

function normalizeTemplateList(savedTemplates, defaultTemplate) {
  const usedIds = new Set();
  return savedTemplates.map((template, index) => {
    const id = uniqueStableId(template?.id, `template-${index + 1}`, usedIds);
    return normalizeTemplate(
      {
        ...template,
        id
      },
      { readOnly: id === defaultTemplate.id || template?.readOnly }
    );
  });
}

function normalizeMaintenanceTasksByTemplate(value, templates) {
  const saved = isPlainObject(value) ? value : {};
  return Object.fromEntries(
    templates.map((template) => {
      const existing = Array.isArray(saved[template.id])
        ? normalizeMaintenanceTaskList(saved[template.id], template.zones)
        : [];
      const defaults = normalizeMaintenanceTaskList(undefined, template.zones);
      const existingIds = new Set(existing.map((task) => task.id));
      return [
        template.id,
        [...existing, ...defaults.filter((task) => !existingIds.has(task.id))]
      ];
    })
  );
}

function templatesWithMaintenanceTasks(templates, maintenanceTasksByTemplate) {
  return templates.map((template) => ({
    ...template,
    maintenanceTasks: maintenanceTasksByTemplate[template.id] || []
  }));
}

export function normalizeAppState(value) {
  if (!isPlainObject(value)) return normalizeAppState(createLegacyState());

  const defaultTemplate = createDefaultTemplate();
  const savedTemplates = Array.isArray(value.templates) ? value.templates : [];
  const normalizedTemplates = normalizeTemplateList(savedTemplates, defaultTemplate);
  const hasDefault = normalizedTemplates.some((template) => template.id === defaultTemplate.id);
  const templates = hasDefault ? normalizedTemplates : [defaultTemplate, ...normalizedTemplates];
  const firstSavedTemplateId = normalizedTemplates[0]?.id;
  const requestedActiveTemplateId =
    typeof value.activeTemplateId === "string" ? value.activeTemplateId.trim() : "";
  const activeTemplateId = templates.some((template) => template.id === requestedActiveTemplateId)
    ? requestedActiveTemplateId
    : firstSavedTemplateId || templates[0].id;
  const history = normalizeHistory(value.history);
  const dailyRuleCompletions = normalizeDailyRuleCompletions(value.dailyRuleCompletions);
  const activeTemplate = templates.find((template) => template.id === activeTemplateId) || templates[0];
  const appSettings = normalizeAppSettings(value.appSettings);
  const todayTasksByDate = normalizeTodayTasksByDate(
    value.todayTasksByDate,
    activeTemplate,
    dailyRuleCompletions,
    value.dashboardTodos,
    appSettings
  );
  const maintenanceTasksByTemplate = normalizeMaintenanceTasksByTemplate(
    value.maintenanceTasksByTemplate,
    templates
  );
  const maintenanceTemplates = templatesWithMaintenanceTasks(
    templates,
    maintenanceTasksByTemplate
  );
  const maintenanceCompletions = Object.prototype.hasOwnProperty.call(
    value,
    "maintenanceCompletions"
  )
    ? normalizeMaintenanceCompletions(
        value.maintenanceCompletions,
        maintenanceTemplates
      )
    : deriveLegacyMaintenanceCompletions({
        templates: maintenanceTemplates,
        activeTemplateId,
        todayTasksByDate,
        history
      });

  return {
    templates,
    activeTemplateId,
    history,
    activeSession: normalizeActiveSession(value.activeSession, templates, activeTemplateId),
    dailyRuleCompletions,
    todayTasksByDate,
    maintenanceTasksByTemplate,
    maintenanceCompletions,
    dashboardTodos: normalizeDashboardTodos(value.dashboardTodos),
    dismissedRecommendations: normalizeDismissedRecommendations(value.dismissedRecommendations),
    appSettings,
    onboardingCompleted: Boolean(value.onboardingCompleted),
    onboardingCompletedAt: normalizeDateString(value.onboardingCompletedAt),
    lastFullBackupExportedAt: normalizeDateString(value.lastFullBackupExportedAt),
    firstMeaningfulUseAt: inferFirstMeaningfulUse(
      value,
      templates,
      history,
      dailyRuleCompletions,
      todayTasksByDate
    )
  };
}

export function loadAppState() {
  const saved = readJson(STORAGE_KEYS.appState, null);
  const state = saved
    ? normalizeAppState(saved)
    : normalizeAppState(createLegacyState());
  if (canUseStorage() && !hasStoredValue(STORAGE_KEYS.appState)) {
    saveAppState(state);
  }
  return state;
}

export function saveAppState(state) {
  writeJson(STORAGE_KEYS.appState, normalizeAppState(state));
}

export function createFullBackup(state) {
  return {
    app: "Clean30",
    type: "full-backup",
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: normalizeAppState(state)
  };
}

export function prepareImportedAppState(state) {
  return {
    ...state,
    lastFullBackupExportedAt: null
  };
}

function isValidTaskBackupShape(task) {
  return (
    isPlainObject(task) &&
    ((typeof task.title === "string" && Boolean(task.title.trim())) ||
      (typeof task.text === "string" && Boolean(task.text.trim())))
  );
}

function isValidPhaseBackupShape(phase) {
  return (
    isPlainObject(phase) &&
    typeof phase.title === "string" &&
    Array.isArray(phase.tasks) &&
    phase.tasks.every(isValidTaskBackupShape)
  );
}

function isValidRoutineBackupShape(routine) {
  return (
    isPlainObject(routine) &&
    typeof routine.title === "string" &&
    Array.isArray(routine.phases) &&
    routine.phases.every(isValidPhaseBackupShape)
  );
}

function isValidTemplateBackupShape(template) {
  const todayDefaults = Array.isArray(template?.todayDefaults)
    ? template.todayDefaults
    : template?.dailyRules;
  const weekdayDefaults = isPlainObject(template?.todayWeekdayDefaults)
    ? Object.values(template.todayWeekdayDefaults)
    : [];
  return (
    isPlainObject(template) &&
    typeof template.id === "string" &&
    Boolean(template.id.trim()) &&
    isPlainObject(template.profile) &&
    Array.isArray(template.routines) &&
    template.routines.every(isValidRoutineBackupShape) &&
    Array.isArray(todayDefaults) &&
    todayDefaults.every(isValidTaskBackupShape) &&
    weekdayDefaults.every(
      (tasks) =>
        tasks === null ||
        (Array.isArray(tasks) && tasks.every(isValidTaskBackupShape))
    )
  );
}

function hasOwnFields(object, fields) {
  return isPlainObject(object) && fields.every((field) => hasOwn(object, field));
}

function isNonEmptyString(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function isCanonicalTagArray(value, { allowEmpty = true } = {}) {
  return (
    Array.isArray(value) &&
    (allowEmpty || value.length > 0) &&
    value.length <= 24 &&
    value.every(
      (tag) =>
        typeof tag === "string" &&
        Boolean(tag.trim()) &&
        tag === tag.trim()
    )
  );
}

const CURRENT_TASK_FIELDS = [
  "id",
  "title",
  "duration",
  "detail",
  "note",
  "tags",
  "priority"
];

function isValidCurrentTaskBackupShape(task) {
  return (
    hasOwnFields(task, CURRENT_TASK_FIELDS) &&
    isNonEmptyString(task.id) &&
    isNonEmptyString(task.title) &&
    typeof task.duration === "string" &&
    typeof task.detail === "string" &&
    typeof task.note === "string" &&
    isCanonicalTagArray(task.tags) &&
    priorityOptions.includes(task.priority)
  );
}

const CURRENT_PHASE_FIELDS = ["id", "title", "tasks"];

function isValidCurrentPhaseBackupShape(phase) {
  return (
    hasOwnFields(phase, CURRENT_PHASE_FIELDS) &&
    isNonEmptyString(phase.id) &&
    isNonEmptyString(phase.title) &&
    Array.isArray(phase.tasks) &&
    phase.tasks.every(isValidCurrentTaskBackupShape)
  );
}

const CURRENT_ROUTINE_FIELDS = [
  "id",
  "title",
  "estimatedTime",
  "estimatedMinutes",
  "archived",
  "colorLabel",
  "purpose",
  "whenToUse",
  "message",
  "phases"
];

function isValidCurrentRoutineBackupShape(routine) {
  return (
    hasOwnFields(routine, CURRENT_ROUTINE_FIELDS) &&
    isNonEmptyString(routine.id) &&
    isNonEmptyString(routine.title) &&
    isNonEmptyString(routine.estimatedTime) &&
    typeof routine.estimatedMinutes === "number" &&
    Number.isInteger(routine.estimatedMinutes) &&
    routine.estimatedMinutes >= 1 &&
    routine.estimatedMinutes <= 600 &&
    typeof routine.archived === "boolean" &&
    routineColorOptions.includes(routine.colorLabel) &&
    typeof routine.purpose === "string" &&
    typeof routine.whenToUse === "string" &&
    typeof routine.message === "string" &&
    Array.isArray(routine.phases) &&
    routine.phases.every(isValidCurrentPhaseBackupShape)
  );
}

const CURRENT_SYSTEM_FIELDS = [
  "apartmentLaws",
  "bottlenecks",
  "priorityOrder",
  "systemSections"
];
const CURRENT_SYSTEM_SECTION_FIELDS = [
  "id",
  "title",
  "problem",
  "items",
  "secondaryTitle",
  "secondaryItems"
];

function isValidCurrentSystemsBackupShape(systems) {
  return (
    hasOwnFields(systems, CURRENT_SYSTEM_FIELDS) &&
    isValidStringArray(systems.apartmentLaws) &&
    Array.isArray(systems.bottlenecks) &&
    systems.bottlenecks.every(
      (item) =>
        hasOwnFields(item, ["problem", "consequence"]) &&
        typeof item.problem === "string" &&
        typeof item.consequence === "string"
    ) &&
    Array.isArray(systems.priorityOrder) &&
    systems.priorityOrder.every(
      (item) =>
        hasOwnFields(item, ["title", "detail"]) &&
        typeof item.title === "string" &&
        typeof item.detail === "string"
    ) &&
    Array.isArray(systems.systemSections) &&
    systems.systemSections.every(
      (section) =>
        hasOwnFields(section, CURRENT_SYSTEM_SECTION_FIELDS) &&
        isNonEmptyString(section.id) &&
        isNonEmptyString(section.title) &&
        typeof section.problem === "string" &&
        isValidStringArray(section.items) &&
        typeof section.secondaryTitle === "string" &&
        isValidStringArray(section.secondaryItems)
    )
  );
}

const CURRENT_TEMPLATE_FIELDS = [
  "id",
  "name",
  "readOnly",
  "profile",
  "zones",
  "todayDefaults",
  "todayWeekdayDefaultsEnabled",
  "todayWeekdayDefaultsExplicit",
  "todayWeekdayDefaults",
  "dailyRules",
  "routines",
  "systems",
  "schedule",
  "appearance"
];

function isValidCurrentTemplateBackupShape(template) {
  const profileFields = [
    "appDisplayName",
    "homeName",
    "apartmentSizeText",
    "apartmentTypeText",
    "goalText"
  ];
  const scheduleFields = [
    "weeklyResetDay",
    "backupResetDay",
    "monthlyDeepCleanInterval",
    "weeklyResetDueAfterDays",
    "minimalResetFallbackLabel"
  ];
  return (
    hasOwnFields(template, CURRENT_TEMPLATE_FIELDS) &&
    isNonEmptyString(template.id) &&
    isNonEmptyString(template.name) &&
    typeof template.readOnly === "boolean" &&
    hasOwnFields(template.profile, profileFields) &&
    profileFields.every((field) => typeof template.profile[field] === "string") &&
    Array.isArray(template.zones) &&
    template.zones.every(
      (zone) =>
        hasOwnFields(zone, ["id", "name"]) &&
        isNonEmptyString(zone.id) &&
        isNonEmptyString(zone.name)
    ) &&
    Array.isArray(template.todayDefaults) &&
    template.todayDefaults.every(isValidCurrentTaskBackupShape) &&
    typeof template.todayWeekdayDefaultsEnabled === "boolean" &&
    template.todayWeekdayDefaultsExplicit === true &&
    hasOwnFields(template.todayWeekdayDefaults, WEEKDAY_KEYS) &&
    WEEKDAY_KEYS.every(
      (day) =>
        template.todayWeekdayDefaults[day] === null ||
        (Array.isArray(template.todayWeekdayDefaults[day]) &&
          template.todayWeekdayDefaults[day].every(isValidCurrentTaskBackupShape))
    ) &&
    Array.isArray(template.dailyRules) &&
    template.dailyRules.every(isValidCurrentTaskBackupShape) &&
    Array.isArray(template.routines) &&
    template.routines.every(isValidCurrentRoutineBackupShape) &&
    isValidCurrentSystemsBackupShape(template.systems) &&
    hasOwnFields(template.schedule, scheduleFields) &&
    typeof template.schedule.weeklyResetDay === "string" &&
    typeof template.schedule.backupResetDay === "string" &&
    typeof template.schedule.monthlyDeepCleanInterval === "number" &&
    Number.isFinite(template.schedule.monthlyDeepCleanInterval) &&
    template.schedule.monthlyDeepCleanInterval >= 14 &&
    template.schedule.monthlyDeepCleanInterval <= 90 &&
    typeof template.schedule.weeklyResetDueAfterDays === "number" &&
    Number.isFinite(template.schedule.weeklyResetDueAfterDays) &&
    template.schedule.weeklyResetDueAfterDays >= 1 &&
    template.schedule.weeklyResetDueAfterDays <= 30 &&
    typeof template.schedule.minimalResetFallbackLabel === "string" &&
    hasOwnFields(template.appearance, ["accentColor", "density"]) &&
    accentOptions.includes(template.appearance.accentColor) &&
    densityOptions.includes(template.appearance.density)
  );
}

function isValidHistoryBackupEntry(entry) {
  return (
    isPlainObject(entry) &&
    typeof entry.id === "string" &&
    Boolean(entry.id.trim()) &&
    typeof entry.routineId === "string" &&
    Boolean(entry.routineId.trim()) &&
    typeof entry.routineTitle === "string" &&
    Boolean(normalizeDateString(entry.startedAt)) &&
    Boolean(normalizeDateString(entry.finishedAt))
  );
}

const CURRENT_HISTORY_FIELDS = [
  "id",
  "routineId",
  "routineTitle",
  "startedAt",
  "finishedAt",
  "completedTasks",
  "totalTasks",
  "percent",
  "notes",
  "templateId",
  "templateName",
  "kind",
  "source",
  "date",
  "completedAt",
  "elapsedMs",
  "elapsedMinutes",
  "estimatedDurationMinutes"
];
const TODAY_HISTORY_TYPES = ["today", "daily-rules"];

function isValidNullableNonNegativeNumber(value) {
  return (
    value === null ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0)
  );
}

function isValidCurrentHistoryBackupEntry(entry) {
  if (!hasOwnFields(entry, CURRENT_HISTORY_FIELDS)) return false;
  if (
    !isNonEmptyString(entry.id) ||
    !isNonEmptyString(entry.routineId) ||
    !isNonEmptyString(entry.routineTitle) ||
    !normalizeDateString(entry.startedAt) ||
    !normalizeDateString(entry.finishedAt)
  ) {
    return false;
  }

  const startedAtMs = new Date(entry.startedAt).getTime();
  const finishedAtMs = new Date(entry.finishedAt).getTime();
  if (finishedAtMs < startedAtMs) return false;
  const latestAllowedMs = Date.now() + MAX_CLOCK_SKEW_MS;
  if (startedAtMs > latestAllowedMs || finishedAtMs > latestAllowedMs) return false;

  if (
    typeof entry.completedTasks !== "number" ||
    !Number.isInteger(entry.completedTasks) ||
    entry.completedTasks < 0 ||
    typeof entry.totalTasks !== "number" ||
    !Number.isInteger(entry.totalTasks) ||
    entry.totalTasks < 0 ||
    entry.completedTasks > entry.totalTasks ||
    typeof entry.percent !== "number" ||
    !Number.isFinite(entry.percent) ||
    entry.percent < 0 ||
    entry.percent > 100
  ) {
    return false;
  }

  if (
    typeof entry.notes !== "string" ||
    !(entry.templateId === null || isNonEmptyString(entry.templateId)) ||
    typeof entry.templateName !== "string" ||
    !["session", ...TODAY_HISTORY_TYPES].includes(entry.kind) ||
    !["session", ...TODAY_HISTORY_TYPES].includes(entry.source) ||
    !isValidNullableNonNegativeNumber(entry.elapsedMs) ||
    !isValidNullableNonNegativeNumber(entry.elapsedMinutes) ||
    !isValidNullableNonNegativeNumber(entry.estimatedDurationMinutes)
  ) {
    return false;
  }

  const isTodayEntry =
    TODAY_HISTORY_TYPES.includes(entry.kind) ||
    TODAY_HISTORY_TYPES.includes(entry.source);
  if (isTodayEntry) {
    return (
      (entry.date === null || Boolean(normalizeDateKey(entry.date))) &&
      (entry.completedAt === null ||
        (Boolean(normalizeDateString(entry.completedAt)) &&
          new Date(entry.completedAt).getTime() <= latestAllowedMs))
    );
  }

  return (
    entry.kind === "session" &&
    entry.source === "session" &&
    entry.date === null &&
    entry.completedAt === null
  );
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isValidNullableDate(value) {
  return value === null || Boolean(normalizeDateString(value));
}

function isValidStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidDateKeyMap(value) {
  return (
    isPlainObject(value) &&
    Object.entries(value).every(
      ([dateKey, items]) => Boolean(normalizeDateKey(dateKey)) && isValidStringArray(items)
    )
  );
}

function isValidTodayTaskBackupShape(task) {
  return (
    hasOwnFields(task, [
      "id",
      "defaultTaskId",
      "text",
      "completed",
      "source",
      "note",
      "tags",
      "routineId",
      "routineName",
      "originalTaskId",
      "createdAt",
      "completedAt"
    ]) &&
    isNonEmptyString(task.id) &&
    isNonEmptyString(task.text) &&
    typeof task.completed === "boolean" &&
    ["custom", "default", "routine"].includes(task.source) &&
    typeof task.note === "string" &&
    isCanonicalTagArray(task.tags) &&
    (task.defaultTaskId === null || isNonEmptyString(task.defaultTaskId)) &&
    (task.routineId === null || isNonEmptyString(task.routineId)) &&
    typeof task.routineName === "string" &&
    (task.originalTaskId === null || isNonEmptyString(task.originalTaskId)) &&
    Boolean(normalizeDateString(task.createdAt)) &&
    (task.completed
      ? Boolean(normalizeDateString(task.completedAt))
      : task.completedAt === null) &&
    (task.source !== "default" || isNonEmptyString(task.defaultTaskId)) &&
    (task.source !== "routine" ||
      (isNonEmptyString(task.routineId) &&
        isNonEmptyString(task.routineName) &&
        isNonEmptyString(task.originalTaskId)))
  );
}

function isValidTodayTasksByDate(value) {
  return (
    isPlainObject(value) &&
    Object.entries(value).every(
      ([dateKey, tasks]) =>
        Boolean(normalizeDateKey(dateKey)) &&
        Array.isArray(tasks) &&
        tasks.every(isValidTodayTaskBackupShape) &&
        !containsDuplicateIds(tasks)
    )
  );
}

function isValidDashboardTodoBackupShape(todo) {
  return (
    hasOwnFields(todo, [
      "id",
      "text",
      "completed",
      "note",
      "tags",
      "createdAt",
      "completedAt"
    ]) &&
    isNonEmptyString(todo.id) &&
    isNonEmptyString(todo.text) &&
    typeof todo.completed === "boolean" &&
    typeof todo.note === "string" &&
    isCanonicalTagArray(todo.tags) &&
    Boolean(normalizeDateString(todo.createdAt)) &&
    (todo.completed
      ? Boolean(normalizeDateString(todo.completedAt))
      : todo.completedAt === null)
  );
}

function isValidAppSettingsBackupShape(settings) {
  return (
    hasOwnFields(settings, [
      "backupReminderIntervalDays",
      "accentColor",
      "backgroundColor",
      "fontSize",
      "density",
      "startTodayEmpty",
      "taskTags"
    ]) &&
    typeof settings.backupReminderIntervalDays === "number" &&
    BACKUP_REMINDER_INTERVALS.includes(settings.backupReminderIntervalDays) &&
    accentOptions.includes(settings.accentColor) &&
    BACKGROUND_OPTIONS.includes(settings.backgroundColor) &&
    FONT_SIZE_OPTIONS.includes(settings.fontSize) &&
    densityOptions.includes(settings.density) &&
    typeof settings.startTodayEmpty === "boolean" &&
    isCanonicalTagArray(settings.taskTags, { allowEmpty: false })
  );
}

const CURRENT_MAINTENANCE_TASK_FIELDS = [
  "id",
  "catalogId",
  "title",
  "room",
  "estimatedMinutes",
  "stage",
  "frequencyMode",
  "intervalDays",
  "weekdays",
  "effort",
  "enabled",
  "source"
];

function isValidMaintenanceTaskBackupShape(task) {
  return (
    hasOwnFields(task, CURRENT_MAINTENANCE_TASK_FIELDS) &&
    isNonEmptyString(task.id) &&
    (task.catalogId === null || isNonEmptyString(task.catalogId)) &&
    isNonEmptyString(task.title) &&
    isNonEmptyString(task.room) &&
    typeof task.estimatedMinutes === "number" &&
    Number.isInteger(task.estimatedMinutes) &&
    task.estimatedMinutes >= 1 &&
    task.estimatedMinutes <= 240 &&
    typeof task.stage === "number" &&
    Number.isInteger(task.stage) &&
    task.stage >= 0 &&
    task.stage <= 100 &&
    MAINTENANCE_FREQUENCY_MODES.includes(task.frequencyMode) &&
    (task.frequencyMode === "on-demand"
      ? task.intervalDays === null
      : typeof task.intervalDays === "number" &&
        Number.isInteger(task.intervalDays) &&
        task.intervalDays >= 1 &&
        task.intervalDays <= 3650) &&
    Array.isArray(task.weekdays) &&
    task.weekdays.every((day) => WEEKDAY_KEYS.includes(day)) &&
    (task.frequencyMode !== "weekdays" || task.weekdays.length > 0) &&
    MAINTENANCE_EFFORTS.includes(task.effort) &&
    typeof task.enabled === "boolean" &&
    ["catalog", "custom"].includes(task.source)
  );
}

function isValidMaintenanceTasksByTemplate(value, templates) {
  if (!isPlainObject(value)) return false;
  const templateIds = templates.map((template) => template.id);
  const keys = Object.keys(value);
  if (
    keys.length !== templateIds.length ||
    !keys.every((key) => templateIds.includes(key))
  ) {
    return false;
  }
  return templateIds.every(
    (templateId) =>
      Array.isArray(value[templateId]) &&
      value[templateId].every(isValidMaintenanceTaskBackupShape) &&
      !containsDuplicateIds(value[templateId])
  );
}

const CURRENT_MAINTENANCE_COMPLETION_FIELDS = [
  "id",
  "templateId",
  "taskId",
  "completedAt",
  "source",
  "sourceId"
];

function isValidMaintenanceCompletions(value, maintenanceTasksByTemplate) {
  if (!Array.isArray(value) || containsDuplicateIds(value)) return false;
  return value.every((entry) => {
    if (
      !hasOwnFields(entry, CURRENT_MAINTENANCE_COMPLETION_FIELDS) ||
      !isNonEmptyString(entry.id) ||
      !isNonEmptyString(entry.templateId) ||
      !isNonEmptyString(entry.taskId) ||
      !normalizeDateString(entry.completedAt) ||
      new Date(entry.completedAt).getTime() > Date.now() + MAX_CLOCK_SKEW_MS ||
      !MAINTENANCE_COMPLETION_SOURCES.includes(entry.source) ||
      !(entry.sourceId === null || isNonEmptyString(entry.sourceId))
    ) {
      return false;
    }
    return Boolean(
      maintenanceTasksByTemplate[entry.templateId]?.some(
        (task) => task.id === entry.taskId
      )
    );
  });
}

const CURRENT_STATE_FIELDS = [
  "templates",
  "activeTemplateId",
  "history",
  "activeSession",
  "dailyRuleCompletions",
  "todayTasksByDate",
  "maintenanceTasksByTemplate",
  "maintenanceCompletions",
  "dashboardTodos",
  "dismissedRecommendations",
  "appSettings",
  "onboardingCompleted",
  "onboardingCompletedAt",
  "lastFullBackupExportedAt",
  "firstMeaningfulUseAt"
];

function validateCurrentStateShape(data) {
  if (!isPlainObject(data)) {
    return "Backup must contain a data object.";
  }

  const missingFields = CURRENT_STATE_FIELDS.filter((field) => !hasOwn(data, field));
  if (missingFields.length) {
    return `Current backup is incomplete. Missing: ${missingFields.join(", ")}.`;
  }
  if (!Array.isArray(data.templates) || data.templates.length === 0) {
    return "Current backup contains no templates and cannot replace current data.";
  }
  if (!data.templates.every(isValidCurrentTemplateBackupShape)) {
    return "Current backup contains an invalid or incomplete template.";
  }
  if (backupHasMissingNestedIds(data) || backupHasDuplicateIds(data)) {
    return "Current backup contains missing or duplicate template, routine, phase, task, or history IDs.";
  }
  const validTemplateIds = data.templates.map((template) => template.id.trim());
  if (!validTemplateIds.includes("clean30-default")) {
    return "Current backup is incomplete because the Clean30 starter template is missing.";
  }
  if (
    typeof data.activeTemplateId !== "string" ||
    !validTemplateIds.includes(data.activeTemplateId.trim())
  ) {
    return "Current backup has an invalid active template.";
  }
  if (
    !Array.isArray(data.history) ||
    !data.history.every(isValidCurrentHistoryBackupEntry)
  ) {
    return "Current backup contains invalid or incomplete History data.";
  }
  if (data.activeSession !== null && !isPlainObject(data.activeSession)) {
    return "Current backup has an invalid active session value.";
  }
  if (!isValidDateKeyMap(data.dailyRuleCompletions)) {
    return "Current backup contains invalid Today completion data.";
  }
  if (!isValidTodayTasksByDate(data.todayTasksByDate)) {
    return "Current backup contains invalid or incomplete Today task data.";
  }
  if (
    !isValidMaintenanceTasksByTemplate(
      data.maintenanceTasksByTemplate,
      data.templates
    )
  ) {
    return "Current backup contains invalid or incomplete cleaning-task configuration.";
  }
  if (
    !isValidMaintenanceCompletions(
      data.maintenanceCompletions,
      data.maintenanceTasksByTemplate
    )
  ) {
    return "Current backup contains invalid cleaning-task completion history.";
  }
  if (
    !Array.isArray(data.dashboardTodos) ||
    !data.dashboardTodos.every(isValidDashboardTodoBackupShape) ||
    containsDuplicateIds(data.dashboardTodos)
  ) {
    return "Current backup contains invalid legacy dashboard task data.";
  }
  if (!isValidDateKeyMap(data.dismissedRecommendations)) {
    return "Current backup contains invalid dismissed recommendation data.";
  }
  if (!isValidAppSettingsBackupShape(data.appSettings)) {
    return "Current backup contains invalid or incomplete app settings.";
  }
  if (typeof data.onboardingCompleted !== "boolean") {
    return "Current backup contains invalid onboarding state.";
  }
  if (
    !isValidNullableDate(data.onboardingCompletedAt) ||
    !isValidNullableDate(data.lastFullBackupExportedAt) ||
    !isValidNullableDate(data.firstMeaningfulUseAt)
  ) {
    return "Current backup contains an invalid saved timestamp.";
  }
  return null;
}

function containsDuplicateIds(items) {
  if (!Array.isArray(items)) return false;
  const ids = items
    .map((item) => (typeof item?.id === "string" ? item.id.trim() : ""))
    .filter(Boolean);
  return new Set(ids).size !== ids.length;
}

function containsMissingIds(items) {
  return (
    Array.isArray(items) &&
    items.some((item) => typeof item?.id !== "string" || !item.id.trim())
  );
}

function backupHasMissingNestedIds(data) {
  return data.templates.some((template) => {
    const todayDefaults = Array.isArray(template.todayDefaults)
      ? template.todayDefaults
      : template.dailyRules;
    if (containsMissingIds(todayDefaults) || containsMissingIds(template.routines)) return true;
    if (
      Object.values(
        isPlainObject(template.todayWeekdayDefaults) ? template.todayWeekdayDefaults : {}
      ).some((tasks) => containsMissingIds(tasks))
    ) {
      return true;
    }
    return template.routines.some(
      (routine) =>
        containsMissingIds(routine?.phases) ||
        (Array.isArray(routine?.phases) &&
          routine.phases.some((phase) => containsMissingIds(phase?.tasks)))
    );
  });
}

function backupHasDuplicateIds(data) {
  if (containsDuplicateIds(data.templates) || containsDuplicateIds(data.history)) return true;
  return data.templates.some((template) => {
    const todayDefaults = Array.isArray(template.todayDefaults)
      ? template.todayDefaults
      : template.dailyRules;
    if (containsDuplicateIds(todayDefaults) || containsDuplicateIds(template.routines)) return true;
    if (
      Object.values(
        isPlainObject(template.todayWeekdayDefaults) ? template.todayWeekdayDefaults : {}
      ).some((tasks) => containsDuplicateIds(tasks))
    ) {
      return true;
    }
    return template.routines.some(
      (routine) =>
        containsDuplicateIds(routine?.phases) ||
        (Array.isArray(routine?.phases) &&
          (routine.phases.some((phase) => containsDuplicateIds(phase?.tasks)) ||
            containsDuplicateIds(routine.phases.flatMap((phase) => phase?.tasks || []))))
    );
  });
}

function parseEmergencyValue(value, fallback) {
  if (value === null || value === undefined || value === "") return { ok: true, value: fallback };
  if (typeof value !== "string") return { ok: false };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
}

function upgradeEmergencyBackup(payload) {
  const emergencyKeys = [
    "clean30_appState",
    "clean30_settings",
    "clean30_dailyRules",
    "clean30_activeSession",
    "clean30_history"
  ];
  if (!emergencyKeys.some((key) => Object.prototype.hasOwnProperty.call(payload, key))) {
    return null;
  }

  const appState = parseEmergencyValue(payload.clean30_appState, null);
  if (!appState.ok) {
    return { ok: false, error: "Emergency backup contains an unreadable app state." };
  }
  if (
    isPlainObject(appState.value) &&
    Array.isArray(appState.value.templates) &&
    appState.value.templates.length > 0
  ) {
    return {
      ok: true,
      data: appState.value,
      warnings: ["Emergency localStorage backup upgraded before import."]
    };
  }

  const settings = parseEmergencyValue(payload.clean30_settings, {});
  const dailyRules = parseEmergencyValue(payload.clean30_dailyRules, {});
  const activeSession = parseEmergencyValue(payload.clean30_activeSession, null);
  const history = parseEmergencyValue(payload.clean30_history, []);
  if (![settings, dailyRules, activeSession, history].every((result) => result.ok)) {
    return { ok: false, error: "Emergency backup contains unreadable legacy data." };
  }

  const hasLegacyData =
    (isPlainObject(settings.value) && Object.keys(settings.value).length > 0) ||
    (isPlainObject(dailyRules.value) && Object.keys(dailyRules.value).length > 0) ||
    isPlainObject(activeSession.value) ||
    (Array.isArray(history.value) && history.value.length > 0);
  if (!hasLegacyData) {
    return { ok: false, error: "Emergency backup does not contain recoverable Clean30 data." };
  }

  const defaultTemplate = createDefaultTemplate();
  const customTemplate = applyLegacySettings(
    duplicateTemplate(defaultTemplate, settings.value?.displayName || "My Cleaning System"),
    settings.value
  );
  const templates = [defaultTemplate, customTemplate];
  const activeTemplateId = customTemplate.id;
  const normalizedHistory = normalizeHistory(history.value);
  const dailyRuleCompletions = normalizeDailyRuleCompletions(dailyRules.value);
  const appSettings = normalizeAppSettings();

  return {
    ok: true,
    data: {
      templates,
      activeTemplateId,
      history: normalizedHistory,
      activeSession: normalizeActiveSession(activeSession.value, templates, activeTemplateId),
      dailyRuleCompletions,
      todayTasksByDate: normalizeTodayTasksByDate(
        {},
        customTemplate,
        dailyRuleCompletions,
        [],
        appSettings
      ),
      dashboardTodos: [],
      dismissedRecommendations: {},
      appSettings,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      lastFullBackupExportedAt: null,
      firstMeaningfulUseAt: inferFirstMeaningfulUse(
        {},
        templates,
        normalizedHistory,
        dailyRuleCompletions
      )
    },
    warnings: ["Legacy localStorage data upgraded before import."]
  };
}

export function validateFullBackupPayload(payload) {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Backup must be a Clean30 JSON object." };
  }

  const emergency = upgradeEmergencyBackup(payload);
  if (emergency && !emergency.ok) return emergency;

  const isCurrentTypedBackup =
    payload.app === "Clean30" &&
    payload.type === "full-backup" &&
    payload.version === CURRENT_BACKUP_VERSION;

  if (isCurrentTypedBackup) {
    if (!hasOwn(payload, "exportedAt") || !normalizeDateString(payload.exportedAt)) {
      return {
        ok: false,
        error: "Current backup contains invalid or incomplete export metadata."
      };
    }
    const shapeError = validateCurrentStateShape(payload.data);
    if (shapeError) return { ok: false, error: shapeError };
    const normalized = normalizeAppState(payload.data);
    const activeSessionResult = normalizeActiveSessionWithReport(
      payload.data.activeSession,
      normalized.templates,
      normalized.activeTemplateId,
      { forImport: true, strictIdentity: true }
    );
    return {
      ok: true,
      data: {
        ...normalized,
        activeSession: activeSessionResult.session
      },
      warnings: activeSessionResult.warnings
    };
  }

  if (payload.app !== undefined && payload.app !== "Clean30") {
    return { ok: false, error: "This JSON file is not a Clean30 backup." };
  }
  if (
    payload.type !== undefined &&
    !["full-backup", "emergency-localStorage-backup"].includes(payload.type)
  ) {
    return { ok: false, error: "This Clean30 JSON file is not a full backup." };
  }
  if (
    payload.type === "full-backup" &&
    Number(payload.version) > CURRENT_BACKUP_VERSION
  ) {
    return { ok: false, error: "This backup was created by a newer Clean30 version." };
  }
  if (
    payload.type === "full-backup" &&
    payload.version === CURRENT_BACKUP_VERSION
  ) {
    return {
      ok: false,
      error: "Current backup is incomplete or invalid and current data was not changed."
    };
  }

  const isOlderTypedBackup =
    payload.app === "Clean30" &&
    payload.type === "full-backup" &&
    Number.isInteger(Number(payload.version)) &&
    Number(payload.version) > 0 &&
    Number(payload.version) < CURRENT_BACKUP_VERSION;
  const isLegacyRawState =
    payload.app === undefined &&
    payload.type === undefined &&
    payload.version === undefined &&
    payload.data === undefined &&
    Array.isArray(payload.templates) &&
    payload.templates.length > 0 &&
    typeof payload.activeTemplateId === "string";

  if (!emergency && !isOlderTypedBackup && !isLegacyRawState) {
    return {
      ok: false,
      error: "Backup format is not a recognized Clean30 full backup."
    };
  }

  const data = emergency?.data || (isOlderTypedBackup ? payload.data : payload);
  const warnings = [
    ...(emergency?.warnings || []),
    ...(isOlderTypedBackup ? ["Older Clean30 backup upgraded before import."] : []),
    ...(isLegacyRawState ? ["Legacy Clean30 app state upgraded before import."] : [])
  ];
  if (!isPlainObject(data)) {
    return { ok: false, error: "Legacy backup must contain a data object." };
  }
  if (
    !Array.isArray(data.templates) ||
    data.templates.length === 0 ||
    !data.templates.every(isValidTemplateBackupShape)
  ) {
    return { ok: false, error: "Legacy backup contains no usable templates." };
  }

  if (backupHasDuplicateIds(data)) {
    warnings.push("Duplicate IDs repaired deterministically.");
  }
  if (backupHasMissingNestedIds(data)) {
    warnings.push("Missing nested IDs repaired deterministically.");
  }
  if (!data.templates.some((template) => template.id === "clean30-default")) {
    warnings.push("Clean30 starter template restored.");
  }
  const invalidHistoryCount = Array.isArray(data.history)
    ? data.history.filter((entry) => !isValidHistoryBackupEntry(entry)).length
    : 0;
  if (invalidHistoryCount) {
    warnings.push(
      `${invalidHistoryCount} invalid history ${invalidHistoryCount === 1 ? "entry was" : "entries were"} ignored.`
    );
  }

  const normalized = normalizeAppState(data);
  const activeSessionResult = normalizeActiveSessionWithReport(
    data.activeSession,
    normalized.templates,
    normalized.activeTemplateId,
    { forImport: true }
  );
  return {
    ok: true,
    data: {
      ...normalized,
      activeSession: activeSessionResult.session
    },
    warnings: [...warnings, ...activeSessionResult.warnings]
  };
}

export function resetToFreshState() {
  const defaultTemplate = createDefaultTemplate();
  return {
    templates: [defaultTemplate],
    activeTemplateId: defaultTemplate.id,
    history: [],
    activeSession: null,
    dailyRuleCompletions: {},
    todayTasksByDate: {},
    maintenanceTasksByTemplate: {
      [defaultTemplate.id]: normalizeMaintenanceTaskList(
        undefined,
        defaultTemplate.zones
      )
    },
    maintenanceCompletions: [],
    dashboardTodos: [],
    dismissedRecommendations: {},
    appSettings: normalizeAppSettings(),
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    lastFullBackupExportedAt: null,
    firstMeaningfulUseAt: null
  };
}
