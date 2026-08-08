import { useEffect } from "react";
import AppIcon from "./AppIcon.jsx";
import Navigation from "./Navigation.jsx";

function formatCurrentDate() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());
}

export default function Layout({
  currentView,
  onNavigate,
  template,
  children,
  onOpenHelp,
  appAppearance
}) {
  const density = appAppearance?.density || template.appearance.density || "comfortable";
  const fontSize = appAppearance?.fontSize || "normal";
  const shellClass = `app-shell density-${density}`;
  const appName = template.profile?.appDisplayName?.trim() || "Clean30";

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
    return () => {
      delete document.documentElement.dataset.fontSize;
    };
  }, [fontSize]);

  function openQuickClean() {
    if (typeof window !== "undefined") {
      window.clean30OpenQuickCleanRequested = true;
    }
    onNavigate?.("routines");
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent("clean30:openQuickClean"));
      });
    }
  }

  return (
    <div
      className={shellClass}
      data-accent={appAppearance?.accentColor || "green"}
      data-background={appAppearance?.backgroundColor || "cream"}
    >
      <header className="app-header simplified-app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <AppIcon name="sparkle" size={24} />
          </span>
          <div className="brand-copy">
            <h1>{appName}</h1>
            <p className="app-kicker">{formatCurrentDate()}</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            aria-label="Open Quick clean"
            className="quick-clean-header-button"
            onClick={openQuickClean}
            type="button"
          >
            <AppIcon name="quick" size={18} />
            <span>Quick clean</span>
          </button>
          <button
            aria-label="Open Clean30 help"
            className="help-button"
            type="button"
            onClick={onOpenHelp}
          >
            <AppIcon name="help" size={20} />
          </button>
        </div>
      </header>
      <Navigation currentView={currentView} onNavigate={onNavigate} />
      <main className="app-main">{children}</main>
    </div>
  );
}
