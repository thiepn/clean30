import { useMemo, useRef, useState } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";
import { parseRoutineTaskText } from "../utils/routineLibrary.js";

export default function RoutinePasteDialog({ open, onContinue, onClose }) {
  const textareaRef = useRef(null);
  const dialogRef = useDialogFocus({
    open,
    onClose,
    initialFocusRef: textareaRef
  });
  const [text, setText] = useState("");
  const preview = useMemo(() => parseRoutineTaskText(text), [text]);

  if (!open) return null;

  function close() {
    setText("");
    onClose?.();
  }

  function continueToEditor() {
    if (!preview.taskCount) return;
    onContinue?.(text);
    setText("");
  }

  return (
    <div
      className="dialog-backdrop routine-paste-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="routine-paste-title"
        aria-modal="true"
        className="dialog routine-paste-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">New routine</p>
            <h2 id="routine-paste-title">Paste a checklist</h2>
            <p>Paste one task per line. Room headings, bullets, numbers, and Markdown checkboxes are understood.</p>
          </div>
          <button aria-label="Close checklist paste" className="icon-button" onClick={close} type="button">
            ×
          </button>
        </div>

        <textarea
          aria-label="Checklist to turn into a routine"
          onChange={(event) => setText(event.target.value)}
          placeholder={"Kitchen:\nClear dishes\nWipe counters\nClean sink\n\nBathroom:\n- [ ] Clean toilet\n- [ ] Clean mirror"}
          ref={textareaRef}
          rows="12"
          value={text}
        />

        <div className="routine-paste-preview" aria-live="polite">
          <strong>
            {preview.taskCount
              ? `${preview.taskCount} ${preview.taskCount === 1 ? "task" : "tasks"} ready`
              : "Paste your checklist to continue"}
          </strong>
          {preview.sections.length ? (
            <span>
              {preview.sections.length} {preview.sections.length === 1 ? "section" : "sections"}
            </span>
          ) : null}
        </div>

        <div className="dialog-actions">
          <button className="button ghost" onClick={close} type="button">
            Cancel
          </button>
          <button
            className="button primary"
            disabled={!preview.taskCount}
            onClick={continueToEditor}
            type="button"
          >
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}
