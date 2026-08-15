import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createCustomLibraryItem,
  getHomeRoomNames,
  getTaskLibraryItems,
  mergeHomeRoomsWithZones
} from "../src/utils/homeLibrary.js";
import { getRoomFreshnessPresentation, getRoutineCoveredRooms } from "../src/utils/homeMotivation.js";
import { getRoomCareStatus, routineCoversRoom } from "../src/utils/roomCare.js";
import { CURRENT_BACKUP_VERSION } from "../src/utils/storage.js";
import { createDefaultTemplate, createTemplateExport } from "../src/utils/templateUtils.js";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function roomRoutine({ id = "room-clean", room = "Kitchen", archived = false } = {}) {
  return {
    id,
    title: `${room} clean`,
    archived,
    phases: [{ id: `${id}-phase`, title: room, tasks: [{ id: `${id}-task`, title: `Clean ${room}` }] }]
  };
}

test("editing Home preserves hidden legacy utility zones without exposing them as rooms", () => {
  const current = [
    { id: "kitchen-stable", name: "Kitchen" },
    { id: "bathroom-stable", name: "Bathroom" },
    { id: "floors-stable", name: "Floors" },
    { id: "other-stable", name: "Other" }
  ];
  const merged = mergeHomeRoomsWithZones(current, ["Kitchen", "Office"]);
  assert.deepEqual(getHomeRoomNames(merged), ["Kitchen", "Office"]);
  assert.equal(merged.find((zone) => zone.name === "Kitchen")?.id, "kitchen-stable");
  assert.equal(merged.find((zone) => zone.name === "Floors")?.id, "floors-stable");
  assert.equal(merged.find((zone) => zone.name === "Other")?.id, "other-stable");
  assert.equal(merged.some((zone) => zone.name === "Bathroom"), false);
});

test("a custom Task Library item remains selectable when it duplicates a built-in title", () => {
  const custom = createCustomLibraryItem("Clean the toilet", "Bathroom");
  const items = getTaskLibraryItems({ routines: [], homeRooms: ["Bathroom"], extraItems: [custom] });
  const resolved = items.find((item) => item.room === "Bathroom" && item.title === "Clean the toilet");
  assert.ok(resolved);
  assert.equal(resolved.id, custom.id);
  assert.equal(resolved.source, "custom");
  assert.equal(items.filter((item) => item.room === "Bathroom" && item.title === "Clean the toilet").length, 1);
});

test("freshness labels cannot contradict the room-care state near a threshold", () => {
  const recent = getRoomFreshnessPresentation({ status: "recent", daysSince: 6, suggestedIntervalDays: 10 });
  const soon = getRoomFreshnessPresentation({ status: "soon", daysSince: 8, suggestedIntervalDays: 10 });
  const attention = getRoomFreshnessPresentation({ status: "attention", daysSince: 12, suggestedIntervalDays: 10 });
  assert.equal(recent.label, "Looking good");
  assert.equal(recent.tone, "good");
  assert.equal(soon.label, "Could use attention");
  assert.equal(soon.tone, "soon");
  assert.equal(attention.label, "Needs attention");
  assert.equal(attention.tone, "attention");
});

test("archived routines stay excluded from maintenance guidance", () => {
  const routine = roomRoutine({ archived: true });
  const history = [{ id: "archived-history", routineId: routine.id, percent: 100, finishedAt: "2026-08-08T08:00:00.000Z" }];
  assert.equal(routineCoversRoom(routine, "Kitchen"), false);
  const care = getRoomCareStatus({ room: "Kitchen", routines: [routine], history, currentDateKey: "2026-08-08" });
  assert.equal(care.status, "untracked");
});

test("archived routine activity can still describe which rooms that routine covers", () => {
  const routine = roomRoutine({ archived: true });
  assert.equal(routineCoversRoom(routine, "Kitchen", { includeArchived: true }), true);
  assert.deepEqual(getRoutineCoveredRooms(routine, ["Kitchen", "Bathroom"]), ["Kitchen"]);
});

test("routine drag reorder delegates to the tested drop helper", () => {
  const editor = textFile("../src/components/RoutineEditorDialog.jsx");
  const library = textFile("../src/utils/routineLibrary.js");
  assert.match(editor, /moveRoutineTaskByDrop/);
  assert.match(library, /targetIndexBefore/);
  assert.match(library, /sourceIndex < targetIndexBefore/);
});

test("Restore starter always uses the current source starter instead of a stale stored default", () => {
  const app = textFile("../src/App.jsx");
  const start = app.indexOf("function resetCurrentTemplateToDefault");
  const end = app.indexOf("function exportTemplate", start);
  const resetBlock = app.slice(start, end);
  assert.match(resetBlock, /const defaultTemplate = createDefaultTemplate\(\);/);
  assert.doesNotMatch(resetBlock, /current\.templates\.find[\s\S]*clean30-default/);
  assert.match(resetBlock, /History is kept/);
});

test("Clean room cards retain native button semantics", () => {
  const clean = textFile("../src/components/CleanStartPanel.jsx");
  assert.match(clean, /className={`clean-room-button care-\$\{care\.status\}`}/);
  assert.match(clean, /type="button"/);
  assert.match(clean, /aria-label="Choose a room to clean"/);
  assert.doesNotMatch(clean, /role="listitem"/);
});

test("Phase 15 data-integrity fixes remain schema-free", () => {
  const app = textFile("../src/App.jsx");
  const vite = textFile("../vite.config.js");
  assert.equal(CURRENT_BACKUP_VERSION, 3);
  assert.equal(createTemplateExport(createDefaultTemplate()).version, 2);
  assert.match(vite, /base:\s*["']\/clean30\/["']/);
  assert.match(app, /useEffect\(\(\) => \{\s*saveAppState\(appState\);\s*\}, \[appState\]\);/s);
});
