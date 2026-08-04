import { readFileSync, writeFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) {
    throw new Error(`Phase 3 replacement failed: ${label}`);
  }
  return next;
}

function lines(...items) {
  return items.join("\n");
}

let app = read("src/App.jsx");
app = replaceOnce(
  app,
  lines(
    'import {',
    '  createDefaultTemplate,',
    '  createTemplateExport,',
    '  normalizeTemplate,',
    '  validateTemplatePayload',
    '} from "./utils/templateUtils.js";'
  ),
  lines(
    'import {',
    '  createDefaultTemplate,',
    '  createTemplateExport,',
    '  normalizeTemplate,',
    '  validateTemplatePayload',
    '} from "./utils/templateUtils.js";',
    'import {',
    '  duplicateRoutineForLibrary,',
    '  sanitizeRoutineDraft',
    '} from "./utils/routineLibrary.js";'
  ),
  "App routine library import"
);
app = replaceOnce(
  app,
  '  const [pendingCompletionSessionId, setPendingCompletionSessionId] = useState(null);',
  lines(
    '  const [pendingCompletionSessionId, setPendingCompletionSessionId] = useState(null);',
    '  const [autoOpenCleanModeSessionId, setAutoOpenCleanModeSessionId] = useState(null);'
  ),
  "App auto-open state"
);

