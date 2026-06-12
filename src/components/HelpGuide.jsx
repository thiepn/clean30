import { useEffect } from "react";

const guideItems = [
  {
    title: "Dashboard",
    detail: "Shows what matters today, including daily rules, next action, memory, and alerts."
  },
  {
    title: "Start Session",
    detail: "Use this when you are actually cleaning. Active sessions stay saved locally."
  },
  {
    title: "Routines",
    detail: "Reference the built-in and custom cleaning sequences before starting."
  },
  {
    title: "Systems",
    detail: "Review practical apartment rules, bottlenecks, zones, and prevention habits."
  },
  {
    title: "Customize",
    detail: "Edit templates, routines, daily rules, profile details, and appearance."
  },
  {
    title: "History",
    detail: "See completed sessions, completion rates, notes, and routine memory."
  },
  {
    title: "Settings",
    detail: "Manage full local backups, imports, resets, and onboarding."
  }
];

export default function HelpGuide({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
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
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Clean30 guide</p>
            <h2 id="help-guide-title">Where Things Live</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close guide">
            X
          </button>
        </div>

        <div className="guide-list">
          {guideItems.map((item) => (
            <article className="guide-item" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
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
