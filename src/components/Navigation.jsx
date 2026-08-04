const navItems = [
  { id: "dashboard", label: "Today" },
  { id: "routines", label: "Routines" },
  { id: "history", label: "Progress" },
  { id: "settings", label: "Settings" }
];

function NavigationButtons({ currentView, onNavigate }) {
  return navItems.map((item) => (
    <button
      key={item.id}
      className={currentView === item.id ? "nav-item active" : "nav-item"}
      type="button"
      aria-current={currentView === item.id ? "page" : undefined}
      onClick={() => onNavigate(item.id)}
    >
      {item.label}
    </button>
  ));
}

export default function Navigation({ currentView, onNavigate }) {
  return (
    <>
      <nav className="navigation desktop-navigation" aria-label="Primary navigation">
        <NavigationButtons currentView={currentView} onNavigate={onNavigate} />
      </nav>

      <nav className="navigation mobile-navigation" aria-label="Primary mobile navigation">
        <NavigationButtons currentView={currentView} onNavigate={onNavigate} />
      </nav>
    </>
  );
}
