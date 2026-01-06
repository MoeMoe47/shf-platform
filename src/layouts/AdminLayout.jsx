// src/layouts/AdminLayout.jsx
import React from "react";
import AdminHeader from "@/components/admin/AdminHeader.jsx";
import AdminSidebar from "@/components/admin/AdminSidebar.jsx";

export default function AdminLayout({ children }) {
  return (
    // IMPORTANT: no "no-sidebar" here
    <div className="app-root" data-app="admin">
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
