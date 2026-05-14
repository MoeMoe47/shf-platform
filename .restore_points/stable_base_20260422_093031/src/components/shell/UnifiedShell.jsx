import React from "react";

/**
 * Shared shell used by non-Career apps.
 * Adds data attributes for scoped CSS/JS upgrades.
 */
export default function UnifiedShell({ app="unknown", header, sidebar, children }) {
  return (
    <div className="unified-root" data-shell="unified" data-app={app}>
      <a className="skip" href="#main">Skip to main</a>
      {header}
      <div className="unified-body">
        {sidebar ? <aside className="unified-sidebar" aria-label="Primary">{sidebar}</aside> : null}
        <main id="main" className="unified-main" role="main" aria-live="polite">
          {children}
        </main>
      </div>
    </div>
  );
}
