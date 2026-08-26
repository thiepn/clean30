import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildConfiguredTasks,
  buildGuestPlan,
  buildRoomPlan,
  buildTodayPlan,
  buildWeeklyReset,
  completeSession,
  createFreshV2State,
  createCustomTask,
  createRoom,
  createSession,
  createV2Backup,
  futureTasks,
  loadV2StateResult,
  normalizeV2State,
  overdueTasks,
  saveV2State,
  taskCatalog,
  tasksForRoom,
  validateV2Backup
} from "../src/v2/model.js";

const today = "2026-08-26";
const kitchen = {
  id: "room-kitchen",
  type: "kitchen",
  name: "Kitchen",
  features: ["oven", "microwave", "refrigerator"]
};
const bathroom = {
  id: "room-bathroom",
  type: "bathroom",
  name: "Main bathroom",
  features: ["toilet", "shower", "mirror"]
};

function configuredState() {
  return normalizeV2State({
    version: 2,
    onboardingComplete: true,
    homeName: "Our home",
    rooms: [kitchen, bathroom],
    tasks: buildConfiguredTasks([kitchen, bathroom], [3], today),
    cleanDays: [3],
    scheduleStyle: "one-day",
    history: []
  });
}

test("the catalog contains substantive recurring cleaning rather than time-filler prompts", () => {
  assert.ok(taskCatalog.length >= 50);
  assert.ok(taskCatalog.every((item) => item.cadence >= 7));
  const titles = taskCatalog.map((item) => item.title.toLowerCase()).join(" ");
  assert.doesNotMatch(titles, /open (a |the )?window|five minutes|5 minutes/);
  assert.match(titles, /toilet/);
  assert.match(titles, /oven/);
  assert.match(titles, /refrigerator/);
});

test("room features control which real tasks are created", () => {
  const withoutOven = tasksForRoom({ ...kitchen, features: ["microwave"] });
  assert.ok(withoutOven.some((item) => item.key === "kitchen-microwave"));
  assert.ok(!withoutOven.some((item) => item.key === "kitchen-oven"));
  assert.ok(withoutOven.some((item) => item.key === "kitchen-floor"));
});

test("a home can add its own recurring room task", () => {
  const custom = createCustomTask(kitchen, "Clean the coffee machine", 30, [3], today);
  const normalized = normalizeV2State({
    ...configuredState(),
    tasks: [...configuredState().tasks, custom]
  });
  const saved = normalized.tasks.find((item) => item.id === custom.id);
  assert.equal(saved.title, "Clean the coffee machine");
  assert.equal(saved.roomId, kitchen.id);
  assert.equal(saved.cadence, 30);
  assert.equal(saved.custom, true);
});

test("today is derived automatically from due dates", () => {
  const state = configuredState();
  const dueId = state.tasks[0].id;
  state.tasks = state.tasks.map((item, index) => ({
    ...item,
    nextDue: index === 0 ? today : "2026-09-02"
  }));
  assert.deepEqual(buildTodayPlan(state, today).map((item) => item.id), [dueId]);
});

test("the recommended setup starts small instead of enabling the entire catalog", () => {
  const rooms = ["kitchen", "bathroom", "bedroom", "living"].reduce(
    (current, type) => [...current, createRoom(type, current)],
    []
  );
  const tasks = buildConfiguredTasks(rooms, [2, 4, 6], today);
  assert.equal(tasks.length, 30);
  assert.equal(tasks.filter((item) => item.enabled).length, 12);
});

test("automatic modes are capped and prioritize the oldest due work", () => {
  const state = configuredState();
  state.tasks = state.tasks.map((item, index) => ({
    ...item,
    enabled: true,
    essential: true,
    nextDue: index === state.tasks.length - 1 ? "2026-01-01" : `2026-08-${String(1 + index % 20).padStart(2, "0")}`
  }));
  const todayPlan = buildTodayPlan(state, today);
  assert.equal(todayPlan.length, 8);
  assert.equal(todayPlan[0].id, state.tasks.at(-1).id);
  assert.ok(buildWeeklyReset(state).length <= 12);
  assert.ok(buildGuestPlan(state).length <= 12);
});

test("purposeful modes are derived from the configured home", () => {
  const state = configuredState();
  assert.ok(buildWeeklyReset(state).length > 0);
  assert.ok(buildWeeklyReset(state).every((item) => item.cadence <= 14));
  assert.ok(buildGuestPlan(state).length > 0);
  assert.ok(buildGuestPlan(state).every((item) => item.guest));
  assert.ok(buildRoomPlan(state, kitchen.id).every((item) => item.roomId === kitchen.id));
});

