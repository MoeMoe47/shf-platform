import { openDashboardOverview } from "./workspace-dashboard/dashboardUtils";
import React, { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";

const shellStyle = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "286px 1fr",
  background: "#06122b",
  color: "#e8eefc",
};

const sidebarStyle = {
  borderRight: "1px solid rgba(255,255,255,0.08)",
  padding: "22px 20px",
  background: "linear-gradient(180deg, #0a1433 0%, #09122c 100%)",
};

const mainStyle = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const topbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 18px",
  minHeight: 48,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(8,18,46,0.92) 0%, rgba(7,16,40,0.88) 100%)",
};

const contentStyle = {
  flex: 1,
  minHeight: 0,
};

const navWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "36px",
};

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "12px 14px",
  borderRadius: "12px",
  textDecoration: "none",
  color: isActive ? "#ffffff" : "rgba(232,238,252,0.88)",
  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
  border: `1px solid ${isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
  fontWeight: 700,
});

export default function ExchangeLayout() {

  useEffect(() => {
    function handleOverviewNavigation(event) {
      const target = event.target?.closest?.("a, button, [role='button'], [data-nav], .nav-item, .sidebar-item");
      if (!target) return;

      const label = String(target.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const href = target.getAttribute?.("href") || "";

      const isOverviewClick =
        label === "overview" ||
        label.startsWith("overview ") ||
        href === "#/exchange" ||
        href === "#/exchange/command";

      if (!isOverviewClick) return;

      event.preventDefault();
      event.stopPropagation();
      openDashboardOverview();
    }

    document.addEventListener("click", handleOverviewNavigation, true);

    return () => {
      document.removeEventListener("click", handleOverviewNavigation, true);
    };
  }, []);

  return (
    <div style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={{ fontSize: 14, opacity: 0.72, marginBottom: 6 }}>
          Silicon Heartland Solutions
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>
          Unified Truth
          <br />
          Command
        </div>

        <div style={navWrapStyle}>
          <NavLink to="/exchange/command" style={linkStyle}>
            Command Center
          </NavLink>
          <NavLink to="/exchange/operator" style={linkStyle}>
            Operator Panel
          </NavLink>
          <NavLink to="/exchange/provider" style={linkStyle}>
            Provider View
          </NavLink>
          <NavLink to="/exchange/investor" style={linkStyle}>
            Investor View
          </NavLink>
          <NavLink to="/exchange/public" style={linkStyle}>
            Public Transparency
          </NavLink>
        </div>
      </aside>

      <div style={mainStyle}>
        <header style={topbarStyle}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(232,238,252,0.72)", letterSpacing: "0.04em" }}>
            SHS Exchange / Command Center
          </div>

          <div style={{ fontSize: 12, color: "rgba(232,238,252,0.66)" }}>
            operational command layer
          </div>
        </header>

        <main style={contentStyle}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
