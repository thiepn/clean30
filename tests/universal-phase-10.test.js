import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createRoutineDraftFromLibraryItems,
  getHomeRoomNames,
  getRecommendedTaskIdsForRoom,
  getTaskLibraryItems,
  mergeHomeRoomsWithZones
} from "../src/utils/homeLibrary.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Home treats real rooms separately from old utility zones", () => {
  const rooms = getHomeRoomNames([
    { id: "k", name: "Kitchen" },
    { id: "f", name: "Floors" },
    { id: "o", name: "Other" },
    { id: "b", name: "Bathroom" },
    { id: "k2", name: " kitchen " }
  ]);
  assert.deepEqual(rooms, ["Kitchen", "Bathroom"]);
});

test("editing Home preserves existing room IDs and adds new rooms without touching routine data", () => {
  const zones = [
    { id: "kitchen-stable", name: "Kitchen" },
    { id: "bath-stable", name: "Bathroom" }
  ];
  const next = mergeHomeRoomsWithZones(zones, ["Kitchen", "Office"]);
  assert.equal(next.length, 2);
  assert.equal(next.find((room) => room.name === "Kitchen")?.id, "kitchen-stable");
  assert.ok(next.find((room) => room.name === "Office")?.id);
  assert.notEqual(next.find((room) => room.name === "Office")?.id, "kitchen-stable");
});

test("Task Library limits built-in room suggestions to the configured home", () => {
  const items = getTaskLibraryItems({
    routines: [],
    homeRooms: ["Kitchen", "Bedroom"]
  });
  assert.ok(items.some((item) => item.room === "Kitchen"));
  assert.ok(items.some((item) => item.room === "Bedroom"));
  assert.ok(items.some((item) => item.room === "Whole home"));
  assert.equal(items.some((item) => item.room === "Bathroom"), false);
  assert.equal(items.some((item) => item.room === "Balcony"), false);
});

test("existing routine tasks are reused by Task Library instead of becoming dead data", () => {
  const routines = [
    {
      id: "my-routine",
      title: "Workday reset",
      phases: [
        {
          id: "office",
          title: "Office",
          tasks: [{ id: "custom-monitor", title: "Organize charging cables", duration: "4 min" }]
        }
      ]
    }
  ];
  const items = getTaskLibraryItems({ routines, homeRooms: ["Kitchen", "Office"] });
  const item = items.find((entry) => entry.title === "Organize charging cables");
  assert.ok(item);
  assert.equal(item.room, "Office");
  assert.equal(item.source, "routine");
  assert.equal(item.sourceLabel, "Workday reset");
});

test("recommended room packs stay bounded and room-specific", () => {
  const ids = getRecommendedTaskIdsForRoom("Kitchen", ["Kitchen", "Bathroom"], []);
  const kitchenItems = getTaskLibraryItems({
    routines: [],
    homeRooms: ["Kitchen", "Bathroom"],
    room: "Kitchen"
  });
  assert.ok(ids.length >= 5);
  assert.ok(ids.length <= 10);
  assert.ok(ids.every((id) => kitchenItems.some((item) => item.id === id)));
});

test("Task Library selections become a structured editable routine draft", () => {
  const items = [
    { id: "1", title: "Wipe kitchen counters", room: "Kitchen", minutes: 4 },
    { id: "2", title: "Clean the kitchen sink", room: "Kitchen", minutes: 4 },
    { id: "3", title: "Clean the toilet", room: "Bathroom", minutes: 6 }
  ];
  const draft = createRoutineDraftFromLibraryItems(items);
  assert.equal(draft.phases.length, 2);
  assert.deepEqual(draft.phases.map((phase) => phase.title), ["Kitchen", "Bathroom"]);
  assert.equal(draft.phases.flatMap((phase) => phase.tasks).length, 3);
  assert.ok(draft.estimatedMinutes >= 14);
  assert.ok(draft.phases.every((phase) => phase.tasks.every((task) => task.id && task.title)));
});

test("Routines exposes room-first cleaning and the reusable Task Library", () => {
  const routines = textFile("../src/components/Routines.jsx");
  const library = textFile("../src/components/TaskLibraryDialog.jsx");
  const home = textFile("../src/components/HomeRoomsDialog.jsx");
  assert.match(routines, /Start with the room, not the setup/);
  assert.match(routines, /Task library/);
  assert.match(routines, /Edit rooms/);
  assert.match(routines, /Choose a quick whole-home reset/);
  assert.match(library, /Select recommended/);
  assert.match(library, /Add to Today/);
  assert.match(library, /Build routine/);
  assert.match(library, /Missing something\?/);
  assert.match(home, /Removing a room here only changes Home and Task Library suggestions/);
  assert.match(home, /does not delete routines or Progress/);
});

test("App connects Home through existing zones and Today through existing task state", () => {
  const app = textFile("../src/App.jsx");
  assert.match(app, /zones=\{activeTemplate\.zones\}/);
  assert.match(app, /onSaveHomeRooms=\{saveHomeRooms\}/);
  assert.match(app, /onAddLibraryTasksToToday=\{addLibraryTasksToToday\}/);
  assert.match(app, /zones: mergeHomeRoomsWithZones\(template\.zones, roomNames\)/);
  assert.match(app, /createTodayTask\(title, dateKey\)/);
  assert.match(app, /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s);
});

test("fresh Home starts with actual rooms rather than utility categories", () => {
  const starter = textFile("../src/data/starterData.js");
  const start = starter.indexOf("export const starterZones");
  const end = starter.indexOf("export const starterSystems");
  const zoneBlock = starter.slice(start, end);
  assert.match(zoneBlock, /Kitchen/);
  assert.match(zoneBlock, /Bathroom/);
  assert.doesNotMatch(zoneBlock, /Floors/);
  assert.doesNotMatch(zoneBlock, /Other/);
});

test("Phase 10 styling loads last and keeps mobile dialogs full-screen", () => {
  const main = textFile("../src/main.jsx");
  const phaseNine = main.indexOf('"./styles/universal-phase9.css"');
  const phaseTen = main.indexOf('"./styles/universal-phase10.css"');
  const css = textFile("../src/styles/universal-phase10.css");
  assert.ok(phaseNine >= 0);
  assert.ok(phaseTen > phaseNine);
  assert.match(css, /task-library-dialog/);
  assert.match(css, /home-room-grid/);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
