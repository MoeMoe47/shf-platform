import React from "react";

export default function MetaverseBreadcrumbs({ breadcrumbs, onNavigate }) {
  return (
    <nav className="met-breadcrumbs" aria-label="Metaverse location breadcrumbs">
      <ol>
        {breadcrumbs.map((crumb, index) => (
          <li key={`${crumb.level}:${crumb.id}`}>
            <button
              type="button"
              onClick={() => onNavigate(crumb)}
              aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
            >
              {crumb.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
