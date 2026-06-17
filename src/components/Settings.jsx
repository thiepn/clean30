import { useRef, useState } from "react";
import { formatDateTime } from "../utils/dates.js";
import Systems from "./Systems.jsx";

const accentOptions = [
  { id: "forest", label: "Forest" },
  { id: "teal", label: "Teal" },
  { id: "navy", label: "Navy" },
  { id: "slate", label: "Slate" },
  { id: "plum", label: "Plum" },
  { id: "brown", label: "Brown" },
  { id: "charcoal", label: "Charcoal" }
];

const backgroundOptions = [
  { id: "soft-blue", label: "Soft blue" },
  { id: "warm-cream", label: "Warm cream" },
  { id: "soft-mint", label: "Soft mint" },
  { id: "pale-green", label: "Pale green" },
  { id: "lavender", label: "Lavender" },
  { id: "cool-gray", label: "Cool gray" }
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
            <p className="eyebrow">App</p>
            <h2>Settings</h2>
            <p>App-level backup, privacy, help, and maintenance controls.</p>
          </div>
        </div>
      </section>

      <section className="panel settings-card">
        <div>
          <p className="eyebrow">Active system</p>
          <h2>{template.name}</h2>
          <p>{template.profile.goalText}</p>
        </div>
        <div className="settings-summary-row">
          <span>{template.profile.homeName}</span>
          <span>{template.readOnly ? "Default / read-only" : "Custom / editable"}</span>
          <span>{template.profile.apartmentSizeText}</span>
        </div>
        <button className="button ghost" type="button" onClick={onManageCustomize}>
          Edit system details
        </button>
      </section>

      <section className="panel settings-card">
        <div>
          <p className="eyebrow">Appearance</p>
          <h2>App Colors</h2>
          <p>Choose app-level accent and background colors. Preferences are stored locally.</p>
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

      <section className="panel settings-card">
        <p className="eyebrow">Privacy</p>
        <h2>Local Only</h2>
        <p>
          Clean30 has no account, no cloud sync, no analytics, and no ads. Your data stays on this
          device unless you export a backup.
        </p>
      </section>

      <section className="panel settings-card">
        <p className="eyebrow">Help</p>
        <h2>{template.profile.appDisplayName}</h2>
        <p>Open the short guide or restart onboarding.</p>
        <div className="settings-actions">
          <button className="button ghost" type="button" onClick={onOpenHelp}>
            Open help guide
          </button>
          <button className="button ghost" type="button" onClick={onRestartOnboarding}>
            Restart onboarding
          </button>
        </div>
      </section>

      <details className="panel settings-systems-detail">
        <summary className="simple-summary">
          <span>
            <span className="eyebrow">Reference</span>
            <strong>Cleaning Systems</strong>
            <small>Zones, priority order, and practical system notes.</small>
          </span>
          <span className="button ghost small">Open</span>
        </summary>
        <div className="settings-embedded-systems">
          <Systems template={template} />
        </div>
      </details>

      <section className="panel settings-card">
        <p className="eyebrow">Install & Device</p>
        <h2>Local PWA</h2>
        <p>Clean30 can be installed from your browser. Reload the app to pick up the latest deployed version.</p>
        <button className="button ghost" type="button" onClick={() => window.location.reload()}>
          Reload app
        </button>
      </section>

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
