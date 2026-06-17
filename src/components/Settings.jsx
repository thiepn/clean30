import { useRef, useState } from "react";
import { formatDateTime } from "../utils/dates.js";

const accentOptions = [
  { id: "red", label: "Red" },
  { id: "orange", label: "Orange" },
  { id: "amber", label: "Amber" },
  { id: "green", label: "Green" },
  { id: "teal", label: "Teal" },
  { id: "cyan", label: "Cyan" },
  { id: "blue", label: "Blue" },
  { id: "navy", label: "Navy" },
  { id: "purple", label: "Purple" },
  { id: "pink", label: "Pink" },
  { id: "brown", label: "Brown" },
  { id: "charcoal", label: "Charcoal" }
];

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

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const result = onImportFullBackup(payload);
        setMessage(result.ok ? result.message || "Backup imported successfully." : result.error);
      } catch {
        setMessage("Backup file is not valid JSON.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading compact-heading">
          <div>
            <h2>Settings</h2>
          </div>
        </div>
      </section>

      <section className="panel settings-card">
        <div>
          <h2>{template.name}</h2>
          <p>{template.profile.goalText}</p>
        </div>
        <div className="settings-summary-row">
          <span>{template.profile.homeName}</span>
          <span>Editable</span>
          <span>{template.profile.apartmentSizeText}</span>
        </div>
        <button className="button ghost" type="button" onClick={onManageCustomize}>
          Edit app details
        </button>
      </section>

      <section className="panel settings-card">
        <div>
          <h2>App Colors</h2>
        </div>
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
      </section>

      <section className="panel settings-card">
        <div>
          <h2>Today</h2>
        </div>
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
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Backup & Data</p>
            <h2>Local Data</h2>
            <p>Your data is stored only on this device/browser.</p>
          </div>
        </div>
        <div className={backupDue ? "backup-box due" : "backup-box"}>
          <div>
            <strong>{backupDue ? "Backup reminder" : "Backup status"}</strong>
            <p>
              Export a full backup occasionally so your routines and history are easy to restore.
            </p>
            <span>
              Last full backup:{" "}
              {lastFullBackupExportedAt ? formatDateTime(lastFullBackupExportedAt) : "Not yet"}
            </span>
          </div>
          <button className="button primary" type="button" onClick={onExportFullBackup}>
            Export full backup
          </button>
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
        <div className="settings-actions">
          <button
            className="button ghost"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
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
          Clean30 has no account, no cloud sync, no analytics, and no ads. Your data stays on this
          device unless you export a backup.
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
