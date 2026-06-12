export default function OverviewSection({
  templates,
  activeTemplate,
  message,
  onSetActiveTemplate,
  onDuplicateDefault,
  onResetTemplate,
  onExportTemplate
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Template Overview</p>
          <h2>{activeTemplate.name}</h2>
          <p>
            {activeTemplate.readOnly
              ? "Protected default template. Duplicate it before editing."
              : activeTemplate.profile.goalText}
          </p>
        </div>
        <span className="pill">{activeTemplate.readOnly ? "Read-only" : "Editable"}</span>
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
          <span>Home goal</span>
          <strong>{activeTemplate.profile.goalText}</strong>
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
          <p className="eyebrow">Status</p>
          <h3>{activeTemplate.readOnly ? "Protected default" : "Editable custom template"}</h3>
          <p className="muted">
            {activeTemplate.readOnly
              ? "The Clean30 default is protected so you always have a stable copy."
              : "This template can be edited. History stays separate from template settings."}
          </p>
          <div className="settings-actions">
            <button className="button primary" type="button" onClick={onDuplicateDefault}>
              Duplicate default template
            </button>
            <button className="button ghost" type="button" onClick={onExportTemplate}>
              Export this template
            </button>
          </div>
        </section>

        <section className="customize-card">
          <p className="eyebrow">Home context</p>
          <h3>{activeTemplate.profile.homeName}</h3>
          <p className="muted">{activeTemplate.profile.apartmentSizeText}</p>
          <p className="muted">{activeTemplate.profile.apartmentTypeText}</p>
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
