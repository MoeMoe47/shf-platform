// src/layouts/CivicLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

import CivicAppShell from "@/layouts/civic/CivicAppShell.jsx";

// CivicAppShell owns the sidebar (collapsible desktop / icon rail tablet /
// off-canvas mobile drawer) and the top bar — see
// src/layouts/civic/CivicAppShell.jsx. `.crb-main wash wash--page` is kept
// as the Outlet's wrapper unchanged so every existing Civic page's own CSS
// (which targets `.crb-main` for padding, `.db-*` classes for in-page
// headers, etc.) keeps working without modification — only the dashboard
// page itself (CivicDashboard.jsx) received a full visual redesign in this
// pass; every other route's content is untouched.
export default function CivicLayout() {
  return (
    <CivicAppShell>
      <main className="crb-main wash wash--page">
        <Outlet />
      </main>
    </CivicAppShell>
  );
}
