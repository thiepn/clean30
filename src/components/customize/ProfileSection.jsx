export default function ProfileSection({ template, canEdit, onEditTemplate }) {
  function updateTemplateName(value) {
    onEditTemplate((draft) => {
      draft.name = value;
    });
  }

  function updateProfile(field, value) {
    onEditTemplate((draft) => {
      draft.profile[field] = value;
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Apartment Profile</p>
          <h2>Display and Home Details</h2>
        </div>
      </div>

      <div className="form-grid">
        <label className="field-label" htmlFor="template-name">
          Template name
          <input
            id="template-name"
            value={template.name}
            disabled={!canEdit}
            onChange={(event) => updateTemplateName(event.target.value)}
          />
        </label>

        <label className="field-label" htmlFor="app-display-name">
          App display name
          <input
            id="app-display-name"
            value={template.profile.appDisplayName}
            disabled={!canEdit}
            onChange={(event) => updateProfile("appDisplayName", event.target.value)}
          />
        </label>

        <label className="field-label" htmlFor="home-name">
          Apartment/home name
          <input
            id="home-name"
            value={template.profile.homeName}
            disabled={!canEdit}
            onChange={(event) => updateProfile("homeName", event.target.value)}
          />
        </label>

        <label className="field-label" htmlFor="apartment-size">
          Apartment size text
          <input
            id="apartment-size"
            value={template.profile.apartmentSizeText}
            disabled={!canEdit}
            onChange={(event) => updateProfile("apartmentSizeText", event.target.value)}
          />
        </label>

        <label className="field-label" htmlFor="apartment-type">
          Apartment type text
          <input
            id="apartment-type"
            value={template.profile.apartmentTypeText}
            disabled={!canEdit}
            onChange={(event) => updateProfile("apartmentTypeText", event.target.value)}
          />
        </label>

        <label className="field-label" htmlFor="goal-text">
          Main cleaning goal text
          <input
            id="goal-text"
            value={template.profile.goalText}
            disabled={!canEdit}
            onChange={(event) => updateProfile("goalText", event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
