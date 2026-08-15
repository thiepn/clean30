import { useRef } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";

const guideSections = [
  {
    title: "Clean",
    body: "This is where cleaning starts. Use Just start when you do not want to decide, choose how much time you have, pick a room, or work through today’s list. Every path leads into the same focused cleaning view."
  },
  {
    title: "Routines",
    body: "Routines are saved reusable cleans. Start one directly, or create a new routine from common cleaning tasks, a pasted checklist, a starter, or a blank list."
  },
  {
    title: "Progress",
    body: "Progress shows what you completed and a lightweight room snapshot. Room status is guidance from completed cleans, not a score, deadline, or requirement."
  },
  {
    title: "Settings",
    body: "Manage rooms, appearance, backups, and advanced cleaning-plan options. Clean30 stores data on this device."
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
