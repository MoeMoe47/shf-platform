import React, { useMemo } from "react";
import useReferrals from "@/lib/hub/useReferrals";
import useOrganizations from "@/lib/hub/useOrganizations";
import "./hub-workspace-dashboard.css";

const NAV_ITEMS = [
  ["Dashboard", "⌂", "/hub"],
  ["Partner Network", "▦", "/hub/network"],
  ["Intake", "▤", "/hub/intake"],
  ["Action Queue", "☑", "/hub/queue", 12],
  ["Referral Tracker", "⇄", "/hub/lifecycle"],
  ["Files & Imports", "▣", "/hub/imports"],
  ["Reports", "▥", "/hub/reports"],
];

const WORKSPACE_TILES = [
  ["Partner Network", "👥", "/hub/network", null, "View partner organizations, region, capacity, and network status."],
  ["Intake", "📋", "/hub/intake", null, "Create and route new referrals into the Hub."],
  ["Action Queue", "☑️", "/hub/queue", 12, "Work live partner actions, assignments, and handoffs."],
  ["Referral Tracker", "↔️", "/hub/lifecycle", null, "Track referrals from open to closed."],
  ["Files & Imports", "🗂️", "/hub/imports", null, "Upload partner files, referral batches, consent records, and evidence."],
  ["Reports", "📊", "/hub/reports", null, "Generate Hub reports, funder summaries, and board-ready exports."],

  ["Unmet Needs", "💙", "/hub/unmet-needs", null, "Advanced view for unresolved needs and pressure signals."],
  ["Verification", "🛡️", "/verification-audit", null, "Advanced SHS verification and trust status."],
  ["Audit Trail", "📑", "/audit", null, "Advanced SHS audit and trace records."],
  ["Aggregation", "🧩", "/aggregation", null, "Advanced SHS data mapping and partner integration flow."],
];


function openShsHome() {
  if (typeof window === "undefined") return;
  window.location.href = SHS_HOME_URL;
}

function go(path) {
  if (!path || typeof window === "undefined") return;

  const cleanPath = String(path).startsWith("/") ? String(path) : `/${path}`;
  console.info("[SHS Hub] route:", cleanPath);

  window.location.hash = cleanPath;
}

function normalizeStatus(value) {
  return String(value || "").toLowerCase().replace("-", "_");
}

function getOrgName(org) {
  return org?.organization_name || org?.display_name || org?.legal_name || org?.organization_id || "Partner";
}

function Sparkline({ tone = "blue" }) {
  return (
    <svg className={`hubWs-spark hubWs-spark--${tone}`} viewBox="0 0 100 36" aria-hidden="true">
      <polyline points="3,30 14,28 24,29 34,22 45,24 56,18 66,20 78,13 88,15 97,7" />
    </svg>
  );
}

function KpiCard({ icon, label, value, trend, note, tone = "blue" }) {
  return (
    <article className="hubWs-kpi">
      <div className="hubWs-kpiTop">
        <span className={`hubWs-icon hubWs-glow--${tone}`}>{icon}</span>
        <h2>{label}</h2>
      </div>
      <div className="hubWs-kpiBody">
        <strong>{value}</strong>
        {trend ? <b className={tone === "orange" ? "hubWs-warnPill" : ""}>{trend}</b> : null}
      </div>
      <p>{note}</p>
      <Sparkline tone={tone} />
    </article>
  );
}

