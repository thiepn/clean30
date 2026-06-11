const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "start", label: "Start Session" },
  { id: "routines", label: "Routines" },
  { id: "systems", label: "Systems" },
  { id: "customize", label: "Customize" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" }
];

export default function Navigation({ currentView, onNavigate }) {
  return (
    <nav className="navigation" aria-label="Primary navigation">
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
  );
}
