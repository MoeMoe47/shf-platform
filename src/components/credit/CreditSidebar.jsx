// src/components/credit/CreditSidebar.jsx
import React from "react";
import SidebarLink from "@/components/sidebar/SidebarLink.jsx";

export default function CreditSidebar() {
  return (
    <div className="crb-rail" style={{ minWidth: 240 }}>
      <nav aria-label="Credit report sections">
        <ul
          className="crb-links"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 6,
          }}
        >
          {/* Top-level dashboard + report views */}
          <SidebarLink to="/dashboard" icon="📊">
            Dashboard
          </SidebarLink>
          <SidebarLink to="/report" icon="📋">
            Credit Report
          </SidebarLink>
          <SidebarLink to="/disputes" icon="✉️">
            Disputes
          </SidebarLink>
          <SidebarLink to="/tasks" icon="✅">
            Tasks
          </SidebarLink>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--line, #ddd)",
              margin: "8px 0",
            }}
          />

          {/* Learning + portfolio */}
          <SidebarLink to="/lesson" icon="📘">
            Lesson
          </SidebarLink>
          <SidebarLink to="/portfolio" icon="📁">
            Portfolio
          </SidebarLink>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--line, #ddd)",
              margin: "8px 0",
            }}
          />

          {/* Utility */}
          <SidebarLink to="/settings" icon="⚙️">
            Settings
          </SidebarLink>
          <SidebarLink to="/help" icon="❓">
            Help
          </SidebarLink>
        </ul>
      </nav>
    </div>
  );
}
