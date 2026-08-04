import { useRef, useState } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";
import {
  onboardingSetupOptions,
  onboardingSteps,
  starterPreviewTasks
} from "../data/onboarding.js";
import { getTodayKey } from "../utils/dates.js";
import {
  buildTodayTasksForDate,
  getStorageHealth,
  loadAppState,
  saveAppState
} from "../utils/storage.js";
import { validateTemplatePayload } from "../utils/templateUtils.js";

export default function Onboarding({ onComplete }) {
  const primaryButtonRef = useRef(null);
  const importInputRef = useRef(null);
  const dialogRef = useDialogFocus({
    open: true,
    onClose: null,
    initialFocusRef: primaryButtonRef,
    dismissible: false
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [setupMode, setSetupMode] = useState("starter");
  const [importMessage, setImportMessage] = useState("");
  const [isReturningUser] = useState(() => Boolean(loadAppState().onboardingCompletedAt));
  const step = onboardingSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === onboardingSteps.length - 1;
  const displayedTitle =
    isReturningUser && step.id === "setup"
      ? "Your current setup stays unchanged"
      : isReturningUser && step.id === "first-clean"
        ? "You are ready"
        : step.title;
  const displayedBody =
    isReturningUser && step.id === "setup"
      ? "Reviewing the introduction does not replace your tasks, routines, progress, or settings."
      : isReturningUser && step.id === "first-clean"
        ? "Return to Today and continue using your existing cleaning plan."
        : step.body;

  function finish(mode = setupMode) {
    if (!isReturningUser) {
      onComplete({ setupMode: mode });
      return;
    }

    const current = loadAppState();
    saveAppState({
      ...current,
      onboardingCompleted: true,
      onboardingCompletedAt: current.onboardingCompletedAt || new Date().toISOString()
    });
    if (getStorageHealth().status === "error") {
      setImportMessage("The introduction could not be closed because browser storage is unavailable.");
      return;
    }
    window.location.reload();
  }

  function continueForward() {
    setStepIndex((current) => Math.min(onboardingSteps.length - 1, current + 1));
  }

  function handleImportFile(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const result = validateTemplatePayload(payload);
        if (!result.ok) {
          setImportMessage(result.error);
          return;
        }

        const current = loadAppState();
        const dateKey = getTodayKey();
        const importedTemplate = result.template;
        const templates = [
          ...current.templates.filter((template) => template.id !== importedTemplate.id),
          importedTemplate
        ];
        const nextState = {
          ...current,
          templates,
          activeTemplateId: importedTemplate.id,
          todayTasksByDate: {
            ...(current.todayTasksByDate || {}),
            [dateKey]: buildTodayTasksForDate(
              null,
              importedTemplate,
              dateKey,
              [],
              current.appSettings
            )
          },
          dailyRuleCompletions: {
            ...(current.dailyRuleCompletions || {}),
            [dateKey]: []
          },
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          firstMeaningfulUseAt: current.firstMeaningfulUseAt || new Date().toISOString()
        };
        saveAppState(nextState);
        if (getStorageHealth().status === "error") {
          setImportMessage("The cleaning plan was valid, but browser storage could not save it.");
          return;
        }
        window.location.reload();
      } catch {
        setImportMessage("This file is not a valid Clean30 cleaning plan.");
      } finally {
        input.value = "";
      }
    };
    reader.onerror = () => {
      setImportMessage("The cleaning plan file could not be read.");
      input.value = "";
    };
    reader.readAsText(file);
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
          <h2 id="onboarding-title">{displayedTitle}</h2>
          <p>{displayedBody}</p>

          {step.id === "welcome" ? (
            <>
              <div className="onboarding-simple-points" aria-label="Clean30 basics">
                <p>See today&apos;s tasks.</p>
                <p>Start a reusable routine.</p>
                <p>Review what you finished.</p>
              </div>
              <button
                className="button ghost onboarding-import-button"
                type="button"
                onClick={() => importInputRef.current?.click()}
              >
                Import a cleaning plan
              </button>
            </>
          ) : null}

          {step.id === "setup" ? (
            isReturningUser ? (
              <div className="onboarding-empty-preview">
                <h3>No data will be reset</h3>
                <p>Your current plan remains active when you close this introduction.</p>
              </div>
            ) : (
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
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                >
                  Import a cleaning plan instead
                </button>
              </div>
            )
          ) : null}

          {step.id === "first-clean" ? (
            isReturningUser ? (
              <div className="onboarding-empty-preview">
                <h3>Your cleaning plan is ready</h3>
                <p>Close the introduction to return to Today.</p>
              </div>
            ) : setupMode === "starter" ? (
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

          {importMessage ? <p className="form-message" role="alert">{importMessage}</p> : null}
        </div>

        <div className="onboarding-actions">
          {!isLastStep ? (
            <button
              className="button ghost"
              type="button"
              onClick={() => finish("starter")}
            >
              {isReturningUser ? "Close introduction" : "Skip setup"}
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

        <input
          ref={importInputRef}
          className="hidden-input"
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
        />
      </section>
    </div>
  );
}
