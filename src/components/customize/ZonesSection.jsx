import { useEffect, useState } from "react";
import { moveItem } from "../../utils/routineUtils.js";
import { createId } from "../../utils/templateUtils.js";

export default function ZonesSection({ zones, canEdit, onEditTemplate, onConfirmEdit }) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || "");
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) || zones[0] || null;
  const selectedZoneIndex = selectedZone
    ? zones.findIndex((zone) => zone.id === selectedZone.id)
    : -1;

  useEffect(() => {
    if (!selectedZone && zones[0]) {
      setSelectedZoneId(zones[0].id);
    }
    if (!zones.length) {
      setSelectedZoneId("");
    }
  }, [zones, selectedZone]);

  function addZone() {
    const zone = { id: createId("zone"), name: "New zone" };
    onEditTemplate((draft) => {
      draft.zones.push(zone);
    });
    setSelectedZoneId(zone.id);
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
    const fallback = zones[index + 1] || zones[index - 1] || null;
    onConfirmEdit({
      title: "Delete zone?",
      message: `"${zone.name}" will be removed from this custom template.`,
      confirmLabel: "Delete zone",
      edit: (draft) => {
        draft.zones.splice(index, 1);
      },
      afterConfirm: () => setSelectedZoneId(fallback?.id || "")
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Zones</p>
          <h2>Apartment Map</h2>
          <p>Zones keep routines scannable by naming the real areas you clean.</p>
        </div>
        <button className="button primary" type="button" disabled={!canEdit} onClick={addZone}>
          Add zone
        </button>
      </div>

      <div className="editor-list compact-editor-list">
        {zones.map((zone, index) => (
          <div className={selectedZone?.id === zone.id ? "editor-row active" : "editor-row"} key={zone.id}>
            <button className="editor-select" type="button" onClick={() => setSelectedZoneId(zone.id)}>
              <strong>{zone.name}</strong>
              <span>Zone {index + 1}</span>
            </button>
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

      {selectedZone && selectedZoneIndex >= 0 ? (
        <div className="editor-card selected-editor-card">
          <div className="editor-row-main">
            <span className="editor-index">{selectedZoneIndex + 1}</span>
            <label className="field-label" htmlFor={`zone-${selectedZone.id}`}>
              Selected zone
              <input
                id={`zone-${selectedZone.id}`}
                value={selectedZone.name}
                disabled={!canEdit}
                onChange={(event) => renameZone(selectedZoneIndex, event.target.value)}
              />
            </label>
          </div>
        </div>
      ) : (
        <p className="callout small">No zones yet. Add a zone to organize routines.</p>
      )}
    </section>
  );
}
