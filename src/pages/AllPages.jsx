// src/pages/AllPages.jsx
import React from "react";
import CrossAppLink from "@/components/nav/CrossAppLink.jsx";

/**
 * All Pages (Dev hub)
 * - Quick jump tiles to every app + common pages
 * - Adds Dev Index (__docs) per app
 * - Search and copy URL helpers
 *
 * CrossAppLink builds URLs as /{app}.html#{to}
 * Use { to: "/" } for index routes
 */

const GROUPS = [
  {
    title: "Core platform",
    items: [
      { app: "solutions",  label: "Solutions (Top)",  to: "/top" },
      { app: "foundation", label: "Foundation (Top)", to: "/top" },
      { app: "store",      label: "Store (Top)",      to: "/top" },
    ],
  },
  {
    title: "Learner apps",
    items: [
      { app: "career",     label: "Career (Dashboard)",    to: "/dashboard" },
      { app: "curriculum", label: "Curriculum (ASL Dash)", to: "/asl/dashboard" },
      { app: "arcade",     label: "Arcade (Home)",         to: "/" }, // index route
    ],
  },
  {
    title: "Sales / Rev",
    items: [
      { app: "sales",      label: "Sales (Home)",     to: "/" },       // index route (SalesDashboard)
      { app: "sales",      label: "Sales (Pro)",      to: "/pro" },
      { app: "sales",      label: "Sales (Pricing)",  to: "/pricing" },
      { app: "launch",     label: "Launch (Overview)",to: "/overview" },
    ],
  },
  {
    title: "Credit & Finance",
    items: [
      { app: "credit",     label: "Credit (Dashboard)", to: "/dashboard" },
      { app: "debt",       label: "Debt (Home)",        to: "/" },      // index = Dashboard
      { app: "debt",       label: "Debt (Clock)",       to: "/clock" },
      { app: "debt",       label: "Debt (Plan)",        to: "/plan" },
      { app: "debt",       label: "Debt (Snowball)",    to: "/snowball" },   // aliases kept in routes
      { app: "debt",       label: "Debt (Avalanche)",   to: "/avalanche" },  // aliases kept in routes
      { app: "fuel",       label: "Fuel Tank (Top)",    to: "/top" },
      { app: "treasury",   label: "Treasury (Home)",    to: "/" },      // index = Dashboard
      { app: "treasury",   label: "Treasury (Ledger)",  to: "/ledger" },
      { app: "treasury",   label: "Treasury (Assets)",  to: "/assets" },
      { app: "treasury",   label: "Treasury (Proofs)",  to: "/proofs" },
      { app: "treasury",   label: "Treasury (Settings)",to: "/settings" },
    ],
  },
  {
    title: "Employer-facing",
    items: [
      { app: "employer",   label: "Employer (Dashboard)", to: "/" },     // index route
      { app: "employer",   label: "Employer (Pipeline)",  to: "/pipeline" },
      { app: "employer",   label: "Employer (Jobs)",      to: "/jobs" },
      { app: "employer",   label: "Employer (Reports)",   to: "/reports" },
      { app: "employer",   label: "Employer (Settings)",  to: "/settings" },
    ],
  },
];

// Add a Dev Index (__docs) tile for each unique app in the groups above
const uniqueApps = Array.from(
  new Set(GROUPS.flatMap(g => g.items.map(i => i.app)))
);

const DEV_INDEX_GROUP = {
  title: "Dev Index per app",
  items: uniqueApps.map(app => ({
    app,
    label: `${cap(app)} – Dev Index`,
    to: "/__docs",
  })),
};

// Outside / All Pages (hosted under Solutions by convention)
const OUTSIDE_GROUP = {
  title: "Outside / All Pages",
  items: [
    { app: "solutions", label: "All Pages (index UI)", to: "/all-pages" },
  ],
};

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function AllPages() {
  const [q, setQ] = React.useState("");

  const groups = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    const filter = (it) =>
      !term ||
      it.label.toLowerCase().includes(term) ||
      `${it.app}.html#${it.to}`.toLowerCase().includes(term);

    const mapGroup = (g) => ({
      ...g,
      items: g.items.filter(filter),
    });

    return [
      mapGroup(DEV_INDEX_GROUP),
      ...GROUPS.map(mapGroup),
      mapGroup(OUTSIDE_GROUP),
    ].filter(g => g.items.length > 0);
  }, [q]);

  return (
    <div className="dev-pages" data-app="dev">
      <header className="dev-header">
        <h1>Dev Pages</h1>
        <div className="dev-controls">
          <input
            type="search"
            placeholder="Search apps, pages, or URLs…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search dev pages"
          />
        </div>
      </header>

      {groups.map((group) => (
        <section key={group.title} className="dev-section">
          <h2>{group.title}</h2>
          <div className="dev-grid">
            {group.items.map(({ app, label, to }) => (
              <Tile key={`${group.title}-${app}-${to}`} app={app} label={label} to={to} />
            ))}
          </div>
        </section>
      ))}

      <style>{css}</style>
    </div>
  );
}

function Tile({ app, label, to }) {
  const hrefShown = `/${app}.html#${to || "/"}`;
  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + hrefShown);
    } catch {}
  }, [hrefShown]);

  return (
    <CrossAppLink
      app={app}
      to={to}
      className="dev-tile"
      title={`Open ${label}`}
      aria-label={`Open ${label}`}
    >
      <div className="dev-tile-title">{label}</div>
      <div className="dev-tile-url">{hrefShown}</div>
      <button
        type="button"
        className="dev-copy"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); copy(); }}
      >
        Copy URL
      </button>
    </CrossAppLink>
  );
}

const css = `
.dev-pages {
  padding: 16px;
  background: #fafaf9;
  min-height: 100dvh;
}
.dev-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 16px;
}
.dev-header h1 {
  margin: 0;
  font-weight: 800;
  font-size: 20px;
}
.dev-controls input[type="search"] {
  width: min(520px, 50vw);
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  outline: none;
}
.dev-section h2 {
  margin: 16px 0 8px;
  font-size: 14px;
  color: #374151;
  font-weight: 700;
  letter-spacing: .02em;
  text-transform: uppercase;
}
.dev-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
.dev-tile {
  position: relative;
  display: grid;
  gap: 6px;
  border: 1px solid var(--ring, #e5e7eb);
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  transition: transform .12s ease, border-color .12s ease;
}
.dev-tile:hover { border-color: #d1d5db; transform: translateY(-1px); }
.dev-tile-title { font-weight: 800; }
.dev-tile-url {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; color: #6b7280;
  word-break: break-all;
}
.dev-copy {
  justify-self: start;
  margin-top: 2px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #111827;
  cursor: pointer;
}
.dev-copy:hover { background: #f3f4f6; }
`;
