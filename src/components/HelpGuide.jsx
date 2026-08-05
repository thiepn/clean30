import { useRef } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";

const guideSections = [
  {
    title: "Today",
    body: "Add tasks, check them off, or use Start cleaning for a focused task-by-task view."
  },
  {
    title: "Routines",
    body: "Routines are reusable cleaning checklists. Start, create, or edit them directly from Routines."
  },
  {
    title: "Progress",
    body: "Progress shows completed Today tasks, finished routines, and Calendar activity."
  },
  {
    title: "Data",
    body: "Clean30 stores data on this device. Export backups from Settings to protect it."
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
            <p className="eyebrow">Quick guide</p>
            <h2 id="help-guide-title">Using Clean30</h2>
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

        <div className="guide-list compact">
          {guideSections.map((section) => (
            <article className="guide-item" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>

        <div className="dialog-actions">
          <button className="button primary" type="button" onClick={onClose}>
            Got it
          </button>
        </div>
      </section>
    </div>
  );
}
