// apps/shf-web/src/pages/civicsure/explorer/explorerIcons.jsx
//
// Minimal hand-authored line icons for the CivicSure Explorer frame —
// no external icon library dependency, matching the restrained,
// institutional line-icon style called for by the approved mock.
import React from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

export const EXPLORER_ICONS = {
  grid: (p) => (
    <svg {...base} {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1.2" />
      <rect x="13" y="4" width="7" height="7" rx="1.2" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" />
    </svg>
  ),
  bank: (p) => (
    <svg {...base} {...p}>
      <path d="M4 10 12 4l8 6" />
      <path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9" />
      <path d="M3.5 19h17" />
    </svg>
  ),
  people: (p) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.7-3.4 3-5 5.5-5s4.8 1.6 5.5 5" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15.8 14.2c2.1.4 3.6 1.9 4.2 4.8" />
    </svg>
  ),
  trend: (p) => (
    <svg {...base} {...p}>
      <path d="M4 17 9.5 11l4 3.5L20 6" />
      <path d="M14.5 6H20v5.5" />
    </svg>
  ),
  book: (p) => (
    <svg {...base} {...p}>
      <path d="M4 5.5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5z" />
      <path d="M12 6v13" />
    </svg>
  ),
  pin: (p) => (
    <svg {...base} {...p}>
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  ),
  plus: (p) => (
    <svg {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  target: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  shield: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3.2 19 6v5.3c0 4.8-3 7.8-7 8.5-4-.7-7-3.7-7-8.5V6l7-2.8z" />
    </svg>
  ),
  shieldCheck: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3.2 19 6v5.3c0 4.8-3 7.8-7 8.5-4-.7-7-3.7-7-8.5V6l7-2.8z" />
      <path d="M8.7 12 11 14.3l4.3-4.6" />
    </svg>
  ),
  building: (p) => (
    <svg {...base} {...p}>
      <rect x="6" y="3.5" width="12" height="17" rx="1" />
      <path d="M9.5 7.5h1M13.5 7.5h1M9.5 11h1M13.5 11h1M9.5 14.5h1M13.5 14.5h1" />
      <path d="M10 20.5v-3.5h4v3.5" />
    </svg>
  ),
  document: (p) => (
    <svg {...base} {...p}>
      <path d="M7 3.5h7l3.5 3.5v13.5H7z" />
      <path d="M14 3.5V7h3.5" />
      <path d="M9.3 12.5h5.4M9.3 15.5h5.4" />
    </svg>
  ),
  box: (p) => (
    <svg {...base} {...p}>
      <path d="M4 8 12 4l8 4-8 4-8-4z" />
      <path d="M4 8v8l8 4 8-4V8" />
      <path d="M12 12v8" />
    </svg>
  ),
  userCheck: (p) => (
    <svg {...base} {...p}>
      <circle cx="9.5" cy="8.5" r="3.2" />
      <path d="M4 19c.6-3.2 2.8-4.8 5.5-4.8s4.9 1.6 5.5 4.8" />
      <path d="M16.5 12.5l1.8 1.8 3.2-3.4" />
    </svg>
  ),
  search: (p) => (
    <svg {...base} {...p}>
      <circle cx="10.5" cy="10.5" r="6.2" />
      <path d="M15.2 15.2 20 20" />
    </svg>
  ),
  infoCircle: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2M12 8v.01" />
    </svg>
  ),
  chevronRight: (p) => (
    <svg {...base} {...p}>
      <path d="M9 5.5 15.5 12 9 18.5" />
    </svg>
  ),
  chevronLeft: (p) => (
    <svg {...base} {...p}>
      <path d="M15 5.5 8.5 12 15 18.5" />
    </svg>
  ),
  close: (p) => (
    <svg {...base} {...p}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  ),
  chevronDown: (p) => (
    <svg {...base} {...p}>
      <path d="M5.5 9 12 15.5 18.5 9" />
    </svg>
  ),
  arrowRight: (p) => (
    <svg {...base} {...p}>
      <path d="M4.5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  sliders: (p) => (
    <svg {...base} {...p}>
      <path d="M5 6h9M18 6h1M5 18h1M8 18h11M5 12h4M13 12h6" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="11" cy="18" r="2" />
    </svg>
  ),
  list: (p) => (
    <svg {...base} {...p}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2.6" />
    </svg>
  ),
  map: (p) => (
    <svg {...base} {...p}>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  ),
  network: (p) => (
    <svg {...base} {...p}>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M7.8 8.6 10.5 16M16.2 8.6 13.5 16M8.2 7h7.6" />
    </svg>
  ),
  barChart: (p) => (
    <svg {...base} {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  home: (p) => (
    <svg {...base} {...p}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
    </svg>
  ),
};

export function ExplorerIcon({ name, ...props }) {
  const Render = EXPLORER_ICONS[name];
  if (!Render) return null;
  return Render(props);
}
