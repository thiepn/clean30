import { useRef, useState } from "react";
import { routineStarterTemplates } from "../data/taskSuggestions.js";
import useDialogFocus from "../hooks/useDialogFocus.js";

const creationMethods = [
  {
    id: "tasks",
    title: "Choose tasks",
    description: "Pick cleaning jobs by room from the same task chooser used on Clean."
  },
  {
    id: "paste",
    title: "Paste a checklist",
    description: "Paste an existing list and let Clean30 split it into tasks and rooms."
  },
  {
    id: "starter",
    title: "Use a starter",
    description: "Begin with a ready-made Clean30 routine and change anything you need."
  },
  {
    id: "blank",
    title: "Start blank",
    description: "Name the routine and type only the tasks you want."
  }
];

export default function RoutineCreationDialog({
  open,
  onChooseTasks,
  onPasteChecklist,
  onUseStarter,
  onStartBlank,
  onClose
}) {
  const firstMethodRef = useRef(null);
  const dialogRef = useDialogFocus({
    open,
    onClose,
    initialFocusRef: firstMethodRef
  });
  const [view, setView] = useState("methods");

  if (!open) return null;

  function chooseMethod(methodId) {
    if (methodId === "tasks") onChooseTasks?.();
    else if (methodId === "paste") onPasteChecklist?.();
    else if (methodId === "blank") onStartBlank?.();
    else if (methodId === "starter") setView("starters");
  }

  function close() {
    setView("methods");
    onClose?.();
  }

  return (
    <div
      className="dialog-backdrop routine-creation-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="routine-creation-title"
        aria-modal="true"
        className="dialog routine-creation-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">New routine</p>
            <h2 id="routine-creation-title">
              {view === "starters" ? "Choose a starter" : "How do you want to make it?"}
            </h2>
            <p>
              {view === "starters"
                ? "Pick a starting point. You can edit every task before saving."
                : "These are four ways to start the same reusable routine."}
            </p>
          </div>
          <button aria-label="Close new routine" className="icon-button" onClick={close} type="button">
            ×
          </button>
        </div>

        {view === "methods" ? (
          <div className="routine-creation-methods">
            {creationMethods.map((method, index) => (
              <button
                className={index === 0 ? "routine-creation-method recommended" : "routine-creation-method"}
                key={method.id}
                onClick={() => chooseMethod(method.id)}
                ref={index === 0 ? firstMethodRef : undefined}
                type="button"
              >
                <span>
                  <strong>{method.title}</strong>
                  <small>{method.description}</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button className="button text-button small routine-creation-back" onClick={() => setView("methods")} type="button">
              ← Other ways to start
            </button>
            <div className="routine-creation-starters">
              {routineStarterTemplates.map((starter) => (
                <button
                  className="routine-creation-starter"
                  key={starter.id}
                  onClick={() => onUseStarter?.(starter.id)}
                  type="button"
                >
                  <span>
                    <strong>{starter.title}</strong>
                    <small>{starter.description}</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
