import { createTask, moveItem } from "../../utils/routineUtils.js";

export default function DailyRulesSection({ dailyRules, canEdit, onEditTemplate, onConfirmEdit }) {
  function addRule() {
    const rule = createTask();
    rule.title = "New daily rule";
    onEditTemplate((draft) => {
      draft.dailyRules.push(rule);
    });
  }

  function updateRule(index, field, value) {
    onEditTemplate((draft) => {
      draft.dailyRules[index][field] = value;
    });
  }

  function moveRule(index, direction) {
    onEditTemplate((draft) => {
      draft.dailyRules = moveItem(draft.dailyRules, index, direction);
    });
  }

  function deleteRule(rule, index) {
    onConfirmEdit({
      title: "Delete daily rule?",
      message: `"${rule.title}" will be removed from today's checklist and the Daily Rules routine.`,
      confirmLabel: "Delete rule",
      edit: (draft) => {
        draft.dailyRules.splice(index, 1);
      }
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Daily Rules</p>
          <h2>Tiny Preventive Rules</h2>
          <p>
            These rules appear on the dashboard and also power the generated Daily Rules routine.
          </p>
        </div>
        <button className="button primary" type="button" disabled={!canEdit} onClick={addRule}>
          Add daily rule
        </button>
      </div>

      <p className="callout small">
        Edit daily rules here. The Daily Rules routine mirrors this list automatically.
      </p>

      <div className="editor-list">
        {dailyRules.map((rule, index) => (
          <div className="editor-card" key={rule.id}>
            <div className="form-grid">
              <label className="field-label" htmlFor={`daily-title-${rule.id}`}>
                Title
                <input
                  id={`daily-title-${rule.id}`}
                  value={rule.title}
                  disabled={!canEdit}
                  onChange={(event) => updateRule(index, "title", event.target.value)}
                />
              </label>
              <label className="field-label" htmlFor={`daily-duration-${rule.id}`}>
                Estimated time
                <input
                  id={`daily-duration-${rule.id}`}
                  value={rule.duration}
                  disabled={!canEdit}
                  onChange={(event) => updateRule(index, "duration", event.target.value)}
                />
              </label>
              <label className="field-label field-span" htmlFor={`daily-detail-${rule.id}`}>
                Detail
                <textarea
                  id={`daily-detail-${rule.id}`}
                  className="textarea-small"
                  value={rule.detail}
                  disabled={!canEdit}
                  onChange={(event) => updateRule(index, "detail", event.target.value)}
                />
              </label>
            </div>
            <div className="row-actions">
              <button
                className="button small ghost"
                type="button"
                disabled={!canEdit || index === 0}
                onClick={() => moveRule(index, -1)}
              >
                Move up
              </button>
              <button
                className="button small ghost"
                type="button"
                disabled={!canEdit || index === dailyRules.length - 1}
                onClick={() => moveRule(index, 1)}
              >
                Move down
              </button>
              <button
                className="button small danger-ghost"
                type="button"
                disabled={!canEdit}
                onClick={() => deleteRule(rule, index)}
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
