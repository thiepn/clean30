import { useEffect, useRef } from "react";

const focusableSelector =
  'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(focusableSelector)].filter(
    (element) => !element.disabled && element.getAttribute("aria-hidden") !== "true"
  );
}

const guideSections = [
  {
    title: "Quick Start",
    items: [
      "Start with Dashboard.",
      "If Clean30 recommends a reset, start that session.",
      "If you are tired, use Minimal Reset.",
      "If guests are coming, use Guest Reset.",
      "Use Customize only when you want to change the system."
    ]
  },
  {
    title: "What Each Area Is For",
    items: [
      "Dashboard: today's status and next action.",
      "Start: do a cleaning session.",
      "Systems: understand cleaning principles and zones.",
      "Routines: view the full checklists.",
      "Customize: edit templates, routines, and rules.",
      "History: see what you completed.",
      "Settings: backup, reset, and onboarding."
    ]
  },
  {
    title: "Templates Explained",
    items: [
      "Default templates are protected.",
      "Duplicate a template to edit it.",
      "Template export shares routines and settings only.",
      "Full backup saves personal data too, including history."
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
      "Use the default template.",
      "Only use Dashboard and Start Session at first.",
      "Ignore Advanced Customize until you need it."
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
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const focusTarget = closeButtonRef.current || dialogRef.current;
    focusTarget?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    };
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

        <p className="callout guide-note">Cleaning screens are for doing. Customize is for editing.</p>

        <div className="dialog-actions">
          <button className="button primary" type="button" onClick={onClose}>
            Got it
          </button>
        </div>
      </section>
    </div>
  );
}
