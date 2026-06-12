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

      <div className="customize-info-grid">
        <article className="info-card">
          <strong>Protected default</strong>
          <p>The Clean30 default template is read-only so there is always a stable copy.</p>
        </article>
        <article className="info-card">
          <strong>Duplicate to edit</strong>
          <p>Creating a personal editable copy lets you adjust routines, zones, and systems.</p>
        </article>
        <article className="info-card">
          <strong>Template export</strong>
          <p>Shares routines, settings, daily rules, systems, and appearance only.</p>
        </article>
        <article className="info-card">
          <strong>Full backup</strong>
          <p>Saves personal app data too, including history, active session, and completions.</p>
        </article>
      </div>

      <div className="form-grid customize-card">
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

      <div className="customize-action-grid">
        <section className="customize-card">
          <p className="eyebrow">Template sharing</p>
          <h3>Routines and Settings</h3>
          <p className="muted">Use this when sharing a cleaning template without personal history.</p>
          <div className="settings-actions">
            <button className="button primary" type="button" onClick={onDuplicateDefault}>
              Duplicate default template
            </button>
            <button className="button ghost" type="button" onClick={onExportTemplate}>
              Export template JSON
            </button>
            <button className="button ghost" type="button" onClick={onImportTemplateClick}>
              Import template JSON
            </button>
          </div>
        </section>

        <section className="customize-card">
          <p className="eyebrow">Full backup</p>
          <h3>Personal App Data</h3>
          <p className="muted">Use this to save or restore templates, history, sessions, and rules.</p>
          <div className="settings-actions">
            <button className="button ghost" type="button" onClick={onExportFullBackup}>
              Export full backup
            </button>
            <button className="button ghost" type="button" onClick={onImportFullBackupClick}>
              Import full backup
            </button>
          </div>
        </section>

        <section className="danger-zone">
          <p className="eyebrow">Danger zone</p>
          <h3>Reset Active Template</h3>
          <p className="muted">
            This replaces the current custom template with the default content. History is kept.
          </p>
          <button
            className="button danger-ghost"
            type="button"
            disabled={activeTemplate.readOnly}
            onClick={onResetTemplate}
          >
            Reset current template to default
          </button>
        </section>
      </div>

      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}
