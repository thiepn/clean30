import { readFileSync, writeFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content, "utf8");
}

function replaceExact(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Could not find ${label}`);
  }
  return source.replace(before, after);
}

function replaceRegex(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${label}`);
  }
  return source.replace(pattern, replacement);
}

// storage.js: introduce the v4 canonical maintenance state without weakening v3 migration.
{
  const path = "src/utils/storage.js";
  let source = read(path);

  source = replaceExact(
    source,
    `} from "./templateUtils.js";\n`,
    `} from "./templateUtils.js";\nimport {\n  MAINTENANCE_COMPLETION_SOURCES,\n  MAINTENANCE_EFFORTS,\n  MAINTENANCE_FREQUENCY_MODES,\n  deriveLegacyMaintenanceCompletions,\n  normalizeMaintenanceCompletions,\n  normalizeMaintenanceTaskList\n} from "./maintenanceTasks.js";\n`,
    "storage maintenance imports"
  );

  source = replaceExact(
    source,
    `export const CURRENT_BACKUP_VERSION = 3;`,
    `export const CURRENT_BACKUP_VERSION = 4;`,
    "backup version"
  );

  source = replaceExact(
    source,
    `export function normalizeAppState(value) {\n  if (!isPlainObject(value)) return createLegacyState();\n`,
    `function normalizeMaintenanceTasksByTemplate(value, templates) {\n  const saved = isPlainObject(value) ? value : {};\n  return Object.fromEntries(\n    templates.map((template) => {\n      const existing = Array.isArray(saved[template.id])\n        ? normalizeMaintenanceTaskList(saved[template.id], template.zones)\n        : [];\n      const defaults = normalizeMaintenanceTaskList(undefined, template.zones);\n      const existingIds = new Set(existing.map((task) => task.id));\n      return [\n        template.id,\n        [...existing, ...defaults.filter((task) => !existingIds.has(task.id))]\n      ];\n    })\n  );\n}\n\nfunction templatesWithMaintenanceTasks(templates, maintenanceTasksByTemplate) {\n  return templates.map((template) => ({\n    ...template,\n    maintenanceTasks: maintenanceTasksByTemplate[template.id] || []\n  }));\n}\n\nexport function normalizeAppState(value) {\n  if (!isPlainObject(value)) return normalizeAppState(createLegacyState());\n`,
    "normalizeAppState prelude"
  );

  source = replaceExact(
    source,
    `  const todayTasksByDate = normalizeTodayTasksByDate(\n    value.todayTasksByDate,\n    activeTemplate,\n    dailyRuleCompletions,\n    value.dashboardTodos,\n    appSettings\n  );\n\n  return {`,
    `  const todayTasksByDate = normalizeTodayTasksByDate(\n    value.todayTasksByDate,\n    activeTemplate,\n    dailyRuleCompletions,\n    value.dashboardTodos,\n    appSettings\n  );\n  const maintenanceTasksByTemplate = normalizeMaintenanceTasksByTemplate(\n    value.maintenanceTasksByTemplate,\n    templates\n  );\n  const maintenanceTemplates = templatesWithMaintenanceTasks(\n    templates,\n    maintenanceTasksByTemplate\n  );\n  const maintenanceCompletions = hasOwn(value, "maintenanceCompletions")\n    ? normalizeMaintenanceCompletions(value.maintenanceCompletions, maintenanceTemplates)\n    : deriveLegacyMaintenanceCompletions({\n        templates: maintenanceTemplates,\n        activeTemplateId,\n        todayTasksByDate,\n        history\n      });\n\n  return {`,
    "maintenance normalization"
  );

  source = replaceExact(
    source,
    `    todayTasksByDate,\n    dashboardTodos: normalizeDashboardTodos(value.dashboardTodos),`,
    `    todayTasksByDate,\n    maintenanceTasksByTemplate,\n    maintenanceCompletions,\n    dashboardTodos: normalizeDashboardTodos(value.dashboardTodos),`,
    "maintenance state return"
  );

  source = replaceExact(
    source,
    `  const state = saved ? normalizeAppState(saved) : createLegacyState();`,
    `  const state = saved\n    ? normalizeAppState(saved)\n    : normalizeAppState(createLegacyState());`,
    "fresh-state normalization"
  );

  source = replaceExact(
    source,
    `  "todayTasksByDate",\n  "dashboardTodos",`,
    `  "todayTasksByDate",\n  "maintenanceTasksByTemplate",\n  "maintenanceCompletions",\n  "dashboardTodos",`,
    "current state fields"
  );

  source = replaceExact(
    source,
    `const CURRENT_STATE_FIELDS = [`,
    `const CURRENT_MAINTENANCE_TASK_FIELDS = [\n  "id",\n  "catalogId",\n  "title",\n  "room",\n  "estimatedMinutes",\n  "stage",\n  "frequencyMode",\n  "intervalDays",\n  "weekdays",\n  "effort",\n  "enabled",\n  "source"\n];\n\nfunction isValidMaintenanceTaskBackupShape(task) {\n  return (\n    hasOwnFields(task, CURRENT_MAINTENANCE_TASK_FIELDS) &&\n    isNonEmptyString(task.id) &&\n    (task.catalogId === null || isNonEmptyString(task.catalogId)) &&\n    isNonEmptyString(task.title) &&\n    isNonEmptyString(task.room) &&\n    typeof task.estimatedMinutes === "number" &&\n    Number.isInteger(task.estimatedMinutes) &&\n    task.estimatedMinutes >= 1 &&\n    task.estimatedMinutes <= 240 &&\n    typeof task.stage === "number" &&\n    Number.isInteger(task.stage) &&\n    task.stage >= 0 &&\n    task.stage <= 100 &&\n    MAINTENANCE_FREQUENCY_MODES.includes(task.frequencyMode) &&\n    (task.frequencyMode === "on-demand"\n      ? task.intervalDays === null\n      : typeof task.intervalDays === "number" &&\n        Number.isInteger(task.intervalDays) &&\n        task.intervalDays >= 1 &&\n        task.intervalDays <= 3650) &&\n    Array.isArray(task.weekdays) &&\n    task.weekdays.every((day) => WEEKDAY_KEYS.includes(day)) &&\n    (task.frequencyMode !== "weekdays" || task.weekdays.length > 0) &&\n    MAINTENANCE_EFFORTS.includes(task.effort) &&\n    typeof task.enabled === "boolean" &&\n    ["catalog", "custom"].includes(task.source)\n  );\n}\n\nfunction isValidMaintenanceTasksByTemplate(value, templates) {\n  if (!isPlainObject(value)) return false;\n  const templateIds = templates.map((template) => template.id);\n  const keys = Object.keys(value);\n  if (keys.length !== templateIds.length || !keys.every((key) => templateIds.includes(key))) {\n    return false;\n  }\n  return templateIds.every(\n    (templateId) =>\n      Array.isArray(value[templateId]) &&\n      value[templateId].every(isValidMaintenanceTaskBackupShape) &&\n      !containsDuplicateIds(value[templateId])\n  );\n}\n\nconst CURRENT_MAINTENANCE_COMPLETION_FIELDS = [\n  "id",\n  "templateId",\n  "taskId",\n  "completedAt",\n  "source",\n  "sourceId"\n];\n\nfunction isValidMaintenanceCompletions(value, maintenanceTasksByTemplate) {\n  if (!Array.isArray(value) || containsDuplicateIds(value)) return false;\n  return value.every((entry) => {\n    if (\n      !hasOwnFields(entry, CURRENT_MAINTENANCE_COMPLETION_FIELDS) ||\n      !isNonEmptyString(entry.id) ||\n      !isNonEmptyString(entry.templateId) ||\n      !isNonEmptyString(entry.taskId) ||\n      !normalizeDateString(entry.completedAt) ||\n      new Date(entry.completedAt).getTime() > Date.now() + MAX_CLOCK_SKEW_MS ||\n      !MAINTENANCE_COMPLETION_SOURCES.includes(entry.source) ||\n      !(entry.sourceId === null || isNonEmptyString(entry.sourceId))\n    ) {\n      return false;\n    }\n    return Boolean(\n      maintenanceTasksByTemplate[entry.templateId]?.some(\n        (task) => task.id === entry.taskId\n      )\n    );\n  });\n}\n\nconst CURRENT_STATE_FIELDS = [`,
    "maintenance validators"
  );

  source = replaceExact(
    source,
    `  if (!isValidTodayTasksByDate(data.todayTasksByDate)) {\n    return "Current backup contains invalid or incomplete Today task data.";\n  }\n`,
    `  if (!isValidTodayTasksByDate(data.todayTasksByDate)) {\n    return "Current backup contains invalid or incomplete Today task data.";\n  }\n  if (!isValidMaintenanceTasksByTemplate(data.maintenanceTasksByTemplate, data.templates)) {\n    return "Current backup contains invalid or incomplete cleaning-task configuration.";\n  }\n  if (!isValidMaintenanceCompletions(data.maintenanceCompletions, data.maintenanceTasksByTemplate)) {\n    return "Current backup contains invalid cleaning-task completion history.";\n  }\n`,
    "maintenance backup validation"
  );

  source = replaceRegex(
    source,
    /export function resetToFreshState\(\) \{([\s\S]*?)todayTasksByDate: \{\},\n    dashboardTodos:/,
    (match) => match.replace(
      `todayTasksByDate: {},\n    dashboardTodos:`,
      `todayTasksByDate: {},\n    maintenanceTasksByTemplate: {\n      [defaultTemplate.id]: normalizeMaintenanceTaskList(undefined, defaultTemplate.zones)\n    },\n    maintenanceCompletions: [],\n    dashboardTodos:`
    ),
    "fresh maintenance state"
  );

  write(path, source);
}

// App.jsx: start collecting canonical task completions immediately through existing flows.
{
  const path = "src/App.jsx";
  let source = read(path);

  source = replaceExact(
    source,
    `import { mergeHomeRoomsWithZones } from "./utils/homeLibrary.js";\n`,
    `import { mergeHomeRoomsWithZones } from "./utils/homeLibrary.js";\nimport {\n  findMaintenanceTaskIdForRoutineTask,\n  findMaintenanceTaskIdForTodayTask,\n  recordMaintenanceCompletion\n} from "./utils/maintenanceTasks.js";\n`,
    "App maintenance imports"
  );

  source = replaceExact(
    source,
    `  function finishSession() {\n    const sessionId = appState.activeSession?.id;\n    if (!sessionId) return;\n    const finishedAt =\n      finishRequestTimesRef.current.get(sessionId) || new Date().toISOString();\n    finishRequestTimesRef.current.set(sessionId, finishedAt);\n    const expectsSummary = appState.activeSession?.routineId !== "daily-rules";\n    setAppState((current) => finishSessionState(current, sessionId, finishedAt).state);\n    setCompletionSummary(null);\n    setPendingCompletionSessionId(expectsSummary ? sessionId : null);\n  }`,
    `  function finishSession() {\n    const sessionId = appState.activeSession?.id;\n    if (!sessionId) return;\n    const finishedAt =\n      finishRequestTimesRef.current.get(sessionId) || new Date().toISOString();\n    finishRequestTimesRef.current.set(sessionId, finishedAt);\n    const expectsSummary = appState.activeSession?.routineId !== "daily-rules";\n    setAppState((current) => {\n      const session = current.activeSession;\n      const finished = finishSessionState(current, sessionId, finishedAt).state;\n      if (!session || session.id !== sessionId) return finished;\n      const template = getTemplateFromState(current);\n      const maintenanceTemplate = {\n        ...template,\n        maintenanceTasks:\n          current.maintenanceTasksByTemplate?.[template.id] || []\n      };\n      const completedIds = new Set(session.completedTaskIds || []);\n      let maintenanceCompletions = current.maintenanceCompletions || [];\n      for (const phase of session.routineSnapshot?.phases || []) {\n        for (const task of phase.tasks || []) {\n          if (!completedIds.has(task.id)) continue;\n          const maintenanceTaskId = findMaintenanceTaskIdForRoutineTask(\n            maintenanceTemplate,\n            task,\n            phase.title\n          );\n          if (!maintenanceTaskId) continue;\n          maintenanceCompletions = recordMaintenanceCompletion(\n            maintenanceCompletions,\n            {\n              templateId: template.id,\n              taskId: maintenanceTaskId,\n              completedAt: finishedAt,\n              source: "routine",\n              sourceId: `session:${session.id}:${task.id}`\n            }\n          );\n        }\n      }\n      return { ...finished, maintenanceCompletions };\n    });\n    setCompletionSummary(null);\n    setPendingCompletionSessionId(expectsSummary ? sessionId : null);\n  }`,
    "finishSession maintenance capture"
  );

  source = replaceExact(
    source,
    `  function toggleTodayTask(taskId) {\n    const dateKey = getTodayKey();\n    setAppState((current) => {\n      const tasks = getTodayTasksFromState(current, dateKey).map((task) => {\n        if (task.id !== taskId) return task;\n        const completed = !task.completed;\n        return {\n          ...task,\n          completed,\n          completedAt: completed ? new Date().toISOString() : null\n        };\n      });\n      const next = applyTodayTasksToState(current, dateKey, tasks);\n      return markMeaningfulUse(next);\n    });\n  }`,
    `  function toggleTodayTask(taskId) {\n    const dateKey = getTodayKey();\n    setAppState((current) => {\n      const currentTasks = getTodayTasksFromState(current, dateKey);\n      const target = currentTasks.find((task) => task.id === taskId);\n      if (!target) return current;\n      const completed = !target.completed;\n      const completedAt = completed ? new Date().toISOString() : null;\n      const tasks = currentTasks.map((task) =>\n        task.id === taskId ? { ...task, completed, completedAt } : task\n      );\n      const template = getTemplateFromState(current);\n      const maintenanceTemplate = {\n        ...template,\n        maintenanceTasks:\n          current.maintenanceTasksByTemplate?.[template.id] || []\n      };\n      const sourceId = `today:${dateKey}:${taskId}`;\n      let maintenanceCompletions = (current.maintenanceCompletions || []).filter(\n        (entry) => entry.sourceId !== sourceId\n      );\n      if (completed) {\n        const maintenanceTaskId = findMaintenanceTaskIdForTodayTask(\n          maintenanceTemplate,\n          target\n        );\n        if (maintenanceTaskId) {\n          maintenanceCompletions = recordMaintenanceCompletion(\n            maintenanceCompletions,\n            {\n              templateId: template.id,\n              taskId: maintenanceTaskId,\n              completedAt,\n              source: "today",\n              sourceId\n            }\n          );\n        }\n      }\n      const next = applyTodayTasksToState(\n        { ...current, maintenanceCompletions },\n        dateKey,\n        tasks\n      );\n      return markMeaningfulUse(next);\n    });\n  }`,
    "Today maintenance capture"
  );

  source = replaceExact(
    source,
    `      message: "This clears completed sessions but keeps templates and Today tasks.",`,
    `      message: "This clears completed sessions and cleaning-task history, but keeps your setup and Today tasks.",`,
    "reset history copy"
  );
  source = replaceExact(
    source,
    `        setAppState((current) => ({ ...current, history: [] }));`,
    `        setAppState((current) => ({\n          ...current,\n          history: [],\n          maintenanceCompletions: []\n        }));`,
    "reset maintenance history"
  );

  source = replaceExact(
    source,
    `        setAppState((current) => ({\n          ...current,\n          history: current.history.filter(\n            (entry) => entry.id !== entryId || isDailyRulesHistoryEntry(entry)\n          )\n        }));`,
    `        setAppState((current) => {\n          const sessionId = entryId.startsWith("session-history-")\n            ? entryId.slice("session-history-".length)\n            : "";\n          return {\n            ...current,\n            history: current.history.filter(\n              (entry) => entry.id !== entryId || isDailyRulesHistoryEntry(entry)\n            ),\n            maintenanceCompletions: (current.maintenanceCompletions || []).filter(\n              (entry) =>\n                !entry.sourceId?.startsWith(`history:${entryId}:`) &&\n                !(sessionId && entry.sourceId?.startsWith(`session:${sessionId}:`))\n            )\n          };\n        });`,
    "delete linked maintenance history"
  );

  write(path, source);
}

// Advance the PWA cache boundary for the new persisted data model.
{
  const path = "public/sw.js";
  let source = read(path);
  source = replaceExact(
    source,
    `const CACHE_NAME = \`${"${CACHE_PREFIX}"}app-shell-v19\`;`,
    `const CACHE_NAME = \`${"${CACHE_PREFIX}"}app-shell-v20\`;`,
    "service-worker cache"
  );
  write(path, source);
}

// Release verifier now protects the v4 backup boundary and v20 PWA cache.
{
  const path = "scripts/verify-release.mjs";
  let source = read(path);
  source = replaceExact(source, `/app-shell-v19/`, `/app-shell-v20/`, "release cache regex");
  source = replaceExact(
    source,
    `"The final release candidate must use the Phase 19 app-shell cache boundary."`,
    `"The autopilot upgrade must use the v20 app-shell cache boundary."`,
    "release cache message"
  );
  source = replaceExact(
    source,
    `assert.equal(CURRENT_BACKUP_VERSION, 3, "Full-backup schema changed unexpectedly.");`,
    `assert.equal(CURRENT_BACKUP_VERSION, 4, "Full-backup schema changed unexpectedly.");`,
    "release backup version"
  );
  source = replaceExact(
    source,
    `console.log("- Phase 19 service-worker cache boundary verified");`,
    `console.log("- autopilot v20 service-worker cache boundary verified");`,
    "release cache log"
  );
  write(path, source);
}

console.log("Applied Clean30 autopilot Phase 1 source migration.");