const appRoutineHandlers = lines(
  '  function saveRoutineFromLibrary(routineDraft) {',
  '    const savedRoutine = sanitizeRoutineDraft(routineDraft);',
  '    const exists = activeTemplate.routines.some(',
  '      (routine) => routine.id === savedRoutine.id',
  '    );',
  '    updateActiveTemplate((template) => ({',
  '      ...template,',
  '      routines: exists',
  '        ? template.routines.map((routine) =>',
  '            routine.id === savedRoutine.id ? savedRoutine : routine',
  '          )',
  '        : [...template.routines, savedRoutine]',
  '    }));',
  '    setSelectedRoutineId(savedRoutine.id);',
  '    return savedRoutine.id;',
  '  }',
  '',
  '  function duplicateRoutineFromLibrary(routineId) {',
  '    const routine = getRoutineById(activeTemplate.routines, routineId);',
  '    if (!routine) return "";',
  '    const duplicate = duplicateRoutineForLibrary(',
  '      routine,',
  '      activeTemplate.routines',
  '        .filter((item) => item.id !== "daily-rules")',
  '        .map((item) => item.title)',
  '    );',
  '    updateActiveTemplate((template) => ({',
  '      ...template,',
  '      routines: [...template.routines, duplicate]',
  '    }));',
  '    setSelectedRoutineId(duplicate.id);',
  '    return duplicate.id;',
  '  }',
  '',
  '  function toggleRoutineArchiveFromLibrary(routineId) {',
  '    const routine = getRoutineById(activeTemplate.routines, routineId);',
  '    if (!routine) return;',
  '    if (',
  '      appState.activeSession?.templateId === activeTemplate.id &&',
  '      appState.activeSession?.routineId === routineId',
  '    ) {',
  '      requestConfirmation({',
  '        title: "Routine is in use",',
  '        message: `"${routine.title}" is used by the current clean. Finish or discard it before changing this routine.`,',
  '        confirmLabel: "Keep routine",',
  '        onConfirm: () => {}',
  '      });',
  '      return;',
  '    }',
  '',
  '    const applyArchive = () =>',
  '      updateActiveTemplate((template) => ({',
  '        ...template,',
  '        routines: template.routines.map((item) =>',
  '          item.id === routineId',
  '            ? { ...item, archived: !routine.archived }',
  '            : item',
  '        )',
  '      }));',
  '',
  '    if (routine.archived) {',
  '      applyArchive();',
  '      return;',
  '    }',
  '',
  '    requestConfirmation({',
  '      title: "Archive routine?",',
  '      message: `"${routine.title}" will be hidden from the main routine list. Progress is kept.`,',
  '      confirmLabel: "Archive routine",',
  '      onConfirm: applyArchive',
  '    });',
  '  }',
  '',
  '  function deleteRoutineFromLibrary(routineId) {',
  '    const routine = getRoutineById(activeTemplate.routines, routineId);',
  '    if (!routine) return;',
  '    if (',
  '      appState.activeSession?.templateId === activeTemplate.id &&',
  '      appState.activeSession?.routineId === routineId',
  '    ) {',
  '      requestConfirmation({',
  '        title: "Routine is in use",',
  '        message: `"${routine.title}" is used by the current clean. Finish or discard it before deleting this routine.`,',
  '        confirmLabel: "Keep routine",',
  '        onConfirm: () => {}',
  '      });',
  '      return;',
  '    }',
  '',
  '    requestConfirmation({',
  '      title: "Delete routine?",',
  '      message: `"${routine.title}" will be removed from this cleaning plan. Existing Progress entries are kept.`,',
  '      confirmLabel: "Delete routine",',
  '      onConfirm: () => {',
  '        const fallback = activeTemplate.routines.find(',
  '          (item) =>',
  '            item.id !== "daily-rules" &&',
  '            item.id !== routineId &&',
  '            !item.archived',
  '        );',
  '        updateActiveTemplate((template) => ({',
  '          ...template,',
  '          routines: template.routines.filter((item) => item.id !== routineId)',
  '        }));',
  '        setSelectedRoutineId(fallback?.id || "");',
  '      }',
  '    });',
  '  }',
  '',
  '  function openAdvancedRoutineEditor(routineId) {',
  '    setSelectedRoutineId(routineId);',
  '    openInternalEditor("routines", "routines", `routine:${routineId}`);',
  '  }',
  '',
  '  function startSession(routineId = selectedRoutineId) {',
  '    const routine = getRoutineById(activeTemplate.routines, routineId);',
  '    if (!routine) return;',
  '',
  '    setSelectedRoutineId(routineId);',
  '',
  '    if (appState.activeSession) {',
  '      if (isSessionForRoutine(appState.activeSession, activeTemplate.id, routineId)) {',
  '        setCompletionSummary(null);',
  '        setAutoOpenCleanModeSessionId(appState.activeSession.id);',
  '        setCurrentView("dashboard");',
  '        return;',
  '      }',
  '',
  '      const hasProgress =',
  '        (appState.activeSession.completedTaskIds || []).length > 0 ||',
  '        Boolean(appState.activeSession.notes?.trim());',
  '      requestConfirmation({',
  '        title: "Replace current clean?",',
  '        message: hasProgress',
  '          ? "A current clean already has progress. Replacing it will discard that progress without saving it."',
  '          : "A current clean already exists. Replacing it will discard that clean without saving it.",',
  '        confirmLabel: "Replace clean",',
  '        onConfirm: () => {',
  '          const nextSession = createSession(routine, activeTemplate);',
  '          setAppState((current) => ({',
  '            ...current,',
  '            activeSession: nextSession',
  '          }));',
  '          setCompletionSummary(null);',
  '          setAutoOpenCleanModeSessionId(nextSession.id);',
  '          setCurrentView("dashboard");',
  '        }',
  '      });',
  '      return;',
  '    }',
  '',
  '    const nextSession = createSession(routine, activeTemplate);',
  '    setAppState((current) => ({',
  '      ...current,',
  '      activeSession: nextSession',
  '    }));',
  '    setCompletionSummary(null);',
  '    setAutoOpenCleanModeSessionId(nextSession.id);',
  '    setCurrentView("dashboard");',
  '  }',
  '',
  '  function pauseSession() {'
);

