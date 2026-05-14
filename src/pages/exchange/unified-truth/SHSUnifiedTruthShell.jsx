import React, { useEffect, useState } from "react";
import TourProvider from "@/system/tour/TourProvider";
import OperatorIdentityBadge from "./components/OperatorIdentityBadge";
import useOperatorIdentity from "./useOperatorIdentity";
import "./shs-unified-truth-shell.css";
import { unifiedTruthCommandTourSteps } from "./unifiedTruthCommandTourSteps";

const SHS_LOGO_SRC = "/assets/branding/shs_orbiter_logo.png";

const navItems = [
  { icon: "⌂", label: "Overview", tone: "blue" },
  { icon: "📥", label: "Intake", tone: "cyan" },
  { icon: "🧩", label: "Aggregation", tone: "cyan" },
  { icon: "🛡", label: "Verification", tone: "green" },
  { icon: "⚖", label: "Reconciliation", tone: "gold" },
  { icon: "🔮", label: "Oracle", tone: "violet" },
  { icon: "✦", label: "Analyst", tone: "violet" },
  { icon: "⚡", label: "Actions", tone: "orange" },
  { icon: "▤", label: "Reports", tone: "blue" },
  { icon: "🔗", label: "Audit Ledger", tone: "green" },
  { icon: "⚙", label: "Settings", tone: "muted" },
];

const headerChips = [
  { icon: "◎", label: "Oracle Active", sub: "All Systems Operational", tone: "green" },
  { icon: "⌘", label: "Verification 91%", sub: "↑ 4% vs 7d", tone: "blue" },
  { icon: "◇", label: "Contradictions 3 Open", sub: "↓ 1 vs 7d", tone: "orange" },
  { icon: "✦", label: "Reporting Readiness High", sub: "↑ 5% vs 7d", tone: "green" },
  { icon: "↻", label: "Ledger Sync Live", sub: "Last sync 1m ago", tone: "teal" },
];

const kpis = [
  {
    icon: "👥",
    label: "People Served",
    value: "582,417",
    delta: "↑ 6.3%",
    sub: "Evidence-backed",
    tone: "blue",
  },
  {
    icon: "🛡",
    label: "Verified Outcomes",
    value: "312,894",
    delta: "↑ 8.7%",
    sub: "Evidence-backed",
    tone: "blue",
  },
  {
    icon: "▦",
    label: "Programs Active",
    value: "147",
    delta: "↑ 3",
    sub: "Institutional score",
    tone: "violet",
  },
  {
    icon: "$",
    label: "Funding Deployed",
    value: "$128.7M",
    delta: "↑ 9.4%",
    sub: "Audited & evidence-linked",
    tone: "gold",
  },
  {
    icon: "⚠",
    label: "Risk Alerts",
    value: "7",
    delta: "↑ 1",
    sub: "Requires review",
    tone: "orange",
  },
  {
    icon: "✦",
    label: "Grant Readiness",
    value: "91%",
    delta: "↑ 6%",
    sub: "Institutional score",
    tone: "green",
  },
];

const queueItems = [
  { icon: "▣", label: "Incoming Cases", value: "128", meta: "Newest 10:37 AM", tone: "blue" },
  { icon: "⚑", label: "Flagged Entities", value: "23", meta: "High Risk Review", tone: "orange" },
  { icon: "⌕", label: "Pending Verification", value: "84", meta: "Oldest 2d 14h", tone: "gold" },
  { icon: "⊗", label: "Unresolved Contradictions", value: "3", meta: "Critical Review", tone: "violet" },
  { icon: "☑", label: "Priority Actions", value: "11", meta: "Due Today 4", tone: "teal" },
];

const actions = [
  {
    icon: "📁",
    title: "Request Case Packet",
    body: "Assemble evidence packet for selected program or case.",
    risk: "Low",
    confidence: "92%",
    result: "More Evidence",
    requirement: "Analyst",
    tone: "green",
  },
  {
    icon: "🛡",
    title: "Escalate Provider Verification",
    body: "Route entity or program for enhanced verification.",
    risk: "Moderate",
    confidence: "87%",
    result: "Verify Entity",
    requirement: "Compliance",
    tone: "gold",
  },
  {
    icon: "🔁",
    title: "Trigger Follow-up Review",
    body: "Schedule follow-up on high-risk or high-impact findings.",
    risk: "Moderate",
    confidence: "85%",
    result: "Resolve Gaps",
    requirement: "Analyst",
    tone: "orange",
  },
  {
    icon: "📄",
    title: "Release Board Brief",
    body: "Compile executive summary for board-aligned review.",
    risk: "Low",
    confidence: "93%",
    result: "Board Aligned",
    requirement: "Executive",
    tone: "blue",
  },
];

