import { useEffect, useRef } from "react";
import { cycleDialogFocus, getFocusableElements } from "../utils/dialogFocus.js";

let bodyLockCount = 0;
let previousBodyOverflow = "";

function focusElement(element) {
  try {
    element?.focus?.({ preventScroll: true });
  } catch {
    element?.focus?.();
  }
}

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

export default function useDialogFocus({
  open,
  onClose,
  initialFocusRef,
  dismissible = true,
  lockScroll = true
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    if (lockScroll) lockBodyScroll();

    const frameId = window.requestAnimationFrame(() => {
      const firstFocusable = getFocusableElements(dialogRef.current)[0];
      focusElement(initialFocusRef?.current || firstFocusable || dialogRef.current);
    });

    function handleKeyDown(event) {
      if (event.key === "Escape" && dismissible) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key === "Tab") {
        cycleDialogFocus(
          event,
          getFocusableElements(dialogRef.current),
          document.activeElement
        );
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (lockScroll) unlockBodyScroll();
      if (previousFocus && document.contains(previousFocus)) {
        focusElement(previousFocus);
      }
    };
  }, [dismissible, initialFocusRef, lockScroll, open]);

  return dialogRef;
}
