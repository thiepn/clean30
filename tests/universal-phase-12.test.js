import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildQuickCleanPlan } from "../src/utils/quickClean.js";
import {
  getLastFullRoomRoutineCompletion,
  getRoomCareStatus,
  rankRoomsForCare,
  routineCoversRoom
} from "../src/utils/roomCare.js";
import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import {
  createDefaultTemplate,
  createTemplateExport
} from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function roomRoutine(id, room, taskTitle = "Custom task") {
  return {
    id,
    title: `${room} clean`,
    archived: false,
    phases: [
      {
        id: `${id}-phase`,
        title: room,
        tasks: [
          {
            id: `${id}-task`,
            title: taskTitle,
            duration: "3 min"
          }
        ]
      }
    ]
  };
}

function completedEntry(routineId, finishedAt, percent = 100) {
  return {
    id: `history-${routineId}-${finishedAt}`,
    routineId,
    finishedAt,
    percent
  };
}

test("room coverage supports explicit custom-room sections and catalog task inference", () => {
  const guestRoom = roomRoutine("guest-room", "Guest room", "Polish dresser");
  const genericBathroom = {
    id: "bathroom-generic",
    title: "Bathroom bits",
    archived: false,
    phases: [
      {
        id: "tasks",
        title: "Tasks",
        tasks: [{ id: "toilet", title: "Clean the toilet", duration: "6 min" }]
      }
    ]
  };

  assert.equal(routineCoversRoom(guestRoom, "Guest room"), true);
  assert.equal(routineCoversRoom(genericBathroom, "Bathroom"), true);
  assert.equal(routineCoversRoom(genericBathroom, "Kitchen"), false);
});

test("archived routines do not drive room-care guidance", () => {
  const archived = { ...roomRoutine("old-kitchen", "Kitchen"), archived: true };
  assert.equal(routineCoversRoom(archived, "Kitchen"), false);
});

test("only fully completed routine sessions count as a full room clean", () => {
  const routine = roomRoutine("kitchen", "Kitchen");
  const history = [
    completedEntry("kitchen", "2026-08-07T10:00:00.000Z", 50),
    completedEntry("kitchen", "2026-08-01T10:00:00.000Z", 100)
  ];

  assert.equal(
    getLastFullRoomRoutineCompletion("Kitchen", [routine], history),
    "2026-08-01T10:00:00.000Z"
  );
});

test("room-care statuses use soft suggested check-ins rather than hard due dates", () => {
  const routines = [
    roomRoutine("kitchen", "Kitchen"),
    roomRoutine("bathroom", "Bathroom"),
    roomRoutine("bedroom", "Bedroom")
  ];
  const history = [
    completedEntry("kitchen", "2026-07-31T10:00:00.000Z"),
    completedEntry("bathroom", "2026-08-02T10:00:00.000Z"),
    completedEntry("bedroom", "2026-08-06T10:00:00.000Z")
  ];

  const kitchen = getRoomCareStatus({
    room: "Kitchen",
    routines,
    history,
    currentDateKey: "2026-08-08"
  });
  const bathroom = getRoomCareStatus({
    room: "Bathroom",
    routines,
    history,
    currentDateKey: "2026-08-08"
  });
  const bedroom = getRoomCareStatus({
    room: "Bedroom",
    routines,
    history,
    currentDateKey: "2026-08-08"
  });

  assert.equal(kitchen.status, "attention");
  assert.equal(kitchen.statusLabel, "May need attention");
  assert.equal(bathroom.status, "soon");
  assert.equal(bathroom.statusLabel, "Coming up");
  assert.equal(bedroom.status, "recent");
  assert.doesNotMatch(kitchen.detail, /overdue|required|must/i);
});

