import React from "react";
import "./ai-guardrails.css";

const API_ROOT = "/api/ai-guardrails";

async function guardrailRequest(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `AI Guardrails request failed: ${response.status}`);
  }
  return data;
}

function label(value) {
  return String(value || "unknown").replace(/_/g, " ");
}

export default function AIGuardrailsPage() {
  const [health, setHealth] = React.useState(null);
  const [policies, setPolicies] = React.useState([]);
  const [decisions, setDecisions] = React.useState([]);
  const [selectedDecision, setSelectedDecision] = React.useState(null);
  const [form, setForm] = React.useState({
    app_id: "shs",
    agent_id: "admin_ai",
    output_type: "draft",
    requested_action: "draft",
    output_text: "",
    claim_ids: "",
  });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const loadGuardrails = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [healthPayload, policiesPayload, decisionsPayload] = await Promise.all([
        guardrailRequest("/health"),
        guardrailRequest("/policies"),
        guardrailRequest("/decisions"),
      ]);
      const nextDecisions = Array.isArray(decisionsPayload.decisions) ? decisionsPayload.decisions : [];
      setHealth(healthPayload || null);
      setPolicies(Array.isArray(policiesPayload.policies) ? policiesPayload.policies : []);
      setDecisions(nextDecisions);
      setSelectedDecision((current) => current || nextDecisions[0] || null);
    } catch (nextError) {
      setError(nextError.message || "AI Guardrails are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGuardrails();
  }, [loadGuardrails]);

  const checkOutput = async (event) => {
    event.preventDefault();
    const claimIds = form.claim_ids
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const payload = await guardrailRequest("/check-output", {
      method: "POST",
      body: JSON.stringify({ ...form, claim_ids: claimIds }),
    });
    setSelectedDecision(payload.decision || null);
    await loadGuardrails();
  };

  const warnings = Array.isArray(selectedDecision?.warnings) ? selectedDecision.warnings : [];

  return (
    <main className="ai-guardrails-page">
      <section className="ai-guardrails-hero">
        <div>
          <p className="ai-guardrails-kicker">SHS AI/Swarm Safety</p>
          <h1>AI Guardrails V1</h1>
          <p>AI may draft, summarize, inspect, and recommend. Verified, public, ruling, report, and execution decisions require the proper infrastructure layers.</p>
        </div>
        <div className="ai-guardrails-badge">Truth Spine + Oracle + Alignment Required</div>
      </section>

      {error ? <div className="ai-guardrails-alert">{error}</div> : null}

      <section className="ai-guardrails-metrics" aria-label="AI Guardrails health">
        <article><span>Policies</span><strong>{Number(health?.policies_total || 0)}</strong></article>
        <article><span>Decisions</span><strong>{Number(health?.decisions_total || 0)}</strong></article>
        <article><span>Blocked</span><strong>{Number(health?.blocked || 0)}</strong></article>
        <article><span>Truth Review</span><strong>{Number(health?.requires_truth_review || 0)}</strong></article>
        <article><span>Oracle Review</span><strong>{Number(health?.requires_oracle_review || 0)}</strong></article>
        <article><span>Alignment</span><strong>{Number(health?.requires_alignment_approval || 0)}</strong></article>
      </section>

      <section className="ai-guardrails-grid">
        <div className="ai-guardrails-panel">
          <div className="ai-guardrails-panel-head">
            <div>
              <span>Output Checker</span>
              <strong>{loading ? "Loading" : "Policy check"}</strong>
            </div>
          </div>
          <form className="ai-guardrails-form" onSubmit={checkOutput}>
            <label>App ID<input value={form.app_id} onChange={(event) => setForm({ ...form, app_id: event.target.value })} /></label>
            <label>Agent ID<input value={form.agent_id} onChange={(event) => setForm({ ...form, agent_id: event.target.value })} /></label>
            <label>Output Type<input value={form.output_type} onChange={(event) => setForm({ ...form, output_type: event.target.value })} /></label>
            <label>Requested Action<input value={form.requested_action} onChange={(event) => setForm({ ...form, requested_action: event.target.value })} /></label>
            <label>Claim IDs<input placeholder="claim_a, claim_b" value={form.claim_ids} onChange={(event) => setForm({ ...form, claim_ids: event.target.value })} /></label>
            <label>Output Text<textarea value={form.output_text} onChange={(event) => setForm({ ...form, output_text: event.target.value })} /></label>
            <button type="submit">Check Output</button>
          </form>
        </div>

        <div className="ai-guardrails-panel">
          <div className="ai-guardrails-panel-head">
            <div>
              <span>Decision Result</span>
              <strong>{label(selectedDecision?.decision || "No decision")}</strong>
            </div>
          </div>
          <div className="ai-guardrails-decision">
            <div><span>Required Layer</span><strong>{selectedDecision?.required_layer || "AI/Swarm Layer"}</strong></div>
            <p>{selectedDecision?.reason || "Run an output check to see the guardrail decision."}</p>
            <div className="ai-guardrails-flags">
              <span>Truth: {selectedDecision?.truth_required ? "required" : "clear"}</span>
              <span>Oracle: {selectedDecision?.oracle_required ? "required" : "clear"}</span>
              <span>Alignment: {selectedDecision?.alignment_required ? "required" : "clear"}</span>
              <span>Public: {selectedDecision?.public_publish_allowed ? "allowed" : "not allowed"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ai-guardrails-grid ai-guardrails-grid--tables">
        <div className="ai-guardrails-panel">
          <div className="ai-guardrails-panel-head">
            <div>
              <span>Policies</span>
              <strong>{policies.length} active cards</strong>
            </div>
          </div>
          <div className="ai-guardrails-policy-list">
            {policies.map((policy) => (
              <article key={policy.policy_id}>
                <strong>{policy.title}</strong>
                <span>{label(policy.status)}</span>
                <p>{policy.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="ai-guardrails-panel">
          <div className="ai-guardrails-panel-head">
            <div>
              <span>Decisions Table</span>
              <strong>{decisions.length} records</strong>
            </div>
          </div>
          <div className="ai-guardrails-decision-list">
            {decisions.map((decision) => (
              <button key={decision.decision_id} type="button" onClick={() => setSelectedDecision(decision)}>
                <strong>{label(decision.decision)}</strong>
                <span>{decision.required_layer} / {decision.check?.agent_id || "unknown agent"}</span>
              </button>
            ))}
            {!decisions.length ? <p>No decisions yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="ai-guardrails-panel">
        <div className="ai-guardrails-panel-head">
          <div>
            <span>Warnings</span>
            <strong>{warnings.length} warnings</strong>
          </div>
        </div>
        <div className="ai-guardrails-warning-list">
          {warnings.map((warning) => <span key={warning}>{label(warning)}</span>)}
          {!warnings.length ? <p>No warnings for selected decision.</p> : null}
        </div>
      </section>
    </main>
  );
}
