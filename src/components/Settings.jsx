import { useRef, useState } from "react";
import { formatDateTime } from "../utils/dates.js";

export default function Settings({
  template,
  onExportFullBackup,
  onImportFullBackup,
  lastFullBackupExportedAt,
  backupDue,
  onRestartOnboarding,
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
        <p className="eyebrow">Active template</p>
        <h2>{template.name}</h2>
        <p>{template.profile.goalText}</p>
        <div className="last-grid">
          <div className="metric-card">
            <span>Home</span>
            <strong>{template.profile.homeName}</strong>
          </div>
          <div className="metric-card">
            <span>Template type</span>
            <strong>{template.readOnly ? "Default" : "Custom"}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Data management</p>
        <h2>Local Data</h2>
        <p className="muted">
          Template editing lives in Customize. This page handles full local backups and resets.
        </p>
        <div className={backupDue ? "backup-box due" : "backup-box"}>
          <div>
            <strong>{backupDue ? "Backup reminder" : "Backup status"}</strong>
            <p>
              Your data is stored only on this device/browser. Export a backup occasionally so you
              do not lose your routines and history.
            </p>
            <span>
              Last full backup:{" "}
              {lastFullBackupExportedAt ? formatDateTime(lastFullBackupExportedAt) : "Never"}
            </span>
          </div>
          <button className="button primary" type="button" onClick={onExportFullBackup}>
            Export full backup now
          </button>
        </div>
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
          <button className="button danger-ghost" type="button" onClick={onResetHistory}>
            Reset only history
          </button>
          <button className="button danger" type="button" onClick={onResetAll}>
            Reset all data
          </button>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </section>

      <section className="panel">
        <p className="eyebrow">About</p>
        <h2>{template.profile.appDisplayName}</h2>
        <p>
          Clean30 is a local-only cleaning routine app. Data stays in the browser&apos;s
          localStorage unless exported.
        </p>
        <div className="settings-actions">
          <button className="button ghost" type="button" onClick={onRestartOnboarding}>
            Restart onboarding
          </button>
        </div>
      </section>
    </div>
  );
}
