import { cloneDeep, createId, normalizeRoutine, normalizeTask } from "./templateUtils.js";

function normalizedTitle(value) {
  return String(value || "").trim().toLowerCase();
}

export function getRoutineMinutes(routine) {
  const direct = Number(routine?.estimatedMinutes);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
  const match = String(routine?.estimatedTime || "").match(/(\d+)/);
  return match ? Math.max(1, Math.min(600, Number(match[1]))) : 30;
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
    estimatedMinutes: 30,
    estimatedTime: "30 min",
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

export function sanitizeRoutineDraft(draft) {
  const minutes = Math.max(
    1,
    Math.min(600, Math.round(Number(draft?.estimatedMinutes) || 30))
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
