import React from "react";

export default function FoundationDonationIcon({ name }) {
  const paths = {
    heart: (
      <path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 2 10 8 15 6-5 12-11 8-15Z" />
    ),
    gift: (
      <>
        <path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12" />
        <path d="M12 9C3 9 5 1 9 4l3 5c9 0 7-8 3-5z" />
      </>
    ),
    chart: (
      <>
        <path d="M3 21h18M5 17v-5h3v5M11 17V7h3v10M17 17V3h3v14" />
      </>
    ),
    people: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M6 21v-3a6 6 0 0 1 12 0v3M3 10a3 3 0 0 0 0 6v5M21 10a3 3 0 0 1 0 6v5" />
      </>
    ),
    partner: (
      <>
        <path d="m2 9 5-5 5 2 5-2 5 5-5 9-4 2-7-6zM7 4l-5 9M17 4l5 9" />
        <path d="m12 6-4 5 3 2 4-3 4 5" />
      </>
    ),
    cap: (
      <>
        <path d="m2 8 10-5 10 5-10 5zM6 10v7q6 5 12 0v-7M22 8v8" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V3h8v4M3 12q9 6 18 0M12 12v5" />
      </>
    ),
    access: (
      <>
        <circle cx="12" cy="4" r="2" />
        <path d="M4 9h16M12 7v7m-5 7 5-7 5 7" />
      </>
    ),
    file: (
      <>
        <path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8" />
      </>
    ),
    shield: (
      <>
        <path d="m12 2 9 4v6q0 7-9 10-9-3-9-10V6zM8 12l3 3 5-6" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.heart}
    </svg>
  );
}
