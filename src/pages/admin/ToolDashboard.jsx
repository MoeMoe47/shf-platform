// src/pages/admin/ToolDashboard.jsx
import React from "react";
import {
  mergeAdminAndCivicLogs,
  buildGrantNarrative,
  saveMasterNarrativeToStorage,
} from "@/utils/binderMerge.js";

const ADMIN_LOG_KEY = "shf.adminToolLogs.v1";
const CIVIC_LOG_KEY = "shf.civicMissionLogs.v1";

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) || typeof parsed === "object"
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

/* ---------- Wizard config ---------- */

const FOCUS_OPTIONS = [
  { id: "funding", label: "Funding & Grants", emoji: "💰" },
  { id: "sales", label: "Employers & Sales", emoji: "🤝" },
  { id: "curriculum", label: "Curriculum Build", emoji: "📚" },
  { id: "product", label: "Product & UX", emoji: "🧪" },
  { id: "civic", label: "Civic & Student Voice", emoji: "🏛" },
];

const GOAL_MAP = {
  funding: [
    {
      id: "grant-paragraph",
      label: "Draft a grant narrative paragraph",
      fundingTags: ["Perkins V", "WIOA", "ESSA Title IV"],
      tools: [
        { label: "AI Tool Workflow", href: "/admin.html#/tool-dashboard" },
        { label: "Grant Binder", href: "/admin.html#/binder" },
        { label: "Master Narrative", href: "/admin.html#/master-narrative" },
      ],
      steps: [
        "Open AI Tool Workflow and log your grant-related AI session under ‘Funding & grants’.",
        "Use Grant Binder to assemble bullets from programs and civic missions.",
        "Open Master Narrative and copy the paragraph into your grant portal.",
      ],
    },
    {
      id: "perkins-story",
      label: "Update Perkins / WIOA impact story",
      fundingTags: ["Perkins V", "WIOA"],
      tools: [
        { label: "AI Tool Workflow", href: "/admin.html#/tool-dashboard" },
        { label: "Master Narrative", href: "/admin.html#/master-narrative" },
        { label: "Civic Grant Story", href: "/civic.html#/grant-story" },
      ],
      steps: [
        "Log admin AI sessions tagged as ‘Funding & grants’.",
        "Check Civic Grant Story to see how student missions support your narrative.",
        "Regenerate the Master Narrative, then paste into Perkins / WIOA reports.",
      ],
    },
    {
      id: "medicaid-impact",
      label: "Build a Medicaid / behavioral health impact paragraph",
      fundingTags: ["Medicaid", "IDEA", "WIOA"],
      tools: [
        { label: "AI Tool Workflow", href: "/admin.html#/tool-dashboard" },
        { label: "Grant Binder", href: "/admin.html#/binder" },
        { label: "Master Narrative", href: "/admin.html#/master-narrative" },
      ],
      steps: [
        "Log admin time spent coordinating STNA / CNA / mental health-aligned programs.",
        "Use Grant Binder to pull entries tied to health, recovery, and wraparound supports.",
        "Regenerate the Master Narrative and clip the health / wraparound paragraph into your Medicaid justification.",
      ],
    },
  ],
  sales: [
    {
      id: "employer-outreach",
      label: "Prepare employer outreach packet",
      fundingTags: ["WIOA", "Local Workforce Board"],
      tools: [
        { label: "AI Tool Workflow", href: "/admin.html#/tool-dashboard" },
        { label: "Partner Jobs", href: "/admin.html#/partner-jobs" },
        { label: "Placement KPIs", href: "/admin.html#/placement-kpis" },
      ],
      steps: [
        "Log sessions where AI drafts outreach emails or employer one-pagers under ‘Sales & outreach’.",
        "Use Partner Jobs to import or review employer roles and internship slots.",
        "Pull Placement KPIs to show employers your pipeline and outcomes.",
      ],
    },
  ],
  curriculum: [
    {
      id: "new-module",
      label: "Build a new module outline",
      fundingTags: ["Perkins V", "ESSA Title IV"],
      tools: [
        { label: "AI Tool Workflow", href: "/admin.html#/tool-dashboard" },
        { label: "Grant Binder", href: "/admin.html#/binder" },
      ],
      steps: [
        "Log curriculum drafting time as ‘Curriculum build’ whenever you use AI to outline lessons.",
        "Use Grant Binder to connect the module to CTE pathways and target funding streams.",
        "Export your outline and attach it to the grant or curriculum review packet.",
      ],
    },
  ],
  product: [
    {
      id: "ux-review",
      label: "Run a UX copy + layout review",
      fundingTags: ["Perkins V", "Private Philanthropy"],
      tools: [
        { label: "AI Tool Workflow", href: "/admin.html#/tool-dashboard" },
        {
          label: "Solutions / Product notes",
          href: "/solutions.html#/ai-job-compass",
        },
      ],
      steps: [
        "Log any AI sessions where you refine UX, accessibility, or product copy as ‘Product & UX’.",
        "Capture 2–3 screenshots and a one-paragraph summary in the admin logs.",
        "Use those logs to show funders a continuous improvement loop for the SHF platform.",
      ],
    },
  ],
  civic: [
    {
      id: "civic-missions",
      label: "Turn student missions into impact story",
      fundingTags: ["ESSA Title IV", "Civics Grants"],
      tools: [
        { label: "Civic Grant Story", href: "/civic.html#/grant-story" },
        { label: "AI Tool Workflow", href: "/admin.html#/tool-dashboard" },
        { label: "Master Narrative", href: "/admin.html#/master-narrative" },
      ],
      steps: [
        "Have students log missions in Elections, Proposals, Treasury Sim, and Debt Clock using the mission log box.",
        "Sync Civic logs in AI Tool Workflow to regenerate the Master Grant Narrative.",
        "Use Civic Grant Story + Master Narrative in your Title IV / civics narrative sections.",
      ],
    },
  ],
};

