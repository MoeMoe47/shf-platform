// src/router/SalesRoutes.jsx
import React from "react";
import { Routes, Route, Navigate, Link, Outlet } from "react-router-dom";

function SalesLayout() {
  // swap this with your real SalesLayout when ready
  return (
    <div className="sales-shell">
      <Outlet />
    </div>
  );
}

function SalesHome() {
  return (
    <div className="page pad">
      <h1 style={{ marginTop: 0 }}>Sales Home</h1>
      <p>If you can see this, the Sales app is mounted correctly.</p>
      <ul>
        {/* use relative link so it works no matter the mount */}
        <li><Link to="dashboard">Go to Dashboard (same stub)</Link></li>
      </ul>
      <div style={{ marginTop: 16, opacity: 0.7 }}>
        Next: we’ll re-enable SalesLayout + SalesDashboard once this is green.
      </div>
    </div>
  );
}

export default function SalesRoutes() {
  return (
    <Routes>
      <Route element={<SalesLayout />}>
        {/* index = sales.html#/ */}
        <Route index element={<SalesHome />} />
        {/* sales.html#/dashboard */}
        <Route path="dashboard" element={<SalesHome />} />
        {/* catch-all -> index */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
