import { useRef, useState } from "react";
import packageInfo from "../../package.json";
import { formatRelativeDays } from "../utils/dates.js";
import {
  appearancePresets,
  getAppearancePresetId
} from "../utils/appearancePresets.js";

const accentOptions = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "cyan",
  "blue",
  "navy",
  "purple",
  "pink",
  "brown",
  "charcoal"
].map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1) }));

const backgroundOptions = [
  { id: "white", label: "White" },
  { id: "light-gray", label: "Light gray" },
  { id: "cream", label: "Cream" },
  { id: "yellow", label: "Yellow" },
  { id: "peach", label: "Peach" },
  { id: "pink", label: "Pink" },
  { id: "lavender", label: "Lavender" },
  { id: "sky-blue", label: "Sky blue" },
  { id: "mint", label: "Mint" },
  { id: "green", label: "Green" },
  { id: "sand", label: "Sand" },
  { id: "slate", label: "Slate" }
];

function backupStatus(lastBackup, backupDue) {
  if (!lastBackup) {
    return {
      label: "No backup yet",
      detail: "Export a backup to protect the data stored on this device.",
      tone: "due"
    };
  }
  if (backupDue) {
    return {
      label: "Backup recommended",
      detail: `Last backup ${formatRelativeDays(lastBackup).toLowerCase()}.`,
      tone: "due"
    };
  }
  return {
    label: "Backup recent",
    detail: `Last backup ${formatRelativeDays(lastBackup).toLowerCase()}.`,
    tone: "recent"
  };
}