test("room-care ranking puts attention and upcoming rooms before untracked and recent rooms", () => {
  const routines = [
    roomRoutine("kitchen", "Kitchen"),
    roomRoutine("bathroom", "Bathroom"),
    roomRoutine("living", "Living room")
  ];
  const history = [
    completedEntry("kitchen", "2026-07-31T10:00:00.000Z"),
    completedEntry("bathroom", "2026-08-02T10:00:00.000Z"),
    completedEntry("living", "2026-08-07T10:00:00.000Z")
  ];

  const ranked = rankRoomsForCare({
    rooms: ["Living room", "Bedroom", "Bathroom", "Kitchen"],
    routines,
    history,
    currentDateKey: "2026-08-08"
  });

  assert.deepEqual(
    ranked.map((item) => item.status),
    ["attention", "soon", "untracked", "recent"]
  );
  assert.deepEqual(
    ranked.map((item) => item.room),
    ["Kitchen", "Bathroom", "Bedroom", "Living room"]
  );
});

test("Quick Clean uses room-care history to prioritize selected rooms when time is tight", () => {
  const routines = [
    roomRoutine("kitchen-care", "Kitchen", "Wipe kitchen counters"),
    roomRoutine("bathroom-care", "Bathroom", "Clean the bathroom sink"),
    roomRoutine("bedroom-care", "Bedroom", "Make the bed")
  ];
  const history = [
    completedEntry("kitchen-care", "2026-08-08T08:00:00.000Z"),
    completedEntry("bathroom-care", "2026-07-28T08:00:00.000Z")
  ];

  const plan = buildQuickCleanPlan({
    minutes: 10,
    rooms: ["Kitchen", "Bathroom", "Bedroom"],
    routines,
    history,
    currentDateKey: "2026-08-08"
  });

  assert.equal(plan.prioritizedRooms[0], "Bathroom");
  assert.equal(plan.prioritizedRooms[1], "Bedroom");
  assert.equal(plan.prioritizedRooms[2], "Kitchen");
  assert.ok(plan.estimatedMinutes <= 10);
  assert.equal(plan.fitsBudget, true);
});

test("history-aware Quick Clean preserves cleaning-stage execution order", () => {
  const routines = [
    roomRoutine("kitchen", "Kitchen"),
    roomRoutine("bathroom", "Bathroom")
  ];
  const history = [completedEntry("kitchen", "2026-07-20T10:00:00.000Z")];
  const plan = buildQuickCleanPlan({
    minutes: 45,
    rooms: ["Kitchen", "Bathroom"],
    routines,
    history,
    currentDateKey: "2026-08-08"
  });
  const stages = plan.items.map((item) => Number(item.stage) || 55);
  assert.deepEqual(stages, [...stages].sort((a, b) => a - b));
});

test("Home and Quick Clean expose room-care guidance without automatic scheduling", () => {
  const routines = textFile("../src/components/Routines.jsx");
  const dialog = textFile("../src/components/QuickCleanDialog.jsx");
  const care = textFile("../src/utils/roomCare.js");

  assert.match(routines, /Room care is guidance from full routine completions, not a required schedule/);
  assert.match(routines, /history=\{history\}/);
  assert.match(dialog, /Completed routines help Clean30 put less-recently covered rooms first/);
  assert.match(care, /May need attention/);
  assert.doesNotMatch(dialog, /Notification|setInterval|recurrence/i);
});

test("Phase 12 styles load after Phase 11 and preserve narrow-phone and reduced-motion safeguards", () => {
  const main = textFile("../src/main.jsx");
  const css = textFile("../src/styles/universal-phase12.css");
  const phaseEleven = main.indexOf('"./styles/universal-phase11.css"');
  const phaseTwelve = main.indexOf('"./styles/universal-phase12.css"');

  assert.ok(phaseEleven >= 0);
  assert.ok(phaseTwelve > phaseEleven);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /#ff0000|\bred\b/i);
});

test("Phase 12 stays schema-free and preserves backup, template, deployment, and persistence invariants", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");
  const templateExport = createTemplateExport(createDefaultTemplate());

  assert.equal(CURRENT_BACKUP_VERSION, 3);
  assert.equal(templateExport.version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(app, /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s);
  assert.doesNotMatch(app, /roomCareState|roomCareSchedule|roomDueDates/);
});
