// Simple line icons, so the menu looks clean without food photos.
const paths = {
  shisha: (
    <>
      <path d="M12 3v3M9.5 6h5l-1 3h-3z" />
      <path d="M12 9v4" />
      <path d="M8 21h8l-1-5a3 3 0 0 0-6 0z" />
      <path d="M14 15c3 0 5 1 5 3.5S17 21 15 21" />
    </>
  ),
  mix: (
    <>
      <path d="M12 3v3M9.5 6h5l-1 3h-3z" />
      <path d="M12 9v4" />
      <path d="M8 21h8l-1-5a3 3 0 0 0-6 0z" />
      <path d="M4 7c1-1 2-1 3 0M3.5 10c1-1 2-1 3 0" />
    </>
  ),
  pan: (
    <>
      <path d="M12 3v3M9.5 6h5l-1 3h-3z" />
      <path d="M12 9v4" />
      <path d="M8 21h8l-1-5a3 3 0 0 0-6 0z" />
      <path d="M17 6.5l1.5-1.5M18 9.5h2M6 9.5H4" />
    </>
  ),
  tea: (
    <>
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
      <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M9 3.5c0 1.5 1.5 1.5 1.5 3M12.5 3.5c0 1.5 1.5 1.5 1.5 3" />
    </>
  ),
  hot: (
    <>
      <path d="M6 8h10l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path d="M5 8h12M8 5h6" />
      <path d="M16 11h1.5a2 2 0 0 1 0 4H15.6" />
    </>
  ),
  iced: (
    <>
      <path d="M6 5h12l-1.5 15a1.5 1.5 0 0 1-1.5 1.3H9a1.5 1.5 0 0 1-1.5-1.3z" />
      <rect x="9" y="9" width="3" height="3" rx=".6" />
      <rect x="12.5" y="12.5" width="3" height="3" rx=".6" />
    </>
  ),
  juice: (
    <>
      <path d="M6 7h12l-1.6 13a1.5 1.5 0 0 1-1.5 1.3H9.1a1.5 1.5 0 0 1-1.5-1.3z" />
      <path d="M7 11h10M14 7l2-5h2" />
    </>
  ),
  mojito: (
    <>
      <path d="M6 6h12l-1.6 14a1.5 1.5 0 0 1-1.5 1.3H9.1a1.5 1.5 0 0 1-1.5-1.3z" />
      <path d="M9 13c2-3 5-3 6-1-2 2-4 2-6 1zM12 12.5l-1.5 3" />
    </>
  ),
  shakes: (
    <>
      <path d="M7 9h10l-1.5 11.5a1.5 1.5 0 0 1-1.5 1.3h-3a1.5 1.5 0 0 1-1.5-1.3z" />
      <path d="M6 9a6 4 0 0 1 12 0M13 5l2-3" />
    </>
  ),
  pasta: (
    <>
      <path d="M3 11h18a9 7 0 0 1-18 0z" />
      <path d="M8 21h8" />
      <path d="M7 8c1-2 3-2 4 0s3 2 4 0 2-2 3 0" />
    </>
  ),
  soft: (
    <>
      <rect x="7" y="4" width="10" height="17" rx="2.5" />
      <path d="M7 8h10M7 17h10M11 2h2" />
    </>
  ),
  sweets: (
    <>
      <path d="M8 12l4 10 4-10" />
      <path d="M7 12a5 5 0 1 1 10 0z" />
    </>
  ),
  offer: (
    <>
      <path d="M3 12V4h8l10 10-8 8z" />
      <circle cx="7.5" cy="8.5" r="1.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 13H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  scooter: (
    <>
      <circle cx="6" cy="17" r="2.5" />
      <circle cx="18" cy="17" r="2.5" />
      <path d="M8.5 17h7l1-6h-4M16.5 11 15 5h3M3 12h6l1.5 3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9v.01M18 15v.01" />
    </>
  ),
  machine: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2" />
      <path d="M9 6h6v4H9zM9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  phone: <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  flame: (
    <>
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.2 2.2-5.2 3.6-7.6.4 1.8 1.3 2.8 2.4 3.4.2-2.9 1.5-5.6 3.4-7.6.4 3.1 1.6 5 3 7 .9 1.3 1.6 2.9 1.6 4.8 0 3.6-2.6 6.2-6.5 6.2z" />
      <path d="M12 21c-1.7 0-2.8-1.2-2.8-2.8 0-1.5 1-2.4 2-3.6.9 1.2 3.6 2 3.6 3.9 0 1.4-1.1 2.5-2.8 2.5z" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  table: (
    <>
      <path d="M3 9h18M5 9v11M19 9v11M8 9l1-5h6l1 5" />
    </>
  ),
};

export default function Icon({ name, size = 22, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.offer}
    </svg>
  );
}
