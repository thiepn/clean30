import { useEffect, useState } from "react";
import { createTask, moveItem } from "../../utils/routineUtils.js";

export default function DailyRulesSection({ dailyRules, canEdit, onEditTemplate, onConfirmEdit }) {
  const [selectedRuleId, setSelectedRuleId] = useState(dailyRules[0]?.id || "");
  const selectedRule = dailyRules.find((rule) => rule.id === selectedRuleId) || dailyRules[0] || null;
  const selectedRuleIndex = selectedRule
    ? dailyRules.findIndex((rule) => rule.id === selectedRule.id)
    : -1;

  useEffect(() => {
    if (!selectedRule && dailyRules[0]) {
      setSelectedRuleId(dailyRules[0].id);
    }
    if (!dailyRules.length) {
      setSelectedRuleId("");
    }
  }, [dailyRules, selectedRule]);

  function addRule() {
    const rule = createTask();
    rule.title = "New Today task";
    onEditTemplate((draft) => {
      draft.todayDefaults = [...(draft.todayDefaults || draft.dailyRules || []), rule];
    });
    setSelectedRuleId(rule.id);
  }

  function updateRule(index, field, value) {
    onEditTemplate((draft) => {
      const defaults = draft.todayDefaults || draft.dailyRules || [];
      defaults[index][field] = value;
      draft.todayDefaults = defaults;
    });
  }

  function moveRule(index, direction) {
    onEditTemplate((draft) => {
      draft.todayDefaults = moveItem(draft.todayDefaults || draft.dailyRules || [], index, direction);
    });
  }

  function deleteRule(rule, index) {
    const fallback = dailyRules[index + 1] || dailyRules[index - 1] || null;
    onConfirmEdit({
      title: "Delete default Today task?",
      message: `"${rule.title}" will be removed from the default Today tasks.`,
      confirmLabel: "Delete task",
      edit: (draft) => {
        const defaults = draft.todayDefaults || draft.dailyRules || [];
        defaults.splice(index, 1);
        draft.todayDefaults = defaults;
      },
      afterConfirm: () => setSelectedRuleId(fallback?.id || "")
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Default Today Tasks</h2>
          <p>These tasks appear automatically in Today for each new day.</p>
        </div>
        <button className="button primary" type="button" disabled={!canEdit} onClick={addRule}>
          Add default task
        </button>
      </div>

      <p className="callout small">
        Delete every default task if you want Today to start empty. One-off tasks are still added
        from Dashboard.
      </p>

      <div className="editor-list compact-editor-list">
        {dailyRules.map((rule, index) => (
          <div className={selectedRule?.id === rule.id ? "editor-row active" : "editor-row"} key={rule.id}>
            <button className="editor-select" type="button" onClick={() => setSelectedRuleId(rule.id)}>
              <strong>{rule.title}</strong>
              <span>{rule.duration || "No estimate"}</span>
            </button>
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

      {selectedRule && selectedRuleIndex >= 0 ? (
        <div className="editor-card selected-editor-card">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Selected task</p>
              <h3>{selectedRule.title}</h3>
            </div>
            <span className="duration">{selectedRule.duration || "No estimate"}</span>
          </div>
          <div className="form-grid">
            <label className="field-label" htmlFor={`daily-title-${selectedRule.id}`}>
              Title
              <input
                id={`daily-title-${selectedRule.id}`}
                value={selectedRule.title}
                disabled={!canEdit}
                onChange={(event) => updateRule(selectedRuleIndex, "title", event.target.value)}
              />
            </label>
            <label className="field-label" htmlFor={`daily-duration-${selectedRule.id}`}>
              Estimated time
              <input
                id={`daily-duration-${selectedRule.id}`}
                value={selectedRule.duration}
                disabled={!canEdit}
                onChange={(event) => updateRule(selectedRuleIndex, "duration", event.target.value)}
              />
            </label>
            <label className="field-label field-span" htmlFor={`daily-detail-${selectedRule.id}`}>
              Detail
              <textarea
                id={`daily-detail-${selectedRule.id}`}
                className="textarea-small"
                value={selectedRule.detail}
                disabled={!canEdit}
                onChange={(event) => updateRule(selectedRuleIndex, "detail", event.target.value)}
              />
            </label>
          </div>
        </div>
      ) : (
        <p className="callout small">No default Today tasks. Dashboard can still accept one-off tasks.</p>
      )}
    </section>
  );
}
