import { useState } from "react";
import { getRoutineTotalTasks } from "../../utils/calculations.js";
import { weekdayOptions } from "../../utils/dates.js";
import { createTask, moveItem } from "../../utils/routineUtils.js";

const shortDailyRuleLabels = {
  "No food trash overnight": "No food trash",
  "Dishes returned to kitchen": "Dishes back",
  "Clothes into laundry basket": "Laundry basket",
  "Bathroom smell check": "Smell check"
};

function shortRuleLabel(title) {
  return shortDailyRuleLabels[title] || title;
}

function templateStatus(template) {
  return template.readOnly ? "Default / read-only" : "Editable copy";
}

export default function SimpleCustomizeSection({
  templates,
  activeTemplate,
  canEdit,
  message,
  templateGallery,
  onSetActiveTemplate,
  onDuplicateDefault,
  onEditTemplate,
  onConfirmEdit,
  onUseGalleryTemplate,
  onExportTemplate,
  onImportTemplateClick,
  onExportFullBackup,
  onResetHistory,
  onResetAll,
  onOpenAdvancedCustomize
}) {
  const [editingRuleId, setEditingRuleId] = useState(activeTemplate.dailyRules[0]?.id || "");
  const profile = activeTemplate.profile;
  const schedule = activeTemplate.schedule;
  const selectedRule =
    activeTemplate.dailyRules.find((rule) => rule.id === editingRuleId) ||
    activeTemplate.dailyRules[0] ||
    null;
  const selectedRuleIndex = selectedRule
    ? activeTemplate.dailyRules.findIndex((rule) => rule.id === selectedRule.id)
    : -1;

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

  function updateSchedule(field, value) {
    onEditTemplate((draft) => {
      draft.schedule[field] = value;
    });
  }

  function addRule() {
    const rule = createTask();
    rule.title = "New daily rule";
    onEditTemplate((draft) => {
      draft.dailyRules.push(rule);
    });
    setEditingRuleId(rule.id);
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
      },
      afterConfirm: () => {
        const nextRule = activeTemplate.dailyRules[index + 1] || activeTemplate.dailyRules[index - 1];
        setEditingRuleId(nextRule?.id || "");
      }
    });
  }

  return (
    <div className="screen-stack simple-customize">
      <section className="panel simple-intro-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Simple Editor</p>
            <h2>Change the basics of your cleaning system.</h2>
            <p>Deep routine steps, phases, systems, and appearance live in Advanced Editor.</p>
          </div>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </section>

      <section className="panel simple-system-card">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Current system</p>
            <h2>{activeTemplate.name}</h2>
            <p>{templateStatus(activeTemplate)}</p>
          </div>
          <span className="pill">{activeTemplate.readOnly ? "Default" : "Editable"}</span>
        </div>

        <div className="simple-template-row">
          <label className="field-label" htmlFor="simple-active-template">
            Active template
            <select
              id="simple-active-template"
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
        </div>

        {activeTemplate.readOnly ? (
          <div className="readonly-notice compact-notice">
            <div>
              <strong>Duplicate to edit.</strong>
              <p>The Clean30 default is protected so you always have a stable copy.</p>
            </div>
            <button className="button primary" type="button" onClick={onDuplicateDefault}>
              Duplicate to edit
            </button>
          </div>
        ) : (
          <p className="muted simple-system-note">
            {profile.homeName} / {profile.goalText}
          </p>
        )}
      </section>

      <details className="panel simple-detail">
        <summary className="simple-summary">
          <span>
            <span className="eyebrow">Home Display</span>
            <strong>{profile.appDisplayName}</strong>
            <small>
              {profile.homeName} / {profile.apartmentSizeText || "Size not set"}
            </small>
            <small>{profile.goalText}</small>
          </span>
          <span className="button ghost small">{canEdit ? "Edit" : "Read-only"}</span>
        </summary>

        {!canEdit ? (
          <p className="callout small">Duplicate the default template before editing home display.</p>
        ) : null}
        <div className="form-grid customize-card compact-form-card">
          <label className="field-label" htmlFor="simple-template-name">
            Template name
            <input
              id="simple-template-name"
              value={activeTemplate.name}
              disabled={!canEdit}
              onChange={(event) => updateTemplateName(event.target.value)}
            />
          </label>
          <label className="field-label" htmlFor="simple-app-display-name">
            App display name
            <input
              id="simple-app-display-name"
              value={profile.appDisplayName}
              disabled={!canEdit}
              onChange={(event) => updateProfile("appDisplayName", event.target.value)}
            />
          </label>
          <label className="field-label" htmlFor="simple-home-name">
            Apartment/home name
            <input
              id="simple-home-name"
              value={profile.homeName}
              disabled={!canEdit}
              onChange={(event) => updateProfile("homeName", event.target.value)}
            />
          </label>
          <label className="field-label" htmlFor="simple-apartment-size">
            Apartment size text
            <input
              id="simple-apartment-size"
              value={profile.apartmentSizeText}
              disabled={!canEdit}
              onChange={(event) => updateProfile("apartmentSizeText", event.target.value)}
            />
          </label>
          <label className="field-label" htmlFor="simple-apartment-type">
            Apartment type text
            <input
              id="simple-apartment-type"
              value={profile.apartmentTypeText}
              disabled={!canEdit}
              onChange={(event) => updateProfile("apartmentTypeText", event.target.value)}
            />
          </label>
          <label className="field-label" htmlFor="simple-goal-text">
            Main cleaning goal text
            <input
              id="simple-goal-text"
              value={profile.goalText}
              disabled={!canEdit}
              onChange={(event) => updateProfile("goalText", event.target.value)}
            />
          </label>
        </div>
      </details>

      <details className="panel simple-detail">
        <summary className="simple-summary">
          <span>
            <span className="eyebrow">Reset Timing</span>
            <strong>
              Weekly: {schedule.weeklyResetDay} / Fallback: {schedule.backupResetDay}
            </strong>
            <small>
              Monthly: {schedule.monthlyDeepCleanInterval} days / Due after{" "}
              {schedule.weeklyResetDueAfterDays} days
            </small>
          </span>
          <span className="button ghost small">{canEdit ? "Edit" : "Read-only"}</span>
        </summary>

        {!canEdit ? (
          <p className="callout small">Duplicate the default template before editing reset timing.</p>
        ) : null}
        <div className="form-grid customize-card compact-form-card">
          <label className="field-label" htmlFor="simple-weekly-reset-day">
            Weekly reset day
            <select
              id="simple-weekly-reset-day"
              value={schedule.weeklyResetDay}
              disabled={!canEdit}
              onChange={(event) => updateSchedule("weeklyResetDay", event.target.value)}
            >
              {weekdayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label" htmlFor="simple-fallback-reset-day">
            Fallback reset day
            <span className="field-help">Cleaning fallback day. This is not data backup.</span>
            <select
              id="simple-fallback-reset-day"
              value={schedule.backupResetDay}
              disabled={!canEdit}
              onChange={(event) => updateSchedule("backupResetDay", event.target.value)}
            >
              {weekdayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label" htmlFor="simple-monthly-interval">
            Monthly deep clean interval in days
            <input
              id="simple-monthly-interval"
              type="number"
              min="14"
              max="90"
              value={schedule.monthlyDeepCleanInterval}
              disabled={!canEdit}
              onChange={(event) =>
                updateSchedule("monthlyDeepCleanInterval", Number(event.target.value))
              }
            />
          </label>
          <label className="field-label" htmlFor="simple-weekly-due-after">
            Weekly reset due after X days
            <input
              id="simple-weekly-due-after"
              type="number"
              min="1"
              max="30"
              value={schedule.weeklyResetDueAfterDays}
              disabled={!canEdit}
              onChange={(event) =>
                updateSchedule("weeklyResetDueAfterDays", Number(event.target.value))
              }
            />
          </label>
        </div>
      </details>

      <details className="panel simple-detail">
        <summary className="simple-summary">
          <span>
            <span className="eyebrow">Daily Rules</span>
            <strong>{activeTemplate.dailyRules.length} dashboard habits</strong>
            <small>Compact daily checklist shown on Dashboard.</small>
          </span>
          <span className="button ghost small">{canEdit ? "Edit rules" : "Read-only"}</span>
        </summary>

        <div className="simple-rule-list">
          {activeTemplate.dailyRules.map((rule) => (
            <div className="simple-rule-row" key={rule.id}>
              <span>{shortRuleLabel(rule.title)}</span>
              {rule.duration ? <span className="duration">{rule.duration}</span> : null}
            </div>
          ))}
        </div>

        {!canEdit ? (
          <p className="callout small">Duplicate the default template before editing Daily Rules.</p>
        ) : null}
        {canEdit ? (
          <div className="simple-rule-editor">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Edit one rule</p>
                <h3>{selectedRule?.title || "No rule selected"}</h3>
              </div>
              <button className="button small primary" type="button" onClick={addRule}>
                Add rule
              </button>
            </div>
            <div className="tab-row simple-rule-tabs" aria-label="Daily rule selector">
              {activeTemplate.dailyRules.map((rule) => (
                <button
                  className={selectedRule?.id === rule.id ? "tab active" : "tab"}
                  key={rule.id}
                  type="button"
                  onClick={() => setEditingRuleId(rule.id)}
                >
                  {shortRuleLabel(rule.title)}
                </button>
              ))}
            </div>
            {selectedRule && selectedRuleIndex >= 0 ? (
              <div className="editor-card compact-rule-card">
                <div className="form-grid">
                  <label className="field-label" htmlFor={`simple-daily-title-${selectedRule.id}`}>
                    Title
                    <input
                      id={`simple-daily-title-${selectedRule.id}`}
                      value={selectedRule.title}
                      onChange={(event) =>
                        updateRule(selectedRuleIndex, "title", event.target.value)
                      }
                    />
                  </label>
                  <label
                    className="field-label"
                    htmlFor={`simple-daily-duration-${selectedRule.id}`}
                  >
                    Estimated time
                    <input
                      id={`simple-daily-duration-${selectedRule.id}`}
                      value={selectedRule.duration}
                      onChange={(event) =>
                        updateRule(selectedRuleIndex, "duration", event.target.value)
                      }
                    />
                  </label>
                  <label
                    className="field-label field-span"
                    htmlFor={`simple-daily-detail-${selectedRule.id}`}
                  >
                    Detail
                    <textarea
                      id={`simple-daily-detail-${selectedRule.id}`}
                      className="textarea-small"
                      value={selectedRule.detail}
                      onChange={(event) =>
                        updateRule(selectedRuleIndex, "detail", event.target.value)
                      }
                    />
                  </label>
                </div>
                <div className="row-actions">
                  <button
                    className="button small ghost"
                    type="button"
                    disabled={selectedRuleIndex === 0}
                    onClick={() => moveRule(selectedRuleIndex, -1)}
                  >
                    Move up
                  </button>
                  <button
                    className="button small ghost"
                    type="button"
                    disabled={selectedRuleIndex === activeTemplate.dailyRules.length - 1}
                    onClick={() => moveRule(selectedRuleIndex, 1)}
                  >
                    Move down
                  </button>
                  <button
                    className="button small danger-ghost"
                    type="button"
                    onClick={() => deleteRule(selectedRule, selectedRuleIndex)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </details>

      <section className="panel simple-actions-panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Templates</p>
            <h2>Presets and sharing</h2>
            <p>Use presets to create editable copies, or share this template as JSON.</p>
          </div>
        </div>
        <div className="settings-actions">
          <button className="button ghost" type="button" onClick={onExportTemplate}>
            Export template
          </button>
          <button className="button ghost" type="button" onClick={onImportTemplateClick}>
            Import template
          </button>
        </div>
        <details className="simple-nested-detail">
          <summary>Browse presets</summary>
          <div className="simple-gallery-grid">
            {templateGallery.map((item) => {
              const routineCount = item.template.routines.length;
              const taskCount = item.template.routines.reduce(
                (sum, routine) => sum + getRoutineTotalTasks(routine),
                0
              );
              return (
                <article className="gallery-card simple-gallery-card" key={item.id}>
                  <div>
                    <p className="eyebrow">{item.complexity}</p>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="simple-meta-row">
                      <span>{routineCount} routines</span>
                      <span>{taskCount} tasks</span>
                    </div>
                    <p className="muted">Best for: {item.bestFor}</p>
                  </div>
                  <button
                    className="button primary wide"
                    type="button"
                    onClick={() => onUseGalleryTemplate(item)}
                  >
                    Use preset
                  </button>
                </article>
              );
            })}
          </div>
        </details>
      </section>

      <section className="panel simple-actions-panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Backup</p>
            <h2>Before major changes</h2>
            <p>Export a full backup before editing lots of routines or rules.</p>
          </div>
        </div>
        <button className="button primary" type="button" onClick={onExportFullBackup}>
          Export full backup
        </button>
      </section>

      <section className="panel simple-actions-panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Advanced editing</p>
            <h2>Need deeper controls?</h2>
            <p>Edit zones, routine steps, phases, systems, schedule, appearance, and imports.</p>
          </div>
        </div>
        <button
          className="button ghost"
          type="button"
          onClick={() => onOpenAdvancedCustomize("overview")}
        >
          Open Advanced Editor
        </button>
      </section>

      <details className="panel danger-zone simple-danger-detail">
        <summary className="simple-summary">
          <span>
            <span className="eyebrow">Danger Zone</span>
            <strong>Data reset actions</strong>
            <small>Collapsed by default to avoid accidental use.</small>
          </span>
          <span className="button danger-ghost small">Open</span>
        </summary>
        <p className="muted">These actions affect stored local app data. Confirmations still apply.</p>
        <div className="settings-actions">
          <button className="button danger-ghost" type="button" onClick={onResetHistory}>
            Reset history
          </button>
          <button className="button danger" type="button" onClick={onResetAll}>
            Reset all data
          </button>
        </div>
      </details>
    </div>
  );
}
