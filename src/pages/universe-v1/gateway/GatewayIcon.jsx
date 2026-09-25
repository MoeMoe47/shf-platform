// src/pages/universe-v1/gateway/GatewayIcon.jsx
// Stroke icon set shared by the SHU gateway and the discovery pages
// (moved out of UniverseGateway.jsx unchanged so both can import it).
import React from 'react';

export default function Icon({ name }) {
  const common = { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' };
  if (name === 'search') return (
    <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></svg>
  );
  if (name === 'cap') return (
    <svg {...common}><path d="M3 8l9-4 9 4-9 4-9-4z" /><path d="M7 10v5c2 2 8 2 10 0v-5" /></svg>
  );
  if (name === 'book') return (
    <svg {...common}><path d="M5 5h7v14H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><path d="M12 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7V5z" /></svg>
  );
  if (name === 'briefcase') return (
    <svg {...common}><path d="M9 7V5h6v2" /><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 12h18M10 12v2h4v-2" /></svg>
  );
  if (name === 'people') return (
    <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c.7-3.4 2.7-5 6-5s5.3 1.6 6 5" /><path d="M14 15c2.8.1 4.6 1.5 5.4 4" /></svg>
  );
  if (name === 'building') return (
    <svg {...common}><path d="M5 21V4h9v17" /><path d="M14 9h5v12" /><path d="M8 8h3M8 12h3M8 16h3M16 13h1M16 17h1" /></svg>
  );
  if (name === 'rocket') return (
    <svg {...common}><path d="M14 4c3 1 5 3 6 6l-7 7-6-6 7-7z" /><path d="M7 11l-3 1 2 2-1 3 3-2M14 4l-1 5 5-1" /></svg>
  );
  if (name === 'pin') return (
    <svg {...common}><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
  );
  if (name === 'hand') return (
    <svg {...common}><path d="M7 12V6a1.5 1.5 0 0 1 3 0v5" /><path d="M10 11V5a1.5 1.5 0 0 1 3 0v6" /><path d="M13 11V7a1.5 1.5 0 0 1 3 0v7" /><path d="M7 12l-2-2a1.6 1.6 0 0 0-2.2 2.3l5.5 6.2A5 5 0 0 0 12 20h2a5 5 0 0 0 5-5v-3" /></svg>
  );
  if (name === 'orbit') return (
    <svg {...common}><circle cx="12" cy="12" r="4.5" /><ellipse cx="12" cy="12" rx="10" ry="3.6" transform="rotate(-18 12 12)" /></svg>
  );
  if (name === 'ticket') return (
    <svg {...common}><path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V4H4v4z" /><path d="M9 7h6M9 13h6" /></svg>
  );
  return (
    <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
}
