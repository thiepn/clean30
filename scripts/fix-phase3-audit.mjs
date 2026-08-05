import { readFileSync, writeFileSync } from "node:fs";

const path = "src/App.jsx";
const source = readFileSync(path, "utf8");
const search = `      <Routines
        routines={activeTemplate.routines}
        history={appState.history}
        activeSession={appState.activeSession}`;
const replacement = `      <Routines
        routines={activeTemplate.routines}
        history={appState.history}
        activeTemplateId={activeTemplate.id}
        activeSession={appState.activeSession}`;
const next = source.replace(search, replacement);
if (next === source) {
  throw new Error("Could not add activeTemplateId to the Routines view.");
}
writeFileSync(path, next, "utf8");
console.log("Phase 3 audit fix applied.");
