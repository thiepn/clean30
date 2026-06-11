import Navigation from "./Navigation.jsx";

export default function Layout({ currentView, onNavigate, template, children }) {
  const profile = template.profile;
  const shellClass = `app-shell theme-${template.appearance.accentColor} density-${template.appearance.density}`;

  return (
    <div className={shellClass}>
      <header className="app-header">
        <div>
          <p className="app-kicker">Apartment Reset System</p>
          <h1>{profile.appDisplayName}</h1>
        </div>
        <div className="header-target">
          <span>{profile.homeName}</span>
          <strong>{profile.goalText}</strong>
        </div>
      </header>
      <Navigation currentView={currentView} onNavigate={onNavigate} />
      <main className="app-main">{children}</main>
    </div>
  );
}
