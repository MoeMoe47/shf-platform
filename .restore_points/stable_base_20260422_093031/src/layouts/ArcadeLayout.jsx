// src/layouts/ArcadeLayout.jsx
// ------------------------------------------------------------
// L1X Arcade layout – thin wrapper around arcade pages
// ------------------------------------------------------------

import React from "react";

export default function ArcadeLayout({ children }) {
  return (
    <div className="ar-root">
      {/* Top glow bar could hold global arcade status later */}
      <header className="ar-top">
        <div className="ar-top__left">
          <span className="ar-dot" />
          <span className="ar-top__label">Arcade Pulse · 7 days</span>
        </div>
        <div className="ar-top__right">
          {/* future quick stats – leave empty for now */}
        </div>
      </header>

      <main className="ar-main">{children}</main>
    </div>
  );
}
