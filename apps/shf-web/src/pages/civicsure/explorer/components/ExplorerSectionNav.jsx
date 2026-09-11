// ExplorerSectionNav.jsx — bounded public projection categories.
import React from "react";
import { ExplorerIcon } from "../explorerIcons.jsx";

const PUBLIC_CATEGORY_TABS = [
  { key: "programs", label: "Programs", icon: "book" },
  { key: "funding", label: "Funding", icon: "dollar" },
  { key: "providers", label: "Providers", icon: "building" },
  { key: "counties", label: "Counties", icon: "map" },
];

export default function ExplorerSectionNav({ activeKey, onSelect }) {
  return (
    <nav className="cse-section-nav" aria-label="Explorer categories">
      <div className="cse-container cse-section-nav__row" role="tablist">
        {PUBLIC_CATEGORY_TABS.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`cse-tab${isActive ? " is-active" : ""}`}
              onClick={() => onSelect?.(tab.key)}
            >
              <ExplorerIcon name={tab.icon} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
