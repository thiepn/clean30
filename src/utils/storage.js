import { createDefaultTemplate, duplicateTemplate, normalizeRoutine, normalizeTemplate } from "./templateUtils.js";

export const STORAGE_KEYS = {
  appState: "clean30_appState",
  settings: "clean30_settings",
  dailyRules: "clean30_dailyRules",
  activeSession: "clean30_activeSession",
  history: "clean30_history"
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string"))];
}

function normalizeDailyRuleCompletions(value) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([dateKey, ruleIds]) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && Array.isArray(ruleIds))
      .map(([dateKey, ruleIds]) => [dateKey, uniqueStrings(ruleIds)])
  );
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
        templateName: typeof entry.templateName === "string" ? entry.templateName : ""
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
      dailyRuleCompletions: {}
    };
  }

  const hasLegacyData =
    window.localStorage.getItem(STORAGE_KEYS.settings) ||
    window.localStorage.getItem(STORAGE_KEYS.dailyRules) ||
    window.localStorage.getItem(STORAGE_KEYS.activeSession) ||
    window.localStorage.getItem(STORAGE_KEYS.history);

  if (!hasLegacyData) {
    return {
      templates: [defaultTemplate],
      activeTemplateId: defaultTemplate.id,
      history: [],
      activeSession: null,
      dailyRuleCompletions: {}
    };
  }

  const legacySettings = readJson(STORAGE_KEYS.settings, {});
  const customTemplate = applyLegacySettings(
    duplicateTemplate(defaultTemplate, legacySettings?.displayName || "My Cleaning System"),
    legacySettings
  );
  const templates = [defaultTemplate, customTemplate];
  const activeTemplateId = customTemplate.id;

  return {
    templates,
    activeTemplateId,
    history: normalizeHistory(readJson(STORAGE_KEYS.history, [])),
    activeSession: normalizeActiveSession(
      readJson(STORAGE_KEYS.activeSession, null),
      templates,
      activeTemplateId
    ),
    dailyRuleCompletions: normalizeDailyRuleCompletions(readJson(STORAGE_KEYS.dailyRules, {}))
  };
}

export function normalizeAppState(value) {
  const fallback = createLegacyState();
  if (!isPlainObject(value)) return fallback;

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

  return {
    templates,
    activeTemplateId,
    history: normalizeHistory(value.history),
    activeSession: normalizeActiveSession(value.activeSession, templates, activeTemplateId),
    dailyRuleCompletions: normalizeDailyRuleCompletions(value.dailyRuleCompletions)
  };
}

export function loadAppState() {
  const saved = readJson(STORAGE_KEYS.appState, null);
  const state = saved ? normalizeAppState(saved) : createLegacyState();
  if (canUseStorage() && !window.localStorage.getItem(STORAGE_KEYS.appState)) {
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
    dailyRuleCompletions: {}
  };
}
