// src/components/debt/DebtSidebar.jsx
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";

export default function DebtSidebar() {
  const link = "sh-sidebarItem";
  return (
    <nav className="sh-sidebarNav">
      <ul className="sh-sidebarGroup">
        <li><AppLink app="debt" to="/clock"      className={link}>🕰️ <span>Debt Clock</span></AppLink></li>
        <li><AppLink app="debt" to="/dashboard"  className={link}>📊 <span>Dashboard</span></AppLink></li>
        <li><AppLink app="debt" to="/ledger"     className={link}>📒 <span>Ledger</span></AppLink></li>
        <li><AppLink app="debt" to="/accounts"   className={link}>🏦 <span>Accounts</span></AppLink></li>
        <li><AppLink app="debt" to="/plan"       className={link}>🧭 <span>Plan</span></AppLink></li>
        <li><AppLink app="debt" to="/help"       className={link}>❓ <span>Help</span></AppLink></li>
      </ul>
    </nav>
  );
}
