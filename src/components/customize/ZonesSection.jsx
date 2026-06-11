import { moveItem } from "../../utils/routineUtils.js";
import { createId } from "../../utils/templateUtils.js";

export default function ZonesSection({ zones, canEdit, onEditTemplate, onConfirmEdit }) {
  function addZone() {
    onEditTemplate((draft) => {
      draft.zones.push({ id: createId("zone"), name: "New zone" });
    });
  }

  function renameZone(index, value) {
    onEditTemplate((draft) => {
      draft.zones[index].name = value;
    });
  }

  function moveZone(index, direction) {
    onEditTemplate((draft) => {
      draft.zones = moveItem(draft.zones, index, direction);
    });
  }

  function deleteZone(zone, index) {
    onConfirmEdit({
      title: "Delete zone?",
      message: `"${zone.name}" will be removed from this custom template.`,
      confirmLabel: "Delete zone",
      edit: (draft) => {
        draft.zones.splice(index, 1);
      }
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Zones</p>
          <h2>Apartment Map</h2>
        </div>
        <button className="button primary" type="button" disabled={!canEdit} onClick={addZone}>
          Add zone
        </button>
      </div>

      <div className="editor-list">
        {zones.map((zone, index) => (
          <div className="editor-row" key={zone.id}>
            <label className="field-label" htmlFor={`zone-${zone.id}`}>
              Zone
              <input
                id={`zone-${zone.id}`}
                value={zone.name}
                disabled={!canEdit}
                onChange={(event) => renameZone(index, event.target.value)}
              />
            </label>
            <div className="row-actions">
              <button
                className="button small ghost"
                type="button"
                disabled={!canEdit || index === 0}
                onClick={() => moveZone(index, -1)}
              >
                Move up
              </button>
              <button
                className="button small ghost"
                type="button"
                disabled={!canEdit || index === zones.length - 1}
                onClick={() => moveZone(index, 1)}
              >
                Move down
              </button>
              <button
                className="button small danger-ghost"
                type="button"
                disabled={!canEdit}
                onClick={() => deleteZone(zone, index)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