function getGoalsForFocus(focusId) {
  return GOAL_MAP[focusId] || [];
}

/* ---------- Multi-app stats from same log spine ---------- */

function computeMultiAppStats(adminLogs, civicLogs) {
  const base = {
    civic: { sessions: 0, minutes: 0 },
    career: { sessions: 0, minutes: 0 },
    curriculum: { sessions: 0, minutes: 0 },
    arcade: { sessions: 0, minutes: 0 },
    adminOther: { sessions: 0, minutes: 0 },
  };

  const add = (key, duration) => {
    if (!base[key]) return;
    base[key].sessions += 1;
    base[key].minutes += Number(duration || 0);
  };

  // Admin logs by app
  if (Array.isArray(adminLogs)) {
    for (const log of adminLogs) {
      const raw =
        (log.appId ||
          log.app ||
          log.appName ||
          log.source ||
          log.category ||
          "") + "";
      const app = raw.toLowerCase();
      let key = "adminOther";
      if (app.includes("civic")) key = "civic";
      else if (app.includes("career")) key = "career";
      else if (app.includes("curriculum")) key = "curriculum";
      else if (app.includes("arcade")) key = "arcade";

      const dur = Number(log.duration || log.minutes || 0) || 0;
      add(key, dur);
    }
  }

  // Civic logs: always count toward civic
  if (Array.isArray(civicLogs)) {
    for (const log of civicLogs) {
      const dur = Number(log.duration || log.minutes || 0) || 0;
      add("civic", dur);
    }
  }

  return base;
}

/* ---------- Component ---------- */