app = replaceOnce(
  app,
  /  function startSession\(routineId = selectedRoutineId\) \{[\s\S]*?\n  \}\n\n  function pauseSession\(\) \{/,
  appRoutineHandlers,
  "App routine handlers and start flow"
);

app = replaceOnce(
  app,
  lines(
    '      <Routines',
    '        routines={activeTemplate.routines}',
    '        history={appState.history}',
    '        onEditRoutines={() => openInternalEditor("routines", "routines")}',
    '        onAddRoutine={() => openInternalEditor("routines", "routines", "add-routine")}',
    '      />'
  ),
  lines(
    '      <Routines',
    '        routines={activeTemplate.routines}',
    '        history={appState.history}',
    '        activeSession={appState.activeSession}',
    '        onStartRoutine={startSession}',
    '        onSaveRoutine={saveRoutineFromLibrary}',
    '        onDuplicateRoutine={duplicateRoutineFromLibrary}',
    '        onToggleArchive={toggleRoutineArchiveFromLibrary}',
    '        onDeleteRoutine={deleteRoutineFromLibrary}',
    '        onAdvancedEdit={openAdvancedRoutineEditor}',
    '      />'
  ),
  "App Routines props"
);

app = replaceOnce(
  app,
  lines(
    '        onAddRoutine={() => openInternalEditor("routines", "dashboard", "add-routine")}',
    '      />'
  ),
  lines(
    '        onAddRoutine={() => openInternalEditor("routines", "dashboard", "add-routine")}',
    '        autoOpenCleanModeSessionId={autoOpenCleanModeSessionId}',
    '        onAutoOpenCleanModeHandled={() => setAutoOpenCleanModeSessionId(null)}',
    '      />'
  ),
  "App Dashboard auto-open props"
);
write("src/App.jsx", app);

let customize = read("src/components/Customize.jsx");
customize = replaceOnce(
  customize,
  'function normalizeEditorSection(section) {',
  lines(
    'function getRoutineIntentId(entryIntent) {',
    '  return typeof entryIntent === "string" && entryIntent.startsWith("routine:")',
    '    ? entryIntent.slice(8)',
    '    : "";',
    '}',
    '',
    'function normalizeEditorSection(section) {'
  ),
  "Customize intent helper"
);
customize = replaceOnce(
  customize,
  lines(
    '  const [selectedRoutineId, setSelectedRoutineId] = useState(',
    '    activeTemplate.routines.find((routine) => routine.id !== "daily-rules")?.id || ""',
    '  );'
  ),
  lines(
    '  const [selectedRoutineId, setSelectedRoutineId] = useState(() => {',
    '    const requestedId = getRoutineIntentId(entryIntent);',
    '    return (',
    '      activeTemplate.routines.find((routine) => routine.id === requestedId)?.id ||',
    '      activeTemplate.routines.find((routine) => routine.id !== "daily-rules")?.id ||',
    '      ""',
    '    );',
    '  });'
  ),
  "Customize selected routine intent"
);
customize = replaceOnce(
  customize,
  lines(
    '  useEffect(() => {',
    '    setActiveSection(normalizeEditorSection(initialSection));',
    '  }, [initialSection]);'
  ),
  lines(
    '  useEffect(() => {',
    '    setActiveSection(normalizeEditorSection(initialSection));',
    '    const requestedId = getRoutineIntentId(entryIntent);',
    '    if (',
    '      requestedId &&',
    '      activeTemplate.routines.some((routine) => routine.id === requestedId)',
    '    ) {',
    '      setSelectedRoutineId(requestedId);',
    '    }',
    '  }, [activeTemplate.routines, entryIntent, initialSection]);'
  ),
  "Customize intent effect"
);
write("src/components/Customize.jsx", customize);

let dashboard = read("src/components/Dashboard.jsx");
dashboard = replaceOnce(
  dashboard,
  lines(
    '  onEditRoutines,',
    '  onAddRoutine',
    '}) {'
  ),
  lines(
    '  onEditRoutines,',
    '  onAddRoutine,',
    '  autoOpenCleanModeSessionId,',
    '  onAutoOpenCleanModeHandled',
    '}) {'
  ),
  "Dashboard auto-open props"
);
dashboard = replaceOnce(
  dashboard,
  '  const [cleanModeOpen, setCleanModeOpen] = useState(false);',
  lines(
    '  const [cleanModeOpen, setCleanModeOpen] = useState(false);',
    '  const [sessionMoreOpen, setSessionMoreOpen] = useState(false);'
  ),
  "Dashboard session menu state"
);
dashboard = replaceOnce(
  dashboard,
  lines(
    '  useEffect(() => {',
    '    if (cleanModeOpen && !cleanModeAvailable) {',
    '      setCleanModeOpen(false);',
    '    }',
    '  }, [cleanModeAvailable, cleanModeOpen]);'
  ),
  lines(
    '  useEffect(() => {',
    '    if (cleanModeOpen && !cleanModeAvailable) {',
    '      setCleanModeOpen(false);',
    '    }',
    '  }, [cleanModeAvailable, cleanModeOpen]);',
    '',
    '  useEffect(() => {',
    '    if (!autoOpenCleanModeSessionId || !activeSession) return;',
    '    if (activeSession.id !== autoOpenCleanModeSessionId) return;',
    '    if (cleanModeAvailable) setCleanModeOpen(true);',
    '    onAutoOpenCleanModeHandled?.();',
    '  }, [',
    '    activeSession,',
    '    autoOpenCleanModeSessionId,',
    '    cleanModeAvailable,',
    '    onAutoOpenCleanModeHandled',
    '  ]);'
  ),
  "Dashboard auto-open effect"
);
dashboard = replaceOnce(
  dashboard,
  lines(
    '  function resumeAndScroll() {',
    '    if (activeSession?.paused) onResumeSession?.();',
    '    scrollToSession();',
    '  }'
  ),
  lines(
    '  function continueRoutineCleaning() {',
    '    if (activeSession?.paused) onResumeSession?.();',
    '    setSessionMoreOpen(false);',
    '    if (cleanModeAvailable) {',
    '      setCleanModeOpen(true);',
    '      return;',
    '    }',
    '    scrollToSession();',
    '  }'
  ),
  "Dashboard continue cleaning function"
);

const oldSessionActions = lines(
  '          <div className="card-actions compact-actions session-resume-actions">',
  '            <button',
  '              className="button primary small"',
  '              onClick={resumeAndScroll}',
  '              type="button"',
  '            >',
  '              {activeSession.paused ? "Resume" : "Continue"}',
  '            </button>',
  '            {cleanModeAvailable ? (',
  '              <button',
  '                className="button edit-action small"',
  '                onClick={openCleanMode}',
  '                type="button"',
  '              >',
  '                Clean Mode',
  '              </button>',
  '            ) : null}',
  '            <button',
  '              className="button ghost small"',
  '              onClick={onFinishSession}',
  '              type="button"',
  '            >',
  '              {activeFinishLabel}',
  '            </button>',
  '            <button',
  '              className="button danger-ghost small"',
  '              onClick={onCancelSession}',
  '              type="button"',
  '            >',
  '              Discard',
  '            </button>',
  '          </div>'
);
const newSessionActions = lines(
  '          <div className="card-actions compact-actions session-resume-actions">',
  '            <button',
  '              className="button primary small"',
  '              onClick={continueRoutineCleaning}',
  '              type="button"',
  '            >',
  '              {activeSession.paused ? "Resume cleaning" : "Continue cleaning"}',
  '            </button>',
  '            <button',
  '              aria-expanded={sessionMoreOpen}',
  '              className="button ghost small"',
  '              onClick={() => setSessionMoreOpen((open) => !open)}',
  '              type="button"',
  '            >',
  '              More',
  '            </button>',
  '          </div>',
  '          {sessionMoreOpen ? (',
  '            <div className="session-compact-menu">',
  '              <button',
  '                className="button ghost small"',
  '                onClick={scrollToSession}',
  '                type="button"',
  '              >',
  '                View full checklist',
  '              </button>',
  '              {activeSession.paused ? (',
  '                <button',
  '                  className="button ghost small"',
  '                  onClick={onResumeSession}',
  '                  type="button"',
  '                >',
  '                  Resume timer',
  '                </button>',
  '              ) : (',
  '                <button',
  '                  className="button ghost small"',
  '                  onClick={onPauseSession}',
  '                  type="button"',
  '                >',
  '                  Pause timer',
  '                </button>',
  '              )}',
  '              <button',
  '                className="button ghost small"',
  '                onClick={onFinishSession}',
  '                type="button"',
  '              >',
  '                {activeFinishLabel === "Finish" ? "Finish clean" : "Stop and save"}',
  '              </button>',
  '              <button',
  '                className="button danger-ghost small"',
  '                onClick={onCancelSession}',
  '                type="button"',
  '              >',
  '                Discard session',
  '              </button>',
  '            </div>',
  '          ) : null}'
);
dashboard = replaceOnce(
  dashboard,
  oldSessionActions,
  newSessionActions,
  "Dashboard compact current clean card"
);
write("src/components/Dashboard.jsx", dashboard);

let main = read("src/main.jsx");
main = replaceOnce(
  main,
  'import "./styles/universal-phase2.css";',
  lines(
    'import "./styles/universal-phase2.css";',
    'import "./styles/universal-phase3.css";'
  ),
  "main Phase 3 style import"
);
write("src/main.jsx", main);

let help = read("src/components/HelpGuide.jsx");
help = replaceOnce(
  help,
  'Routines are reusable cleaning checklists. Start them from Today → More → Start a routine, or edit them from Routines.',
  'Routines are reusable cleaning checklists. Start, create, or edit them directly from Routines.',
  "Help routine guidance"
);
write("src/components/HelpGuide.jsx", help);

console.log("Phase 3 source transformation completed.");
