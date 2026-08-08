import { useRef } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";

const guideSections = [
  {
    title: "Today",
    body: "Add tasks, check them off, or use Start cleaning for a focused task-by-task view. Quick clean is also available from the header when you want Clean30 to decide what fits your available time."
  },
  {
    title: "Routines",
    body: "Routines are reusable cleaning checklists. Start, create, or edit them directly from Routines. Use Quick clean when you only know how much time you have. The 5, 15, and 30 minute buttons can send a ready-made plan straight to Today, while Plan a quick clean lets you choose the exact time and rooms."
  },
  {
    title: "Progress",
    body: "Progress starts with recent activity and this week, then shows Home snapshot, Calendar, and optional deeper Insights. Home snapshot turns full room-routine completions into simple Fresh, Looking good, Could use attention, or Needs attention guidance. It is maintenance context, not a score or deadline."
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
