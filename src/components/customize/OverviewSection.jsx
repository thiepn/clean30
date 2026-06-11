export default function OverviewSection({
  templates,
  activeTemplate,
  message,
  onSetActiveTemplate,
  onDuplicateDefault,
  onResetTemplate,
  onExportTemplate,
  onImportTemplateClick,
  onExportFullBackup,
  onImportFullBackupClick
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>{activeTemplate.name}</h2>
          <p>
            {activeTemplate.readOnly
              ? "Protected default template. Duplicate it before editing."
              : "Editable custom template. History stays separate from this template."}
          </p>
        </div>
        <span className="pill">{activeTemplate.readOnly ? "Read-only" : "Editable"}</span>
      </div>

      <div className="form-grid">
        <label className="field-label" htmlFor="active-template">
          Active template
          <select
            id="active-template"
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
          <span>Sharing mode</span>
          <strong>Template exports exclude history and active sessions</strong>
        </div>
      </div>

      <div className="last-grid">
        <div className="metric-card">
          <span>Routines</span>
          <strong>{activeTemplate.routines.length}</strong>
        </div>
        <div className="metric-card">
          <span>Daily rules</span>
          <strong>{activeTemplate.dailyRules.length}</strong>
        </div>
        <div className="metric-card">
          <span>Zones</span>
          <strong>{activeTemplate.zones.length}</strong>
        </div>
        <div className="metric-card">
          <span>Density</span>
          <strong>{activeTemplate.appearance.density}</strong>
        </div>
      </div>

      <div className="settings-actions">
        <button className="button primary" type="button" onClick={onDuplicateDefault}>
          Duplicate default template
        </button>
        <button
          className="button danger-ghost"
          type="button"
          disabled={activeTemplate.readOnly}
          onClick={onResetTemplate}
        >
          Reset current template to default
        </button>
        <button className="button ghost" type="button" onClick={onExportTemplate}>
          Export template JSON
        </button>
        <button className="button ghost" type="button" onClick={onImportTemplateClick}>
          Import template JSON
        </button>
        <button className="button ghost" type="button" onClick={onExportFullBackup}>
          Export full backup
        </button>
        <button className="button ghost" type="button" onClick={onImportFullBackupClick}>
          Import full backup
        </button>
      </div>

      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}
