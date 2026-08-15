import AppIcon from "./AppIcon.jsx";

const navItems = [
  { id: "dashboard", label: "Clean", icon: "today" },
  { id: "routines", label: "Routines", icon: "routines" },
  { id: "history", label: "Progress", icon: "progress" },
  { id: "settings", label: "Settings", icon: "settings" }
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
      <AppIcon className="nav-icon" name={item.icon} size={19} />
      <span>{item.label}</span>
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
