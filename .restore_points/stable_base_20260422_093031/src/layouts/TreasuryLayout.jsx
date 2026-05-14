import React from "react";
import { Outlet } from "react-router-dom";

export default function TreasuryLayout() {
  return (
    <div
      data-app="treasury"
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #d1d5db",
          background: "#ffffff",
          fontWeight: 700,
          fontSize: "20px",
        }}
      >
        Treasury Shell
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: "calc(100vh - 58px)",
        }}
      >
        <aside
          style={{
            borderRight: "1px solid #d1d5db",
            background: "#ffffff",
            padding: "20px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Navigation</div>
          <div style={{ display: "grid", gap: 10 }}>
            <a href="/treasury.html#/dashboard">Dashboard</a>
            <a href="/treasury.html#/assets">Assets</a>
            <a href="/treasury.html#/ledger">Ledger</a>
            <a href="/treasury.html#/proofs">Proofs</a>
            <a href="/treasury.html#/operator">Operator</a>
            <a href="/treasury.html#/settings">Settings</a>
            <a href="/treasury.html#/help">Help</a>
          </div>
        </aside>

        <main style={{ padding: "24px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
