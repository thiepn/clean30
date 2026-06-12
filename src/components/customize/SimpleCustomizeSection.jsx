import DailyRulesSection from "./DailyRulesSection.jsx";
import ProfileSection from "./ProfileSection.jsx";
import ScheduleSection from "./ScheduleSection.jsx";
import TemplateGallerySection from "./TemplateGallerySection.jsx";

export default function SimpleCustomizeSection({
  templates,
  activeTemplate,
  canEdit,
  message,
  templateGallery,
  onSetActiveTemplate,
  onDuplicateDefault,
  onEditTemplate,
  onConfirmEdit,
  onUseGalleryTemplate,
  onExportTemplate,
  onExportFullBackup,
  onResetHistory,
  onResetAll,
  onOpenAdvancedRoutine
}) {
  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Simple Customize</p>
            <h2>Start With The Useful Controls</h2>
            <p>
              Most users only need profile, schedule, daily rules, quick routine access, sharing,
              and backups.
            </p>
          </div>
          <span className="pill">{activeTemplate.readOnly ? "Read-only" : "Editable"}</span>
        </div>

        <div className="form-grid customize-card">
          <label className="field-label" htmlFor="simple-active-template">
            Current template
            <select
              id="simple-active-template"
              value={activeTemplate.id}
              onChange={(event) => onSetActiveTemplate(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.readOnly ? "(default)" : "(custom)"}
                </option>
              ))}
            </select>
          </label>
          <div className="readonly-field">
            <span>Editing</span>
            <strong>
              {activeTemplate.readOnly
                ? "Duplicate this template before editing."
                : "This custom template is editable."}
            </strong>
          </div>
        </div>

        {activeTemplate.readOnly ? (
          <div className="readonly-notice">
            <div>
              <strong>Default templates are protected.</strong>
              <p>Create an editable copy if you want to change routines, rules, or schedule.</p>
            </div>
            <button className="button primary" type="button" onClick={onDuplicateDefault}>
              Duplicate to edit
            </button>
          </div>
        ) : null}
        {message ? <p className="form-message">{message}</p> : null}
      </section>

      <TemplateGallerySection gallery={templateGallery} onUseTemplate={onUseGalleryTemplate} compact />

      <ProfileSection template={activeTemplate} canEdit={canEdit} onEditTemplate={onEditTemplate} />

      <ScheduleSection
        schedule={activeTemplate.schedule}
        canEdit={canEdit}
        onEditTemplate={onEditTemplate}
      />

      <DailyRulesSection
        dailyRules={activeTemplate.dailyRules}
        canEdit={canEdit}
        onEditTemplate={onEditTemplate}
        onConfirmEdit={onConfirmEdit}
      />

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick routines</p>
            <h2>Edit Entry Points</h2>
            <p>Open Advanced Customize only for the routines you want to change deeply.</p>
          </div>
        </div>
        <div className="quick-routine-list">
          {activeTemplate.routines.map((routine) => (
            <button
              className="quick-button"
              key={routine.id}
              type="button"
              onClick={() => onOpenAdvancedRoutine(routine.id)}
            >
              <strong>{routine.title}</strong>
              <span>Edit phases and tasks in Advanced</span>
            </button>
          ))}
        </div>
      </section>

      <div className="customize-action-grid">
        <section className="customize-card">
          <p className="eyebrow">Sharing and backup</p>
          <h3>Save or Share</h3>
          <p className="muted">
            Template export shares the cleaning system. Full backup saves personal app data too.
          </p>
          <div className="settings-actions">
            <button className="button ghost" type="button" onClick={onExportTemplate}>
              Export template
            </button>
            <button className="button primary" type="button" onClick={onExportFullBackup}>
              Export full backup
            </button>
          </div>
        </section>

        <section className="danger-zone">
          <p className="eyebrow">Danger zone</p>
          <h3>Data Reset</h3>
          <p className="muted">These actions affect stored local app data. Use them carefully.</p>
          <div className="settings-actions">
            <button className="button danger-ghost" type="button" onClick={onResetHistory}>
              Reset history
            </button>
            <button className="button danger" type="button" onClick={onResetAll}>
              Reset all data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
