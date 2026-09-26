// src/layouts/AdminLayout.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader.jsx";
import AdminSidebar from "@/components/admin/AdminSidebar.jsx";

// Admin routes that are complete command surfaces with their own navigation.
// They render without the admin header and rail so the page is one coherent
// surface instead of a layout nested under a second navigation. Every other
// admin route is unchanged.
export const FULL_BLEED_ADMIN_ROUTES = Object.freeze(["/agent-fabric/command"]);

export function isFullBleedAdminRoute(pathname = "") {
  return FULL_BLEED_ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();

  if (isFullBleedAdminRoute(pathname)) {
    return (
      <div className="app-root ds-shell" data-app="admin" data-ds-theme="shs" data-shell-family="operator" data-shell-mode="full-bleed">
        <main className="app-main">{children}</main>
      </div>
    );
  }

  return (
    // IMPORTANT: no "no-sidebar" here
    <div className="app-root ds-shell" data-app="admin" data-ds-theme="shs" data-shell-family="operator">
      {/* Top header bar */}
      <AdminHeader />

      {/* 2-column shell: sidebar (left) + main (right) */}
      <div className="app-body">
        <AdminSidebar />

        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
