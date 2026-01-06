// src/layouts/CivicLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

import CivicHeader from "@/components/civic/CivicHeader.jsx";
import CivicSidebar from "@/components/civic/CivicSidebar.jsx";

export default function CivicLayout() {
  return (
    <>
      {/* Top header bar (already styled via .crb-header in unified shell CSS) */}
      <CivicHeader />

      {/* Sidebar + main content, using shared shell classes */}
      <div className="crb-body">
        <CivicSidebar />
        <main className="crb-main wash wash--page">
          <Outlet />
        </main>
      </div>
    </>
  );
}
