export function orderTodayCleaningTasks(tasks = []) {
  const safeTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
  return [
    ...safeTasks.filter((task) => !task.completed),
    ...safeTasks.filter((task) => task.completed)
  ];
}

export function getInitialTodayCleaningTaskId(tasks = []) {
  const ordered = orderTodayCleaningTasks(tasks);
  return ordered.find((task) => !task.completed)?.id || ordered[0]?.id || "";
}

export function getAdjacentTodayCleaningTaskId(tasks = [], currentTaskId, direction = 1) {
  const ordered = orderTodayCleaningTasks(tasks);
  if (!ordered.length) return "";
  const currentIndex = ordered.findIndex((task) => task.id === currentTaskId);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (startIndex + direction + ordered.length) % ordered.length;
  return ordered[nextIndex]?.id || "";
}

export function getNextIncompleteTodayTaskId(tasks = [], currentTaskId) {
  const ordered = orderTodayCleaningTasks(tasks);
  if (!ordered.length) return "";
  const currentIndex = ordered.findIndex((task) => task.id === currentTaskId);
  const startIndex = currentIndex >= 0 ? currentIndex : -1;

  for (let offset = 1; offset <= ordered.length; offset += 1) {
    const candidate = ordered[(startIndex + offset) % ordered.length];
    if (candidate && candidate.id !== currentTaskId && !candidate.completed) {
      return candidate.id;
    }
  }

  return "";
}

export function getTodayCleaningProgress(tasks = []) {
  const ordered = orderTodayCleaningTasks(tasks);
  const total = ordered.length;
  const completed = ordered.filter((task) => task.completed).length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0
  };
}
