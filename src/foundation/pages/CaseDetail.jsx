import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const ORACLE_BASE = "http://127.0.0.1:8091";

const pageStyle = {
  minHeight: "100vh",
  background: "#f6f1e9",
  color: "#3f2d1d",
  padding: "28px 22px 40px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle = {
  maxWidth: 1360,
  margin: "0 auto",
  display: "grid",
  gap: 18,
};

const cardStyle = {
  borderRadius: 24,
  border: "1px solid rgba(165,132,97,0.14)",
  background: "rgba(255,255,255,0.68)",
  padding: 22,
  boxShadow: "0 12px 30px rgba(81,58,36,0.06)",
};

const buttonStyle = {
  height: 46,
  padding: "0 18px",
  borderRadius: 14,
  border: "1px solid rgba(160,129,96,0.18)",
  background: "rgba(255,255,255,0.85)",
  color: "#6b4a2b",
  fontWeight: 700,
  cursor: "pointer",
};

const actionButtonStyle = {
  height: 44,
  padding: "0 16px",
  borderRadius: 12,
  border: "1px solid rgba(16,185,129,0.35)",
  background: "rgba(16,185,129,0.12)",
  color: "#065f46",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
};

function titleCase(value = "") {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function entityToCounty(entityId = "") {
  if (entityId === "test_case_001") return "Franklin";
  if (entityId === "test_case_002") return "Cuyahoga";
  if (entityId === "test_case_003") return "Hamilton";
  return "Unknown";
}

function entityToProgram(entityId = "") {
  if (entityId === "test_case_001") return "Career Launchpad";
  if (entityId === "test_case_002") return "Recovery Housing Pilot";
  if (entityId === "test_case_003") return "Barber Licensure Pathway";
  return "Unassigned";
}

function entityToStage(entityId = "", readinessStatus = "") {
  if (readinessStatus === "leadership_ready") return "Leadership Ready";
  if (readinessStatus === "not_ready") return "Not Ready";
  if (entityId === "test_case_001") return "Execution Ready";
  if (entityId === "test_case_002") return "Verification Gap";
  if (entityId === "test_case_003") return "Conflict Review";
  return "Intake";
}

function getRiskSignal(item) {
  if (!item) {
    return {
      label: "Unknown",
      color: "#6b7280",
      bg: "rgba(107,114,128,0.08)",
      border: "rgba(107,114,128,0.18)",
    };
  }

  const readiness = item?.readinessStatus || "unknown";
  const confidence = Number(item?.confidenceScore ?? 0);

  if (readiness === "blocked" || confidence < 60) {
    return {
      label: "High Risk",
      color: "#991b1b",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.20)",
    };
  }

  if (readiness === "not_ready" || confidence < 85) {
    return {
      label: "Medium Risk",
      color: "#92400e",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.20)",
    };
  }

  return {
    label: "Low Risk",
    color: "#065f46",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.20)",
  };
}

async function fetchTruth(entityId) {
  const res = await fetch(`${ORACLE_BASE}/oracle/truth/${encodeURIComponent(entityId)}`);
  if (!res.ok) throw new Error(`Truth fetch failed: ${res.status}`);
  return res.json();
}

async function fetchPriority(entityId) {
  const res = await fetch(
    `${ORACLE_BASE}/oracle/priority?ids=${encodeURIComponent(entityId)},test_case_002`
  );
  if (!res.ok) throw new Error(`Priority fetch failed: ${res.status}`);
  return res.json();
}

async function fetchActions() {
  const res = await fetch(`${ORACLE_BASE}/oracle/actions`);
  if (!res.ok) throw new Error(`Actions fetch failed: ${res.status}`);
  const data = await res.json();
  return data.actions || [];
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(90,67,45,0.68)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(16,185,129,0.22)",
        background: "rgba(16,185,129,0.08)",
        color: "#065f46",
        fontWeight: 800,
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function StatusStrip({ text, loading }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        background: loading ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
        border: loading
          ? "1px solid rgba(245,158,11,0.35)"
          : "1px solid rgba(16,185,129,0.35)",
        fontWeight: 700,
        color: loading ? "#92400e" : "#065f46",
      }}
    >
      {text}
    </div>
  );
}

