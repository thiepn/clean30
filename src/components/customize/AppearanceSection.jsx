import { accentOptions, densityOptions } from "../../utils/templateUtils.js";

const templateAccentToAppAccent = {
  green: "forest",
  blue: "navy",
  brown: "brown",
  gray: "charcoal"
};

export default function AppearanceSection({
  appearance,
  canEdit,
  onEditTemplate,
  onUpdateAppAppearance
}) {
  function updateAppearance(field, value) {
    onEditTemplate((draft) => {
      draft.appearance[field] = value;
    });
    if (field === "accentColor" && templateAccentToAppAccent[value]) {
      onUpdateAppAppearance?.("accentColor", templateAccentToAppAccent[value]);
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Appearance</p>
          <h2>Template Appearance</h2>
          <p>
            Keep template density and legacy accent settings here. Full app color controls live in
            Settings.
          </p>
        </div>
      </div>

      <div className="form-grid customize-card">
        <label className="field-label" htmlFor="accent-color">
          Template accent
          <span className="field-help">
            Kept for template compatibility; Settings controls the full app color palette.
          </span>
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
          <span className="field-help">Comfortable gives more breathing room; compact tightens panels.</span>
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