function ChoiceButtons({ label, value, options, onChange }) {
  return (
    <div className="appearance-setting-group">
      <p className="field-label">{label}</p>
      <div className="setting-segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            aria-pressed={value === option.id}
            className={value === option.id ? "button edit-action small" : "button ghost small"}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsDestination({ title, description, meta, onClick }) {
  return (
    <button className="settings-destination" onClick={onClick} type="button">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="settings-destination-tail">
        {meta ? <small>{meta}</small> : null}
        <span aria-hidden="true">›</span>
      </span>
    </button>
  );
}

function SettingsPageHeader({ title, description, onBack }) {
  return (
    <div className="settings-page-header">
      <button className="button ghost small" onClick={onBack} type="button">
        ← Settings
      </button>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}

export default function Settings({
  template,
  onExportFullBackup,
  onImportFullBackup,
  lastFullBackupExportedAt,
  backupDue,
  backupReminderIntervalDays,
  appAppearance,
  onUpdateBackupReminderInterval,
  onUpdateAppAppearance,
  onUpdateStartTodayEmpty,
  onRestartOnboarding,
  onOpenHelp,
  onManageCustomize,
  onResetTemplate,
  onResetAll,
  onResetHistory
}) {
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [activePage, setActivePage] = useState(null);
  const health = backupStatus(lastFullBackupExportedAt, backupDue);
  const activePresetId = getAppearancePresetId(appAppearance);
  const activePreset = appearancePresets.find((preset) => preset.id === activePresetId);

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const result = onImportFullBackup(payload, { fileName: file.name });
        setMessage(result.ok ? result.message || "Backup validated." : result.error);
      } catch {
        setMessage("Backup file is not valid JSON. Current data was not changed.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setMessage("Backup file could not be read. Current data was not changed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    try {
      reader.readAsText(file);
    } catch {
      setMessage("Backup file could not be read. Current data was not changed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleExportFullBackup() {
    const result = onExportFullBackup();
    setMessage(
      result?.ok === false
        ? result.error
        : result?.message || "Full backup download started."
    );
  }

  function applyPreset(preset) {
    onUpdateAppAppearance("accentColor", preset.accentColor);
    onUpdateAppAppearance("backgroundColor", preset.backgroundColor);
  }

  if (!activePage) {
    return (
      <div className="screen-stack settings-screen">
        <section className="panel settings-overview-panel">
          <div className="settings-overview-heading">
            <div>
              <p className="eyebrow">Clean30</p>
              <h2>Settings</h2>
              <p>Change how the app looks, protect your data, or open advanced controls.</p>
            </div>
          </div>

          <div className="settings-destination-list">
            <SettingsDestination
              title="Appearance"
              description="Theme, text size, and layout spacing."
              meta={activePreset?.label || "Custom"}
              onClick={() => setActivePage("appearance")}
            />
            <SettingsDestination
              title="Data and backup"
              description="Export, restore, and protect local Clean30 data."
              meta={health.label}
              onClick={() => setActivePage("backup")}
            />
            <SettingsDestination
              title="Help"
              description="Quick guide, introduction, and installation help."
              onClick={() => setActivePage("help")}
            />
            <SettingsDestination
              title="About"
              description="Privacy, app version, and update controls."
              meta={`v${packageInfo.version}`}
              onClick={() => setActivePage("about")}
            />
            <SettingsDestination
              title="Advanced"
              description="Regular tasks, cleaning-plan settings, and reset tools."
              onClick={() => setActivePage("advanced")}
            />
          </div>
        </section>
      </div>
    );
  }

  if (activePage === "appearance") {
    return (
      <div className="screen-stack settings-screen">
        <section className="panel settings-focus-panel">
          <SettingsPageHeader
            title="Appearance"
            description="Choose a calm preset or customize the interface yourself."
            onBack={() => setActivePage(null)}
          />

          <div className="appearance-preset-grid" role="group" aria-label="Theme preset">
            {appearancePresets.map((preset) => (
              <button
                aria-pressed={activePresetId === preset.id}
                className={
                  activePresetId === preset.id
                    ? "appearance-preset active"
                    : "appearance-preset"
                }
                key={preset.id}
                onClick={() => applyPreset(preset)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="appearance-preset-preview"
                  data-preset={preset.id}
                />
                <strong>{preset.label}</strong>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>

          <div className="settings-focus-section">
            <ChoiceButtons
              label="Text size"
              value={appAppearance?.fontSize || "normal"}
              options={[
                { id: "small", label: "Small" },
                { id: "normal", label: "Normal" },
                { id: "large", label: "Large" }
              ]}
              onChange={(value) => onUpdateAppAppearance("fontSize", value)}
            />
            <ChoiceButtons
              label="Layout"
              value={appAppearance?.density || "comfortable"}
              options={[
                { id: "compact", label: "Compact" },
                { id: "comfortable", label: "Comfortable" }
              ]}
              onChange={(value) => onUpdateAppAppearance("density", value)}
            />
          </div>

          <details className="settings-subdetail">
            <summary>
              <span>
                <strong>Custom colors</strong>
                <small>Choose any available accent and background.</small>
              </span>
              <span aria-hidden="true">›</span>
            </summary>
            <div className="settings-detail-content">
              <div className="appearance-setting-group">
                <p className="field-label">Accent color</p>
                <div className="appearance-choice-grid">
                  {accentOptions.map((option) => (
                    <button
                      aria-pressed={appAppearance?.accentColor === option.id}
                      className={
                        appAppearance?.accentColor === option.id
                          ? "appearance-choice active"
                          : "appearance-choice"
                      }
                      data-accent-choice={option.id}
                      key={option.id}
                      onClick={() => onUpdateAppAppearance("accentColor", option.id)}
                      type="button"
                    >
                      <span className="appearance-swatch" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="appearance-setting-group">
                <p className="field-label">Background color</p>
                <div className="appearance-choice-grid">
                  {backgroundOptions.map((option) => (
                    <button
                      aria-pressed={appAppearance?.backgroundColor === option.id}
                      className={
                        appAppearance?.backgroundColor === option.id
                          ? "appearance-choice active"
                          : "appearance-choice"
                      }
                      data-background-choice={option.id}
                      key={option.id}
                      onClick={() => onUpdateAppAppearance("backgroundColor", option.id)}
                      type="button"
                    >
                      <span className="appearance-swatch" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </section>
      </div>
    );
  }

  if (activePage === "backup") {
    return (
      <div className="screen-stack settings-screen">
        <section className="panel settings-focus-panel">
          <SettingsPageHeader
            title="Data and backup"
            description="Clean30 stores your data only in this browser or installed app."
            onBack={() => setActivePage(null)}
          />

          <div className={health.tone === "due" ? "backup-summary due" : "backup-summary"}>
            <span className={health.tone === "due" ? "status-pill warning" : "status-pill"}>
              {health.label}
            </span>
            <p>{health.detail}</p>
          </div>

          <div className="settings-primary-actions">
            <button className="button primary" onClick={handleExportFullBackup} type="button">
              Export backup
            </button>
            <button
              className="button ghost"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Import backup
            </button>
            <input
              accept="application/json,.json"
              className="hidden-input"
              onChange={handleImportFile}
              ref={fileInputRef}
              type="file"
            />
          </div>

          <label className="field-label settings-inline-field" htmlFor="backup-reminder-interval">
            Backup reminder
            <select
              id="backup-reminder-interval"
              onChange={(event) => onUpdateBackupReminderInterval(event.target.value)}
              value={backupReminderIntervalDays}
            >
              <option value={0}>Off</option>
              <option value={14}>Every 14 days</option>
              <option value={30}>Every 30 days</option>
              <option value={60}>Every 60 days</option>
            </select>
          </label>

          <div className="settings-info-box">
            <strong>Before importing</strong>
            <p>
              Clean30 validates the file and shows a preview before your current local data is
              replaced.
            </p>
          </div>

          {message ? <p className="form-message" role="status">{message}</p> : null}
        </section>
      </div>
    );
  }

  if (activePage === "help") {
    return (
      <div className="screen-stack settings-screen">
        <section className="panel settings-focus-panel">
          <SettingsPageHeader
            title="Help"
            description="Clean30 is designed to work without a guide. These options are here when you need them."
            onBack={() => setActivePage(null)}
          />

          <div className="settings-action-list">
            <button className="settings-action-row" onClick={onOpenHelp} type="button">
              <span>
                <strong>Quick guide</strong>
                <small>Today, Routines, Progress, and local data in a few short notes.</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
            <button className="settings-action-row" onClick={onRestartOnboarding} type="button">
              <span>
                <strong>Restart introduction</strong>
                <small>See the three-step introduction again without deleting your data.</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div className="settings-info-box">
            <strong>Install Clean30</strong>
            <p>
              Open your browser menu and choose Install app or Add to Home Screen. Your data stays
              on this device.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (activePage === "about") {
    return (
      <div className="screen-stack settings-screen">
        <section className="panel settings-focus-panel">
          <SettingsPageHeader
            title="About"
            description="Clean30 is a local-first cleaning app designed to stay simple."
            onBack={() => setActivePage(null)}
          />

          <div className="about-app-block">
            <strong>Clean30</strong>
            <span>Version {packageInfo.version}</span>
            {template.profile?.homeName ? <small>{template.profile.homeName}</small> : null}
          </div>

          <div className="privacy-fact-grid">
            <span>No account</span>
            <span>No cloud sync</span>
            <span>No analytics</span>
            <span>No ads</span>
          </div>

          <div className="settings-info-box">
            <strong>Your data stays local</strong>
            <p>
              Clearing browser or app storage can remove Clean30 data. Use Data and backup to keep
              a portable copy.
            </p>
          </div>

          <button className="button ghost" onClick={() => window.location.reload()} type="button">
            Reload app
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="screen-stack settings-screen">
      <section className="panel settings-focus-panel settings-advanced-panel">
        <SettingsPageHeader
          title="Advanced"
          description="Detailed cleaning-plan controls that are not required for everyday use."
          onBack={() => setActivePage(null)}
        />

        <div className="settings-action-list">
          <button
            className="settings-action-row"
            onClick={() => onManageCustomize("routines", "today")}
            type="button"
          >
            <span>
              <strong>Manage regular tasks</strong>
              <small>Change the tasks used when Clean30 creates a new Today list.</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
          <button
            className="settings-action-row"
            onClick={() => onManageCustomize("routines")}
            type="button"
          >
            <span>
              <strong>Manage routines</strong>
              <small>Edit reusable routines and their detailed structure.</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
          <button
            className="settings-action-row"
            onClick={() => onManageCustomize("profile")}
            type="button"
          >
            <span>
              <strong>Home details</strong>
              <small>Edit optional home labels and cleaning-plan details.</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
          <button
            className="settings-action-row"
            onClick={() => onManageCustomize("schedule")}
            type="button"
          >
            <span>
              <strong>Schedule</strong>
              <small>Adjust reset timing and existing schedule thresholds.</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
          <button
            className="settings-action-row"
            onClick={() => onManageCustomize("import-export")}
            type="button"
          >
            <span>
              <strong>Import and export</strong>
              <small>Share a cleaning plan or open the detailed backup tools.</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="settings-focus-section">
          <label className="toggle-row">
            <input
              checked={Boolean(appAppearance?.startTodayEmpty)}
              onChange={(event) => onUpdateStartTodayEmpty(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>Start each day empty</strong>
              <small>New days begin without regular Today tasks.</small>
            </span>
          </label>
        </div>

        <div className="settings-action-list">
          <button className="settings-action-row" onClick={onResetTemplate} type="button">
            <span>
              <strong>Restore starter</strong>
              <small>Replace the current cleaning plan with the Clean30 starter. Progress is kept.</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <details className="settings-subdetail danger-subdetail">
          <summary>
            <span>
              <strong>Reset data</strong>
              <small>Destructive actions stay out of the normal Settings flow.</small>
            </span>
            <span aria-hidden="true">›</span>
          </summary>
          <div className="settings-detail-content">
            <p className="muted">These actions affect data stored on this device.</p>
            <div className="settings-primary-actions">
              <button className="button danger-ghost" onClick={onResetHistory} type="button">
                Reset Progress
              </button>
              <button className="button danger" onClick={onResetAll} type="button">
                Reset all local data
              </button>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
