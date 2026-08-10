const paths = {
  today: (
    <>
      <path d="M7.5 3.5v2M16.5 3.5v2M4.5 8.5h15" />
      <rect x="4.5" y="5.5" width="15" height="14" rx="3" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  routines: (
    <>
      <path d="M6.5 7.5h9.5a3 3 0 0 1 3 3v0" />
      <path d="m16.5 5 2.5 2.5-2.5 2.5" />
      <path d="M17.5 16.5H8a3 3 0 0 1-3-3v0" />
      <path d="m7.5 19-2.5-2.5L7.5 14" />
    </>
  ),
  progress: (
    <>
      <path d="M5 19V11" />
      <path d="M10 19V6" />
      <path d="M15 19v-5" />
      <path d="M20 19V9" />
      <path d="M4 19.5h17" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 12h3" />
      <path d="M11 12h9" />
      <circle cx="9" cy="12" r="2" />
      <path d="M4 17h8" />
      <path d="M16 17h4" />
      <circle cx="14" cy="17" r="2" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.7 3.2 2.3 4.8 5.5 5.5-3.2.7-4.8 2.3-5.5 5.5-.7-3.2-2.3-4.8-5.5-5.5 3.2-.7 4.8-2.3 5.5-5.5Z" />
      <path d="M18.5 14.5c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5Z" />
      <path d="M5.5 15.5c.25 1.1.9 1.75 2 2-1.1.25-1.75.9-2 2-.25-1.1-.9-1.75-2-2 1.1-.25 1.75-.9 2-2Z" />
    </>
  ),
  quick: (
    <>
      <circle cx="12" cy="12.5" r="7.5" />
      <path d="M12 8.5v4.5l3 1.5" />
      <path d="M9 3.5h6" />
      <path d="M12 3.5v1.5" />
      <path d="m17.6 7.1 1.4-1.4" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.4a2.4 2.4 0 1 1 3.5 2.15c-.9.5-1.3.95-1.3 1.95" />
      <path d="M12 17h.01" />
    </>
  )
};

export default function AppIcon({ name, size = 20, className = "", title }) {
  return (
    <svg
      aria-hidden={title ? undefined : "true"}
      className={className}
      fill="none"
      height={size}
      role={title ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {title ? <title>{title}</title> : null}
      {paths[name] || paths.sparkle}
    </svg>
  );
}