test("finishing a clean reschedules completed work and leaves skipped work due", () => {
  const state = configuredState();
  const selected = state.tasks.slice(0, 2).map((item) => ({ ...item, nextDue: today }));
  state.tasks = state.tasks.map((item) => selected.find((selectedItem) => selectedItem.id === item.id) || item);
  const session = createSession("Today's clean", "today", selected);
  session.items[0].done = true;
  session.items[1].skipped = true;
  const result = completeSession(state, session, "2026-08-26T12:00:00.000Z");
  const completed = result.tasks.find((item) => item.id === session.items[0].id);
  const skipped = result.tasks.find((item) => item.id === session.items[1].id);
  assert.notEqual(completed.nextDue, today);
  assert.equal(skipped.nextDue, today);
  assert.equal(result.history.at(-1).completedCount, 1);
  assert.equal(result.activeSession, null);
});

test("a clean with only skipped tasks does not create a misleading history entry", () => {
  const state = configuredState();
  const session = createSession("Skipped clean", "today", state.tasks.slice(0, 2));
  session.items.forEach((item) => { item.skipped = true; });
  const result = completeSession(state, session, "2026-08-26T12:00:00.000Z");
  assert.equal(result.history.length, 0);
  assert.equal(result.activeSession, null);
});

test("corrupt or stale active sessions are discarded while valid progress is normalized", () => {
  const state = configuredState();
  assert.equal(normalizeV2State({ ...state, activeSession: { id: "bad", title: "Bad", items: [{ id: "missing", title: "Missing" }] } }).activeSession, null);
  const valid = createSession("Kitchen", "room", state.tasks.slice(0, 2));
  valid.currentIndex = 99;
  valid.items[0].done = true;
  valid.items[0].skipped = true;
  const normalized = normalizeV2State({ ...state, activeSession: valid }).activeSession;
  assert.equal(normalized.currentIndex, 1);
  assert.equal(normalized.items[0].done, true);
  assert.equal(normalized.items[0].skipped, false);
});

test("the plan exposes overdue, near-term, and long-term work without overlap", () => {
  const state = configuredState();
  state.tasks = state.tasks.slice(0, 4).map((item, index) => ({
    ...item,
    enabled: true,
    nextDue: ["2026-08-20", "2026-08-26", "2026-09-10", "2026-10-10"][index]
  }));
  assert.deepEqual(overdueTasks(state, today).map((item) => item.nextDue), ["2026-08-20"]);
  assert.deepEqual(futureTasks(state, 0, 6, today).map((item) => item.nextDue), ["2026-08-26"]);
  assert.deepEqual(futureTasks(state, 7, 30, today).map((item) => item.nextDue), ["2026-09-10"]);
  assert.deepEqual(futureTasks(state, 31, Infinity, today).map((item) => item.nextDue), ["2026-10-10"]);
});

test("storage failures recover safely and report that data was not persisted", () => {
  const previousWindow = globalThis.window;
  try {
    globalThis.window = { localStorage: {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("full"); }
    } };
    const loaded = loadV2StateResult();
    assert.deepEqual(loaded.state, createFreshV2State());
    assert.match(loaded.error, /could not read saved data/i);
    const saved = saveV2State(configuredState());
    assert.equal(saved.ok, false);
    assert.match(saved.error, /could not be saved/i);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("completed work returns on a configured cleaning day", () => {
  const state = configuredState();
  const selected = [{ ...state.tasks[0], nextDue: "2026-08-27" }];
  state.tasks = state.tasks.map((item) => item.id === selected[0].id ? selected[0] : item);
  const session = createSession("Kitchen", "room", selected);
  session.items[0].done = true;
  const result = completeSession(state, session, "2026-08-27T12:00:00.000Z");
  const rescheduled = result.tasks.find((item) => item.id === selected[0].id);
  assert.equal(new Date(`${rescheduled.nextDue}T12:00:00`).getDay(), 3);
});

test("v2 backup data validates and normalizes", () => {
  const backup = createV2Backup(configuredState());
  assert.equal(validateV2Backup(backup), true);
  assert.equal(normalizeV2State(backup.data).onboardingComplete, true);
  assert.equal(validateV2Backup({ ...backup, version: 99 }), false);
});

test("the shipped interface is the home-plan redesign", async () => {
  const [main, app] = await Promise.all([
    readFile(new URL("../src/main.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/v2/AppV2.jsx", import.meta.url), "utf8")
  ]);
  assert.match(main, /\.\/v2\/AppV2\.jsx/);
  assert.match(app, /Start today(?:’|')s clean/);
  assert.match(app, /Weekly reset/);
  assert.match(app, /Guests are coming/);
  assert.match(app, /Home.*Plan.*Settings/s);
  assert.match(app, /Discard clean/);
  assert.match(app, /Review choices/);
  assert.match(app, /onEditSetup\(1\).*onEditSetup\(3\).*onEditSetup\(4\)/s);
  assert.match(app, /function useModalFocus/);
  assert.match(app, /inert=\{backgroundInert \? true : undefined\}/);
  assert.doesNotMatch(app, /5 minutes|10 minutes|15 minutes|Quick Start|Routines/);
  assert.doesNotMatch(main, /^import ["']\.\/styles(?:\.css|\/universal-)/m);
});
