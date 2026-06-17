import { useState } from "react";

const steps = [
  {
    eyebrow: "Welcome",
    title: "Keep cleaning simple",
    body:
      "Clean30 helps you manage today's tasks, reusable cleaning routines, and what you already finished."
  },
  {
    eyebrow: "Today",
    title: "Start with Today",
    body:
      "Dashboard starts with Today. Check off starter tasks or add a one-off task for the current day.",
    examples: ["Take out trash", "Dishes back to kitchen", "Quick bathroom check"]
  },
  {
    eyebrow: "Routines",
    title: "Use reusable cleaning plans",
    body:
      "Routines are checklists like Weekly Reset or Monthly Deep Clean. Start them from Dashboard and inspect or edit them from Routines."
  },
  {
    eyebrow: "History",
    title: "See what got done",
    body: "History shows which days you cleaned and what you completed."
  },
  {
    eyebrow: "Local data",
    title: "Your data stays here",
    body:
      "There is no account and no cloud sync. Export a backup from Settings if you care about the data."
  },
  {
    eyebrow: "Setup",
    title: "Choose how Today starts",
    body: "Pick a starting point. You can edit this later from Dashboard or Routines."
  },
  {
    eyebrow: "Done",
    title: "Ready",
    body: "Open Dashboard and use Today first. Everything else can wait until you need it."
  }
];

export default function Onboarding({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [setupMode, setSetupMode] = useState("starter");
  const step = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  function finish(mode = setupMode) {
    onComplete({ setupMode: mode });
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
          {steps.map((item, index) => (
            <span
              className={index <= stepIndex ? "onboarding-dot active" : "onboarding-dot"}
              key={item.title}
            />
          ))}
        </div>

        <div className="onboarding-step">
          <p className="eyebrow">{step.eyebrow}</p>
          <h2 id="onboarding-title">{step.title}</h2>
          <p>{step.body}</p>

          {step.examples ? (
            <div className="guide-list compact">
              {step.examples.map((example) => (
                <article className="guide-item" key={example}>
                  <h3>{example}</h3>
                  <p>Example Today task</p>
                </article>
              ))}
            </div>
          ) : null}

          {stepIndex === 5 ? (
            <div className="setup-options">
              <label className={setupMode === "starter" ? "setup-option active" : "setup-option"}>
                <input
                  checked={setupMode === "starter"}
                  name="setup-mode"
                  type="radio"
                  value="starter"
                  onChange={() => setSetupMode("starter")}
                />
                <span>
                  <strong>Use starter tasks and routines</strong>
                  <small>Begin with the Clean30 starter plan.</small>
                </span>
              </label>
              <label
                className={setupMode === "empty-today" ? "setup-option active" : "setup-option"}
              >
                <input
                  checked={setupMode === "empty-today"}
                  name="setup-mode"
                  type="radio"
                  value="empty-today"
                  onChange={() => setSetupMode("empty-today")}
                />
                <span>
                  <strong>Start with empty Today tasks</strong>
                  <small>Keep routines, but let Today start blank.</small>
                </span>
              </label>
              <label className={setupMode === "later" ? "setup-option active" : "setup-option"}>
                <input
                  checked={setupMode === "later"}
                  name="setup-mode"
                  type="radio"
                  value="later"
                  onChange={() => setSetupMode("later")}
                />
                <span>
                  <strong>Customize later</strong>
                  <small>Use the starter plan now and adjust it later.</small>
                </span>
              </label>
            </div>
          ) : null}
        </div>

        <div className="onboarding-actions">
          <button className="button ghost" type="button" onClick={() => finish("starter")}>
            Skip
          </button>
          <button
            className="button ghost"
            type="button"
            disabled={isFirstStep}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            Back
          </button>
          {isLastStep ? (
            <button className="button primary" type="button" onClick={() => finish()}>
              Go to Dashboard
            </button>
          ) : (
            <button
              className="button primary"
              type="button"
              onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
            >
              Next
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
