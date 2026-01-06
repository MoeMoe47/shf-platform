// src/layouts/StoreLayout.jsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import WalletButton from "@/components/WalletButton.jsx";
import "@/styles/theme-solutions.css";

export default function StoreLayout() {
  return (
    <div data-app="store">
      <header className="smp-appbar" style={{ margin: 12 }}>
        <div className="smp-brand">
          <span className="dot" />
          <span className="name">SILICON HEARTLAND</span>
          <span className="sub">store</span>
        </div>
        <nav className="smp-nav">
          <NavLink to="/marketplace">Marketplace</NavLink>
          <NavLink to="/catalog">Catalog</NavLink>
        </nav>
        <div className="smp-actions" style={{ marginLeft: "auto" }}>
          <WalletButton />
        </div>
      </header>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px" }}>
        <Outlet />
      </main>
    </div>
  );
}
