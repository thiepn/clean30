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

function normalizeDateString(value) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : value;
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
      .filter(([dateKey, ruleIds]) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && Array.isArray(ruleIds))
      .map(([dateKey, ruleIds]) => [dateKey, uniqueStrings(ruleIds)])
  );
}

function normalizeDismissedRecommendations(value) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([dateKey, recommendationKeys]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && Array.isArray(recommendationKeys)
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
        createdAt,
        completedAt: completed ? normalizeDateString(todo.completedAt) || createdAt : null
      };
    });
}

function normalizeTodayTask(value, index, dateKey) {
  const saved = isPlainObject(value) ? value : {};
  const textValue =
    typeof saved.text === "string"
      ? saved.text
      : typeof saved.title === "string"
        ? saved.title
        : "";
  if (!textValue.trim()) return null;
  const createdAt = normalizeDateString(saved.createdAt) || `${dateKey}T00:00:00.000Z`;
  const completed = Boolean(saved.completed);
  const source = saved.source === "custom" ? "custom" : "default";
  const defaultTaskId =
    typeof saved.defaultTaskId === "string"
      ? saved.defaultTaskId
      : typeof saved.ruleId === "string"
        ? saved.ruleId
        : source === "default" && typeof saved.id === "string"
          ? saved.id.replace(/^today-[^-]+-\d{2}-\d{2}-/, "")
          : null;

  return {
    id:
      typeof saved.id === "string" && saved.id
        ? saved.id
        : `today-${source}-${dateKey}-${index}`,
    defaultTaskId,
    text: textValue.trim(),
    completed,
    source,
    createdAt,
    completedAt: completed ? normalizeDateString(saved.completedAt) || createdAt : null
  };
}

export function buildTodayTasksForDate(existingTasks, template, dateKey, completedDefaultIds = []) {
  if (Array.isArray(existingTasks)) {
    return existingTasks
      .map((task, index) => normalizeTodayTask(task, index, dateKey))
      .filter(Boolean);
  }

  const completed = new Set(uniqueStrings(completedDefaultIds));
  const defaults = template?.todayDefaults || template?.dailyRules || [];
  return defaults.map((task, index) => {
    const isCompleted = completed.has(task.id);
    return {
      id: `today-default-${dateKey}-${task.id || index}`,
      defaultTaskId: task.id || null,
      text: task.title || task.text || `Task ${index + 1}`,
      completed: isCompleted,
      source: "default",
      createdAt: `${dateKey}T00:00:00.000Z`,
      completedAt: isCompleted ? `${dateKey}T12:00:00.000Z` : null
    };
  });
}

function normalizeTodayTasksByDate(value, template, dailyRuleCompletions, dashboardTodos) {
  const result = {};
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([dateKey, tasks]) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        result[dateKey] = buildTodayTasksForDate(tasks, template, dateKey);
      }
    });
  }

  const todayKey = getTodayKey();
  if (!Object.prototype.hasOwnProperty.call(result, todayKey)) {
    const defaults = buildTodayTasksForDate(
      null,
      template,
      todayKey,
      dailyRuleCompletions[todayKey] || []
    );
    const migratedTodos = normalizeDashboardTodos(dashboardTodos).map((todo, index) => ({
      id: todo.id || `today-custom-${todayKey}-${index}`,
      defaultTaskId: null,
      text: todo.text,
      completed: todo.completed,
      source: "custom",
      createdAt: todo.createdAt,
      completedAt: todo.completedAt
    }));
    result[todayKey] = [...defaults, ...migratedTodos];
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
    backgroundColor: backgroundOptions.includes(backgroundColor) ? backgroundColor : "cream"
  };
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry) =>
        isPlainObject(entry) &&
        typeof entry.id === "string" &&
        typeof entry.routineId === "string" &&
        typeof entry.routineTitle === "string" &&
        typeof entry.startedAt === "string" &&
        typeof entry.finishedAt === "string"
    )
    .map((entry) => {
      const completedTasks = Number(entry.completedTasks);
      const totalTasks = Number(entry.totalTasks);
      const percent = Number(entry.percent);
      return {
        id: entry.id,
        routineId: entry.routineId,
        routineTitle: entry.routineTitle,
        startedAt: entry.startedAt,
        finishedAt: entry.finishedAt,
        completedTasks: Number.isFinite(completedTasks) ? Math.max(0, completedTasks) : 0,
        totalTasks: Number.isFinite(totalTasks) ? Math.max(0, totalTasks) : 0,
        percent: Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0,
        notes: typeof entry.notes === "string" ? entry.notes : "",
        templateId: typeof entry.templateId === "string" ? entry.templateId : null,
        templateName: typeof entry.templateName === "string" ? entry.templateName : "",
        kind: typeof entry.kind === "string" ? entry.kind : "session",
        source: typeof entry.source === "string" ? entry.source : "session",
        date: typeof entry.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
          ? entry.date
          : null,
        completedAt: normalizeDateString(entry.completedAt),
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
    typeof value.routineId !== "string" ||
    typeof value.startedAt !== "string"
  ) {
    return null;
  }

  const templateId = typeof value.templateId === "string" ? value.templateId : activeTemplateId;
  const snapshotSource = isPlainObject(value.routineSnapshot)
    ? value.routineSnapshot
    : findRoutine(templates, templateId, value.routineId);

  return {
    id: value.id,
    routineId: value.routineId,
    templateId,
    startedAt: value.startedAt,
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
    todayTasksByDate: normalizeTodayTasksByDate({}, customTemplate, dailyRuleCompletions, []),
    dashboardTodos: [],
    dismissedRecommendations: {},
    appSettings: normalizeAppSettings(),
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    lastFullBackupExportedAt: null,
    firstMeaningfulUseAt: inferFirstMeaningfulUse({}, templates, history, dailyRuleCompletions)
  };
}

export function normalizeAppState(value) {
  if (!isPlainObject(value)) return createLegacyState();

  const defaultTemplate = createDefaultTemplate();
  const savedTemplates = Array.isArray(value.templates) ? value.templates : [];
  const normalizedTemplates = savedTemplates.map((template) =>
    normalizeTemplate(template, { readOnly: template?.id === defaultTemplate.id || template?.readOnly })
  );
  const hasDefault = normalizedTemplates.some((template) => template.id === defaultTemplate.id);
  const templates = hasDefault ? normalizedTemplates : [defaultTemplate, ...normalizedTemplates];
  const activeTemplateId = templates.some((template) => template.id === value.activeTemplateId)
    ? value.activeTemplateId
    : templates[0].id;
  const history = normalizeHistory(value.history);
  const dailyRuleCompletions = normalizeDailyRuleCompletions(value.dailyRuleCompletions);
  const activeTemplate = templates.find((template) => template.id === activeTemplateId) || templates[0];

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
      value.dashboardTodos
    ),
    dashboardTodos: normalizeDashboardTodos(value.dashboardTodos),
    dismissedRecommendations: normalizeDismissedRecommendations(value.dismissedRecommendations),
    appSettings: normalizeAppSettings(value.appSettings),
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

export function validateFullBackupPayload(payload) {
  const data = payload?.data || payload;
  if (!isPlainObject(data)) {
    return { ok: false, error: "Backup must contain a data object." };
  }
  if (!Array.isArray(data.templates) || !data.activeTemplateId) {
    return { ok: false, error: "Backup is missing templates or an active template." };
  }
  return { ok: true, data: normalizeAppState(data) };
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
