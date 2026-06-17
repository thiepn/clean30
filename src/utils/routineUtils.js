import { createId, normalizePhase, normalizeRoutine, normalizeTask } from "./templateUtils.js";

export function moveItem(items, index, direction) {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function createRoutine() {
  return normalizeRoutine({
    id: createId("routine"),
    title: "New Routine",
    estimatedTime: "30 min",
    estimatedMinutes: 30,
    archived: false,
    colorLabel: "none",
    purpose: "",
    whenToUse: "",
    phases: [
      {
        id: createId("phase"),
        title: "Start",
        tasks: [createTask()]
      }
    ]
  });
}

export function createPhase() {
  return normalizePhase({
    id: createId("phase"),
    title: "New phase",
    tasks: []
  });
}

export function createTask() {
  return normalizeTask({
    id: createId("task"),
    title: "New task",
    duration: "",
    detail: "",
    priority: "normal"
  });
}
