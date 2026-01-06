// src/pages/AdminCohorts.jsx
import React from "react";
import { useAdminCohortsMock } from "@/hooks/useAdminCohortsMock.js";
import CohortFunnelCard from "@/components/admin/CohortFunnelCard.jsx";
import CohortTable from "@/components/admin/CohortTable.jsx";
import AnomalyBadge from "@/components/admin/AnomalyBadge.jsx";
import { track } from "@/utils/analytics.js";

export default function AdminCohorts() {
  const { funnel, cohorts, refresh } = useAdminCohortsMock();

  // --- focus state (URL-driven) ---
  const [focusId, setFocusId] = React.useState(() => getFocusFromURL());
  React.useEffect(() => {
    const onPop = () => setFocusId(getFocusFromURL());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  function setFocusInURL(id) {
    const u = new URL(window.location.href);
    if (id) u.searchParams.set("focus", id);
    else u.searchParams.delete("focus");
    window.history.pushState({}, "", u.toString());
    setFocusId(id || "");
  }

  // Optional: show-only-focus toggle
  const [onlyFocus, setOnlyFocus] = React.useState(false);
  const rows = React.useMemo(() => {
    if (!onlyFocus || !focusId) return cohorts;
    return cohorts.filter((c) => (c.id || slugify(c.name)) === focusId);
  }, [cohorts, onlyFocus, focusId]);

  function getSeverity(retention) {
    if (retention < 0.4) return "critical";
    if (retention < 0.6) return "warning";
    return "info";
  }

  function goToDetails(cohort) {
    const id = cohort.id || slugify(cohort.name);
    track("cohort_badge_clicked", { id, name: cohort.name, retention: cohort.retention });
    setFocusInURL(id); // deep-link + update state
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Cohorts & Funnels (Mock)</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button style={styles.btn} onClick={refresh}>Refresh mock</button>

          {/* Focus controls */}
          <label style={styles.chk}>
            <input
              type="checkbox"
              checked={!!onlyFocus}
              onChange={(e) => setOnlyFocus(e.target.checked)}
              disabled={!focusId}
            />
            <span>Show only focused cohort</span>
          </label>
          {focusId && (
            <button
              style={styles.btn}
              onClick={() => setFocusInURL("")}
              title="Clear focused cohort"
            >
              Clear focus
            </button>
          )}
        </div>
      </header>

      <section style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.h2}>Outcome Funnel</h2>
          <CohortFunnelCard data={funnel} />
        </div>

        <div style={styles.card}>
          <h2 style={styles.h2}>Cohorts</h2>
          {/* Pass focusId so the table can highlight the row */}
          <CohortTable rows={rows} focusId={focusId} />

          {/* Quick anomaly badges (top 3 cohorts) — clickable deep links */}
          <div style={styles.badgesRow} aria-label="Cohort quick links">
            {cohorts.slice(0, 3).map((c, i) => {
              const sev = getSeverity(c.retention);
              const hint = `Retention ${Math.round(c.retention * 100)}%`;
              return (
                <button
                  key={c.id || i}
                  onClick={() => goToDetails(c)}
                  title={`Open details: ${c.name}`}
                  style={styles.badgeBtn}
                >
                  <AnomalyBadge severity={sev} label={c.name} hint={hint} />
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* utils */
function slugify(s = "") {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function getFocusFromURL() {
  try {
    return new URLSearchParams(window.location.search).get("focus") || "";
  } catch {
    return "";
  }
}

/* styles */
const styles = {
  page: {
    padding: 16,
    background: "#f6f3ed",
    minHeight: "100vh",
    color: "#0f172a",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
    flexWrap: "wrap"
  },
  h1: { margin: 0, fontWeight: 800, fontSize: 22 },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  card: {
    background: "#fff",
    border: "1px solid #e6e4de",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,.04)"
  },
  h2: { margin: "0 0 10px", fontSize: 16, fontWeight: 800 },
  btn: {
    border: "1px solid #dcd7ce",
    background: "#fff",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600
  },
  chk: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0f172a" },
  badgesRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10
  },
  badgeBtn: {
    all: "unset",
    cursor: "pointer",
    borderRadius: 999,
    display: "inline-flex"
  }
};
