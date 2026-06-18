import { useEffect, useMemo, useRef, useState } from "react";
import { getRoutineTotalTasks } from "../utils/calculations.js";
import { cloneDeep } from "../utils/templateUtils.js";
import ProfileSection from "./customize/ProfileSection.jsx";
import RoutinesSection from "./customize/RoutinesSection.jsx";
import ScheduleSection from "./customize/ScheduleSection.jsx";

const editorSections = [
  {
    id: "routines",
    label: "Routines",
    description: "Edit Today defaults and reusable cleaning routines."
  },
  {
    id: "profile",
    label: "App details",
    description: "Edit names, home labels, and the main cleaning goal."
  },
  {
    id: "schedule",
    label: "Schedule",
    description: "Adjust reset timing and due thresholds."
  },
  {
    id: "import-export",
    label: "Import / Export",
    description: "Share templates or back up the whole local app."
  }
];

function normalizeEditorSection(section) {
  if (section === "daily-rules" || section === "today") return "routines";
  if (editorSections.some((item) => item.id === section)) return section;
  return "routines";
}

function getSectionCount(sectionId, activeTemplate) {
  if (sectionId === "profile") return activeTemplate.profile.homeName || "Home profile";
  if (sectionId === "routines") {
    const visibleRoutines = activeTemplate.routines.filter((routine) => routine.id !== "daily-rules");
    const taskCount = visibleRoutines.reduce(
      (total, routine) => total + getRoutineTotalTasks(routine),
      0
    );
    return `${activeTemplate.todayDefaults?.length || 0} Today / ${visibleRoutines.length} routines / ${taskCount} tasks`;
  }
  if (sectionId === "schedule") {
    return `${activeTemplate.schedule.weeklyResetDay} / ${activeTemplate.schedule.backupResetDay}`;
  }
  return "Template + full backup";
}

