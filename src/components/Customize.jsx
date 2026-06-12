import { useEffect, useMemo, useRef, useState } from "react";
import { cloneDeep } from "../utils/templateUtils.js";
import AppearanceSection from "./customize/AppearanceSection.jsx";
import DailyRulesSection from "./customize/DailyRulesSection.jsx";
import OverviewSection from "./customize/OverviewSection.jsx";
import ProfileSection from "./customize/ProfileSection.jsx";
import RoutinesSection from "./customize/RoutinesSection.jsx";
import ScheduleSection from "./customize/ScheduleSection.jsx";
import SystemsSection from "./customize/SystemsSection.jsx";
import ZonesSection from "./customize/ZonesSection.jsx";

const customizeSections = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "zones", label: "Zones" },
  { id: "routines", label: "Routines" },
  { id: "daily-rules", label: "Daily Rules" },
  { id: "systems", label: "Systems" },
  { id: "schedule", label: "Schedule" },
  { id: "appearance", label: "Appearance" }
];

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
  onRequestConfirmation
}) {
  const templateImportRef = useRef(null);
  const backupImportRef = useRef(null);
  const [activeSection, setActiveSection] = useState("overview");
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

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Customize</p>
            <h2>Cleaning System Editor</h2>
            <p>
              Edit templates here. Cleaning screens are for doing; Customize is for changing the
              system.
            </p>
          </div>
          <span className="pill">{activeTemplate.readOnly ? "Default" : "Custom"}</span>
        </div>
        <div className="tab-row customize-tabs" role="tablist" aria-label="Customize sections">
          {customizeSections.map((section) => (
            <button
              className={activeSection === section.id ? "tab active" : "tab"}
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
        {!canEdit ? (
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

      {activeSection === "overview" ? (
        <OverviewSection
          templates={appState.templates}
          activeTemplate={activeTemplate}
          message={message}
          onSetActiveTemplate={onSetActiveTemplate}
          onDuplicateDefault={onDuplicateDefault}
          onResetTemplate={onResetTemplate}
          onExportTemplate={onExportTemplate}
          onImportTemplateClick={() => templateImportRef.current?.click()}
          onExportFullBackup={onExportFullBackup}
          onImportFullBackupClick={() => backupImportRef.current?.click()}
        />
      ) : null}

      {activeSection === "profile" ? (
        <ProfileSection
          template={activeTemplate}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
        />
      ) : null}

      {activeSection === "zones" ? (
        <ZonesSection
          zones={activeTemplate.zones}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
        />
      ) : null}

      {activeSection === "routines" ? (
        <RoutinesSection
          routines={activeTemplate.routines}
          selectedRoutine={selectedRoutine}
          selectedRoutineId={selectedRoutineId}
          canEdit={canEdit}
          onSelectRoutine={setSelectedRoutineId}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
        />
      ) : null}

      {activeSection === "daily-rules" ? (
        <DailyRulesSection
          dailyRules={activeTemplate.dailyRules}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
        />
      ) : null}

      {activeSection === "systems" ? (
        <SystemsSection
          systems={activeTemplate.systems}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
          onConfirmEdit={confirmTemplateEdit}
        />
      ) : null}

      {activeSection === "schedule" ? (
        <ScheduleSection
          schedule={activeTemplate.schedule}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
        />
      ) : null}

      {activeSection === "appearance" ? (
        <AppearanceSection
          appearance={activeTemplate.appearance}
          canEdit={canEdit}
          onEditTemplate={editTemplate}
        />
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