const reports = [
  {
    icon: "⚖",
    title: "Executive Decision Brief",
    body: "Strategic summary for leadership decisions",
    status: "Ready",
    tone: "green",
  },
  {
    icon: "🏛",
    title: "Institutional Report",
    body: "Comprehensive program and impact report",
    status: "Ready",
    tone: "green",
  },
  {
    icon: "✍",
    title: "Grant Narrative",
    body: "Funder-ready narrative and outcomes",
    status: "Ready",
    tone: "green",
  },
  {
    icon: "🌐",
    title: "Public-safe Snapshot",
    body: "Redacted metrics for public distribution",
    status: "Caution",
    tone: "gold",
  },
  {
    icon: "</>",
    title: "Technical Appendix",
    body: "Methodology, data models, validation",
    status: "Caution",
    tone: "gold",
  },
  {
    icon: "+",
    title: "Custom Report",
    body: "Build a tailored report",
    status: "Build",
    tone: "muted",
  },
];

function SlimRail() {
  return (
    <aside className="utc-rail" data-tour="utc-rail">
      <CommandOverviewHardNavigationGuard />
      <CommandShellOverviewNavigationGuard />
      <div className="utc-rail__mark">
        <img src={SHS_LOGO_SRC} alt="Silicon Heartland Solutions" />
      </div>

      <nav className="utc-rail__nav" aria-label="SHS command navigation">
        {navItems.map((item, index) => (
          <button
            key={item.label}
            className={`utc-rail__item utc-glow--${item.tone} ${index === 0 ? "is-active" : ""}`}
            type="button"
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Header() {
  const operatorIdentity = useOperatorIdentity();

  return (
    <>
      <header className="utc-header" data-tour="utc-header">
      <div className="utc-header__brand">
        <h1>Silicon Heartland Solutions</h1>
        <p>Command Center</p>
      </div>

      <div className="utc-header__chips">
        {headerChips.map((chip) => (
          <article className={`utc-header-chip utc-glow--${chip.tone}`} key={chip.label}>
            <span>{chip.icon}</span>
            <div>
              <strong>{chip.label}</strong>
              <small>{chip.sub}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="utc-header__controls">
        <button className="utc-publication-mode" type="button">
          <span>Publication Mode</span>
          <strong>Internal Full Fidelity⌄</strong>
        </button>

        <button className="utc-export" type="button">
          Export⌄
        </button>

        <OperatorIdentityBadge operator={operatorIdentity} />
      </div>
    </header>
    </>);
}

function KpiStrip() {
  return (
    <section className="utc-kpis" aria-label="SHS command KPIs" data-tour="utc-kpis">
      {kpis.map((kpi) => (
        <article className={`utc-kpi utc-glow--${kpi.tone}`} key={kpi.label}>
          <div className="utc-kpi__top">
            <span className="utc-kpi__icon">{kpi.icon}</span>
            <div className="utc-kpi__label">{kpi.label}</div>
          </div>

          <div className="utc-kpi__body">
            <div>
              <strong>{kpi.value}</strong>
              <small>{kpi.sub}</small>
            </div>
            <span className="utc-kpi__delta">{kpi.delta}</span>
          </div>

          <svg className="utc-kpi__sparkline" viewBox="0 0 96 36" aria-hidden="true">
            <polyline points="4,28 18,24 30,26 42,19 54,22 66,13 78,17 92,6" />
          </svg>
        </article>
      ))}
    </section>
  );
}

function IntakeQueue() {
  return (
    <aside className="utc-card utc-intake" data-tour="utc-intake">
      <div className="utc-card__head">
        <h2>Operational Intake / Queue</h2>
        <button type="button">⌁</button>
      </div>

      <div className="utc-intake__list">
        {queueItems.map((item) => (
          <article className={`utc-intake__row utc-glow--${item.tone}`} key={item.label}>
            <span className="utc-intake__icon">{item.icon}</span>
            <div>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
            <em>{item.meta}</em>
          </article>
        ))}
      </div>

      <button className="utc-wide-btn" type="button">View Full Queue →</button>
    </aside>
  );
}

function OhioMap() {
  const nodes = [
    ["blue", 14, 33], ["blue", 24, 45], ["gold", 34, 38], ["blue", 49, 35],
    ["gold", 61, 50], ["blue", 72, 38], ["gold", 82, 47], ["blue", 18, 61],
    ["gold", 32, 70], ["gold", 50, 56], ["blue", 66, 66], ["blue", 76, 70],
    ["gold", 44, 82], ["blue", 58, 82], ["blue", 28, 84], ["gold", 86, 80],
  ];

  return (
    <main className="utc-card utc-map" data-tour="utc-map">
      <div className="utc-map__top">
        <div>
          <h2>Ohio Statewide Intelligence Map</h2>
          <p>
            <span>Impact Intensity</span>
            <b>Low</b>
            <i />
            <b>High</b>
            <span>High Impact</span>
            <span>Active Programs</span>
            <span>AI-Risk</span>
            <span>Data Gap</span>
          </p>
        </div>

        <div className="utc-map__tools">
          <button type="button">Layers⌄</button>
          <button type="button">↗</button>
        </div>
      </div>

      <div className="utc-map__canvas">
        <div className="utc-ohio-shape">
          <div className="utc-county-grid" />

          {nodes.map(([tone, x, y], index) => (
            <span
              key={index}
              className={`utc-node utc-node--${tone}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}

          <div className="utc-franklin">
            <span />
            <strong>FRANKLIN</strong>
          </div>

          <article className="utc-county-popup">
            <button type="button">×</button>
            <h3>Franklin County</h3>
            <p>High Impact</p>

            <dl>
              <div><dt>Programs Active</dt><dd>18</dd></div>
              <div><dt>People Served</dt><dd>85,429</dd></div>
              <div><dt>Verified Outcomes</dt><dd>46,231</dd></div>
              <div><dt>Funding Deployed</dt><dd>$18.6M</dd></div>
              <div><dt>Readiness</dt><dd>High</dd></div>
              <div><dt>Risk Posture</dt><dd>Moderate</dd></div>
            </dl>

            <footer>View County Dossier →</footer>
          </article>
        </div>
      </div>
    </main>
  );
}

function OraclePanel() {
  return (
    <aside className="utc-side-stack" data-tour="utc-oracle">
      <section className="utc-card utc-oracle-panel">
        <div className="utc-panel-title utc-glow--gold">
          <span>🔮</span>
          <h2>Oracle Truth Package</h2>
          <b>91%</b>
        </div>

        <div className="utc-oracle-grid">
          <div><span>Contradictions</span><strong>3 Open</strong></div>
          <div><span>Audit Integrity</span><strong>98%</strong></div>
          <div><span>Readiness Judgment</span><strong>High</strong></div>
          <div><span>Source Coverage</span><strong>92%</strong></div>
          <div><span>Publication Safety</span><strong>High</strong></div>
          <div><span>Verification Status</span><strong>Verified</strong></div>
        </div>

        <p className="utc-oracle-copy">
          Strong source coverage with minor data gaps. Low impact contradictions are under review.
        </p>

        <button className="utc-wide-btn" type="button">View Package →</button>
      </section>

      <section className="utc-card utc-analyst-panel">
        <div className="utc-panel-title utc-glow--violet">
          <span>✦</span>
          <h2>AI Analyst Narrative</h2>
          <b>88%</b>
        </div>

        <p>
          Ohio statewide impact continues to strengthen with measurable outcomes across core service areas.
          Franklin, Cuyahoga, and Hamilton counties drive the highest verified outcomes and funding efficiency.
        </p>

        <button className="utc-panel-btn" type="button">View Full Narrative →</button>
      </section>

      <section className="utc-card utc-trust-panel">
        <div className="utc-panel-title utc-glow--blue">
          <span>🛡</span>
          <h2>Trust & Verification</h2>
          <b>91%</b>
        </div>

        <div className="utc-trust-metrics">
          <div><span>Evidence Depth</span><strong>High</strong></div>
          <div><span>Source Diversity</span><strong>High</strong></div>
          <div><span>Recency</span><strong>High</strong></div>
          <div><span>Completeness</span><strong>High</strong></div>
        </div>

        <div className="utc-verification-bar">
          <span />
        </div>
      </section>
    </aside>
  );
}


function saveCommandActionEvent(action) {
  if (typeof window === "undefined") return null;

  const event = {
    id: `command-action-${Date.now()}`,
    createdAt: new Date().toISOString(),
    source: "shs-command-surface",
    status: "confirmed",
    ...action,
  };

  const current = JSON.parse(localStorage.getItem("shs.commandActionEvents") || "[]");
  const next = [event, ...current].slice(0, 50);

  localStorage.setItem("shs.commandActionEvents", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("shsCommandActionEvent:created", { detail: event }));

  return event;
}

function ActionConfirmationModal({ action, onCancel, onConfirm }) {
  if (!action) return null;

  return (
    <div className="shsActionConfirmOverlay" role="presentation">
      <section className="shsActionConfirmModal" role="dialog" aria-modal="true" aria-label="Confirm command action">
        <div className="shsActionConfirmModal__header">
          <span>{action.icon || "⚡"}</span>
          <div>
            <strong>Confirm Command Action</strong>
            <small>{action.title}</small>
          </div>
        </div>

        <p>{action.body || "Confirm that this operator action should be logged into the SHS command workflow."}</p>

        <div className="shsActionConfirmModal__meta">
          <div><span>Risk</span><b>{action.risk || "Normal"}</b></div>
          <div><span>Confidence</span><b>{action.confidence || "N/A"}</b></div>
          <div><span>Requirement</span><b>{action.requirement || "Operator"}</b></div>
          <div><span>Expected Result</span><b>{action.result || "Action logged"}</b></div>
        </div>

        <div className="shsActionConfirmModal__footer">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={() => onConfirm(action)}>Log Action</button>
        </div>
      </section>
    </div>
  );
}



function readCommandActionEvents() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("shs.commandActionEvents");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatCommandActivityTime(value) {
  if (!value) return "Just now";

  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}


function isCommandActionLogged(events = [], title = "") {
  const target = String(title || "").trim().toLowerCase();

  if (!target) return false;

  return events.some((event) => {
    const eventTitle = String(event?.title || "").trim().toLowerCase();
    return eventTitle === target;
  });
}


function RecentCommandActivity() {
  const [events, setEvents] = useState(() => readCommandActionEvents());

  useEffect(() => {
    function syncEvents(event) {
      if (event?.detail) {
        setEvents(readCommandActionEvents());
        return;
      }

      setEvents(readCommandActionEvents());
    }

    window.addEventListener("storage", syncEvents);
    window.addEventListener("shsCommandActionEvent:created", syncEvents);

    const timer = window.setInterval(syncEvents, 1200);

    return () => {
      window.removeEventListener("storage", syncEvents);
      window.removeEventListener("shsCommandActionEvent:created", syncEvents);
      window.clearInterval(timer);
    };
  }, []);

  const recentEvents = events.slice(0, 5);

  return (
    <section className="shsRecentCommandActivity" aria-label="Recent command activity" data-tour="utc-activity">
      <div className="shsRecentCommandActivity__head">
        <span>◷</span>
        <div>
          <strong>Recent Command Activity</strong>
          <small>Confirmed operator actions from this command workflow</small>
        </div>
      </div>

      {recentEvents.length ? (
        <div className="shsRecentCommandActivity__list">
          {recentEvents.map((event) => (
            <article className="shsRecentCommandActivity__row" key={event.id}>
              <span>{event.icon || "✓"}</span>

              <div>
                <strong>{event.title || "Command action logged"}</strong>
                <small>
                  {event.type || "recommended_action"} · {event.status || "confirmed"} · {formatCommandActivityTime(event.createdAt)}
                </small>
              </div>

              <b>{event.confidence || "Logged"}</b>
            </article>
          ))}
        </div>
      ) : (
        <div className="shsRecentCommandActivity__empty">
          <strong>No command actions logged yet.</strong>
          <small>Confirmed actions will appear here after the operator logs them.</small>
        </div>
      )}
    </section>
  );
}


function ActionRail() {
  const [pendingAction, setPendingAction] = useState(null);
  const [lastLoggedAction, setLastLoggedAction] = useState(null);
  const [loggedActionEvents, setLoggedActionEvents] = useState(() => readCommandActionEvents());

  useEffect(() => {
    function syncLoggedActionEvents() {
      setLoggedActionEvents(readCommandActionEvents());
    }

    window.addEventListener("storage", syncLoggedActionEvents);
    window.addEventListener("shsCommandActionEvent:created", syncLoggedActionEvents);

    const timer = window.setInterval(syncLoggedActionEvents, 1200);

    return () => {
      window.removeEventListener("storage", syncLoggedActionEvents);
      window.removeEventListener("shsCommandActionEvent:created", syncLoggedActionEvents);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!lastLoggedAction) return undefined;

    const lastLoggedActionAutoDismissTimer = window.setTimeout(() => {
      setLastLoggedAction(null);
    }, 3200);

    return () => {
      window.clearTimeout(lastLoggedActionAutoDismissTimer);
    };
  }, [lastLoggedAction]);

  function handleConfirmAction(action) {
    const saved = saveCommandActionEvent({
      type: "recommended_action",
      title: action.title,
      body: action.body,
      icon: action.icon,
      tone: action.tone,
      risk: action.risk,
      confidence: action.confidence,
      result: action.result,
      requirement: action.requirement,
    });

    setLastLoggedAction(saved);
    setLoggedActionEvents(readCommandActionEvents());
    setPendingAction(null);
  }

  return (
    <section className="utc-actions" data-tour="utc-actions">
      <div className="utc-section-title">
        <span>✦</span>
        <h2>Recommended Next Actions</h2>
        <button type="button">View All Actions →</button>
      </div>

      {lastLoggedAction && (
        <div className="shsActionLoggedToast" role="status" key={lastLoggedAction.id}>
          <span>✓</span>
          <strong>Action Logged:</strong>
          <small>{lastLoggedAction.title}</small>
        </div>
      )}

      <div className="utc-actions__grid">
        {actions.map((action) => {
          const actionLogged = isCommandActionLogged(loggedActionEvents, action.title);

          return (
            <article
              className={`utc-action utc-glow--${action.tone} ${actionLogged ? "is-action-logged" : ""}`}
              key={action.title}
            >
              <span className="utc-action__icon">{action.icon}</span>

              <div className="utc-action__body">
                <div className="utc-action__titleRow">
                  <strong>{action.title}</strong>
                  {actionLogged && <em>Logged</em>}
                </div>

                <p>{action.body}</p>

                <dl>
                  <div><dt>Risk</dt><dd>{action.risk}</dd></div>
                  <div><dt>Confidence</dt><dd>{action.confidence}</dd></div>
                  <div><dt>Expected Result</dt><dd>{actionLogged ? "In Progress" : action.result}</dd></div>
                  <div><dt>Requirement</dt><dd>{action.requirement}</dd></div>
                </dl>
              </div>

              <button
                type="button"
                aria-label={actionLogged ? `Action logged: ${action.title}` : `Log action: ${action.title}`}
                onClick={() => setPendingAction(action)}
              >
                {actionLogged ? "✓" : "→"}
              </button>
            </article>
          );
        })}
      </div>

      <CommandContextGuidanceDrawer />

      <RecentCommandActivity />

      <ActionConfirmationModal
        action={pendingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
    </section>
  );
}

function ReportingDock() {
  return (
    <section className="utc-reporting" data-tour="utc-reporting">
      <div className="utc-section-title">
        <span>▤</span>
        <h2>Reporting Dock</h2>
      </div>

      <div className="utc-reporting__grid">
        {reports.map((report) => (
          <article className={`utc-report utc-glow--${report.tone}`} key={report.title}>
            <span>{report.icon}</span>
            <div>
              <strong>{report.title}</strong>
              <p>{report.body}</p>
            </div>
            <em>{report.status}</em>
          </article>
        ))}
      </div>
    </section>
  );
}



function goToWorkspaceDashboardOverview() {
  if (typeof window === "undefined") return;

  localStorage.setItem("shs.dashboard.activePanel", "Overview");
  window.dispatchEvent(new CustomEvent("shsDash:panelChange", { detail: "Overview" }));
  window.location.hash = "/exchange/dashboard";
}


function openWorkspaceDashboardOverview(event) {
  if (event) {
    event.preventDefault?.();
    event.stopPropagation?.();
  }

  if (typeof window === "undefined") return;

  localStorage.setItem("shs.dashboard.activePanel", "Overview");
  window.dispatchEvent(new CustomEvent("shsDash:panelChange", { detail: "Overview" }));
  window.location.hash = "/exchange/dashboard";
}

function readCommandContext() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("shs.commandContext");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function CommandContextBanner() {
  const [context, setContext] = useState(() => readCommandContext());

  useEffect(() => {
    function handleStorage() {
      setContext(readCommandContext());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("shsCommandContext:update", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("shsCommandContext:update", handleStorage);
    };
  }, []);

  if (!context) return null;

  function clearContext() {
    localStorage.removeItem("shs.commandContext");
    setContext(null);
  }

  function returnToDashboard() {
    window.location.hash = "/exchange/dashboard";
  }

  return (
    <section className="shsCommandContextBanner" aria-label="Command context" data-tour="utc-context-banner">
      <div className="shsCommandContextBanner__icon">⚠</div>

      <div className="shsCommandContextBanner__body">
        <div className="shsCommandContextBanner__eyebrow">
          Command Context · Opened from Workspace Dashboard
        </div>

        <h2>{context.title || "Command Context"}</h2>

        <p>
          <strong>{context.county || "Systemwide"}</strong>
          <span>•</span>
          <strong>Priority {context.priority || "Normal"}</strong>
        </p>

        {context.summary && <small>{context.summary}</small>}

        {context.recommendedAction && (
          <div className="shsCommandContextBanner__recommendation">
            Recommended Action: {context.recommendedAction}
          </div>
        )}
      </div>

      <div className="shsCommandContextBanner__actions">
        <button type="button" onClick={returnToDashboard}>
          Return to Dashboard
        </button>

        <button type="button" onClick={clearContext}>
          Clear Context
        </button>
      </div>
    </section>
  );
}



function getCommandReaction(context) {
  if (!context) return null;

  if (context.kind === "contradiction_review") {
    return {
      tone: "orange",
      title: "Guided Reaction: Contradiction Review",
      summary: "The system is focusing the operator on contradiction state, Oracle truth package, and Franklin County review.",
      steps: [
        "Review Oracle Truth Package",
        "Inspect contradiction status",
        "Open Franklin County dossier",
        "Trigger follow-up review if evidence is incomplete",
      ],
      highlightTerms: [
        "Contradictions",
        "Oracle Truth Package",
        "Franklin County",
        "Recommended Next Actions",
        "Trigger Follow-up Review",
      ],
    };
  }

  if (context.kind === "report_ready") {
    return {
      tone: "green",
      title: "Guided Reaction: Report Ready",
      summary: "The system is focusing the operator on reporting readiness, reporting dock, and export review.",
      steps: [
        "Review reporting readiness",
        "Open reporting dock",
        "Confirm export package",
        "Release board or executive brief",
      ],
      highlightTerms: [
        "Reporting",
        "Reporting Dock",
        "Grant Readiness",
        "Release Board Brief",
        "Reports",
      ],
    };
  }

  if (context.kind === "verification_followup") {
    return {
      tone: "blue",
      title: "Guided Reaction: Verification Follow-up",
      summary: "The system is focusing the operator on verification state, source coverage, and evidence review.",
      steps: [
        "Review verification state",
        "Check source coverage",
        "Inspect pending verification queue",
        "Escalate provider verification if needed",
      ],
      highlightTerms: [
        "Verification",
        "Trust & Verification",
        "Pending Verification",
        "Source Coverage",
        "Escalate Provider Verification",
      ],
    };
  }

  return {
    tone: "neutral",
    title: "Guided Reaction: Command Context",
    summary: "The Command Surface is reacting to workspace context.",
    steps: [context.recommendedAction || "Review command context"],
    highlightTerms: [],
  };
}


function findCommandNodeByText(terms = []) {
  if (typeof document === "undefined") return null;

  const selectors = [
    "section",
    "article",
    "button",
    "[class*='card']",
    "[class*='Card']",
    "[class*='panel']",
    "[class*='Panel']",
    "[class*='map']",
    "[class*='Map']",
  ].join(",");

  const nodes = Array.from(document.querySelectorAll(selectors));

  return nodes.find((node) => {
    const text = (node.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!text) return false;

    return terms.some((term) => text.includes(String(term).toLowerCase()));
  });
}

function flashCommandTarget(node) {
  if (!node) return;

  document.querySelectorAll(".shsGuidedActionFocus").forEach((item) => {
    item.classList.remove("shsGuidedActionFocus");
  });

  node.classList.add("shsGuidedActionFocus");
  node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

  window.setTimeout(() => {
    node.classList.remove("shsGuidedActionFocus");
  }, 3200);
}


function findGuidedTargetBySelector(selectors = []) {
  if (typeof document === "undefined") return null;

  for (const selector of selectors) {
    const matches = Array.from(document.querySelectorAll(selector));

    const usable = matches.find((node) => {
      if (!node) return false;
      if (
        node.closest(".shsContextGuidanceDrawer") ||
        node.closest(".shsCommandReactionLayer") ||
        node.closest(".shsCommandContextBanner")
      ) {
        return false;
      }

      const rect = node.getBoundingClientRect();
      return rect.width > 20 && rect.height > 20;
    });

    if (usable) return usable;
  }

  return null;
}

function getGuidedActionTarget(step = "") {
  const normalized = String(step || "").toLowerCase();

  if (normalized.includes("oracle")) {
    return findGuidedTargetBySelector([
      ".utc-oracle-panel",
      "[class*='oracle' i]",
      "[class*='Oracle' i]",
    ]);
  }

  if (normalized.includes("contradiction")) {
    return findGuidedTargetBySelector([
      ".utc-intake-card",
      ".utc-intake",
      "[class*='intake' i]",
      "[class*='contradiction' i]",
      "[class*='risk' i]",
    ]);
  }

  if (normalized.includes("franklin") || normalized.includes("dossier")) {
    return findGuidedTargetBySelector([
      ".utc-map",
      ".utc-map-panel",
      "[class*='map' i]",
      "[class*='Map' i]",
    ]);
  }

  if (normalized.includes("follow-up") || normalized.includes("review")) {
    return findGuidedTargetBySelector([
      ".utc-actions",
      ".utc-action",
      "[class*='action' i]",
      "[class*='Action' i]",
    ]);
  }

  if (normalized.includes("report") || normalized.includes("export")) {
    return findGuidedTargetBySelector([
      ".utc-reporting",
      ".utc-report",
      "[class*='report' i]",
      "[class*='Report' i]",
    ]);
  }

  if (normalized.includes("verification")) {
    return findGuidedTargetBySelector([
      ".utc-trust-panel",
      "[class*='verification' i]",
      "[class*='Verification' i]",
      "[class*='trust' i]",
      "[class*='Trust' i]",
    ]);
  }

  return null;
}

function getScrollableParents(node) {
  if (typeof window === "undefined" || !node) return [];

  const parents = [];
  let current = node.parentElement;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const canScroll =
      /(auto|scroll|overlay)/.test(style.overflowY) &&
      current.scrollHeight > current.clientHeight + 8;

    if (canScroll) parents.push(current);
    current = current.parentElement;
  }

  parents.push(document.scrollingElement || document.documentElement);
  return parents;
}

function forceGuidedScrollToTarget(target) {
  if (!target || typeof window === "undefined") return;

  const focusTarget =
    target.closest(".utc-card, .utc-action, .utc-actions, .utc-map, .utc-intake, .utc-reporting, section, article") ||
    target;

  document.querySelectorAll(".shsGuidedActionFocus").forEach((node) => {
    node.classList.remove("shsGuidedActionFocus", "shsGuidedActionFocus--strong");
  });

  focusTarget.classList.add("shsGuidedActionFocus");

  const offset = 118;

  // Native scrollIntoView first.
  try {
    focusTarget.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  } catch {
    // ignored
  }

  // Then force every scrollable parent, including the document.
  const parents = getScrollableParents(focusTarget);

  parents.forEach((parent) => {
    const rect = focusTarget.getBoundingClientRect();

    if (
      parent === document.documentElement ||
      parent === document.body ||
      parent === document.scrollingElement
    ) {
      const top = window.scrollY + rect.top - offset;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });

      return;
    }

    const parentRect = parent.getBoundingClientRect();
    const top = parent.scrollTop + rect.top - parentRect.top - offset;

    parent.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  });

  window.setTimeout(() => {
    focusTarget.classList.add("shsGuidedActionFocus--strong");
  }, 450);

  window.setTimeout(() => {
    focusTarget.classList.remove("shsGuidedActionFocus", "shsGuidedActionFocus--strong");
  }, 4200);
}


function writeGuidedAction(action) {
  if (typeof window === "undefined") return;

  const current = JSON.parse(localStorage.getItem("shs.guidedActions") || "[]");

  const next = [
    {
      id: `guided-${Date.now()}`,
      action,
      createdAt: new Date().toISOString(),
      source: "command-context-reaction-layer",
    },
    ...current,
  ].slice(0, 25);

  localStorage.setItem("shs.guidedActions", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("shsCommandGuidedAction", { detail: next[0] }));
}


function CommandContextReactionLayer() {
  const [context, setContext] = useState(() => readCommandContext());

  useEffect(() => {
    function syncContext() {
      setContext(readCommandContext());
    }

    window.addEventListener("storage", syncContext);
    window.addEventListener("shsCommandContext:update", syncContext);

    const timer = window.setInterval(syncContext, 800);

    return () => {
      window.removeEventListener("storage", syncContext);
      window.removeEventListener("shsCommandContext:update", syncContext);
      window.clearInterval(timer);
    };
  }, []);

  const reaction = getCommandReaction(context);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove(
      "shs-context-mode",
      "shs-context-contradiction-review",
      "shs-context-report-ready",
      "shs-context-verification-followup"
    );

    document.querySelectorAll(".shsContextReactiveTarget").forEach((node) => {
      node.classList.remove("shsContextReactiveTarget");
    });

    if (!context || !reaction) return;

    root.classList.add("shs-context-mode");

    if (context.kind === "contradiction_review") {
      root.classList.add("shs-context-contradiction-review");
    }

    if (context.kind === "report_ready") {
      root.classList.add("shs-context-report-ready");
    }

    if (context.kind === "verification_followup") {
      root.classList.add("shs-context-verification-followup");
    }

    const terms = reaction.highlightTerms || [];
    const candidates = Array.from(
      document.querySelectorAll("section, article, button, .card, [class*='card'], [class*='Card'], [class*='panel'], [class*='Panel']")
    );

    candidates.forEach((node) => {
      if (
        node.closest(".shsCommandReactionLayer") ||
        node.closest(".shsCommandContextBanner")
      ) {
        return;
      }

      const text = (node.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;

      const matched = terms.some((term) =>
        text.toLowerCase().includes(String(term).toLowerCase())
      );

      if (matched) {
        node.classList.add("shsContextReactiveTarget");
      }
    });

    return () => {
      root.classList.remove(
        "shs-context-mode",
        "shs-context-contradiction-review",
        "shs-context-report-ready",
        "shs-context-verification-followup"
      );

      document.querySelectorAll(".shsContextReactiveTarget").forEach((node) => {
        node.classList.remove("shsContextReactiveTarget");
      });
    };
  }, [context, reaction]);

  if (!context || !reaction) return null;

  function handleGuidedStep(step) {
    const normalized = String(step || "").toLowerCase();

    writeGuidedAction({
      step,
      contextKind: context.kind,
      contextTitle: context.title,
      county: context.county,
      priority: context.priority,
    });

    if (normalized.includes("oracle")) {
      flashCommandTarget(findCommandNodeByText(["Oracle Truth Package", "Contradictions", "Readiness Judgment"]));
      return;
    }

    if (normalized.includes("contradiction")) {
      flashCommandTarget(findCommandNodeByText(["Contradictions", "3 Open", "Risk Alerts"]));
      return;
    }

    if (normalized.includes("franklin") || normalized.includes("dossier")) {
      flashCommandTarget(findCommandNodeByText(["Franklin County", "Ohio Statewide Intelligence Map", "View County Dossier"]));
      return;
    }

    if (normalized.includes("follow-up") || normalized.includes("review")) {
      flashCommandTarget(findCommandNodeByText(["Recommended Next Actions", "Trigger Follow-up Review", "Escalate Provider Verification"]));
      return;
    }

    if (normalized.includes("report") || normalized.includes("export")) {
      flashCommandTarget(findCommandNodeByText(["Reporting Dock", "Release Board Brief", "Grant Readiness"]));
      return;
    }

    if (normalized.includes("verification")) {
      flashCommandTarget(findCommandNodeByText(["Trust & Verification", "Pending Verification", "Source Coverage"]));
      return;
    }

    flashCommandTarget(findCommandNodeByText([context.title || "Command Context"]));
  }

  return (
    <section className={`shsCommandReactionLayer is-${reaction.tone}`}>
      <div>
        <span>⚡</span>
        <strong>{reaction.title}</strong>
        <p>{reaction.summary}</p>
      </div>

      <ol>
        {reaction.steps.map((step) => (
          <li key={step}>
            <button type="button" onClick={() => handleGuidedStep(step)}>
              {step}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}



function CommandContextGuidanceDrawer() {
  const [context, setContext] = useState(() => readCommandContext());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function syncContext() {
      setContext(readCommandContext());
    }

    window.addEventListener("storage", syncContext);
    window.addEventListener("shsCommandContext:update", syncContext);

    const timer = window.setInterval(syncContext, 900);

    return () => {
      window.removeEventListener("storage", syncContext);
      window.removeEventListener("shsCommandContext:update", syncContext);
      window.clearInterval(timer);
    };
  }, []);

  const reaction = getCommandReaction(context);

  if (!context || !reaction) return null;

  function clearContext() {
    localStorage.removeItem("shs.commandContext");
    setContext(null);
    setIsOpen(false);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shsCommandContext:update"));
    }
  }

  function returnToDashboard() {
    window.location.hash = "/exchange/dashboard";
  }

  function handleDrawerStep(step) {
    writeGuidedAction({
      step,
      contextKind: context.kind,
      contextTitle: context.title,
      county: context.county,
      priority: context.priority,
    });

    const target = getGuidedActionTarget(step);

    if (target) {
      forceGuidedScrollToTarget(target);
      return;
    }

    flashCommandTarget(findCommandNodeByText([context.title || "Command Context"]));
  }

  return (
    <section className="shsContextGuidanceDrawer" aria-label="Context guidance drawer" data-tour="utc-guidance">
      <button
        className="shsContextGuidanceDrawer__toggle"
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        <span>⚡</span>

        <div>
          <strong>Context Guidance</strong>
          <small>
            {context.title || "Command Context"} · {context.county || "Systemwide"} · Priority {context.priority || "Normal"}
          </small>
        </div>

        <b>{isOpen ? "Collapse" : "Expand"}</b>
      </button>

      {isOpen && (
        <div className="shsContextGuidanceDrawer__body">
          <article className="shsContextGuidanceDrawer__summary">
            <div className="shsContextGuidanceDrawer__eyebrow">
              Opened from Workspace Dashboard
            </div>

            <h3>{reaction.title}</h3>

            <p>{reaction.summary}</p>

            {context.recommendedAction && (
              <small>
                Recommended Action: {context.recommendedAction}
              </small>
            )}
          </article>

          <article className="shsContextGuidanceDrawer__actions">
            <h4>Guided Operator Actions</h4>

            <div>
              {reaction.steps.map((step) => (
                <button
                  type="button"
                  key={step}
                  onClick={() => handleDrawerStep(step)}
                >
                  {step}
                </button>
              ))}
            </div>
          </article>

          <footer className="shsContextGuidanceDrawer__footer">
            <button type="button" onClick={returnToDashboard}>
              Return to Dashboard
            </button>

            <button type="button" onClick={clearContext}>
              Clear Context
            </button>
          </footer>
        </div>
      )}
    </section>
  );
}



function CommandShellOverviewNavigationGuard() {
  useEffect(() => {
    function handleClick(event) {
      const target = event.target?.closest?.("button, a, [role='button'], [aria-label], [title]");
      if (!target) return;

      const textLabel = String(target.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const ariaLabel = String(target.getAttribute?.("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const titleLabel = String(target.getAttribute?.("title") || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const href = String(target.getAttribute?.("href") || "").trim();

      const label = `${textLabel} ${ariaLabel} ${titleLabel}`.trim();

      const isOverview =
        label === "overview" ||
        label.includes("overview") ||
        href === "#/exchange" ||
        href === "#/exchange/command";

      if (!isOverview) return;

      event.preventDefault();
      event.stopPropagation();
      goToWorkspaceDashboardOverview();
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}



function CommandOverviewHardNavigationGuard() {
  React.useEffect(() => {
    function handleCommandOverviewClick(event) {
      const target = event.target?.closest?.("button, a, [role='button']");
      if (!target) return;

      const label = String(target.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const href = String(target.getAttribute?.("href") || "").trim();

      if (label !== "overview" && !href.includes("#/exchange")) return;

      openWorkspaceDashboardOverview(event);
    }

    document.addEventListener("click", handleCommandOverviewClick, true);

    return () => {
      document.removeEventListener("click", handleCommandOverviewClick, true);
    };
  }, []);

  return null;
}


export default function SHSUnifiedTruthShell() {
  return (
    <TourProvider steps={unifiedTruthCommandTourSteps} buttonLabel="Start Tour">
      <div className="utc-shell utc-shell--mockLocked">
      <SlimRail />

      <main className="utc-workspace utc-workspace--command">
        <Header />

        <section className="utc-commandTop" data-tour="utc-command-top">
          <KpiStrip />
          <CommandContextBanner />
        </section>

        <section className="utc-commandTheater" aria-label="SHS command theater" data-tour="utc-theater">
          <div className="utc-commandTheater__left">
            <IntakeQueue />
          </div>

          <div className="utc-commandTheater__map">
            <OhioMap />
          </div>

          <div className="utc-commandTheater__right">
            <OraclePanel />
          </div>
        </section>

        <section className="utc-commandLower" aria-label="Command workflow" data-tour="utc-lower">
          <ActionRail />
          <ReportingDock />
        </section>
      </main>
      </div>
    </TourProvider>
  );
}

