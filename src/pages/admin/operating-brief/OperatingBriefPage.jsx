import React from "react";

const LABELS = {
  VERIFIED_FACT: "VERIFIED",
  CANONICAL_OPERATIONAL_FACT: "CANONICAL",
  SECURITY_GOVERNANCE_FACT: "SECURITY / GOVERNANCE",
  EXTERNAL_OBSERVATION: "EXTERNAL",
  DERIVED_FINDING: "DERIVED",
  RECOMMENDATION: "RECOMMENDATION",
};

function BriefSection({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <section style={{ borderTop: "1px solid #d8dee7", padding: "18px 0" }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 17, color: "#132238" }}>{title}</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, index) => (
          <article key={`${item.findingId || item.title}-${index}`} style={{ padding: 14, border: "1px solid #d8dee7", borderRadius: 6, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong style={{ color: "#132238" }}>{item.title}</strong>
              <span style={{ color: "#52647a", fontSize: 12, fontWeight: 700 }}>{LABELS[item.verificationClass] || item.verificationClass || "UNCLASSIFIED"}</span>
            </div>
            <p style={{ margin: "7px 0 0", color: "#40536b", lineHeight: 1.45 }}>{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function OperatingBriefPage() {
  const [brief, setBrief] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/daily-briefs/latest", { credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message || "Daily Operating Brief is unavailable.");
      setBrief(payload.data || null);
    } catch (nextError) { setError(nextError.message || "Daily Operating Brief is unavailable."); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <main style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 24px 56px", color: "#132238" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <p style={{ margin: "0 0 6px", color: "#52647a", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>TODAY</p>
          <h1 style={{ margin: 0, fontSize: 30 }}>Daily Operating Brief</h1>
          <p style={{ margin: "8px 0 0", color: "#52647a" }}>A scoped summary of verified outcomes, operating conditions, and recommended next actions.</p>
        </div>
        <button type="button" onClick={load} style={{ border: "1px solid #9aaabd", borderRadius: 5, background: "#fff", color: "#132238", padding: "9px 14px", cursor: "pointer" }}>Refresh</button>
      </header>
      {loading && <p>Loading the latest brief...</p>}
      {!loading && error && <p role="alert" style={{ color: "#a12828" }}>{error}</p>}
      {!loading && !error && !brief && <p>No Daily Operating Brief has been generated for this organization yet.</p>}
      {!loading && !error && brief && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8, color: "#52647a", fontSize: 13 }}>
            <span>Generated {new Date(brief.generatedAt).toLocaleString()}</span>
            <span>•</span>
            <span>Source window {new Date(brief.reportingPeriodStart).toLocaleDateString()} to {new Date(brief.reportingPeriodEnd).toLocaleDateString()}</span>
          </div>
          <BriefSection title="What Changed" items={brief.brief?.whatChanged} />
          <BriefSection title="Needs Attention" items={brief.brief?.needsAttention} />
          <BriefSection title="Decisions Required" items={brief.brief?.decisionsRequired} />
          <BriefSection title="Risks / Blockers" items={brief.brief?.risksBlockers} />
          <BriefSection title="Opportunities" items={brief.brief?.opportunities} />
          <BriefSection title="Agent Activity" items={brief.brief?.agentActivity} />
          <BriefSection title="Security / Governance" items={brief.brief?.securityGovernance} />
          <BriefSection title="Verified Outcomes" items={brief.brief?.verifiedOutcomes} />
          <BriefSection title="External Signals" items={brief.brief?.externalSignals} />
          <BriefSection title="Recommended Next Actions" items={brief.brief?.recommendedNextActions} />
        </>
      )}
    </main>
  );
}
