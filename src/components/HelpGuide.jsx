import { useRef } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";

const guideSections = [
  {
    title: "Dashboard",
    items: [
      "Start with Today.",
      "Check off tasks, add one-off tasks, or pull tasks from a routine.",
      "Completed tasks move below active tasks.",
      "Start, continue, pause, or finish cleaning routines from Dashboard.",
      "An unfinished session appears near the top with progress and elapsed time.",
      "Clean Mode is an optional focused view with large controls; the normal checklist stays available.",
      "Clean Mode uses the same timer, pause or resume state, task progress, and finish action.",
      "Calendar days open a compact activity detail, with measured routine time separate from estimated Today-task time.",
      "Use Edit when you want to change what appears each day."
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
      "Weekdays can use General defaults, custom tasks, or explicitly start empty.",
      "Routines can be edited from Dashboard or Routines.",
      "Routine edits include duration, duplicate, archive, and optional color labels.",
      "App details and schedule are also in the editor.",
      "Appearance is changed from Settings."
    ]
  },
  {
    title: "History",
    items: [
      "Today activity is derived from dated Today tasks, so resetting or unchecking those tasks can update it.",
      "Finished routine sessions are stored as History entries and can be deleted.",
      "Legacy Today entries remain visible when no dated Today task data exists for that date."
    ]
  },
  {
    title: "Data And Backups",
    items: [
      "Data is stored locally on this device/browser.",
      "Export a full backup occasionally.",
      "Settings shows backup health and previews backup contents before an import replaces data.",
      "Font size and layout density are stored locally with your other preferences.",
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
  const closeButtonRef = useRef(null);
  const dialogRef = useDialogFocus({
    open,
    onClose,
    initialFocusRef: closeButtonRef
  });

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
