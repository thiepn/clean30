const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "routines", label: "Routines" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" }
];

export default function Navigation({ currentView, onNavigate }) {
  return (
    <>
      <nav className="navigation desktop-navigation" aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={currentView === item.id ? "nav-item active" : "nav-item"}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <nav className="navigation mobile-navigation" aria-label="Primary mobile navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={currentView === item.id ? "nav-item active" : "nav-item"}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
