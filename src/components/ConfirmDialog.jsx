import { useRef } from "react";
import useDialogFocus from "../hooks/useDialogFocus.js";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useDialogFocus({
    open: Boolean(title),
    onClose: onCancel,
    initialFocusRef: cancelButtonRef
  });

  if (!title) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="button ghost" type="button" onClick={onCancel} ref={cancelButtonRef}>
            Cancel
          </button>
          <button className="button danger" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
