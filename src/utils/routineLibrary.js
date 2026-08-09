import {
  cleaningTaskCatalog,
  routineStarterTemplates
} from "../data/taskSuggestions.js";
import { parseDurationMinutes } from "./duration.js";
import { cloneDeep, createId, normalizeRoutine, normalizeTask } from "./templateUtils.js";

function normalizedTitle(value) {
  return String(value || "").trim().toLowerCase();
}

const GLOBAL_TASK_SECTION_NAMES = new Set(["tasks", "whole home"]);

function sectionScope(sectionTitle) {
  const key = normalizedTitle(sectionTitle);
  return !key || GLOBAL_TASK_SECTION_NAMES.has(key) ? "__global__" : key;
}

function scopedTaskKey(sectionTitle, taskTitle) {
  return `${sectionScope(sectionTitle)}::${normalizedTitle(taskTitle)}`;
}

function stageForTitle(title) {
  const catalog = getSuggestedTaskInfo(title);
  if (catalog) return catalog.stage;
  const value = normalizedTitle(title);
  if (/trash|rubbish|garbage|\bbin\b/.test(value)) return 10;
  if (/dish|laundry|clothes/.test(value)) return 20;
  if (/put away|declutter|clutter|tidy|clear|make the bed/.test(value)) return 30;
  if (/dust/.test(value)) return 40;
  if (/wipe|clean|scrub|wash|stove|sink|toilet|shower|bath/.test(value)) return 50;
  if (/mirror|window|glass/.test(value)) return 60;
  if (/vacuum|sweep/.test(value)) return 70;
  if (/mop/.test(value)) return 80;
  return 55;
}

