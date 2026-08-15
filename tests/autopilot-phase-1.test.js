import test from "node:test";
import assert from "node:assert/strict";

import {
  CURRENT_BACKUP_VERSION,
  createFullBackup,
  normalizeAppState,
  resetToFreshState,
  validateFullBackupPayload
} from "../src/utils/storage.js";
import {
  createDefaultMaintenanceTasks,
  findMaintenanceTaskIdForTodayTask,
  recordMaintenanceCompletion
} from "../src/utils/maintenanceTasks.js";
import { createDefaultTemplate } from "../src/utils/templateUtils.js";

test("fresh state seeds canonical cleaning tasks for configured rooms", () => {
  const state = resetToFreshState();
  const tasks = state.maintenanceTasksByTemplate[state.activeTemplateId];
  assert.ok(tasks.length > 20);
  assert.ok(
    tasks.some(
      (task) => task.room === "Kitchen" && task.title === "Wipe kitchen counters"
    )
  );
  assert.ok(
    tasks.some(
      (task) => task.room === "Bathroom" && task.title === "Clean the toilet"
    )
  );
  assert.ok(tasks.every((task) => Number.isInteger(task.estimatedMinutes)));
  assert.ok(
    tasks.every((task) =>
      ["interval", "weekdays", "on-demand"].includes(task.frequencyMode)
    )
  );
});

test("catalog task IDs are deterministic across fresh generation", () => {
  const template = createDefaultTemplate();
  const first = createDefaultMaintenanceTasks(template.zones);
  const second = createDefaultMaintenanceTasks(template.zones);
  assert.deepEqual(
    first.map((task) => task.id),
    second.map((task) => task.id)
  );
});

test("v4 full backups require and preserve canonical maintenance state", () => {
  const state = resetToFreshState();
  const backup = createFullBackup(state);
  assert.equal(CURRENT_BACKUP_VERSION, 4);
  assert.equal(backup.version, 4);
  const validated = validateFullBackupPayload(backup);
  assert.equal(validated.ok, true);
  assert.deepEqual(
    validated.data.maintenanceTasksByTemplate,
    state.maintenanceTasksByTemplate
  );
});

test("older v3 backups migrate forward without losing normal app data", () => {
  const state = resetToFreshState();
  const backup = createFullBackup(state);
  backup.version = 3;
  delete backup.data.maintenanceTasksByTemplate;
  delete backup.data.maintenanceCompletions;
  const result = validateFullBackupPayload(backup);
  assert.equal(result.ok, true);
  assert.ok(
    result.data.maintenanceTasksByTemplate[result.data.activeTemplateId].length >
      20
  );
  assert.ok(Array.isArray(result.data.maintenanceCompletions));
});

test("completed legacy Today tasks seed task-level cleaning history", () => {
  const base = resetToFreshState();
  const dateKey = "2026-08-15";
  const raw = {
    ...base,
    todayTasksByDate: {
      [dateKey]: [
        {
          id: "today-kitchen-counter",
          defaultTaskId: null,
          text: "Wipe kitchen counters",
          completed: true,
          source: "custom",
          note: "Room: Kitchen",
          tags: [],
          routineId: null,
          routineName: "",
          originalTaskId: null,
          createdAt: `${dateKey}T10:00:00.000Z`,
          completedAt: `${dateKey}T10:04:00.000Z`
        }
      ]
    }
  };
  delete raw.maintenanceCompletions;
  const normalized = normalizeAppState(raw);
  const tasks =
    normalized.maintenanceTasksByTemplate[normalized.activeTemplateId];
  const task = tasks.find(
    (item) =>
      item.title === "Wipe kitchen counters" && item.room === "Kitchen"
  );
  assert.ok(task);
  assert.ok(
    normalized.maintenanceCompletions.some((entry) => entry.taskId === task.id)
  );
});

test("Today matching prefers explicit room context", () => {
  const template = createDefaultTemplate();
  const maintenanceTasks = createDefaultMaintenanceTasks(template.zones);
  const maintenanceTemplate = { ...template, maintenanceTasks };
  const id = findMaintenanceTaskIdForTodayTask(maintenanceTemplate, {
    text: "Clean the bathroom mirror",
    note: "Room: Bathroom",
    source: "custom"
  });
  assert.equal(
    id,
    maintenanceTasks.find(
      (task) => task.title === "Clean the bathroom mirror"
    )?.id
  );
});

test("same source completion replaces instead of double counting", () => {
  const task = createDefaultMaintenanceTasks([{ name: "Kitchen" }]).find(
    (item) => item.title === "Wipe kitchen counters"
  );
  let entries = recordMaintenanceCompletion([], {
    templateId: "clean30-default",
    taskId: task.id,
    completedAt: "2026-08-15T10:00:00.000Z",
    source: "today",
    sourceId: "today:2026-08-15:counter"
  });
  entries = recordMaintenanceCompletion(entries, {
    templateId: "clean30-default",
    taskId: task.id,
    completedAt: "2026-08-15T10:01:00.000Z",
    source: "today",
    sourceId: "today:2026-08-15:counter"
  });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].completedAt, "2026-08-15T10:01:00.000Z");
});