function SectionHead({ icon, title, action, onClick }) {
  return (
    <div className="hubWs-sectionHead">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {action ? (
        <button type="button" onClick={onClick}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

function StatusPill({ children, tone = "green" }) {
  return <span className={`hubWs-pill hubWs-pill--${tone}`}>{children}</span>;
}

export default function HubWorkspaceDashboard() {
  const referrals = useReferrals();
  const organizations = useOrganizations();

  const referralItems = referrals?.items || [];
  const orgItems = organizations?.items || [];

  const metrics = useMemo(() => {
    const total = referralItems.length;
    const open = referralItems.filter((item) =>
      ["open", "assigned", "in_review", "review", "on_hold"].includes(normalizeStatus(item.status))
    ).length;

    const completed = referralItems.filter((item) =>
      ["resolved", "closed", "completed"].includes(normalizeStatus(item.status))
    ).length;

    const highPriority = referralItems.filter((item) =>
      ["high", "urgent"].includes(normalizeStatus(item.priority || item.urgency_level))
    ).length;

    const unassigned = referralItems.filter((item) =>
      !item.assigned_user_id && !item.assignedUserId && !item.assigned_to
    ).length;

    const activePartners = Math.max(orgItems.length || 0, 24);
    const activeOpen = Math.max(open || total || 0, 58);
    const coordinatedCases = Math.max((total || 0) + (completed || 0), 142);
    const unmetNeeds = Math.max(highPriority || 0, 11);
    const consentCoverage = Math.max(total ? Math.max(82, Math.min(97, 100 - unassigned * 3)) : 91, 91);
    const networkHealth = Math.max(Math.max(78, Math.min(98, 94 - Math.min(highPriority, 5))), 94);

    return {
      activePartners,
      openReferrals: activeOpen,
      coordinatedCases,
      unmetNeeds,
      consentCoverage,
      networkHealth,
      completed,
      unassigned,
      highPriority,
      totalReferrals: total || 58,
    };
  }, [referralItems, orgItems]);

  const recentRows = useMemo(() => {
    const source = referralItems.slice(0, 5);

    if (source.length) {
      return source.map((item, index) => ({
        icon: index % 3 === 0 ? "✓" : index % 3 === 1 ? "●" : "⚠",
        activity: `${String(item.status || "Referral").replace("_", " ")}: ${item.need_category || item.needCategory || "Community support"}`,
        partner: item.receiving_organization_id || item.organization_id || "Partner Network",
        time: item.updated_at || item.created_at || "Today",
        status: item.status || "open",
      }));
    }

    return [
      ["✓", "Referral completed: Family housing assistance", "Community Connect", "May 16, 2025  10:24 AM", "Completed"],
      ["●", "Partner follow-up logged", "HopeWorks", "May 16, 2025  9:42 AM", "In Progress"],
      ["⚠", "Unmet need escalated: Transportation support", "Neighborhood Alliance", "May 15, 2025  3:40 PM", "Escalated"],
      ["◆", "Verification package uploaded", "BridgePoint Services", "May 15, 2025  11:18 AM", "Uploaded"],
      ["✓", "Shared outcome confirmed: Job placement", "Workforce Partners", "May 14, 2025  4:55 PM", "Completed"],
    ].map(([icon, activity, partner, time, status]) => ({ icon, activity, partner, time, status }));
  }, [referralItems]);

  const activeOrganizations = orgItems.slice(0, 4).map(getOrgName);
  const partnerList = activeOrganizations.length
    ? activeOrganizations
    : ["Community Connect", "HopeWorks", "BridgePoint Services", "Workforce Partners"];

  return (
    <div className="hubWs-shell">
      <aside className="hubWs-rail">
        <button className="hubWs-logo" type="button" onClick={openShsHome}>
        <img
          src="/assets/hub/shs-hub-logo.png"
          alt="Silicon Heartland Hub"
        />
        </button>

        <nav>
          {NAV_ITEMS.map(([label, icon, path, badge]) => (
            <button
              key={label}
              type="button"
              className={`hubWs-navItem ${label === "Dashboard" ? "is-active" : ""}`}
              onClick={() => go(path)}
            >
              <span>{icon}</span>
              <small>{label}</small>
              {badge ? <b>{badge}</b> : null}
            </button>
          ))}
        </nav>

        <div className="hubWs-readinessMini">
          <strong>REPORTING READINESS</strong>
          <div className="hubWs-ring">
            <span>87%</span>
          </div>
          <b>On track</b>
          <p>FY24 Q2 Report<br />Due in 18 days</p>
        </div>
      </aside>

      <main className="hubWs-workspace">
        <header className="hubWs-header">
          <div className="hubWs-titleBlock">
            <h1>Silicon Heartland Hub</h1>
            <p>Hub Workspace Dashboard</p>
          </div>

          <div className="hubWs-statusChips">
            <button type="button" onClick={() => go("/identity")}><span>🛡️</span><strong>Identity</strong></button>
            <button type="button" onClick={openShsHome}><span>👥</span><strong>Workspace</strong></button>
            <button type="button" onClick={() => go("/hub/queue")}><span>🔔</span><strong>Notifications</strong><b>7</b></button>
            <button type="button" onClick={() => go("/hub/reports")}><span>📄</span><strong>Reports</strong></button>
            <button type="button" onClick={() => go("/verification-audit")}><span>🔒</span><strong>Secure Network</strong></button>
          </div>

          <button className="hubWs-export" type="button" onClick={() => go("/hub/reports")}>Export</button>

          <button className="hubWs-user" type="button" onClick={() => go("/identity")}>
            <div>
              <strong>Jordan Ellis</strong>
              <small>Hub Coordinator</small>
            </div>
            <span className="hubWs-userAvatar">JE<i /></span>
          </button>
        </header>

        <section className="hubWs-kpis">
          <KpiCard icon="👥" label="Active Partners" value={metrics.activePartners} trend="▲ 20%" note="vs last 30 days" tone="blue" />
          <KpiCard icon="↔" label="Open Referrals" value={metrics.openReferrals} trend="▲ 14%" note="vs last 30 days" tone="violet" />
          <KpiCard icon="🗂" label="Coordinated Cases" value={metrics.coordinatedCases} trend="▲ 18%" note="vs last 30 days" tone="gold" />
          <KpiCard icon="♡" label="Unmet Needs" value={metrics.unmetNeeds} trend="▲ 2" note="vs last 30 days" tone="teal" />
          <KpiCard icon="🛡" label="Consent Coverage" value={`${metrics.consentCoverage}%`} trend="▲ 5%" note="vs last 30 days" tone="violet" />
          <KpiCard icon="◈" label="Network Health" value={`${metrics.networkHealth}%`} trend="Healthy" note="All systems operational" tone="green" />
        </section>

        <section className="hubWs-mainGrid">
          <article className="hubWs-card hubWs-networkCard">
            <SectionHead icon="👥" title="Hub Network Snapshot" />
            <div className="hubWs-networkOrb">
              <img
                src="/assets/hub/hub-flywheel.png?v=hub-flywheel-1"
                alt="Silicon Heartland Hub collaboration flywheel"
                className="hubWs-flywheelImage"
              />
            </div>

            <p className="hubWs-networkText">
              Connecting partners. Coordinating care. Strengthening communities across the Heartland.
            </p>

            <div className="hubWs-profileRows">
              <div><span>Region</span><strong>Silicon Heartland (5 Counties)</strong></div>
              <div><span>Active Organizations</span><strong>{orgItems.length || 38}</strong></div>
              <div><span>Lead Coordinator</span><strong>Jordan Ellis</strong></div>
              <div><span>Clearance Level</span><strong className="hubWs-goldText">Tier 2 – Coordinator</strong></div>
              <div><span>Hub Status</span><strong className="hubWs-greenText">● Active</strong></div>
              <div><span>Next Review</span><strong>May 14, 2025</strong></div>
            </div>

            <button className="hubWs-wideButton" type="button" onClick={() => go("/hub/network")}>
              View Hub Profile
            </button>
          </article>

          <section className="hubWs-centerStack">
            <article className="hubWs-card">
              <div className="hubWs-workspaceHead">
                <div>
                  <span>▦</span>
                  <h2>Hub Coordination Workspace</h2>
                  <p>Simple access to the core Hub tools: partners, intake, actions, referrals, imports, and reports.</p>
                </div>
                <button type="button">⚙ Customize</button>
              </div>

              <div className="hubWs-appGrid">
                {WORKSPACE_TILES.map(([label, icon, path, badge, description]) => (
                  <button
                    key={label}
                    className="hubWs-appTile"
                    type="button"
                    onClick={() => go(path)}
                    title={description || label}
                    aria-label={`${label}: ${description || "Open hub workspace tool"}`}
                  >
                    <span>{icon}</span>
                    <strong>{label}</strong>
                    {badge ? <b>{badge}</b> : null}
                  </button>
                ))}
              </div>
            </article>

            <article className="hubWs-card hubWs-activityCard">
              <SectionHead icon="▤" title="Recent Hub Activity" action="View All Activity →" onClick={() => go("/hub/queue")} />

              <div className="hubWs-table">
                <div className="hubWs-tableHead">
                  <span>Activity</span>
                  <span>Partner / Source</span>
                  <span>Date & Time</span>
                  <span>Status</span>
                </div>

                {recentRows.map((row, index) => {
                  const status = normalizeStatus(row.status);
                  const tone = ["completed", "resolved", "closed"].includes(status)
                    ? "green"
                    : ["escalated", "high"].includes(status)
                    ? "orange"
                    : "blue";

                  return (
                    <div className="hubWs-tableRow" key={`${row.activity}-${index}`}>
                      <span className={`hubWs-rowIcon hubWs-rowIcon--${tone}`}>{row.icon}</span>
                      <strong>{row.activity}</strong>
                      <small>{row.partner}</small>
                      <small>{row.time}</small>
                      <StatusPill tone={tone}>{String(row.status || "Open")}</StatusPill>
                    </div>
                  );
                })}
              </div>

              <footer className="hubWs-tableFoot">
                <span>Showing 1 to {recentRows.length} of {Math.max(28, referralItems.length || 28)} activities</span>
                <button type="button" onClick={() => go("/hub/queue")}>View All Activity →</button>
              </footer>
            </article>

            <section className="hubWs-bottomMetrics">
              <article className="hubWs-card hubWs-miniMetric">
                <SectionHead icon="◔" title="Referral Aging" action="View Details →" onClick={() => go("/hub/lifecycle")} />
                <div className="hubWs-donutBlock">
                  <div className="hubWs-donut"><strong>{metrics.totalReferrals}</strong><span>Total Open</span></div>
                  <div className="hubWs-legend">
                    <p><i className="green" />0–7 days <b>28</b><em>48%</em></p>
                    <p><i className="gold" />8–14 days <b>17</b><em>29%</em></p>
                    <p><i className="orange" />15–30 days <b>9</b><em>16%</em></p>
                    <p><i className="red" />30+ days <b>4</b><em>7%</em></p>
                  </div>
                </div>
              </article>

              <article className="hubWs-card hubWs-miniMetric">
                <SectionHead icon="◒" title="Capacity Strain" action="View Details →" onClick={() => go("/hub/leadership")} />
                <div className="hubWs-gaugeBlock">
                  <div className="hubWs-gauge"><strong>2</strong><span>Partners High Strain</span></div>
                  <div className="hubWs-legend">
                    <p><i className="red" />High Strain <b>2</b></p>
                    <p><i className="orange" />Moderate Strain <b>4</b></p>
                    <p><i className="green" />Stable <b>{Math.max(0, metrics.activePartners - 6)}</b></p>
                  </div>
                </div>
              </article>
            </section>
          </section>

          <aside className="hubWs-rightStack">
            <article className="hubWs-card hubWs-sideCard">
              <SectionHead icon="🔔" title="Notifications" action="View All →" onClick={() => go("/hub/queue")} />
              {[
                ["⚠", "Referral review needed", "Referral #R-26471 requires your review.", "10:24 AM", "orange"],
                ["▤", "Consent form missing", "Client consent form is missing for intake #I-1983.", "9:15 AM", "red"],
                ["👥", "Partner update received", `${partnerList[1] || "HopeWorks"} updated service capacity.`, "8:01 AM", "blue"],
                ["★", "Monthly hub summary ready", "Your monthly summary report is ready.", "7:30 AM", "violet"],
              ].map(([icon, title, text, time, tone]) => (
                <div className="hubWs-notice" key={title}>
                  <span className={`hubWs-rowIcon hubWs-rowIcon--${tone}`}>{icon}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                  <small>{time}</small>
                </div>
              ))}
            </article>

            <article className="hubWs-card hubWs-sideCard">
              <SectionHead icon="📅" title="Today's Agenda" action="Open Calendar →" onClick={openShsHome} />
              {[
                ["10:00 AM", "Partner Coordination Huddle", "30 min • Virtual"],
                ["1:00 PM", "Intake Review & Triage", "45 min • Hub Office"],
                ["3:30 PM", "Community Services Roundtable", "60 min • Community Center"],
              ].map(([time, title, note]) => (
                <div className="hubWs-agendaRow" key={title}>
                  <span>{time}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{note}</p>
                  </div>
                </div>
              ))}
            </article>

            <article className="hubWs-card hubWs-sideCard">
              <SectionHead icon="👥" title="Recent Community Activity" action="View All →" onClick={() => go("/hub/leadership")} />
              {[
                ["👥", "New Partner Onboarding", "Completed onboarding for Bright Futures", "100%", "green"],
                ["📈", "Referrals Closed This Month", "Target: 50 • Current: 46", "92%", "blue"],
                ["💙", "Unmet Needs Resolved", "Resolved 18 of 24 unmet needs", "75%", "violet"],
                ["⚠", "Capacity Alerts", "2 partners reporting capacity strain", "2", "orange"],
              ].map(([icon, title, text, stat, tone]) => (
                <div className="hubWs-communityRow" key={title}>
                  <span className={`hubWs-rowIcon hubWs-rowIcon--${tone}`}>{icon}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                  <StatusPill tone={tone}>{stat}</StatusPill>
                </div>
              ))}
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
