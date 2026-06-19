import { useRef, useState } from "react";
import packageInfo from "../../package.json";
import { formatRelativeDays } from "../utils/dates.js";

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
      label: "No local backup yet",
      detail: "Export a backup to protect your local routines and history.",
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
            className={value === option.id ? "button edit-action small" : "button ghost small"}
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
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
  onResetAll,
  onResetHistory
}) {
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const health = backupStatus(lastFullBackupExportedAt, backupDue);

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

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading compact-heading">
          <h2>Settings</h2>
        </div>
      </section>

      <section className="panel settings-card">
        <h2>Today</h2>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={Boolean(appAppearance?.startTodayEmpty)}
            onChange={(event) => onUpdateStartTodayEmpty(event.target.checked)}
          />
          <span>
            <strong>Start empty</strong>
            <small>New days skip default tasks.</small>
          </span>
        </label>
      </section>

      <section className="panel settings-card">
        <h2>Appearance</h2>
        <ChoiceButtons
          label="Font size"
          value={appAppearance?.fontSize || "normal"}
          options={[
            { id: "small", label: "Small" },
            { id: "normal", label: "Normal" },
            { id: "large", label: "Large" }
          ]}
          onChange={(value) => onUpdateAppAppearance("fontSize", value)}
        />
        <ChoiceButtons
          label="Layout density"
          value={appAppearance?.density || "comfortable"}
          options={[
            { id: "compact", label: "Compact" },
            { id: "comfortable", label: "Comfortable" }
          ]}
          onChange={(value) => onUpdateAppAppearance("density", value)}
        />
      </section>

      <details className="panel settings-card compact-detail">
        <summary className="simple-summary">
          <span>
            <strong>App colors</strong>
            <small>Accent and page background.</small>
          </span>
          <span className="button ghost small">Open</span>
        </summary>
        <div className="settings-detail-content">
          <div className="appearance-setting-group">
            <p className="field-label">Accent color</p>
            <div className="appearance-choice-grid">
              {accentOptions.map((option) => (
                <button
                  className={
                    appAppearance?.accentColor === option.id
                      ? "appearance-choice active"
                      : "appearance-choice"
                  }
                  data-accent-choice={option.id}
                  key={option.id}
                  type="button"
                  aria-pressed={appAppearance?.accentColor === option.id}
                  onClick={() => onUpdateAppAppearance("accentColor", option.id)}
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
                  className={
                    appAppearance?.backgroundColor === option.id
                      ? "appearance-choice active"
                      : "appearance-choice"
                  }
                  data-background-choice={option.id}
                  key={option.id}
                  type="button"
                  aria-pressed={appAppearance?.backgroundColor === option.id}
                  onClick={() => onUpdateAppAppearance("backgroundColor", option.id)}
                >
                  <span className="appearance-swatch" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      <section className="panel settings-card backup-health-card">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Backup</p>
            <h2>Backup health</h2>
            <p>Your data exists only in this browser or installed app.</p>
          </div>
          <span className={health.tone === "due" ? "status-pill warning" : "status-pill"}>
            {health.label}
          </span>
        </div>
        <p>{health.detail}</p>
        <div className="settings-actions">
          <button className="button primary" type="button" onClick={handleExportFullBackup}>
            Export full backup
          </button>
          <button className="button ghost" type="button" onClick={() => fileInputRef.current?.click()}>
            Import full backup
          </button>
          <input
            ref={fileInputRef}
            className="hidden-input"
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
          />
        </div>
        <label className="field-label settings-inline-field" htmlFor="backup-reminder-interval">
          Backup reminder
          <select
            id="backup-reminder-interval"
            value={backupReminderIntervalDays}
            onChange={(event) => onUpdateBackupReminderInterval(event.target.value)}
          >
            <option value={0}>Off</option>
            <option value={14}>Every 14 days</option>
            <option value={30}>Every 30 days</option>
            <option value={60}>Every 60 days</option>
          </select>
        </label>
        {message ? <p className="form-message">{message}</p> : null}
      </section>

      <details className="panel settings-card compact-detail">
        <summary className="simple-summary">
          <span>
            <strong>Privacy</strong>
            <small>Local-only data and no account.</small>
          </span>
          <span className="button ghost small">Open</span>
        </summary>
        <p>
          Clean30 has no account, cloud sync, analytics, or ads. Export a backup before clearing
          browser or app data.
        </p>
      </details>

      <details className="panel settings-card compact-detail">
        <summary className="simple-summary">
          <span>
            <strong>Help / onboarding</strong>
            <small>Guide and first-run walkthrough.</small>
          </span>
          <span className="button ghost small">Open</span>
        </summary>
        <div className="settings-actions">
          <button className="button ghost" type="button" onClick={onOpenHelp}>
            Open help guide
          </button>
          <button className="button ghost" type="button" onClick={onRestartOnboarding}>
            Restart onboarding
          </button>
        </div>
      </details>

      <details className="panel settings-card compact-detail">
        <summary className="simple-summary">
          <span>
            <strong>Install</strong>
            <small>PWA install and app reload.</small>
          </span>
          <span className="button ghost small">Open</span>
        </summary>
        <p>Install Clean30 from your browser. Reload to pick up the latest deployed version.</p>
        <button className="button ghost" type="button" onClick={() => window.location.reload()}>
          Reload app
        </button>
      </details>

      <details className="panel settings-card compact-detail">
        <summary className="simple-summary">
          <span>
            <strong>About</strong>
            <small>App details and tester version.</small>
          </span>
          <span className="button ghost small">Open</span>
        </summary>
        <div className="settings-detail-content">
          <div>
            <h3>{template.name}</h3>
            <p>{template.profile.homeName}</p>
          </div>
          <p className="version-label">Version {packageInfo.version}</p>
          <button className="button ghost" type="button" onClick={onManageCustomize}>
            Edit app details
          </button>
        </div>
      </details>

      <details className="panel danger-zone settings-danger-detail">
        <summary className="simple-summary">
          <span>
            <span className="eyebrow">Danger Zone</span>
            <strong>Reset local data</strong>
            <small>Collapsed by default. Confirmations still apply.</small>
          </span>
          <span className="button danger-ghost small">Open</span>
        </summary>
        <p className="muted">These actions affect stored local app data. Use them carefully.</p>
        <div className="settings-actions">
          <button className="button danger-ghost" type="button" onClick={onResetHistory}>
            Reset only history
          </button>
          <button className="button danger" type="button" onClick={onResetAll}>
            Reset all data
          </button>
        </div>
      </details>
    </div>
  );
}
