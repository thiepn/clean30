import { daysBetween } from "./dates.js";
import { cloneDeep } from "./templateUtils.js";

const weekdayIndexes = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

function daysUntilWeekday(dayName, date = new Date()) {
  const target = weekdayIndexes[dayName];
  if (target === undefined) return null;
  return (target - date.getDay() + 7) % 7;
}

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

function estimateDailyRuleMinutes(dailyRules) {
  return (dailyRules || []).reduce((total, rule) => {
    const match = String(rule.duration || "").match(/(\d+(?:\.\d+)?)/);
    return total + (match ? Number(match[1]) : 0);
  }, 0);
}

export function createDailyRulesHistoryEntry({ dateKey, dailyRules, template }) {
  const completedAt = new Date().toISOString();
  const totalTasks = dailyRules.length;
  return {
    id: `daily-rules-${dateKey}`,
    kind: "daily-rules",
    source: "daily-rules",
    date: dateKey,
    completedAt,
    routineId: "daily-rules",
    routineTitle: "Daily Rules",
    templateId: template?.id || null,
    templateName: template?.name || "",
    startedAt: completedAt,
    finishedAt: completedAt,
    completedTasks: totalTasks,
    totalTasks,
    percent: totalTasks ? 100 : 0,
    estimatedDurationMinutes: estimateDailyRuleMinutes(dailyRules),
    notes: "Completed from Dashboard daily rules."
  };
}

export function hasDailyRulesHistoryEntry(history, dateKey) {
  return (history || []).some(
    (entry) =>
      entry?.id === `daily-rules-${dateKey}` ||
      ((entry?.kind === "daily-rules" || entry?.source === "daily-rules") &&
        entry?.date === dateKey)
  );
}

export function isDailyRulesHistoryEntry(entry) {
  return entry?.kind === "daily-rules" || entry?.source === "daily-rules";
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
  const daysUntilWeekly = daysUntilWeekday(template.schedule.weeklyResetDay);
  const weeklyAge = daysBetween(weeklyDate);
  const monthlyAge = daysBetween(monthlyDate);

  if (!weeklyDate) {
    if (daysUntilWeekly === 0) {
      return {
        status: "Weekly reset due today",
        key: "weekly-today",
        kind: "weekly",
        tone: "warning",
        explanation: "Today is the weekly reset day. Start only if it fits your day."
      };
    }

    if (daysUntilWeekly === 1) {
      return {
        status: "Weekly reset tomorrow",
        key: "weekly-tomorrow",
        kind: "weekly",
        tone: "amber",
        explanation: "The weekly reset day is tomorrow. Keep today light and practical."
      };
    }

    return {
      status: "Ready to start",
      key: "ready-to-start",
      kind: "ready",
      tone: "stable",
      explanation: "No reset history yet. Use Tiny Rules or start a reset when you are ready."
    };
  }

  if (weeklyAge > weeklyDueAfter) {
    if (daysUntilWeekly === 0) {
      return {
        status: "Weekly reset due today",
        key: "weekly-today",
        kind: "weekly",
        tone: "warning",
        explanation: "Today is the weekly reset day. Use the reset if the apartment needs it."
      };
    }

    if (daysUntilWeekly === 1) {
      return {
        status: "Weekly reset tomorrow",
        key: "weekly-tomorrow",
        kind: "weekly",
        tone: "amber",
        explanation: "The weekly reset day is tomorrow. Keep today light unless there is drift."
      };
    }

    return {
      status: "Weekly reset overdue",
      key: "weekly-overdue",
      kind: "weekly",
      tone: "warning",
      explanation: `The weekly anchor was last completed ${weeklyAge} days ago.`
    };
  }

  if (!monthlyDate || monthlyAge > monthlyInterval) {
    return {
      status: "Monthly deep clean due",
      tone: "amber",
      explanation: `Monthly maintenance is due after ${monthlyInterval} days.`
    };
  }

  if (weeklyAge !== null && weeklyAge <= weeklyDueAfter) {
    return {
      status: "Weekly reset handled",
      key: "weekly-handled",
      kind: "weekly",
      tone: dailyProgress.completed < dailyProgress.total ? "stable" : "success",
      explanation:
        dailyProgress.completed < dailyProgress.total
          ? "The weekly anchor is in good shape. Finish Tiny Rules to maintain it."
          : "The weekly anchor is current. Keep the bottlenecks clear."
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

export function getRecommendedAction(status, dailyProgress, options = {}) {
  const daysUntilWeekly = daysUntilWeekday(options.template?.schedule?.weeklyResetDay, options.date);

  if (status.kind === "weekly" && status.key !== "weekly-handled") {
    if (daysUntilWeekly === 1) {
      return {
        key: "weekly-reset-upcoming",
        label: "Upcoming: Weekly Reset tomorrow",
        routineId: null,
        detail:
          "Your weekly reset day is tomorrow. Keep today light unless the apartment needs attention."
      };
    }

    if (status.key === "weekly-today" || status.key === "weekly-overdue") {
      return {
        key: status.key === "weekly-today" ? "weekly-reset-today" : "weekly-reset-overdue",
        label: "Start Weekly Reset",
        routineId: "weekly-reset",
        detail: "Use the laundry cycle as the anchor and clear the bottlenecks first."
      };
    }

    if (daysUntilWeekly && daysUntilWeekly > 1) {
      return {
        key: "weekly-reset-scheduled",
        label: "Weekly Reset scheduled",
        routineId: null,
        detail: `Your weekly reset day is in ${daysUntilWeekly} days. Keep today light unless the apartment needs attention.`
      };
    }
  }

  if (status.key === "ready-to-start") {
    return {
      key: "ready-to-start",
      label: "Start small",
      routineId: null,
      detail: "Begin with Tiny Rules or choose a reset when the apartment needs one."
    };
  }
  if (status.status === "Monthly deep clean due") {
    return {
      key: "monthly-deep-clean-due",
      label: "Start Monthly Deep Clean",
      routineId: "monthly-deep-clean",
      detail: "Handle monthly maintenance without turning it into a weekly burden."
    };
  }
  if (dailyProgress.completed < dailyProgress.total) {
    return {
      key: "daily-rules-incomplete",
      label: "Finish Daily Rules",
      routineId: "daily-rules",
      detail: "Spend five minutes keeping trash, dishes, clothes, and bathroom smell controlled."
    };
  }
  return {
    key: "stable",
    label: "Maintain. No full clean needed.",
    routineId: null,
    detail: "The system is stable. Avoid over-cleaning."
  };
}

export function getHistoryStats(history) {
  const sessionEntries = history.filter((entry) => !isDailyRulesHistoryEntry(entry));
  const total = sessionEntries.length;
  const average = total
    ? Math.round(sessionEntries.reduce((sum, entry) => sum + (entry.percent || 0), 0) / total)
    : 0;
  return {
    total,
    dailyRules: history.filter((entry) => isDailyRulesHistoryEntry(entry)).length,
    weekly: sessionEntries.filter((entry) => entry.routineId === "weekly-reset").length,
    minimal: sessionEntries.filter((entry) => entry.routineId === "minimal-reset").length,
    monthly: sessionEntries.filter((entry) => entry.routineId === "monthly-deep-clean").length,
    average,
    daysSinceWeekly: daysBetween(getLastCompleted(history, "weekly-reset")),
    daysSinceMonthly: daysBetween(getLastCompleted(history, "monthly-deep-clean"))
  };
}
