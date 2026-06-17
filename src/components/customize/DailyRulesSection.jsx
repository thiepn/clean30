import { useEffect, useState } from "react";
import { createTask, moveItem } from "../../utils/routineUtils.js";

const weekdayOptions = [
  { id: "general", label: "General" },
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" }
];

const EMPTY_TASKS = [];

function cloneTasks(tasks) {
  return JSON.parse(JSON.stringify(tasks || []));
}

export default function DailyRulesSection({
  dailyRules,
  weekdayDefaultsEnabled = false,
  weekdayDefaults = {},
  canEdit,
  onEditTemplate,
  onConfirmEdit
}) {
  const [selectedDay, setSelectedDay] = useState("general");
  const activeRules =
    selectedDay === "general" ? dailyRules : weekdayDefaults?.[selectedDay] || EMPTY_TASKS;
  const [selectedRuleId, setSelectedRuleId] = useState(activeRules[0]?.id || "");
  const selectedRule = activeRules.find((rule) => rule.id === selectedRuleId) || activeRules[0] || null;
  const selectedRuleIndex = selectedRule
    ? activeRules.findIndex((rule) => rule.id === selectedRule.id)
    : -1;
  const usesGeneralFallback =
    weekdayDefaultsEnabled && selectedDay !== "general" && activeRules.length === 0;

  useEffect(() => {
    if (!weekdayDefaultsEnabled && selectedDay !== "general") {
      setSelectedDay("general");
    }
  }, [selectedDay, weekdayDefaultsEnabled]);

  useEffect(() => {
    if (!selectedRule && activeRules[0]) {
      setSelectedRuleId(activeRules[0].id);
    }
    if (!activeRules.length) {
      setSelectedRuleId("");
    }
  }, [activeRules, selectedRule]);

  function editActiveRules(mutator) {
    onEditTemplate((draft) => {
      if (selectedDay === "general") {
        const defaults = draft.todayDefaults || draft.dailyRules || [];
        mutator(defaults);
        draft.todayDefaults = defaults;
        return;
      }

      const weekdayDefaults = { ...(draft.todayWeekdayDefaults || {}) };
      const defaults = [...(weekdayDefaults[selectedDay] || [])];
      mutator(defaults);
      weekdayDefaults[selectedDay] = defaults;
      draft.todayWeekdayDefaults = weekdayDefaults;
    });
  }

  function updateWeekdayEnabled(enabled) {
    onEditTemplate((draft) => {
      draft.todayWeekdayDefaultsEnabled = enabled;
      draft.todayWeekdayDefaults = draft.todayWeekdayDefaults || {};
    });
  }

  function addRule() {
    const rule = createTask();
    rule.title = "New Today task";
    editActiveRules((defaults) => {
      defaults.push(rule);
    });
    setSelectedRuleId(rule.id);
  }

  function updateRule(index, field, value) {
    editActiveRules((defaults) => {
      defaults[index][field] = value;
    });
  }

  function moveRule(index, direction) {
    editActiveRules((defaults) => {
      const moved = moveItem(defaults, index, direction);
      defaults.splice(0, defaults.length, ...moved);
    });
  }

  function deleteRule(rule, index) {
    const fallback = activeRules[index + 1] || activeRules[index - 1] || null;
    onConfirmEdit({
      title: "Delete default Today task?",
      message: `"${rule.title}" will be removed from the default Today tasks.`,
      confirmLabel: "Delete task",
      edit: (draft) => {
        const defaults =
          selectedDay === "general"
            ? draft.todayDefaults || draft.dailyRules || []
            : draft.todayWeekdayDefaults?.[selectedDay] || [];
        defaults.splice(index, 1);
        if (selectedDay === "general") draft.todayDefaults = defaults;
        else draft.todayWeekdayDefaults = { ...(draft.todayWeekdayDefaults || {}), [selectedDay]: defaults };
      },
      afterConfirm: () => setSelectedRuleId(fallback?.id || "")
    });
  }

  function copyGeneralDefaults() {
    onEditTemplate((draft) => {
      draft.todayWeekdayDefaults = {
        ...(draft.todayWeekdayDefaults || {}),
        [selectedDay]: cloneTasks(draft.todayDefaults || draft.dailyRules || [])
      };
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Default Today Tasks</h2>
          <p>General defaults appear on new days unless weekday defaults override them.</p>
        </div>
        <button className="button edit-action small" type="button" disabled={!canEdit} onClick={addRule}>
          Add
        </button>
      </div>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={weekdayDefaultsEnabled}
          disabled={!canEdit}
          onChange={(event) => updateWeekdayEnabled(event.target.checked)}
        />
        <span>
          <strong>Use different defaults by weekday</strong>
          <small>Empty weekdays fall back to General.</small>
        </span>
      </label>

      {weekdayDefaultsEnabled ? (
        <div className="weekday-selector" role="tablist" aria-label="Today default day">
          {weekdayOptions.map((option) => (
            <button
              className={selectedDay === option.id ? "tab active" : "tab"}
              key={option.id}
              type="button"
              onClick={() => setSelectedDay(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {usesGeneralFallback ? (
        <div className="callout small weekday-fallback">
          This weekday uses General defaults.
          <button className="button ghost small" type="button" disabled={!canEdit} onClick={copyGeneralDefaults}>
            Copy General
          </button>
        </div>
      ) : null}

      <div className="editor-list compact-editor-list">
        {activeRules.map((rule, index) => (
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
                disabled={!canEdit || index === activeRules.length - 1}
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
        <p className="callout small">
          {usesGeneralFallback
            ? "Copy General or add a task to customize this weekday."
            : "No default Today tasks. Dashboard can still accept one-off tasks."}
        </p>
      )}
    </section>
  );
}
