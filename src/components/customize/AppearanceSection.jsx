import { accentOptions, densityOptions } from "../../utils/templateUtils.js";

export default function AppearanceSection({ appearance, canEdit, onEditTemplate }) {
  function updateAppearance(field, value) {
    onEditTemplate((draft) => {
      draft.appearance[field] = value;
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Appearance</p>
          <h2>Simple Theme Settings</h2>
        </div>
      </div>

      <div className="form-grid">
        <label className="field-label" htmlFor="accent-color">
          Accent color
          <select
            id="accent-color"
            value={appearance.accentColor}
            disabled={!canEdit}
            onChange={(event) => updateAppearance("accentColor", event.target.value)}
          >
            {accentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label" htmlFor="density">
          Density
          <select
            id="density"
            value={appearance.density}
            disabled={!canEdit}
            onChange={(event) => updateAppearance("density", event.target.value)}
          >
            {densityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
