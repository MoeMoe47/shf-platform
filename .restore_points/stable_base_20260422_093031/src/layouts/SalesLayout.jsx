import React from "react";
import { Outlet, NavLink } from "react-router-dom";

export default function SalesLayout() {
  return (
    <div data-app="sales" style={{minHeight:"100vh",display:"grid",gridTemplateRows:"56px 1fr"}}>
      <header style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #e5e7eb"}}>
        <strong>SHF SALES</strong>
        <nav style={{display:"flex",gap:12}}>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/leads">Leads</NavLink>
          <NavLink to="/pipeline">Pipeline</NavLink>
        </nav>
      </header>
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr"}}>
        <aside style={{borderRight:"1px solid #e5e7eb",padding:12}}>
          <ul style={{listStyle:"none",padding:0,margin:0}}>
            <li><NavLink to="/dashboard">🏁 Northstar</NavLink></li>
            <li><NavLink to="/leads">📬 Leads</NavLink></li>
            <li><NavLink to="/pipeline">🧭 Pipeline</NavLink></li>
          </ul>
        </aside>
        <main id="sales-main" style={{padding:16}}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
