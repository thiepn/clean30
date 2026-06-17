import { useEffect, useMemo, useRef, useState } from "react";
import { getRoutineTotalTasks } from "../utils/calculations.js";
import { cloneDeep } from "../utils/templateUtils.js";
import AppearanceSection from "./customize/AppearanceSection.jsx";
import DailyRulesSection from "./customize/DailyRulesSection.jsx";
import OverviewSection from "./customize/OverviewSection.jsx";
import ProfileSection from "./customize/ProfileSection.jsx";
import RoutinesSection from "./customize/RoutinesSection.jsx";
import ScheduleSection from "./customize/ScheduleSection.jsx";
import SimpleCustomizeSection from "./customize/SimpleCustomizeSection.jsx";
import SystemsSection from "./customize/SystemsSection.jsx";
import TemplateGallerySection from "./customize/TemplateGallerySection.jsx";
import ZonesSection from "./customize/ZonesSection.jsx";

const customizeSections = [
  {
    id: "overview",
    label: "Template Overview",
    description: "Review the active template, status, goal, and reset option."
  },
  {
    id: "gallery",
    label: "Gallery Presets",
    description: "Create an editable copy from a built-in cleaning setup."
  },
  {
    id: "profile",
    label: "Profile Fields",
    description: "Edit app labels, home details, and the main cleaning goal."
  },
  {
    id: "zones",
    label: "Zones",
    description: "Rename and reorder the real areas used in routines."
  },
  {
    id: "daily-rules",
    label: "Daily Rules",
    description: "Edit the tiny checklist shown on Dashboard."
  },
  {
    id: "routines",
    label: "Routines & Phases",
    description: "Edit routines, phase order, and individual checklist tasks."
  },
  {
    id: "systems",
    label: "Systems",
    description: "Edit bottlenecks, priorities, and system notes."
  },
  {
    id: "schedule",
    label: "Schedule",
    description: "Adjust weekly reset timing, fallback day, and due thresholds."
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Tune the calm visual settings for this template."
  },
  {
    id: "import-export",
    label: "Import / Export",
    description: "Share templates or back up the whole local app."
  }
];

function getSectionCount(sectionId, activeTemplate, templateGallery) {
  if (sectionId === "overview") {
    return activeTemplate.readOnly ? "Default / read-only" : "Custom / editable";
  }
  if (sectionId === "gallery") return `${templateGallery.length} presets`;
  if (sectionId === "profile") return activeTemplate.profile.homeName || "Home profile";
  if (sectionId === "zones") return `${activeTemplate.zones.length} zones`;
  if (sectionId === "daily-rules") return `${activeTemplate.dailyRules.length} rules`;
  if (sectionId === "routines") {
    const taskCount = activeTemplate.routines.reduce(
      (total, routine) => total + getRoutineTotalTasks(routine),
      0
    );
    return `${activeTemplate.routines.length} routines / ${taskCount} tasks`;
  }
  if (sectionId === "systems") {
    return `${activeTemplate.systems.systemSections?.length || 0} sections`;
  }
  if (sectionId === "schedule") {
    return `${activeTemplate.schedule.weeklyResetDay} / ${activeTemplate.schedule.backupResetDay}`;
  }
  if (sectionId === "appearance") {
    return `${activeTemplate.appearance.density} / ${activeTemplate.appearance.accentColor}`;
  }
  return "Template + full backup";
}

