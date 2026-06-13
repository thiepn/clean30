import { useEffect, useRef, useState } from "react";

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "start", label: "Start Session" },
  { id: "systems", label: "Systems" },
  { id: "routines", label: "Routines" },
  { id: "customize", label: "Customize" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" }
];

const mobilePrimaryItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "start", label: "Start" },
  { id: "systems", label: "Systems" }
];

const moreItems = [
  { id: "routines", label: "Routines" },
  { id: "customize", label: "Customize" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" }
];

export default function Navigation({ currentView, onNavigate }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const moreActive = moreItems.some((item) => item.id === currentView);

  useEffect(() => {
    if (!moreOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setMoreOpen(false);
    }

    function handlePointerDown(event) {
      if (!moreRef.current?.contains(event.target)) setMoreOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [moreOpen]);

  function navigateTo(viewId) {
    onNavigate(viewId);
    setMoreOpen(false);
  }

  return (
    <>
      <nav className="navigation desktop-navigation" aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={currentView === item.id ? "nav-item active" : "nav-item"}
            type="button"
            onClick={() => navigateTo(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <nav className="navigation mobile-navigation" aria-label="Primary mobile navigation">
        {mobilePrimaryItems.map((item) => (
          <button
            key={item.id}
            className={currentView === item.id ? "nav-item active" : "nav-item"}
            type="button"
            onClick={() => navigateTo(item.id)}
          >
            {item.label}
          </button>
        ))}

        <div className="more-nav" ref={moreRef}>
          <button
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className={moreActive ? "nav-item active" : "nav-item"}
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
          >
            More
          </button>
          {moreOpen ? (
            <div className="more-menu" role="menu" aria-label="More sections">
              {moreItems.map((item) => (
                <button
                  className={currentView === item.id ? "more-menu-item active" : "more-menu-item"}
                  key={item.id}
                  role="menuitem"
                  type="button"
                  onClick={() => navigateTo(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </nav>
    </>
  );
}
