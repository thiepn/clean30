import { useEffect, useRef } from "react";

function focusElement(element) {
  try {
    element?.focus?.({ preventScroll: true });
  } catch {
    // Some mobile browsers can reject programmatic focus during tap handling.
  }
}

function scheduleFocus(callback) {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(callback);
    return;
  }
  window.setTimeout(callback, 0);
}

const guideSections = [
  {
    title: "Dashboard",
    items: [
      "Start with Today.",
      "Check off default tasks or add one-off tasks.",
      "Start or continue cleaning routines from Dashboard.",
      "Use Edit defaults only when you want to change what appears each day."
    ]
  },
  {
    title: "Tabs",
    items: [
      "Dashboard: Today tasks and cleaning sessions.",
      "Routines: inspect and edit reusable checklists.",
      "History: see what you completed.",
      "Settings: appearance, backups, privacy, help, install, and reset controls."
    ]
  },
  {
    title: "Editing",
    items: [
      "Today defaults live inside the routine editor.",
      "Routines can be edited from Dashboard or Routines.",
      "App details and schedule are also in the editor.",
      "Appearance is changed from Settings."
    ]
  },
  {
    title: "Data And Backups",
    items: [
      "Data is stored locally on this device/browser.",
      "Export a full backup occasionally.",
      "There is no account, cloud sync, or remote storage."
    ]
  },
  {
    title: "If It Feels Overwhelming",
    items: [
      "Only use Dashboard at first.",
      "Treat Today as the daily checklist.",
      "Open the editor only when you need to change the plan."
    ]
  },
  {
    title: "Mobile Install",
    items: [
      "When installed as a PWA, Clean30 behaves like an app.",
      "Installed or not, data is still stored locally in this browser profile."
    ]
  }
];

export default function HelpGuide({ open, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    scheduleFocus(() => {
      focusElement(closeButtonRef.current || dialogRef.current);
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        aria-labelledby="help-guide-title"
        aria-modal="true"
        className="dialog guide-dialog"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Clean30 guide</p>
            <h2 id="help-guide-title">Clean30 Help</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            ref={closeButtonRef}
          >
            X
          </button>
        </div>

        <div className="guide-accordion">
          {guideSections.map((section, index) => (
            <details className="guide-detail" key={section.title} open={index === 0}>
              <summary>{section.title}</summary>
              <ul className="system-list compact">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <p className="callout guide-note">Dashboard is for doing. The editor is for changing the plan.</p>

        <div className="dialog-actions">
          <button className="button primary" type="button" onClick={onClose}>
            Got it
          </button>
        </div>
      </section>
    </div>
  );
}