export default function ToolDashboard() {
  const [merged, setMerged] = React.useState(null);
  const [syncStatus, setSyncStatus] = React.useState("idle");
  const [previewLines, setPreviewLines] = React.useState("");

  const [focus, setFocus] = React.useState(null);
  const [goalId, setGoalId] = React.useState(null);

  const [appStats, setAppStats] = React.useState(null);

  React.useEffect(() => {
    // On mount, try to give a quick snapshot based on whatever logs already exist
    try {
      const adminLogs = readJSON(ADMIN_LOG_KEY, []);
      const civicLogs = readJSON(CIVIC_LOG_KEY, []);

      const m = mergeAdminAndCivicLogs(adminLogs, civicLogs);
      setMerged(m);

      const narrative = buildGrantNarrative(m);
      const firstLines = narrative.split("\n").slice(0, 6).join("\n");
      setPreviewLines(firstLines);

      // multi-app analytics from the same logs
      const stats = computeMultiAppStats(adminLogs, civicLogs);
      setAppStats(stats);
    } catch {
      // ignore
    }
  }, []);

  const handleSync = () => {
    setSyncStatus("working");
    try {
      const adminLogs = readJSON(ADMIN_LOG_KEY, []);
      const civicLogs = readJSON(CIVIC_LOG_KEY, []);

      const m = mergeAdminAndCivicLogs(adminLogs, civicLogs);
      const narrative = buildGrantNarrative(m);

      // Total civic minutes for contribution bar on the Civic side
      const civicMinutesTotal = (m.byCategory?.Civic || []).reduce(
        (sum, item) => sum + Number(item.duration || 0),
        0
      );

      saveMasterNarrativeToStorage(narrative, {
        updatedAt: new Date().toISOString().slice(0, 10),
        adminCount: m.adminCount,
        civicCount: m.civicCount,
        totalTimeHours: m.totalTimeHours,
        civicMinutesTotal,
      });

      setMerged(m);
      const firstLines = narrative.split("\n").slice(0, 6).join("\n");
      setPreviewLines(firstLines);
      setSyncStatus("ok");

      // refresh multi-app stats
      const stats = computeMultiAppStats(adminLogs, civicLogs);
      setAppStats(stats);
    } catch (err) {
      console.warn("[ToolDashboard] Sync failed", err);
      setSyncStatus("error");
    }
  };

  const goals = getGoalsForFocus(focus);
  const activeGoal = goals.find((g) => g.id === goalId) || goals[0];

  const adminCount = merged?.adminCount ?? 0;
  const civicCount = merged?.civicCount ?? 0;
  const totalTimeHours = merged?.totalTimeHours ?? 0;

  const renderAppCard = (key, label, emoji) => {
    if (!appStats) return null;
    const stat = appStats[key] || { sessions: 0, minutes: 0 };
    const hasData = stat.sessions > 0 || stat.minutes > 0;

    return (
      <div
        key={key}
        className="card"
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid var(--ring,#e5e7eb)",
          background: hasData ? "#f9fafb" : "#fefefe",
          minWidth: 130,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            fontSize: 13,
          }}
        >
          <span aria-hidden>{emoji}</span>
          <strong>{label}</strong>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>
          Sessions: <strong>{stat.sessions}</strong>
        </div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>
          Minutes: <strong>{stat.minutes}</strong>
        </div>
      </div>
    );
  };

  return (
    <section className="app-main" aria-labelledby="tooldash-title">
      <header className="app-header">
        <div>
          <h1 id="tooldash-title">AI Tool Workflow Cockpit</h1>
          <p className="app-subtitle">
            Log where AI helps across Funding, Employers, Curriculum, Product,
            and Civic. Then turn those logs into a funder-ready Master Grant
            Narrative.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" className="app-ctaBtn" onClick={handleSync}>
            <span className="app-ico">🔄</span>
            <span>Sync with Civic &amp; Update Narrative</span>
          </button>
          {syncStatus === "working" && (
            <span className="sh-badge is-ghost">Syncing…</span>
          )}
          {syncStatus === "ok" && (
            <span className="sh-badge" style={{ background: "#ecfdf5" }}>
              ✅ Narrative updated
            </span>
          )}
          {syncStatus === "error" && (
            <span className="sh-badge" style={{ background: "#fef2f2" }}>
              ⚠️ Sync error
            </span>
          )}
        </div>
      </header>

      <div className="app-grid">
        {/* ---------- Left: "Today I'm working on…" wizard ---------- */}
        <section
          className="card card--pad"
          aria-label="Today I'm working on wizard"
          style={{ display: "grid", gap: 12 }}
        >
          <strong style={{ fontSize: 16 }}>Today I’m working on…</strong>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
            Pick what you’re doing. We’ll show you which tools to open and the
            1-2-3 steps to keep Silicon Heartland in the top 1% for grants and
            outcomes.
          </p>

          {/* Step 1: Focus */}
          <div style={{ marginTop: 4 }}>
            <div
              style={{
                fontSize: 12,
                opacity: 0.8,
                marginBottom: 4,
              }}
            >
              Step 1 — Choose focus
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {FOCUS_OPTIONS.map((opt) => {
                const active = opt.id === focus;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={active ? "sh-btn" : "sh-btn is-ghost"}
                    onClick={() => {
                      setFocus(opt.id);
                      setGoalId(null);
                    }}
                    style={{ fontSize: 13, paddingInline: 10 }}
                  >
                    <span style={{ marginRight: 4 }}>{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Goal */}
          {focus && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.8,
                  marginBottom: 4,
                }}
              >
                Step 2 — Pick a goal
              </div>
              {goals.length === 0 ? (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.75,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px dashed var(--line,#e5e7eb)",
                  }}
                >
                  No presets yet for this focus. Use the Funding presets as a
                  template.
                </div>
              ) : (
                <select
                  className="sh-input"
                  value={activeGoal?.id || ""}
                  onChange={(e) => setGoalId(e.target.value)}
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Step 3: Tools + steps + funding tags */}
          {focus && activeGoal && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.8,
                  marginBottom: 4,
                }}
              >
                Step 3 — Open tools and follow the play
              </div>

              {/* Funding streams */}
              {activeGoal.fundingTags && activeGoal.fundingTags.length > 0 && (
                <div
                  style={{
                    marginBottom: 6,
                    fontSize: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  <span style={{ opacity: 0.8 }}>Funding streams:</span>
                  {activeGoal.fundingTags.map((tag) => (
                    <span
                      key={tag}
                      className="sh-badge is-ghost"
                      style={{ fontSize: 11 }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                {activeGoal.tools.map((t) => (
                  <a
                    key={t.label}
                    href={t.href}
                    className="sh-btn is-ghost"
                    style={{ fontSize: 13, paddingInline: 10 }}
                  >
                    {t.label} →
                  </a>
                ))}
              </div>

              <ol style={{ paddingLeft: 18, fontSize: 13, margin: 0 }}>
                {activeGoal.steps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!focus && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                opacity: 0.7,
              }}
            >
              Hint: Start with <strong>Funding &amp; Grants</strong> when
              you’re writing Perkins, WIOA, ESSA, or Medicaid narratives.
            </div>
          )}
        </section>

        {/* ---------- Right: Usage snapshot + narrative preview ---------- */}
        <section
          className="card card--pad"
          aria-label="AI usage snapshot"
          style={{ display: "grid", gap: 10 }}
        >
          <strong style={{ fontSize: 16 }}>AI usage snapshot</strong>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 13,
            }}
          >
            <span className="sh-badge">
              Admin sessions: <strong>{adminCount}</strong>
            </span>
            <span className="sh-badge is-ghost">
              Civic missions: <strong>{civicCount}</strong>
            </span>
            <span className="sh-badge">
              Time saved: <strong>{totalTimeHours.toFixed(1)} hrs</strong>
            </span>
          </div>

          {/* Multi-app analytics deck */}
          {appStats && (
            <div style={{ marginTop: 4 }}>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.8,
                  marginBottom: 4,
                }}
              >
                Usage by app (sessions &amp; minutes)
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {renderAppCard("civic", "Civic", "🏛")}
                {renderAppCard("career", "Career", "💼")}
                {renderAppCard("curriculum", "Curriculum", "📚")}
                {renderAppCard("arcade", "Arcade", "🎮")}
                {renderAppCard("adminOther", "Admin (other)", "🛠️")}
              </div>
            </div>
          )}

          <div style={{ fontSize: 12, opacity: 0.8 }}>
            These numbers come from two log streams:
            <ul style={{ paddingLeft: 16, marginTop: 4, marginBottom: 4 }}>
              <li>Admin Tool Dashboard logs (internal work)</li>
              <li>
                Civic Mission logs (student missions in Elections, Proposals,
                Treasury, Debt Clock)
              </li>
            </ul>
            When you hit{" "}
            <strong>Sync with Civic &amp; Update Narrative</strong>, the system
            merges both into a single Master Grant Narrative stored in the
            binder.
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginBottom: 4,
              }}
            >
              Narrative preview (first lines)
            </div>
            <pre
              style={{
                maxHeight: 200,
                overflow: "auto",
                background: "#0b1120",
                color: "#e5e7eb",
                padding: 10,
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.4,
                whiteSpace: "pre-wrap",
              }}
            >
              {previewLines ||
                "No narrative yet. Click “Sync with Civic & Update Narrative” once you have a few admin logs and civic missions."}
            </pre>
          </div>

          <div style={{ fontSize: 11, opacity: 0.7 }}>
            Tip: After syncing, open{" "}
            <a href="/admin.html#/master-narrative">Grant Narrative</a> in Admin
            and <a href="/civic.html#/grant-story">Grant Story</a> in Civic.
            Those two screens become your funder-facing “AI + impact” proof.
          </div>
        </section>
      </div>
    </section>
  );
}
