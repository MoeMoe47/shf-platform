// src/components/sales/SalesHeader.jsx
//
// Replaces a mislabeled copy of CivicHeader.jsx (file comment literally
// read "src/components /sales/CivicHeader.jsx", function name
// CivicHeader(), rendered "SHF CIVIC" — confirmed cross-vertical
// contamination, not real Sales content). Content below is adapted from
// the archived, genuinely Sales-specific src/entries/_archive/
// components.sales.20251107-000126/SalesHeader.jsx, rewritten to render
// as the *content* of SalesLayout.jsx's own <header className="crb-header">
// (the archived version wrapped itself in a second <header> tag, which
// SalesLayout.jsx already provides). Only classes confirmed defined in
// src/styles/shell.css / sales-shell.css (both loaded by sales.main.jsx)
// are used — no invented styling.
import React from "react";
import { Link } from "react-router-dom";

export default function SalesHeader() {
  return (
    <>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🚀 Sales</h1>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Link className="sh-btn" to="/help">❓ Help</Link>
      </div>
    </>
  );
}
