// src/components/curriculum/icons.jsx
// Minimal line-icon set for the Curriculum Learning Dashboard.
// No icon package exists in this repo (checked package.json + src tree),
// so these are small, dependency-free, stroke-based SVGs matching the
// approved mock's visual language (currentColor, 1.8 stroke, rounded caps).
import React from "react";

function Base({ size = 20, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const DashboardIcon = (p) => (
  <Base {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Base>
);

export const CalendarIcon = (p) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </Base>
);

export const PortfolioIcon = (p) => (
  <Base {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
  </Base>
);

export const LessonsIcon = (p) => (
  <Base {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 0 4 23V5.5Z" transform="translate(0 -2)" />
    <path d="M12 3h5.5A2.5 2.5 0 0 1 20 5.5V19a2.5 2.5 0 0 0-2.5-2.5H12" transform="translate(0 -2)" />
  </Base>
);

export const AssignmentsIcon = (p) => (
  <Base {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
    <path d="M8.5 12.5 10.5 14.5 15.5 9.5" />
  </Base>
);

export const InstructorIcon = (p) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20.5c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
  </Base>
);

export const MasterViewIcon = (p) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </Base>
);

export const SearchIcon = (p) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Base>
);

export const BellIcon = (p) => (
  <Base {...p}>
    <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Base>
);

export const ChevronDownIcon = (p) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

export const ChevronLeftIcon = (p) => (
  <Base {...p}>
    <path d="m15 18-6-6 6-6" />
  </Base>
);

export const ChevronRightIcon = (p) => (
  <Base {...p}>
    <path d="m9 18 6-6-6-6" />
  </Base>
);

export const BrainIcon = (p) => (
  <Base {...p}>
    <path d="M9 4.5A2.5 2.5 0 0 0 6.5 7 2.5 2.5 0 0 0 5 9.3 2.6 2.6 0 0 0 6 14a2.6 2.6 0 0 0 2.5 3.2A2.5 2.5 0 0 0 11 19.5V4.7A2.4 2.4 0 0 0 9 4.5Z" />
    <path d="M15 4.5A2.5 2.5 0 0 1 17.5 7 2.5 2.5 0 0 1 19 9.3 2.6 2.6 0 0 1 18 14a2.6 2.6 0 0 1-2.5 3.2 2.5 2.5 0 0 1-2.5 2.3V4.7A2.4 2.4 0 0 1 15 4.5Z" />
  </Base>
);

export const FlameIcon = (p) => (
  <Base {...p}>
    <path d="M12 2.5c1 3 4 4 4 8.5a4 4 0 0 1-8 0c0-1.5.8-2.2 1.3-3.2.4-.8.2-1.7-.3-2.3C10.5 6.7 12 4.8 12 2.5Z" />
    <path d="M9.5 14a2.5 2.5 0 0 0 5 0c0-1.2-.7-1.9-1.3-2.6" />
  </Base>
);

export const BookIcon = (p) => (
  <Base {...p}>
    <path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 1-2-2V5.5Z" />
    <path d="M11 3.5h7a2 2 0 0 1 2 2V16a2 2 0 0 0-2-2h-7" />
  </Base>
);

export const AwardIcon = (p) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="5" />
    <path d="M8.5 12.5 7 21l5-2.5 5 2.5-1.5-8.5" />
  </Base>
);

export const PersonCircleIcon = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.3 18.3a6.5 6.5 0 0 1 11.4 0" />
  </Base>
);

export const ClipboardIcon = (p) => (
  <Base {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
  </Base>
);

export const ArrowRightIcon = (p) => (
  <Base {...p}>
    <path d="M4 12h16M13 5l7 7-7 7" />
  </Base>
);

export const GlobeIcon = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
  </Base>
);

export const CodeIcon = (p) => (
  <Base {...p}>
    <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
  </Base>
);

export const DatabaseIcon = (p) => (
  <Base {...p}>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
    <path d="M5 5.5V18a7 2.5 0 0 0 14 0V5.5" />
    <path d="M5 11.75a7 2.5 0 0 0 14 0" />
  </Base>
);

export const MenuIcon = (p) => (
  <Base {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Base>
);

export const CloseIcon = (p) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const HomeIcon = (p) => (
  <Base {...p}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
  </Base>
);

export const ClockIcon = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Base>
);

export const CheckCircleIcon = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.3 2.3L15.5 9.5" />
  </Base>
);

export const CircleIcon = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
  </Base>
);

export const TargetIcon = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
  </Base>
);

export const PlayIcon = (p) => (
  <Base {...p}>
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </Base>
);

export const BriefcaseIcon = (p) => (
  <Base {...p}>
    <rect x="3" y="7.5" width="18" height="12" rx="2" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 12.5h18" />
  </Base>
);

export const SparkleIcon = (p) => (
  <Base {...p}>
    <path d="M12 3.5c.6 3 2.1 4.5 5 5-2.9.5-4.4 2-5 5-.6-3-2.1-4.5-5-5 2.9-.5 4.4-2 5-5Z" />
    <path d="M19 15c.3 1.4 1 2.1 2.4 2.4-1.4.3-2.1 1-2.4 2.4-.3-1.4-1-2.1-2.4-2.4 1.4-.3 2.1-1 2.4-2.4Z" />
  </Base>
);

export const ChatBubbleIcon = (p) => (
  <Base {...p}>
    <path d="M4 5.5h16v10H9l-4 3.5v-3.5H4Z" />
  </Base>
);

export const LayersIcon = (p) => (
  <Base {...p}>
    <path d="m12 3 8 4.5-8 4.5-8-4.5Z" />
    <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
  </Base>
);

export const ChevronUpIcon = (p) => (
  <Base {...p}>
    <path d="m6 15 6-6 6 6" />
  </Base>
);

// SHF heart mark — the one shared brand glyph, used by CurriculumSidebar.jsx
// and CurriculumFooter.jsx. Moved here (from a local, unexported function
// in CurriculumSidebar.jsx) so the footer doesn't duplicate the SVG path.
export function HeartMark({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.5-4.6-10-9.6C.4 7 2.6 3.5 6.3 3.5c2.1 0 3.7 1.1 5.7 3.4C14 4.6 15.6 3.5 17.7 3.5 21.4 3.5 23.6 7 22 10.9c-2.5 5-10 9.6-10 9.6Z" />
    </svg>
  );
}

export const LockIcon = (p) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Base>
);

export const VideoIcon = (p) => (
  <Base {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10.5 5-3v9l-5-3Z" />
  </Base>
);

export const HeadsetIcon = (p) => (
  <Base {...p}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="3.5" y="13" width="4" height="6" rx="1.5" />
    <rect x="16.5" y="13" width="4" height="6" rx="1.5" />
    <path d="M20.5 19v1a2 2 0 0 1-2 2h-3" />
  </Base>
);

export const TagIcon = (p) => (
  <Base {...p}>
    <path d="M3.5 11.2 12.3 3h6.2a1.5 1.5 0 0 1 1.5 1.5v6.2L11.7 20 3.5 11.8Z" />
    <circle cx="15.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
  </Base>
);
