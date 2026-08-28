// src/layouts/ArcadeLayout.jsx
// ------------------------------------------------------------
// SHF Learning Arcade layout.
//
// Shell/density repair pass: now renders ArcadeAppShell (Arcade's own
// dedicated shell — src/layouts/arcade/ArcadeAppShell.jsx), NOT
// AppShellLayout. Measured live before this change: AppShellLayout's
// header sits ABOVE the sidebar+main body row (header y=0..56, sidebar
// y=56..), which structurally cannot produce the approved mock's geometry
// (sidebar full-height from y=0, header starting only at the sidebar's
// right edge). ArcadeAppShell is a different DOM topology entirely, not a
// restyle of the old one. Every existing Arcade route keeps working
// unchanged — only the outer chrome around `{children}` changed.
// ------------------------------------------------------------

import React from "react";
import { Outlet } from "react-router-dom";
import ArcadeAppShell from "@/layouts/arcade/ArcadeAppShell.jsx";
import ArcadeTopNav from "@/components/arcade/ArcadeTopNav.jsx";

export default function ArcadeLayout({ children }) {
  return (
    <ArcadeAppShell>
      {/* No data-app attribute here either — same reason as
          ArcadeAppShell.jsx's own root div: only arcade.html's #root
          needs it (for the mount-point query in arcade.main.jsx), and
          app-shell.css's global `[data-app]{display:flex;flex-direction:
          column}` rule would otherwise apply to this div a second time
          for no benefit. */}
      <div className="ar-root">
        <ArcadeTopNav />
        <main className="ar-main" id="arcade-main" role="main" aria-live="polite">
          {children ?? <Outlet />}
        </main>
      </div>
    </ArcadeAppShell>
  );
}
