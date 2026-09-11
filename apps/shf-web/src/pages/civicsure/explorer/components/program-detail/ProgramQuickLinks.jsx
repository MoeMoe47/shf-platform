// ProgramQuickLinks.jsx — "View latest report / See funding sources /
// Explore providers / View evidence library" quick-link row.
// "See funding sources", "Explore providers", and "View evidence
// library" perform real local navigation (they switch the active tab
// via onNavigateTab — no backend, but a working interaction, not a
// dead link). "View latest report" has no wired destination yet (no
// Report system in this phase) so it renders as an inert,
// aria-disabled placeholder — same convention used elsewhere in the
// CivicSure public frame.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProgramQuickLinks({ onNavigateTab }) {
  const links = [
    { key: "report", label: "View latest report", icon: "document", placeholder: true },
    { key: "funding", label: "See funding sources", icon: "bank", tabKey: "money" },
    { key: "providers", label: "Explore providers", icon: "people", tabKey: "providers" },
    { key: "evidence", label: "View evidence library", icon: "book", tabKey: "evidence" },
  ];

  return (
    <nav className="cse-card cse-pd-quicklinks" aria-label="Quick links">
      <h3 className="cse-pd-quicklinks__heading">Quick Links</h3>
      <ul className="cse-pd-quicklinks__list">
        {links.map((link) =>
          link.placeholder ? (
            <li key={link.key}>
              <span className="cse-pd-quicklinks__link cse-pd-quicklinks__link--placeholder" aria-disabled="true" title="Coming soon">
                <ExplorerIcon name={link.icon} />
                {link.label}
              </span>
            </li>
          ) : (
            <li key={link.key}>
              <button type="button" className="cse-pd-quicklinks__link" onClick={() => onNavigateTab(link.tabKey)}>
                <ExplorerIcon name={link.icon} />
                {link.label}
              </button>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}
