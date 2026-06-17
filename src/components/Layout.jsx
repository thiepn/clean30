import { useEffect } from "react";
import Navigation from "./Navigation.jsx";

export default function Layout({
  currentView,
  onNavigate,
  template,
  children,
  onOpenHelp,
  appAppearance
}) {
  const profile = template.profile;
  const density = appAppearance?.density || template.appearance.density || "comfortable";
  const fontSize = appAppearance?.fontSize || "normal";
  const shellClass = `app-shell density-${density}`;

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
      <header className="app-header">
        <div>
          <p className="app-kicker">Apartment Reset System</p>
          <h1>{profile.appDisplayName}</h1>
        </div>
        <div className="header-actions">
          <button
            aria-label="Open Clean30 guide"
            className="help-button"
            type="button"
            onClick={onOpenHelp}
          >
            ?
          </button>
          <div className="header-target">
            <span>{profile.homeName}</span>
            <strong>{profile.goalText}</strong>
          </div>
        </div>
      </header>
      <Navigation currentView={currentView} onNavigate={onNavigate} />
      <main className="app-main">{children}</main>
    </div>
  );
}
