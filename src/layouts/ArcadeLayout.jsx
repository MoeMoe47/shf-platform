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
//
// SHF shared-footer integration (Arcade pass): every Arcade route runs
// through this one layout (see ArcadeRoutes.jsx — there is no separate
// "immersive gameplay" shell in this codebase; /games' own Play action is
// currently just an informational stub, not a real fullscreen game), so
// this is the correct single insertion point for the same canonical
// SHFFooter Curriculum/Career already use — no per-page imports, no
// Arcade-specific footer fork. `hideFooter` is an escape hatch for
// whichever future route becomes real, canvas-driven fullscreen gameplay
// (see the task's own "fullscreen gameplay exception") — reserved but
// unused today since no such route exists yet; nothing currently passes
// it as true.

import React from "react";
import { Outlet } from "react-router-dom";
import ArcadeAppShell from "@/layouts/arcade/ArcadeAppShell.jsx";
import ArcadeTopNav from "@/components/arcade/ArcadeTopNav.jsx";
import SHFFooter from "@/components/shared/SHFFooter.jsx";

export default function ArcadeLayout({ children, hideFooter = false }) {
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
        {!hideFooter && <SHFFooter variant="arcade" />}
      </div>
    </ArcadeAppShell>
  );
}
