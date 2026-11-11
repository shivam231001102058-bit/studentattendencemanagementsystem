const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  students: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c.4-3.1 2.4-4.8 6-4.8s5.6 1.7 6 4.8M16 5.2a3.1 3.1 0 0 1 0 5.9M17.3 15.4c2.2.6 3.4 2.1 3.7 4.6" />
    </>
  ),
  attendance: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M7 3v4M17 3v4M3 10h18M8 15l2.2 2.2L16 12" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20V10m5 10V4m5 16v-7m5 7V7" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  arrowUp: <path d="m7 14 5-5 5 5" />,
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </>
  ),
}

function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

export default Icon