function SimpleDataCard({ title, rows }) {
  return (
    <div style={cardStyle}>
      <SectionLabel>{title}</SectionLabel>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((row, idx) => (
          <div key={idx} style={{ color: "#4b3624" }}>
            <strong>{row.label}:</strong> {row.value}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineCard({ timeline }) {
  const items = timeline?.visible || [];
  const hiddenCount = timeline?.hiddenCount || 0;

  return (
    <div style={cardStyle}>
      <SectionLabel>Case Timeline</SectionLabel>
      <div style={{ display: "grid", gap: 12 }}>
        {items.length ? (
          items.map((e, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                border: "1px solid rgba(165,132,97,0.14)",
                borderRadius: 16,
                background: "rgba(255,255,255,0.78)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                {e.title}
              </div>
              <div style={{ marginBottom: 6 }}>{e.detail}</div>
              {e.repeatCount && e.repeatCount > 1 ? (
                <div style={{ fontSize: 12, color: "#92400e", marginBottom: 6 }}>
                  repeated x{e.repeatCount}
                </div>
              ) : null}
              <small>{e.time ? new Date(e.time).toLocaleString() : "—"}</small>
            </div>
          ))
        ) : (
          <div>No events yet.</div>
        )}

        {hiddenCount > 0 ? (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.22)",
              color: "#92400e",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {hiddenCount} older backlog events hidden to keep the timeline readable.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CrossCaseCommandStrip({ priorityState, currentPriority, safeEntityId }) {
  const [rankPulse, setRankPulse] = useState(false);
  const lastRankRef = useRef(currentPriority?.rank ?? "—");

  const summary = useMemo(() => {
    const ranked = priorityState?.ranked || [];
    const currentIndex = ranked.findIndex((c) => c.entityId === safeEntityId);

    const previousCase =
      currentIndex > 0
        ? ranked[currentIndex - 1]?.entityId || null
        : ranked.length
        ? ranked[ranked.length - 1]?.entityId || null
        : null;

    const nextCase =
      currentIndex >= 0 && ranked.length
        ? ranked[(currentIndex + 1) % ranked.length]?.entityId || null
        : null;

    return {
      executionMode: ranked.filter((c) => c.readinessStatus === "leadership_ready").length,
      blocked: ranked.filter((c) => c.readinessStatus === "blocked").length,
      verificationHold: ranked.filter((c) => c.readinessStatus === "not_ready").length,
      internallyReady: ranked.filter((c) => c.readinessStatus === "internally_ready").length,
      topPriority: ranked[0]?.entityId || "—",
      currentRank: currentPriority?.rank ?? "—",
      currentScore: currentPriority?.priorityScore ?? "—",
      total: ranked.length,
      previousCase,
      nextCase,
      risk: getRiskSignal(currentPriority),
    };
  }, [priorityState, currentPriority, safeEntityId]);

  useEffect(() => {
    const nextRank = currentPriority?.rank ?? "—";
    if (lastRankRef.current !== nextRank) {
      setRankPulse(true);
      const timer = setTimeout(() => setRankPulse(false), 1200);
      lastRankRef.current = nextRank;
      return () => clearTimeout(timer);
    }
    lastRankRef.current = nextRank;
  }, [currentPriority?.rank]);

  function jumpToCase(caseId) {
    if (!caseId) return;
    window.location.hash = `#/case/${caseId}`;
  }

  return (
    <div
      style={{
        ...cardStyle,
        border: rankPulse
          ? "1px solid rgba(16,185,129,0.30)"
          : "1px solid rgba(165,132,97,0.14)",
        boxShadow: rankPulse
          ? "0 12px 28px rgba(16,185,129,0.10)"
          : "0 12px 30px rgba(81,58,36,0.06)",
        padding: 18,
        transition: "all 220ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <SectionLabel>Cross-Case Command Strip</SectionLabel>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${summary.risk.border}`,
              background: summary.risk.bg,
              color: summary.risk.color,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {summary.risk.label}
          </div>

          <Badge>{summary.total} Cases In View</Badge>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {[
          {
            label: "Leadership Ready",
            value: summary.executionMode,
            sub: "active cases",
            accent: "#065f46",
            bg: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.18)",
          },
          {
            label: "Blocked",
            value: summary.blocked,
            accent: "#991b1b",
            bg: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
          },
          {
            label: "Not Ready",
            value: summary.verificationHold,
            accent: "#92400e",
            bg: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.18)",
          },
          {
            label: "Internally Ready",
            value: summary.internallyReady,
            accent: "#4338ca",
            bg: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.18)",
          },
          {
            label: "Top Priority",
            value: summary.topPriority,
            accent: "#4b3624",
            bg: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(165,132,97,0.14)",
          },
          {
            label: "Current Case",
            value: `#${summary.currentRank}`,
            sub: `Score ${summary.currentScore}`,
            accent: "#4b3624",
            bg: rankPulse ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.75)",
            border: rankPulse
              ? "1px solid rgba(16,185,129,0.28)"
              : "1px solid rgba(165,132,97,0.14)",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              borderRadius: 16,
              border: item.border,
              padding: 12,
              background: item.bg,
              transition: "all 220ms ease",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.6 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.accent }}>
              {item.value}
            </div>
            {item.sub ? (
              <div style={{ fontSize: 12, color: "rgba(75,54,36,0.68)", marginTop: 2 }}>
                {item.sub}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={() => jumpToCase(summary.previousCase)} style={buttonStyle}>
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => jumpToCase(summary.topPriority)}
          style={{
            ...buttonStyle,
            border: "1px solid rgba(16,185,129,0.22)",
            background: "rgba(16,185,129,0.08)",
            color: "#065f46",
          }}
        >
          Jump to Top
        </button>
        <button type="button" onClick={() => jumpToCase(summary.nextCase)} style={buttonStyle}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const { caseId, entityId } = useParams();
  const safeEntityId = caseId || entityId || "test_case_001";

  const county = titleCase(entityToCounty(safeEntityId));
  const program = entityToProgram(safeEntityId);

  const [truthState, setTruthState] = useState(null);
  const [priorityState, setPriorityState] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionLock, setActionLock] = useState(false);
  const [lastActionAtMs, setLastActionAtMs] = useState(0);
  const previousReadiness = useRef("unknown");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [truth, priority, acts] = await Promise.all([
          fetchTruth(safeEntityId),
          fetchPriority(safeEntityId),
          fetchActions(),
        ]);

        if (cancelled) return;

        setTruthState(truth);
        setPriorityState(priority);
        setActions((acts || []).filter((a) => a.entityId === safeEntityId));

        if (truth?.readinessStatus) {
          previousReadiness.current = truth.readinessStatus;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load case");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [safeEntityId]);

  const currentPriority = useMemo(() => {
    return priorityState?.ranked?.find((c) => c.entityId === safeEntityId) || null;
  }, [priorityState, safeEntityId]);

  const timeline = useMemo(() => {
    const truthEvents = [];

    if (truthState?.lastTruthRefresh) {
      truthEvents.push({
        type: "truth_refresh",
        title: "Truth Refreshed",
        detail: `${truthState.truthStatus || "unknown"} • ${truthState.readinessStatus || "unknown"}`,
        time: truthState.lastTruthRefresh,
        repeatCount: 1,
      });
    }

    if (truthState?.latestOracleAction && truthState?.lastActionAt) {
      truthEvents.push({
        type: "state_change",
        title: "State Change",
        detail: `${previousReadiness.current} → ${truthState.readinessStatus || "unknown"}`,
        time: truthState.lastActionAt,
        repeatCount: 1,
      });
    }

    const groupedActions = new Map();

    for (const a of actions || []) {
      const dt = a?.createdAt ? new Date(a.createdAt) : null;
      const minuteBucket =
        dt && !Number.isNaN(dt.getTime())
          ? `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}-${dt.getMinutes()}`
          : "unknown-time";

      const key = `${a?.action || "unknown"}-${minuteBucket}`;

      if (!groupedActions.has(key)) {
        groupedActions.set(key, {
          type: "action",
          title: `Action: ${a?.action || "unknown"}`,
          detail: a?.payload ? JSON.stringify(a.payload) : "No payload",
          time: a?.createdAt || null,
          repeatCount: 1,
        });
      } else {
        const existing = groupedActions.get(key);
        existing.repeatCount += 1;
      }
    }

    const actionEvents = Array.from(groupedActions.values());

    const merged = [...truthEvents, ...actionEvents].sort(
      (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
    );

    const visible = merged.slice(0, 10);
    const hiddenCount = Math.max(0, merged.length - visible.length);

    return {
      visible,
      hiddenCount,
    };
  }, [truthState, actions]);

  async function handlePromoteCase() {
    const now = Date.now();

    if (actionLock) return;
    if (now - lastActionAtMs < 2000) return;

    try {
      setActionLock(true);
      setLastActionAtMs(now);
      setActionBusy(true);
      setError("");

      const res = await fetch(`${ORACLE_BASE}/oracle/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: safeEntityId,
          action: "promote_case",
        }),
      });

      if (!res.ok) {
        throw new Error(`Promote failed: ${res.status}`);
      }

      const [truth, priority, acts] = await Promise.all([
        fetchTruth(safeEntityId),
        fetchPriority(safeEntityId),
        fetchActions(),
      ]);

      setTruthState(truth);
      setPriorityState(priority);
      setActions((acts || []).filter((a) => a.entityId === safeEntityId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote case");
    } finally {
      setActionBusy(false);
      setTimeout(() => setActionLock(false), 2000);
    }
  }

  const statusText =
    loading || actionBusy
      ? "⚡ ORACLE STATUS — Updating Oracle..."
      : truthState?.readinessStatus === "leadership_ready"
      ? "⚡ ORACLE STATUS — Promoted • Leadership Ready • Stable"
      : "⚡ ORACLE STATUS — Case Active • Decision Surface Live";

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <header
          style={{
            ...cardStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <SectionLabel>SHF Case Command Surface</SectionLabel>
            <h1
              style={{
                margin: 0,
                fontSize: 40,
                lineHeight: 1.05,
                fontWeight: 800,
              }}
            >
              Case {titleCase(safeEntityId)}
            </h1>
            <div
              style={{
                marginTop: 8,
                color: "rgba(90,67,45,0.78)",
                fontSize: 15,
              }}
            >
              Case-level decision surface for Oracle truth, verification, reporting, and action.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                window.location.hash = `#/county/${county.toLowerCase()}`;
              }}
              style={buttonStyle}
            >
              Return to County
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.hash = "#/";
              }}
              style={buttonStyle}
            >
              Return to Impact Map
            </button>
          </div>
        </header>

        <CrossCaseCommandStrip
          priorityState={priorityState}
          currentPriority={currentPriority}
          safeEntityId={safeEntityId}
        />

        {error ? (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "1px solid rgba(239,68,68,0.28)",
              background: "rgba(239,68,68,0.10)",
              color: "#991b1b",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.45fr 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div style={cardStyle}>
              <SectionLabel>Case Overview</SectionLabel>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
                Live Case Command Overview
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "#4b3624",
                }}
              >
                This case surface extends the SHF decision system from state and county down to the
                case level, so operators can view Oracle truth, readiness, and next-action signals
                on a single command page.
              </p>
            </div>

            <div style={{ ...cardStyle, padding: 10 }}>
              <StatusStrip text={statusText} loading={loading || actionBusy} />
              <div style={{ marginTop: 14 }}>
                <SectionLabel>AI Analyst</SectionLabel>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                  Decision Engine
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>What changed</div>
                <div style={{ marginBottom: 16 }}>
                  {truthState?.readinessStatus === "leadership_ready"
                    ? "Case has entered execution mode and is ready for operational follow-through."
                    : "Oracle truth is live and ready for review."}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Why it matters</div>
                <ul style={{ marginTop: 0, marginBottom: 16 }}>
                  <li>Truth: {truthState?.truthStatus || "unknown"}</li>
                  <li>Verification: {truthState?.verificationStatus || "unknown"}</li>
                  <li>Readiness: {truthState?.readinessStatus || "unknown"}</li>
                  <li>Confidence: {truthState?.confidenceScore ?? "—"}</li>
                  <li>Latest Action: {truthState?.latestOracleAction || "—"}</li>
                </ul>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Next move</div>
                <div>
                  {truthState?.readinessStatus === "leadership_ready"
                    ? "Proceed with reporting and institutional review."
                    : "Continue operator review and monitor Oracle truth."}
                </div>
              </div>
            </div>

            <SimpleDataCard
              title="Reports & Briefings"
              rows={[
                { label: "Case Brief", value: "Ready • High Confidence" },
                { label: "Program Narrative", value: "Pending • Medium Confidence" },
                { label: "Audit Snapshot", value: "Ready • High Confidence" },
              ]}
            />

            <TimelineCard timeline={timeline} />
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <SimpleDataCard
              title="Trust + Verification"
              rows={[
                { label: "Truth Status", value: truthState?.truthStatus || "unknown" },
                { label: "Verification", value: truthState?.verificationStatus || "unknown" },
                { label: "Readiness", value: truthState?.readinessStatus || "unknown" },
                { label: "Confidence", value: truthState?.confidenceScore ?? "—" },
              ]}
            />

            <SimpleDataCard
              title="Case Metadata"
              rows={[
                { label: "Entity ID", value: safeEntityId },
                { label: "County", value: county },
                { label: "Program", value: program },
                { label: "Stage", value: entityToStage(safeEntityId, truthState?.readinessStatus || "") },
                { label: "Route", value: `/case/${safeEntityId}` },
                { label: "Decision Layer", value: "State → County → Case → Action" },
                { label: "Last Action", value: truthState?.latestOracleAction || "none" },
              ]}
            />

            <SimpleDataCard
              title="Priority Intelligence"
              rows={[
                { label: "Rank", value: currentPriority?.rank ?? "—" },
                { label: "Score", value: currentPriority?.priorityScore ?? "—" },
                { label: "Status", value: currentPriority?.readinessStatus || "unknown" },
              ]}
            />

            <SimpleDataCard
              title="Ghost Decision Path"
              rows={[
                { label: "Current", value: truthState?.readinessStatus || "unknown" },
                {
                  label: "Next",
                  value:
                    truthState?.readinessStatus === "leadership_ready"
                      ? "reporting"
                      : "operator_review",
                },
                {
                  label: "Alternate",
                  value:
                    truthState?.readinessStatus === "leadership_ready"
                      ? "hold_for_verification"
                      : "not_ready",
                },
              ]}
            />

            <div style={cardStyle}>
              <SectionLabel>Action Lane</SectionLabel>
              <div style={{ display: "grid", gap: 12 }}>
                <button
                  type="button"
                  onClick={handlePromoteCase}
                  disabled={actionBusy || actionLock}
                  style={{
                    ...actionButtonStyle,
                    opacity: actionBusy || actionLock ? 0.65 : 1,
                  }}
                >
                  {actionBusy ? "Promoting..." : "Promote Case"}
                </button>

                <button
                  type="button"
                  style={{
                    ...actionButtonStyle,
                    border: "1px solid rgba(217,119,6,0.35)",
                    background: "rgba(245,158,11,0.12)",
                    color: "#92400e",
                  }}
                >
                  Hold for Verification
                </button>

                <button
                  type="button"
                  style={{
                    ...actionButtonStyle,
                    border: "1px solid rgba(99,102,241,0.35)",
                    background: "rgba(99,102,241,0.10)",
                    color: "#4338ca",
                  }}
                >
                  Open Case Packet
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
