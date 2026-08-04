import { useRef, useState } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";
import {
  onboardingSetupOptions,
  onboardingSteps,
  starterPreviewTasks
} from "../data/onboarding.js";

export default function Onboarding({ onComplete }) {
  const primaryButtonRef = useRef(null);
  const dialogRef = useDialogFocus({
    open: true,
    onClose: null,
    initialFocusRef: primaryButtonRef,
    dismissible: false
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [setupMode, setSetupMode] = useState("starter");
  const step = onboardingSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === onboardingSteps.length - 1;

  function finish(mode = setupMode) {
    onComplete({ setupMode: mode });
  }

  function continueForward() {
    setStepIndex((current) => Math.min(onboardingSteps.length - 1, current + 1));
  }

  return (
    <div className="dialog-backdrop onboarding-backdrop" role="presentation">
      <section
        aria-labelledby="onboarding-title"
        aria-modal="true"
        className="dialog onboarding-dialog"
        role="dialog"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div
          className="onboarding-progress"
          aria-label={`Introduction step ${stepIndex + 1} of ${onboardingSteps.length}`}
        >
          {onboardingSteps.map((item, index) => (
            <span
              className={index <= stepIndex ? "onboarding-dot active" : "onboarding-dot"}
              key={item.id}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="onboarding-step">
          <p className="eyebrow">{step.eyebrow}</p>
          <h2 id="onboarding-title">{step.title}</h2>
          <p>{step.body}</p>

          {step.id === "welcome" ? (
            <div className="onboarding-simple-points" aria-label="Clean30 basics">
              <p>See today&apos;s tasks.</p>
              <p>Start a reusable routine.</p>
              <p>Review what you finished.</p>
            </div>
          ) : null}

          {step.id === "setup" ? (
            <div className="setup-options">
              {onboardingSetupOptions.map((option) => (
                <label
                  className={setupMode === option.id ? "setup-option active" : "setup-option"}
                  key={option.id}
                >
                  <input
                    checked={setupMode === option.id}
                    name="setup-mode"
                    type="radio"
                    value={option.id}
                    onChange={() => setSetupMode(option.id)}
                  />
                  <span>
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
              <p className="muted compact-empty">
                Already have a cleaning plan? You can import it later from Settings.
              </p>
            </div>
          ) : null}

          {step.id === "first-clean" ? (
            setupMode === "starter" ? (
              <div className="onboarding-task-preview" aria-label="Starter Today tasks">
                {starterPreviewTasks.map((task) => (
                  <div className="onboarding-task-preview-row" key={task}>
                    <span aria-hidden="true">□</span>
                    <strong>{task}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="onboarding-empty-preview">
                <h3>Your Today list will start empty</h3>
                <p>Add a task whenever something needs attention.</p>
              </div>
            )
          ) : null}
        </div>

        <div className="onboarding-actions">
          {!isLastStep ? (
            <button className="button ghost" type="button" onClick={() => finish("starter")}>
              Skip setup
            </button>
          ) : (
            <span />
          )}
          <button
            className="button ghost"
            type="button"
            disabled={isFirstStep}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            Back
          </button>
          {isLastStep ? (
            <button
              className="button primary"
              type="button"
              ref={primaryButtonRef}
              onClick={() => finish()}
            >
              Go to Today
            </button>
          ) : (
            <button
              className="button primary"
              type="button"
              ref={primaryButtonRef}
              onClick={continueForward}
            >
              {isFirstStep ? "Get started" : "Continue"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
