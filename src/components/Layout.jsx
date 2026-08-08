import { useEffect } from "react";
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

  return (
    <div
      className={shellClass}
      data-accent={appAppearance?.accentColor || "green"}
      data-background={appAppearance?.backgroundColor || "cream"}
    >
      <header className="app-header simplified-app-header">
        <div>
          <h1>{appName}</h1>
          <p className="app-kicker">{formatCurrentDate()}</p>
        </div>
        <div className="header-actions">
          <button
            aria-label="Open Clean30 help"
            className="help-button"
            type="button"
            onClick={onOpenHelp}
          >
            ?
          </button>
        </div>
      </header>
      <Navigation currentView={currentView} onNavigate={onNavigate} />
      <main className="app-main">{children}</main>
    </div>
  );
}
