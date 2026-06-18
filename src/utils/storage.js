import { getTodayKey } from "./dates.js";
import { createDefaultTemplate, duplicateTemplate, normalizeRoutine, normalizeTemplate } from "./templateUtils.js";

export const STORAGE_KEYS = {
  appState: "clean30_appState",
  settings: "clean30_settings",
  dailyRules: "clean30_dailyRules",
  activeSession: "clean30_activeSession",
  history: "clean30_history"
};

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
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Clean30 could not save local data for ${key}.`, error);
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

function cleanTags(value) {
  return uniqueStrings(value)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function getWeekdayKey(dateKey) {
  const parsed = new Date(`${dateKey}T00:00:00`);
  return WEEKDAY_KEYS[Number.isNaN(parsed.getTime()) ? 0 : parsed.getDay()];
}

function getTemplateTodayDefaults(template, dateKey) {
  if (template?.todayWeekdayDefaultsEnabled) {
    const weekdayTasks = template?.todayWeekdayDefaults?.[getWeekdayKey(dateKey)];
    if (Array.isArray(weekdayTasks) && weekdayTasks.length) return weekdayTasks;
  }
  return template?.todayDefaults || template?.dailyRules || [];
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

function hasCustomTemplate(templates) {
  return templates.some((template) => template.id !== "clean30-default" && !template.readOnly);
}

function inferFirstMeaningfulUse(value, templates, history, dailyRuleCompletions) {
  const saved = normalizeDateString(value?.firstMeaningfulUseAt);
  if (saved) return saved;
  const historyDate = earliestHistoryDate(history);
  if (historyDate) return historyDate;
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
    const templateDefaults = getTemplateTodayDefaults(template, dateKey);
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
  const defaults = getTemplateTodayDefaults(template, dateKey);
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
  const accentOptions = [
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
  ];
  const backgroundOptions = [
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
  return {
    backupReminderIntervalDays: [0, 14, 30, 60].includes(interval) ? interval : 30,
    accentColor: accentOptions.includes(accentColor) ? accentColor : "green",
    backgroundColor: backgroundOptions.includes(backgroundColor) ? backgroundColor : "cream",
    fontSize: ["small", "normal", "large"].includes(value?.fontSize)
      ? value.fontSize
      : "normal",
    density: ["compact", "comfortable"].includes(value?.density)
      ? value.density
      : "comfortable",
    startTodayEmpty: Boolean(value?.startTodayEmpty),
    taskTags: cleanTags(value?.taskTags).length ? cleanTags(value.taskTags) : DEFAULT_TASK_TAGS
  };
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  const usedIds = new Set();
  return value
    .filter(
      (entry) =>
        isPlainObject(entry) &&
        typeof entry.id === "string" &&
        Boolean(entry.id.trim()) &&
        typeof entry.routineId === "string" &&
        Boolean(entry.routineId.trim()) &&
        typeof entry.routineTitle === "string" &&
        normalizeDateString(entry.startedAt) &&
        normalizeDateString(entry.finishedAt)
    )
    .map((entry, index) => {
      const completedTasks = Number(entry.completedTasks);
      const totalTasks = Number(entry.totalTasks);
      const percent = Number(entry.percent);
      return {
        id: uniqueStableId(entry.id, `history-${index + 1}`, usedIds),
        routineId: entry.routineId.trim(),
        routineTitle: entry.routineTitle,
        startedAt: normalizeDateString(entry.startedAt),
        finishedAt: normalizeDateString(entry.finishedAt),
        completedTasks: Number.isFinite(completedTasks) ? Math.max(0, completedTasks) : 0,
        totalTasks: Number.isFinite(totalTasks) ? Math.max(0, totalTasks) : 0,
        percent: Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0,
        notes: typeof entry.notes === "string" ? entry.notes : "",
        templateId: typeof entry.templateId === "string" ? entry.templateId : null,
        templateName: typeof entry.templateName === "string" ? entry.templateName : "",
        kind: typeof entry.kind === "string" ? entry.kind : "session",
        source: typeof entry.source === "string" ? entry.source : "session",
        date: normalizeDateKey(entry.date),
        completedAt: normalizeDateString(entry.completedAt),
        elapsedMs: Number.isFinite(Number(entry.elapsedMs))
          ? Math.max(0, Number(entry.elapsedMs))
          : null,
        estimatedDurationMinutes: Number.isFinite(Number(entry.estimatedDurationMinutes))
          ? Math.max(0, Number(entry.estimatedDurationMinutes))
          : null
      };
    });
}

function findRoutine(templates, templateId, routineId) {
  const template = templates.find((item) => item.id === templateId) || templates[0];
  return template?.routines?.find((routine) => routine.id === routineId) || null;
}

function normalizeActiveSession(value, templates, activeTemplateId) {
  if (!isPlainObject(value)) return null;
  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.routineId !== "string" ||
    !value.routineId.trim()
  ) {
    return null;
  }

  const routineId = value.routineId.trim();
  const requestedTemplateId =
    typeof value.templateId === "string" ? value.templateId.trim() : "";
  const templateId = templates.some((template) => template.id === requestedTemplateId)
    ? requestedTemplateId
    : activeTemplateId;
  const startedAt =
    normalizeDateString(value.startedAt) ||
    normalizeDateString(value.createdAt) ||
    new Date().toISOString();
  const paused = Boolean(value.paused);
  const snapshotSource = isPlainObject(value.routineSnapshot)
    ? value.routineSnapshot
    : findRoutine(templates, templateId, routineId);

  return {
    id: value.id.trim(),
    routineId,
    templateId,
    startedAt,
    paused,
    pausedAt: paused ? normalizeDateString(value.pausedAt) || startedAt : null,
    totalPausedMs: Number.isFinite(Number(value.totalPausedMs))
      ? Math.max(0, Number(value.totalPausedMs))
      : 0,
    completedTaskIds: uniqueStrings(value.completedTaskIds),
    notes: typeof value.notes === "string" ? value.notes : "",
    routineSnapshot: snapshotSource ? normalizeRoutine(snapshotSource) : null
  };
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

export function normalizeAppState(value) {
  if (!isPlainObject(value)) return createLegacyState();

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

  return {
    templates,
    activeTemplateId,
    history,
    activeSession: normalizeActiveSession(value.activeSession, templates, activeTemplateId),
    dailyRuleCompletions,
    todayTasksByDate: normalizeTodayTasksByDate(
      value.todayTasksByDate,
      activeTemplate,
      dailyRuleCompletions,
      value.dashboardTodos,
      appSettings
    ),
    dashboardTodos: normalizeDashboardTodos(value.dashboardTodos),
    dismissedRecommendations: normalizeDismissedRecommendations(value.dismissedRecommendations),
    appSettings,
    onboardingCompleted: Boolean(value.onboardingCompleted),
    onboardingCompletedAt: normalizeDateString(value.onboardingCompletedAt),
    lastFullBackupExportedAt: normalizeDateString(value.lastFullBackupExportedAt),
    firstMeaningfulUseAt: inferFirstMeaningfulUse(value, templates, history, dailyRuleCompletions)
  };
}

export function loadAppState() {
  const saved = readJson(STORAGE_KEYS.appState, null);
  const state = saved ? normalizeAppState(saved) : createLegacyState();
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
    version: 2,
    exportedAt: new Date().toISOString(),
    data: normalizeAppState(state)
  };
}

function isValidTaskBackupShape(task) {
  return (
    isPlainObject(task) &&
    (typeof task.title === "string" || typeof task.text === "string")
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
      (tasks) => Array.isArray(tasks) && tasks.every(isValidTaskBackupShape)
    )
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

  if (payload.app !== undefined && payload.app !== "Clean30") {
    return { ok: false, error: "This JSON file is not a Clean30 backup." };
  }
  if (
    payload.type !== undefined &&
    !["full-backup", "emergency-localStorage-backup"].includes(payload.type)
  ) {
    return { ok: false, error: "This Clean30 JSON file is not a full backup." };
  }

  const emergency = upgradeEmergencyBackup(payload);
  if (emergency && !emergency.ok) return emergency;

  const data = emergency?.data || (Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload);
  const warnings = [...(emergency?.warnings || [])];
  if (!isPlainObject(data)) {
    return { ok: false, error: "Backup must contain a data object." };
  }

  if (!Array.isArray(data.templates)) {
    return { ok: false, error: "Backup is missing its templates array." };
  }
  if (data.templates.length === 0) {
    return { ok: false, error: "Backup contains no templates and cannot replace current data." };
  }
  if (!data.templates.every(isValidTemplateBackupShape)) {
    return { ok: false, error: "Backup contains an invalid or incomplete template." };
  }

  const validTemplateIds = data.templates.map((template) => template.id.trim());
  const requestedActiveTemplateId =
    typeof data.activeTemplateId === "string" ? data.activeTemplateId.trim() : "";
  if (
    !requestedActiveTemplateId ||
    !validTemplateIds.includes(requestedActiveTemplateId)
  ) {
    warnings.push(`Missing active template repaired to "${validTemplateIds[0]}".`);
  }
  if (backupHasDuplicateIds(data)) {
    warnings.push("Duplicate IDs repaired deterministically.");
  }
  if (backupHasMissingNestedIds(data)) {
    warnings.push("Missing nested IDs repaired deterministically.");
  }
  if (!validTemplateIds.includes("clean30-default")) {
    warnings.push("Clean30 starter template restored.");
  }

  if (Array.isArray(data.history)) {
    const ignoredHistoryEntries = data.history.filter(
      (entry) => !isValidHistoryBackupEntry(entry)
    ).length;
    if (ignoredHistoryEntries > 0) {
      warnings.push(
        `${ignoredHistoryEntries} invalid history ${ignoredHistoryEntries === 1 ? "entry was" : "entries were"} ignored.`
      );
    }
  }

  return { ok: true, data: normalizeAppState(data), warnings };
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
    dashboardTodos: [],
    dismissedRecommendations: {},
    appSettings: normalizeAppSettings(),
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    lastFullBackupExportedAt: null,
    firstMeaningfulUseAt: null
  };
}