export default function Customize({
  appState,
  activeTemplate,
  onSetActiveTemplate,
  onDuplicateDefault,
  onResetTemplate,
  onUpdateTemplate,
  onExportTemplate,
  onImportTemplate,
  onExportFullBackup,
  onImportFullBackup,
  templateGallery,
  onUseGalleryTemplate,
  onResetHistory,
  onResetAll,
  onRequestConfirmation,
  onUpdateAppAppearance,
  initialSection = "menu",
  initialMode,
  entryIntent = null,
  onBack,
  backLabel = "Back"
}) {
  const templateImportRef = useRef(null);
  const backupImportRef = useRef(null);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [customizeMode, setCustomizeMode] = useState(
    initialMode || (initialSection === "menu" ? "simple" : "advanced")
  );
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    activeTemplate.routines[0]?.id || ""
  );
  const [message, setMessage] = useState("");
  const canEdit = !activeTemplate.readOnly;

  const selectedRoutine = useMemo(() => {
    return (
      activeTemplate.routines.find((routine) => routine.id === selectedRoutineId) ||
      activeTemplate.routines[0] ||
      null
    );
  }, [activeTemplate.routines, selectedRoutineId]);

  useEffect(() => {
    if (!selectedRoutine && activeTemplate.routines[0]) {
      setSelectedRoutineId(activeTemplate.routines[0].id);
    }
  }, [activeTemplate.routines, selectedRoutine]);

  useEffect(() => {
    setActiveSection(initialSection);
    setCustomizeMode(initialMode || (initialSection === "menu" ? "simple" : "advanced"));
  }, [initialMode, initialSection]);

  function editTemplate(mutator) {
    if (!canEdit) return;
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
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const result = handler(payload);
        setMessage(result.ok ? result.message || fallbackMessage : result.error);
      } catch {
        setMessage("File is not valid JSON.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function openAdvancedRoutine(routineId) {
    setSelectedRoutineId(routineId);
    setActiveSection("routines");
    setCustomizeMode("advanced");
  }

  function openAdvancedCustomize(sectionId = "menu") {
    setActiveSection(sectionId);
    setCustomizeMode("advanced");
  }

  function renderAdvancedSection() {
    if (activeSection === "overview") {
      return (
        <OverviewSection
          templates={appState.templates}
          activeTemplate={activeTemplate}
          message={message}
          onSetActiveTemplate={onSetActiveTemplate}
          onDuplicateDefault={onDuplicateDefault}
          onResetTemplate={onResetTemplate}
          onExportTemplate={onExportTemplate}
        />
      );
    }

    if (activeSection === "gallery") {
      return (
        <TemplateGallerySection
          gallery={templateGallery}
          onUseTemplate={onUseGalleryTemplate}
          compact
        />
      );
    }

    if (activeSection === "profile") {
      return (
        <ProfileSection template={activeTemplate} canEdit={canEdit} onEditTemplate={editTemplate} />
      );
    }

    if (activeSection === "zones") {
      return (
        <ZonesSection
          zones={activeTemplate.zones}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
        />
      );
    }

    if (activeSection === "routines") {
      return (
        <RoutinesSection
          routines={activeTemplate.routines}
          selectedRoutine={selectedRoutine}
          selectedRoutineId={selectedRoutineId}
          canEdit={canEdit}
          onSelectRoutine={setSelectedRoutineId}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
          autoAddRoutine={entryIntent === "add-routine"}
        />
      );
    }

    if (activeSection === "daily-rules") {
      return (
        <DailyRulesSection
          dailyRules={activeTemplate.dailyRules}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
        />
      );
    }

    if (activeSection === "systems") {
      return (
        <SystemsSection
          systems={activeTemplate.systems}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
        />
      );
    }

    if (activeSection === "schedule") {
      return (
        <ScheduleSection
          schedule={activeTemplate.schedule}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
        />
      );
    }

    if (activeSection === "appearance") {
      return (
        <AppearanceSection
          appearance={activeTemplate.appearance}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
          onUpdateAppAppearance={onUpdateAppAppearance}
        />
      );
    }

    if (activeSection === "import-export") {
      return (
        <ImportExportSection
          message={message}
          onExportTemplate={onExportTemplate}
          onImportTemplateClick={() => templateImportRef.current?.click()}
          onExportFullBackup={onExportFullBackup}
          onImportFullBackupClick={() => backupImportRef.current?.click()}
        />
      );
    }

    return null;
  }

  const activeSectionMeta = customizeSections.find((section) => section.id === activeSection);

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Editor</p>
            <h2>Edit Cleaning Plan</h2>
            <p>
              Edit routines, Daily Rules, schedule, systems, and template settings.
            </p>
          </div>
          <span className="pill">{activeTemplate.readOnly ? "Default" : "Custom"}</span>
        </div>
        {onBack ? (
          <button className="button ghost" type="button" onClick={onBack}>
            {backLabel}
          </button>
        ) : null}
        <div className="tab-row customize-mode-tabs" role="tablist" aria-label="Editor mode">
          <button
            className={customizeMode === "simple" ? "tab active" : "tab"}
            type="button"
            onClick={() => setCustomizeMode("simple")}
          >
            Simple
          </button>
          <button
            className={customizeMode === "advanced" ? "tab active" : "tab"}
            type="button"
            onClick={() => openAdvancedCustomize()}
          >
            Advanced editor
          </button>
        </div>
        {customizeMode === "advanced" ? (
          <p className="callout small">
            Advanced editor is for editing routines, phases, tasks, systems, and template
            internals. Most users do not need this every day.
          </p>
        ) : null}
        {!canEdit && customizeMode === "advanced" ? (
          <div className="readonly-notice">
            <div>
              <strong>Clean30 Default is protected.</strong>
              <p>Duplicate it to edit routines, zones, daily rules, schedule, and appearance.</p>
            </div>
            <button className="button primary" type="button" onClick={onDuplicateDefault}>
              Duplicate to edit
            </button>
          </div>
        ) : null}
      </section>

      {customizeMode === "simple" ? (
        <SimpleCustomizeSection
          templates={appState.templates}
          activeTemplate={activeTemplate}
          canEdit={canEdit}
          message={message}
          templateGallery={templateGallery}
          onSetActiveTemplate={onSetActiveTemplate}
          onDuplicateDefault={onDuplicateDefault}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
          onUseGalleryTemplate={onUseGalleryTemplate}
          onExportTemplate={onExportTemplate}
          onImportTemplateClick={() => templateImportRef.current?.click()}
          onExportFullBackup={onExportFullBackup}
          onResetHistory={onResetHistory}
          onResetAll={onResetAll}
          onOpenAdvancedRoutine={openAdvancedRoutine}
          onOpenAdvancedCustomize={() => openAdvancedCustomize()}
        />
      ) : null}

      {customizeMode === "advanced" && activeSection === "menu" ? (
        <section className="panel advanced-menu-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Advanced Editor</p>
              <h2>Choose what to edit</h2>
              <p>Open one category at a time. Dashboard is for doing; the editor is for changing the plan.</p>
            </div>
            <span className="pill">{canEdit ? "Editable" : "Read-only"}</span>
          </div>
          <div className="advanced-category-list" aria-label="Advanced editor categories">
            {customizeSections.map((section) => (
              <button
                className="advanced-category-card"
                key={section.id}
                type="button"
                aria-expanded={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              >
                <span>
                  <strong>{section.label}</strong>
                  <small>{section.description}</small>
                </span>
                <span className="advanced-category-meta">
                  {getSectionCount(section.id, activeTemplate, templateGallery)}
                  <span aria-hidden="true">&gt;</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {customizeMode === "advanced" && activeSection !== "menu" ? (
        <>
          <section className="panel advanced-detail-header">
            <button className="button ghost" type="button" onClick={() => setActiveSection("menu")}>
              Back to Advanced
            </button>
            <div>
              <p className="eyebrow">Advanced Editor</p>
              <h2>{activeSectionMeta?.label || "Category"}</h2>
              {activeSectionMeta?.description ? <p>{activeSectionMeta.description}</p> : null}
            </div>
            <select
              aria-label="Switch advanced category"
              value={activeSection}
              onChange={(event) => setActiveSection(event.target.value)}
            >
              {customizeSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </section>
          {renderAdvancedSection()}
        </>
      ) : null}

      <input
        ref={templateImportRef}
        className="hidden-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) =>
          handleJsonFile(event, onImportTemplate, "Template imported as a new custom template.")
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
  onImportFullBackupClick
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Import / Export</p>
          <h2>Templates and Full Backups</h2>
          <p>
            Template files share the cleaning system only. Full backups save the whole local app,
            including history and sessions.
          </p>
        </div>
      </div>

      <div className="customize-action-grid advanced-import-grid">
        <section className="customize-card">
          <p className="eyebrow">Template only</p>
          <h3>Share routines and settings</h3>
          <p className="muted">
            Export or import routines, daily rules, zones, systems, schedule, and appearance.
          </p>
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
            Export or restore templates, settings, history, active session, and completed daily
            rules.
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

      <p className="callout small">
        Backup here means data backup. Cleaning fallback timing is edited in Schedule.
      </p>
      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}
