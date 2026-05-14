import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "#ffffff" : "#cbd5e1",
  background: isActive ? "#2563eb" : "transparent",
  fontWeight: 600,
});

export default function CapitalLayout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        maxWidth: "100vw",
        display: "grid",
        gridTemplateColumns: "260px minmax(0, 1fr)",
        background: "#0b1020",
        color: "#e5e7eb",
        fontFamily: "Arial, sans-serif",
        overflowX: "hidden",
      }}
    >
      <aside
        style={{
          width: 260,
          minWidth: 260,
          maxWidth: 260,
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: 20,
          background: "#0f172a",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            SHF Infrastructure
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc" }}>
            Capital Ops
          </div>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          <NavLink to="/operator" style={linkStyle}>
            Operator Panel
          </NavLink>
        </nav>
      </aside>

      <div
        style={{
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        <header
          style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "0 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "#111827",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              Infrastructure Control Plane
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb" }}>
              Capital Operations
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#93c5fd",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            credits • pools • payouts • settlement • governance
          </div>
        </header>

        <main
          style={{
            padding: 24,
            minWidth: 0,
            maxWidth: "100%",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