function cleanListLine(value) {
  return String(value || "")
    .trim()
    .replace(/^[-*•]\s*\[[ xX]\]\s*/, "")
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

function headingFromLine(value) {
  const trimmed = String(value || "").trim();
  const markdown = trimmed.match(/^#{1,6}\s+(.+)$/);
  if (markdown) return markdown[1].trim().replace(/:$/, "");
  if (/^[^:]{1,50}:$/.test(trimmed)) return trimmed.slice(0, -1).trim();
  return "";
}

function createTaskFromTitle(title) {
  const suggestion = getSuggestedTaskInfo(title);
  return {
    id: createId("task"),
    title: String(title || "").trim(),
    duration: suggestion ? `${suggestion.minutes} min` : "",
    detail: "",
    note: "",
    tags: [],
    priority: "normal"
  };
}

function isDefaultEmptySection(phase) {
  return Boolean(
    phase &&
      normalizedTitle(phase.title) === "tasks" &&
      (phase.tasks || []).every((task) => !String(task?.title || "").trim())
  );
}

export function getRoutineMinutes(routine) {
  const direct = Number(routine?.estimatedMinutes);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
  const parsed = parseDurationMinutes(routine?.estimatedTime, null);
  return parsed ? Math.max(1, Math.min(600, parsed)) : 30;
}

export function hasDuplicateRoutineTitle(title, routines = [], ignoreId = "") {
  const candidate = normalizedTitle(title);
  if (!candidate) return false;
  return routines.some(
    (routine) => routine.id !== ignoreId && normalizedTitle(routine.title) === candidate
  );
}

export function createBlankRoutineTask() {
  return {
    id: createId("task"),
    title: "",
    duration: "",
    detail: "",
    note: "",
    tags: [],
    priority: "normal"
  };
}

export function createSimpleRoutineDraft() {
  return {
    id: createId("routine"),
    title: "",
    estimatedMinutes: 5,
    estimatedTime: "5 min",
    archived: false,
    colorLabel: "none",
    purpose: "",
    whenToUse: "",
    message: "",
    phases: [
      {
        id: createId("phase"),
        title: "Tasks",
        tasks: [createBlankRoutineTask()]
      }
    ]
  };
}

export function createRoutineEditorDraft(routine) {
  return cloneDeep(routine || createSimpleRoutineDraft());
}

export function getSuggestedTaskInfo(title) {
  const key = normalizedTitle(title);
  if (!key) return null;
  return cleaningTaskCatalog.find((task) => normalizedTitle(task.title) === key) || null;
}

export function getTaskSuggestions(query = "", room = "All", limit = 18) {
  const needle = normalizedTitle(query);
  const roomKey = normalizedTitle(room);
  return cleaningTaskCatalog
    .filter((task) => roomKey === "all" || normalizedTitle(task.room) === roomKey)
    .filter((task) => {
      if (!needle) return true;
      return [task.title, task.room, ...(task.keywords || [])]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    })
    .slice(0, limit);
}

export function parseRoutineTaskText(text) {
  const sections = [];
  let current = { title: "Tasks", tasks: [] };
  let sawHeading = false;
  const seen = new Set();

  function pushCurrent() {
    if (!current.tasks.length) return;
    sections.push(current);
  }

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const heading = headingFromLine(trimmed);
    if (heading) {
      pushCurrent();
      current = { title: heading || "Tasks", tasks: [] };
      sawHeading = true;
      continue;
    }

    const title = cleanListLine(trimmed);
    if (!title) continue;
    const key = scopedTaskKey(current.title, title);
    if (seen.has(key)) continue;
    seen.add(key);
    current.tasks.push(title);
  }

  pushCurrent();
  return {
    sections,
    taskCount: sections.reduce((total, section) => total + section.tasks.length, 0),
    hasHeadings: sawHeading
  };
}

export function appendParsedTaskText(draft, text) {
  const parsed = parseRoutineTaskText(text);
  if (!parsed.taskCount) return cloneDeep(draft);

  const next = cloneDeep(draft);
  const existingKeys = new Set(
    next.phases.flatMap((phase) =>
      (phase.tasks || [])
        .map((task) => scopedTaskKey(phase.title, task.title))
        .filter((key) => !key.endsWith("::"))
    )
  );

  if (!parsed.hasHeadings && parsed.sections.length === 1) {
    const target = next.phases[0] || {
      id: createId("phase"),
      title: "Tasks",
      tasks: []
    };
    if (!next.phases.length) next.phases.push(target);
    const blankOnly =
      target.tasks.length === 1 && !String(target.tasks[0]?.title || "").trim();
    if (blankOnly) target.tasks = [];
    for (const title of parsed.sections[0].tasks) {
      const key = scopedTaskKey(target.title, title);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      target.tasks.push(createTaskFromTitle(title));
    }
    return next;
  }

  if (next.phases.length === 1 && isDefaultEmptySection(next.phases[0])) {
    next.phases = [];
  }

  for (const section of parsed.sections) {
    let target = next.phases.find(
      (phase) => normalizedTitle(phase.title) === normalizedTitle(section.title)
    );
    if (!target) {
      target = { id: createId("phase"), title: section.title || "Tasks", tasks: [] };
      next.phases.push(target);
    }
    for (const title of section.tasks) {
      const key = scopedTaskKey(target.title, title);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      target.tasks.push(createTaskFromTitle(title));
    }
  }
  return next;
}

export function addSuggestedTaskToDraft(draft, suggestion, phaseId = "") {
  const next = cloneDeep(draft);
  const title = suggestion?.title || suggestion;
  if (!String(title || "").trim()) return next;
  const room = typeof suggestion === "object" ? String(suggestion?.room || "").trim() : "";

  let target = phaseId ? next.phases.find((phase) => phase.id === phaseId) : null;
  if (!target && room) {
    const desiredTitle = normalizedTitle(room) === "whole home" ? "Tasks" : room;
    target = next.phases.find(
      (phase) => normalizedTitle(phase.title) === normalizedTitle(desiredTitle)
    );
    if (!target && next.phases.length === 1 && isDefaultEmptySection(next.phases[0])) {
      target = next.phases[0];
      target.title = desiredTitle;
    }
    if (!target) {
      target = { id: createId("phase"), title: desiredTitle || "Tasks", tasks: [] };
      next.phases.push(target);
    }
  }
  target ||= next.phases[0];
  if (!target) {
    target = { id: createId("phase"), title: "Tasks", tasks: [] };
    next.phases.push(target);
  }

  const key = scopedTaskKey(target.title, title);
  const duplicate = next.phases.some((phase) =>
    (phase.tasks || []).some((task) => scopedTaskKey(phase.title, task.title) === key)
  );
  if (duplicate) return next;

  if (target.tasks.length === 1 && !String(target.tasks[0]?.title || "").trim()) {
    target.tasks = [];
  }
  target.tasks.push(createTaskFromTitle(title));
  return next;
}

export function createRoutineDraftFromTemplate(templateId) {
  const template = routineStarterTemplates.find((item) => item.id === templateId);
  if (!template) return createSimpleRoutineDraft();
  const phases = Object.entries(template.sections).map(([title, tasks]) => ({
    id: createId("phase"),
    title,
    tasks: tasks.map(createTaskFromTitle)
  }));
  const draft = {
    ...createSimpleRoutineDraft(),
    title: template.title,
    phases
  };
  const minutes = estimateRoutineMinutes(draft);
  return { ...draft, estimatedMinutes: minutes, estimatedTime: `${minutes} min` };
}

export function estimateRoutineMinutes(routine) {
  const total = (routine?.phases || []).reduce(
    (sum, phase) =>
      sum +
      (phase.tasks || []).reduce((taskSum, task) => {
        if (!String(task?.title || "").trim()) return taskSum;
        const direct = parseDurationMinutes(task.duration, null);
        const suggested = getSuggestedTaskInfo(task.title)?.minutes;
        return taskSum + (direct || suggested || 3);
      }, 0),
    0
  );
  return Math.max(1, Math.min(600, Math.round(total || 1)));
}

export function optimizeRoutineTaskOrder(draft) {
  const next = cloneDeep(draft);
  next.phases = next.phases.map((phase) => ({
    ...phase,
    tasks: [...phase.tasks].sort((first, second) => {
      const firstBlank = !String(first?.title || "").trim();
      const secondBlank = !String(second?.title || "").trim();
      if (firstBlank !== secondBlank) return firstBlank ? 1 : -1;
      return stageForTitle(first?.title) - stageForTitle(second?.title);
    })
  }));
  return next;
}

export function moveRoutineTaskByDrop(draft, draggedTask, targetPhaseId, targetTaskId) {
  if (!draggedTask?.phaseId || !draggedTask?.taskId || !targetPhaseId || !targetTaskId) {
    return cloneDeep(draft);
  }

  const next = cloneDeep(draft);
  const sourcePhase = next.phases.find((phase) => phase.id === draggedTask.phaseId);
  const targetPhase = next.phases.find((phase) => phase.id === targetPhaseId);
  if (!sourcePhase || !targetPhase) return next;

  const sourceIndex = sourcePhase.tasks.findIndex((task) => task.id === draggedTask.taskId);
  const targetIndexBefore = targetPhase.tasks.findIndex((task) => task.id === targetTaskId);
  if (sourceIndex < 0 || targetIndexBefore < 0) return next;
  if (sourcePhase.id === targetPhase.id && draggedTask.taskId === targetTaskId) return next;

  const [task] = sourcePhase.tasks.splice(sourceIndex, 1);
  let targetIndex = targetPhase.tasks.findIndex((item) => item.id === targetTaskId);
  if (targetIndex < 0) targetIndex = targetPhase.tasks.length;
  if (sourcePhase.id === targetPhase.id && sourceIndex < targetIndexBefore) {
    targetIndex += 1;
  }
  targetPhase.tasks.splice(targetIndex, 0, task);
  return next;
}

export function sanitizeRoutineDraft(draft) {
  const minutes = Math.max(
    1,
    Math.min(600, Math.round(Number(draft?.estimatedMinutes) || estimateRoutineMinutes(draft)))
  );
  const phases = (Array.isArray(draft?.phases) ? draft.phases : [])
    .map((phase, phaseIndex) => ({
      ...phase,
      id: phase.id || createId("phase"),
      title:
        String(phase.title || "").trim() ||
        (phaseIndex === 0 ? "Tasks" : `Section ${phaseIndex + 1}`),
      tasks: (Array.isArray(phase.tasks) ? phase.tasks : [])
        .filter((task) => String(task?.title || "").trim())
        .map((task) =>
          normalizeTask({
            ...task,
            id: task.id || createId("task"),
            title: String(task.title).trim()
          })
        )
    }))
    .filter((phase) => phase.tasks.length > 0);

  return normalizeRoutine({
    ...draft,
    id: draft?.id || createId("routine"),
    title: String(draft?.title || "").trim() || "New routine",
    estimatedMinutes: minutes,
    estimatedTime: `${minutes} min`,
    archived: Boolean(draft?.archived),
    phases: phases.length
      ? phases
      : [
          {
            id: createId("phase"),
            title: "Tasks",
            tasks: []
          }
        ]
  });
}

function makeUniqueCopyTitle(title, siblingTitles) {
  const base = `${String(title || "Routine").trim() || "Routine"} Copy`;
  const used = new Set(siblingTitles.map(normalizedTitle));
  if (!used.has(normalizedTitle(base))) return base;
  let suffix = 2;
  while (used.has(normalizedTitle(`${base} ${suffix}`))) suffix += 1;
  return `${base} ${suffix}`;
}

export function duplicateRoutineForLibrary(routine, siblingTitles = []) {
  const copy = cloneDeep(routine);
  return normalizeRoutine({
    ...copy,
    id: createId("routine"),
    title: makeUniqueCopyTitle(routine?.title, siblingTitles),
    archived: false,
    phases: (copy.phases || []).map((phase) => ({
      ...phase,
      id: createId("phase"),
      tasks: (phase.tasks || []).map((task) => ({
        ...task,
        id: createId("task")
      }))
    }))
  });
}

export function isStructuredRoutine(routine) {
  return (routine?.phases?.length || 0) > 1;
}
