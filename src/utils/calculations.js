import { daysBetween } from "./dates.js";
import { cloneDeep } from "./templateUtils.js";

export function getRoutineById(routines, routineId) {
  return (routines || []).find((routine) => routine.id === routineId);
}

export function getRoutineTaskIds(routine) {
  return routine?.phases?.flatMap((phase) => phase.tasks.map((task) => task.id)) || [];
}

export function getRoutineTotalTasks(routine) {
  return getRoutineTaskIds(routine).length;
}

export function createSession(routine, template) {
  const now = new Date().toISOString();
  return {
    id: `session-${Date.now()}`,
    routineId: routine.id,
    templateId: template.id,
    startedAt: now,
    completedTaskIds: [],
    notes: "",
    routineSnapshot: cloneDeep(routine)
  };
}

export function getSessionProgress(session, routine) {
  const routineSource = routine || session?.routineSnapshot;
  if (!session || !routineSource) {
    return { completed: 0, total: 0, percent: 0 };
  }
  const total = getRoutineTotalTasks(routineSource);
  const validIds = new Set(getRoutineTaskIds(routineSource));
  const completed = new Set((session.completedTaskIds || []).filter((id) => validIds.has(id))).size;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function createHistoryEntry(session, template) {
  const finishedAt = new Date().toISOString();
  const routine = session.routineSnapshot;
  const progress = getSessionProgress(session, routine);
  return {
    id: `history-${Date.now()}`,
    routineId: session.routineId,
    routineTitle: routine?.title || "Routine",
    templateId: session.templateId || template?.id || null,
    templateName: template?.name || "",
    startedAt: session.startedAt,
    finishedAt,
    completedTasks: progress.completed,
    totalTasks: progress.total,
    percent: progress.percent,
    notes: session.notes || ""
  };
}

export function getLastCompleted(history, routineId) {
  return history
    .filter((entry) => entry.routineId === routineId)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))[0]?.finishedAt || null;
}

export function getDashboardStatus({ history, template, dailyProgress }) {
  const weeklyDate = getLastCompleted(history, "weekly-reset");
  const monthlyDate = getLastCompleted(history, "monthly-deep-clean");
  const weeklyDueAfter = Number(template.schedule.weeklyResetDueAfterDays) || 7;
  const monthlyInterval = Number(template.schedule.monthlyDeepCleanInterval) || 30;
  const weeklyAge = daysBetween(weeklyDate);
  const monthlyAge = daysBetween(monthlyDate);

  if (!weeklyDate || weeklyAge > weeklyDueAfter) {
    return {
      status: "Weekly reset due",
      tone: "warning",
      explanation: `The weekly anchor has not been completed in the last ${weeklyDueAfter} days.`
    };
  }

  if (!monthlyDate || monthlyAge > monthlyInterval) {
    return {
      status: "Monthly deep clean due",
      tone: "amber",
      explanation: `Monthly maintenance is due after ${monthlyInterval} days.`
    };
  }

  if (dailyProgress.completed < dailyProgress.total) {
    return {
      status: "Stable, finish daily rules",
      tone: "stable",
      explanation: "The apartment is on track. Finish the tiny rules to prevent drift."
    };
  }

  return {
    status: "Stable",
    tone: "success",
    explanation: "No full clean needed. Maintain the system and keep the bottlenecks clear."
  };
}

export function getRecommendedAction(status, dailyProgress) {
  if (status.status === "Weekly reset due") {
    return {
      label: "Start Weekly Reset",
      routineId: "weekly-reset",
      detail: "Use the laundry cycle as the anchor and clear the bottlenecks first."
    };
  }
  if (status.status === "Monthly deep clean due") {
    return {
      label: "Start Monthly Deep Clean",
      routineId: "monthly-deep-clean",
      detail: "Handle monthly maintenance without turning it into a weekly burden."
    };
  }
  if (dailyProgress.completed < dailyProgress.total) {
    return {
      label: "Finish Daily Rules",
      routineId: "daily-rules",
      detail: "Spend five minutes keeping trash, dishes, clothes, and bathroom smell controlled."
    };
  }
  return {
    label: "Maintain. No full clean needed.",
    routineId: null,
    detail: "The system is stable. Avoid over-cleaning."
  };
}

export function getHistoryStats(history) {
  const total = history.length;
  const average = total
    ? Math.round(history.reduce((sum, entry) => sum + (entry.percent || 0), 0) / total)
    : 0;
  return {
    total,
    weekly: history.filter((entry) => entry.routineId === "weekly-reset").length,
    minimal: history.filter((entry) => entry.routineId === "minimal-reset").length,
    monthly: history.filter((entry) => entry.routineId === "monthly-deep-clean").length,
    average,
    daysSinceWeekly: daysBetween(getLastCompleted(history, "weekly-reset")),
    daysSinceMonthly: daysBetween(getLastCompleted(history, "monthly-deep-clean"))
  };
}
