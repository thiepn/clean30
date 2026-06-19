export const DIALOG_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function getFocusableElements(container) {
  if (!container?.querySelectorAll) return [];
  return [...container.querySelectorAll(DIALOG_FOCUSABLE_SELECTOR)].filter(
    (element) =>
      !element.hidden &&
      element.getAttribute?.("aria-hidden") !== "true" &&
      element.getClientRects?.().length !== 0
  );
}

export function cycleDialogFocus(event, focusable, activeElement) {
  if (event?.key !== "Tab" || !focusable.length) return false;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (activeElement === first || !focusable.includes(activeElement))) {
    event.preventDefault?.();
    last.focus?.();
    return true;
  }
  if (!event.shiftKey && (activeElement === last || !focusable.includes(activeElement))) {
    event.preventDefault?.();
    first.focus?.();
    return true;
  }
  return false;
}
