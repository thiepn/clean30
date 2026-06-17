import { useState } from "react";
import { weekdayOptions } from "../utils/dates.js";

const steps = ["Welcome", "Choose setup", "Basic profile", "Finish"];

export default function Onboarding({ template, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [setupMode, setSetupMode] = useState("default");
  const [appDisplayName, setAppDisplayName] = useState(template.profile.appDisplayName);
  const [homeName, setHomeName] = useState(template.profile.homeName);
  const [weeklyResetDay, setWeeklyResetDay] = useState(template.schedule.weeklyResetDay);
  const [backupResetDay, setBackupResetDay] = useState(template.schedule.backupResetDay);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  function finish() {
    onComplete({
      setupMode,
      profile: {
        appDisplayName: appDisplayName.trim() || "Clean30",
        homeName: homeName.trim() || "Home"
      },
      schedule: {
        weeklyResetDay,
        backupResetDay
      }
    });
  }

  return (
    <div className="dialog-backdrop onboarding-backdrop" role="presentation">
      <section
        aria-labelledby="onboarding-title"
        aria-modal="true"
        className="dialog onboarding-dialog"
        role="dialog"
        tabIndex={-1}
      >
        <div className="onboarding-progress" aria-label="Onboarding progress">
          {steps.map((step, index) => (
            <span
              className={index <= stepIndex ? "onboarding-dot active" : "onboarding-dot"}
              key={step}
            />
          ))}
        </div>

        {stepIndex === 0 ? (
          <div className="onboarding-step">
            <p className="eyebrow">Welcome</p>
            <h2 id="onboarding-title">Set Up Clean30</h2>
            <p>
              Clean30 helps manage cleaning routines, active sessions, apartment systems, and
              history in one calm local app.
            </p>
            <div className="guide-list compact">
              <article className="guide-item">
                <h3>Dashboard</h3>
                <p>Tells you what matters today.</p>
              </article>
              <article className="guide-item">
                <h3>Cleaning sessions</h3>
                <p>Where Daily Rules, to-dos, and cleaning sessions happen.</p>
              </article>
              <article className="guide-item">
                <h3>Edit plan</h3>
                <p>Where routines and Daily Rules are edited when needed.</p>
              </article>
              <article className="guide-item">
                <h3>Local data</h3>
                <p>Everything stays in this browser and device unless you export it.</p>
              </article>
            </div>
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="onboarding-step">
            <p className="eyebrow">Choose setup</p>
            <h2 id="onboarding-title">Start With A Template</h2>
            <p>
              A template is your starting cleaning system. The Clean30 default is protected and
              read-only so it cannot be accidentally broken. You can duplicate a template if you
              want to edit routines, phases, or tasks, and you can change templates later in
              the editor.
            </p>
            <p className="muted">
              Most users should start with the default unless they already know they want changes.
            </p>
            <div className="setup-options">
              <label className={setupMode === "default" ? "setup-option active" : "setup-option"}>
                <input
                  checked={setupMode === "default"}
                  name="setup-mode"
                  type="radio"
                  value="default"
                  onChange={() => setSetupMode("default")}
                />
                <span>
                  <strong>Use Clean30 default template</strong>
                  <small>Keep the protected default template as your starting point.</small>
                </span>
              </label>
              <label className={setupMode === "custom" ? "setup-option active" : "setup-option"}>
                <input
                  checked={setupMode === "custom"}
                  name="setup-mode"
                  type="radio"
                  value="custom"
                  onChange={() => setSetupMode("custom")}
                />
                <span>
                  <strong>Duplicate default template to edit</strong>
                  <small>Create an editable copy immediately.</small>
                </span>
              </label>
            </div>
          </div>
        ) : null}

        {stepIndex === 2 ? (
          <div className="onboarding-step">
            <p className="eyebrow">Basic profile</p>
            <h2 id="onboarding-title">Name Your System</h2>
            <div className="form-grid">
              <label className="field-label">
                App display name
                <input
                  type="text"
                  value={appDisplayName}
                  onChange={(event) => setAppDisplayName(event.target.value)}
                />
              </label>
              <label className="field-label">
                Home name
                <input
                  type="text"
                  value={homeName}
                  onChange={(event) => setHomeName(event.target.value)}
                />
              </label>
              <label className="field-label">
                Weekly reset day
                <span className="field-help">Your main cleaning day for the full weekly reset.</span>
                <select
                  value={weeklyResetDay}
                  onChange={(event) => setWeeklyResetDay(event.target.value)}
                >
                  {weekdayOptions.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Fallback reset day
                <span className="field-help">
                  Your backup cleaning slot if the weekly reset did not happen. This is not a full
                  data backup.
                </span>
                <select
                  value={backupResetDay}
                  onChange={(event) => setBackupResetDay(event.target.value)}
                >
                  {weekdayOptions.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {stepIndex === 3 ? (
          <div className="onboarding-step">
            <p className="eyebrow">Finish</p>
            <h2 id="onboarding-title">Ready When You Are</h2>
            <p>
              Your dashboard will open with the active template, daily rules, and session controls.
              You can restart this guide later from Settings.
            </p>
            <div className="summary-card">
              <span>Setup</span>
              <strong>
                {setupMode === "custom" ? "Editable custom template" : "Clean30 default template"}
              </strong>
              <span>Home</span>
              <strong>{homeName.trim() || "Home"}</strong>
              <span>Weekly reset</span>
              <strong>{weeklyResetDay}</strong>
              <span>Fallback reset</span>
              <strong>{backupResetDay}</strong>
            </div>
          </div>
        ) : null}

        <div className="onboarding-actions">
          <button
            className="button ghost"
            type="button"
            disabled={isFirstStep}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            Back
          </button>
          {isLastStep ? (
            <button className="button primary" type="button" onClick={finish}>
              Finish setup
            </button>
          ) : (
            <button
              className="button primary"
              type="button"
              onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
            >
              Continue
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