export default function Customize({
  appState,
  activeTemplate,
  onSetActiveTemplate,
  onResetTemplate,
  onUpdateTemplate,
  onExportTemplate,
  onImportTemplate,
  onExportFullBackup,
  onImportFullBackup,
  onResetHistory,
  onResetAll,
  onRequestConfirmation,
  initialSection = "routines",
  entryIntent = null,
  onBack,
  activeSession,
  backLabel = "Back"
}) {
  const templateImportRef = useRef(null);
  const backupImportRef = useRef(null);
  const [activeSection, setActiveSection] = useState(normalizeEditorSection(initialSection));
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    activeTemplate.routines.find((routine) => routine.id !== "daily-rules")?.id || ""
  );
  const [message, setMessage] = useState("");

  const selectedRoutine = useMemo(() => {
    const visibleRoutines = activeTemplate.routines.filter((routine) => routine.id !== "daily-rules");
    return (
      visibleRoutines.find((routine) => routine.id === selectedRoutineId) ||
      visibleRoutines[0] ||
      null
    );
  }, [activeTemplate.routines, selectedRoutineId]);

  useEffect(() => {
    if (!selectedRoutine) {
      const fallback = activeTemplate.routines.find((routine) => routine.id !== "daily-rules");
      if (fallback) setSelectedRoutineId(fallback.id);
    }
  }, [activeTemplate.routines, selectedRoutine]);

  useEffect(() => {
    setActiveSection(normalizeEditorSection(initialSection));
  }, [initialSection]);

  function editTemplate(mutator) {
    onUpdateTemplate((template) => {
      const draft = cloneDeep(template);
      mutator(draft);
      return draft;
    });
  }

  function confirmTemplateEdit({ title, message: confirmMessage, confirmLabel, edit, afterConfirm }) {
    onRequestConfirmation({
      title,
      message: confirmMessage,
      confirmLabel,
      onConfirm: () => {
        editTemplate(edit);
        afterConfirm?.();
      }
    });
  }

  function handleJsonFile(event, handler, fallbackMessage) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const result = handler(payload, { fileName: file.name });
        setMessage(result.ok ? result.message || fallbackMessage : result.error);
      } catch {
        setMessage("File is not valid JSON.");
      } finally {
        input.value = "";
      }
    };
    reader.onerror = () => {
      setMessage("File could not be read. Current data was not changed.");
      input.value = "";
    };
    try {
      reader.readAsText(file);
    } catch {
      setMessage("File could not be read. Current data was not changed.");
      input.value = "";
    }
  }

  function handleExport(handler, fallbackMessage) {
    const result = handler();
    setMessage(result?.ok === false ? result.error : result?.message || fallbackMessage);
  }

  function renderSection() {
    if (activeSection === "profile") {
      return (
        <ProfileSection
          template={activeTemplate}
          templates={appState.templates}
          activeTemplateId={appState.activeTemplateId}
          onSetActiveTemplate={onSetActiveTemplate}
          canEdit
          onEditTemplate={editTemplate}
        />
      );
    }

    if (activeSection === "schedule") {
      return (
        <ScheduleSection schedule={activeTemplate.schedule} canEdit onEditTemplate={editTemplate} />
      );
    }

    if (activeSection === "import-export") {
      return (
        <ImportExportSection
          message={message}
          onExportTemplate={() => handleExport(onExportTemplate, "Template download started.")}
          onImportTemplateClick={() => templateImportRef.current?.click()}
          onExportFullBackup={() =>
            handleExport(onExportFullBackup, "Full backup download started.")
          }
          onImportFullBackupClick={() => backupImportRef.current?.click()}
          onResetTemplate={onResetTemplate}
          onResetHistory={onResetHistory}
          onResetAll={onResetAll}
        />
      );
    }

    return (
      <RoutinesSection
        routines={activeTemplate.routines}
        todayDefaults={activeTemplate.todayDefaults || activeTemplate.dailyRules}
        todayWeekdayDefaultsEnabled={activeTemplate.todayWeekdayDefaultsEnabled}
        todayWeekdayDefaults={activeTemplate.todayWeekdayDefaults}
        selectedRoutine={selectedRoutine}
        selectedRoutineId={selectedRoutineId}
        canEdit
        onSelectRoutine={setSelectedRoutineId}
        onEditTemplate={editTemplate}
        onConfirmEdit={confirmTemplateEdit}
        activeSession={activeSession}
        autoAddRoutine={entryIntent === "add-routine"}
        initialEditorTab={entryIntent === "today" ? "today" : "routines"}
      />
    );
  }

  const activeSectionMeta = editorSections.find((section) => section.id === activeSection);

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Editor</p>
            <h2>Edit Cleaning Plan</h2>
            <p>Edit Today defaults, routines, schedule, and app details.</p>
          </div>
          <span className="pill">Editable</span>
        </div>
        {onBack ? (
          <button className="button ghost" type="button" onClick={onBack}>
            {backLabel}
          </button>
        ) : null}
      </section>

      <section className="panel advanced-menu-panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Choose area</p>
            <h2>{activeSectionMeta?.label || "Routines"}</h2>
            {activeSectionMeta?.description ? <p>{activeSectionMeta.description}</p> : null}
          </div>
          <select
            aria-label="Switch editor area"
            value={activeSection}
            onChange={(event) => setActiveSection(event.target.value)}
          >
            {editorSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>
        <div className="advanced-category-list compact-category-list" aria-label="Editor areas">
          {editorSections.map((section) => (
            <button
              className={
                activeSection === section.id
                  ? "advanced-category-card active"
                  : "advanced-category-card"
              }
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
            >
              <span>
                <strong>{section.label}</strong>
                <small>{section.description}</small>
              </span>
              <span className="advanced-category-meta">
                {getSectionCount(section.id, activeTemplate)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {renderSection()}

      <input
        ref={templateImportRef}
        className="hidden-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) =>
          handleJsonFile(event, onImportTemplate, "Template imported as a new template.")
        }
      />
      <input
        ref={backupImportRef}
        className="hidden-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) =>
          handleJsonFile(event, onImportFullBackup, "Backup validated. Confirm import to continue.")
        }
      />
    </div>
  );
}

function ImportExportSection({
  message,
  onExportTemplate,
  onImportTemplateClick,
  onExportFullBackup,
  onImportFullBackupClick,
  onResetTemplate,
  onResetHistory,
  onResetAll
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Import / Export</p>
          <h2>Templates and Full Backups</h2>
          <p>
            Template files share Today defaults, routines, schedule, and app labels. Full backups
            save the whole local app, including history and active sessions.
          </p>
        </div>
      </div>

      <div className="customize-action-grid advanced-import-grid">
        <section className="customize-card">
          <p className="eyebrow">Template only</p>
          <h3>Share routines and settings</h3>
          <p className="muted">Export or import the reusable cleaning plan.</p>
          <div className="settings-actions">
            <button className="button primary" type="button" onClick={onExportTemplate}>
              Export template JSON
            </button>
            <button className="button ghost" type="button" onClick={onImportTemplateClick}>
              Import template JSON
            </button>
          </div>
        </section>

        <section className="customize-card">
          <p className="eyebrow">Full backup</p>
          <h3>Whole local app data</h3>
          <p className="muted">
            Export or restore templates, settings, history, active session, and Today tasks.
          </p>
          <div className="settings-actions">
            <button className="button primary" type="button" onClick={onExportFullBackup}>
              Export full backup
            </button>
            <button className="button ghost" type="button" onClick={onImportFullBackupClick}>
              Import full backup
            </button>
          </div>
        </section>
      </div>

      <details className="danger-zone settings-danger-detail">
        <summary className="simple-summary">
          <span>
            <span className="eyebrow">Maintenance</span>
            <strong>Reset data</strong>
            <small>Collapsed by default. Confirmations still apply.</small>
          </span>
          <span className="button danger-ghost small">Open</span>
        </summary>
        <div className="settings-actions">
          <button className="button danger-ghost" type="button" onClick={onResetTemplate}>
            Reset current template
          </button>
          <button className="button danger-ghost" type="button" onClick={onResetHistory}>
            Reset only history
          </button>
          <button className="button danger" type="button" onClick={onResetAll}>
            Reset all data
          </button>
        </div>
      </details>

      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}
