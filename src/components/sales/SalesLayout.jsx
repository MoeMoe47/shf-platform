import React from "react";
import { Outlet, Link } from "react-router-dom";

export default function SalesLayout() {
  return (
    <div className="page pad">
      <header style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
        <strong>Sales</strong> · <Link to="/dashboard">Dashboard</Link>
      </header>
      <main style={{ paddingTop: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
