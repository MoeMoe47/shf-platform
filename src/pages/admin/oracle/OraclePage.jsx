import React from "react";
import "./oracle.css";

const API_ROOT = "/api/oracle";

async function oracleRequest(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `Oracle request failed: ${response.status}`);
  }
  return data;
}

function label(value) {
  return String(value || "unknown").replace(/_/g, " ");
}

export default function OraclePage() {
  const [health, setHealth] = React.useState(null);
  const [cases, setCases] = React.useState([]);
  const [rulings, setRulings] = React.useState([]);
  const [selectedRuling, setSelectedRuling] = React.useState(null);
  const [form, setForm] = React.useState({ title: "", question: "", claimIds: "" });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const loadOracle = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [healthPayload, casesPayload, rulingsPayload] = await Promise.all([
        oracleRequest("/health"),
        oracleRequest("/cases"),
        oracleRequest("/rulings"),
      ]);
      const nextRulings = Array.isArray(rulingsPayload.rulings) ? rulingsPayload.rulings : [];
      setHealth(healthPayload || null);
      setCases(Array.isArray(casesPayload.cases) ? casesPayload.cases : []);
      setRulings(nextRulings);
      setSelectedRuling((current) => current || nextRulings[0] || null);
    } catch (nextError) {
      setError(nextError.message || "Oracle is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadOracle();
  }, [loadOracle]);

  const createCase = async (event) => {
    event.preventDefault();
    const claimIds = form.claimIds
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    await oracleRequest("/cases", {
      method: "POST",
      body: JSON.stringify({
        title: form.title,
        question: form.question,
        claim_ids: claimIds,
        requested_by: "shs-admin",
      }),
    });
    setForm({ title: "", question: "", claimIds: "" });
    await loadOracle();
  };

  const ruleCase = async (oracleCase) => {
    if (!oracleCase?.case_id) return;
    const payload = await oracleRequest(`/cases/${encodeURIComponent(oracleCase.case_id)}/rule`, {
      method: "POST",
    });
    setSelectedRuling(payload.ruling || null);
    await loadOracle();
  };

  const warningList = Array.isArray(selectedRuling?.warnings) ? selectedRuling.warnings : [];
  const packageList = Array.isArray(selectedRuling?.claim_packages) ? selectedRuling.claim_packages : [];

  return (
    <main className="oracle-page">
      <section className="oracle-hero">
        <div>
          <p className="oracle-kicker">SHS Decision Support</p>
          <h1>Oracle Layer V1</h1>
          <p>Oracle decides what verified Truth Spine evidence supports. It cannot verify, public-approve, or publish claims.</p>
        </div>
        <div className="oracle-badge">Truth Spine Required</div>
      </section>

      {error ? <div className="oracle-alert">{error}</div> : null}

      <section className="oracle-metrics" aria-label="Oracle health">
        <article><span>Cases</span><strong>{Number(health?.cases_total || 0)}</strong></article>
        <article><span>Rulings</span><strong>{Number(health?.rulings_total || 0)}</strong></article>
        <article><span>Open</span><strong>{Number(health?.open_cases || 0)}</strong></article>
        <article><span>Supportable</span><strong>{Number(health?.supportable || 0)}</strong></article>
        <article><span>Disputed</span><strong>{Number(health?.disputed || 0)}</strong></article>
        <article><span>Insufficient</span><strong>{Number(health?.insufficient_evidence || 0)}</strong></article>
      </section>

      <section className="oracle-grid">
        <div className="oracle-panel">
          <div className="oracle-panel-head">
            <div>
              <span>Create Case</span>
              <strong>{loading ? "Loading" : "Evidence question"}</strong>
            </div>
          </div>
          <form className="oracle-form" onSubmit={createCase}>
            <label>
              Title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label>
              Question
              <textarea value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} />
            </label>
            <label>
              Claim IDs
              <input
                placeholder="claim_a, claim_b"
                value={form.claimIds}
                onChange={(event) => setForm({ ...form, claimIds: event.target.value })}
              />
            </label>
            <button type="submit">Create Case</button>
          </form>
        </div>

        <div className="oracle-panel">
          <div className="oracle-panel-head">
            <div>
              <span>Ruling Detail</span>
              <strong>{label(selectedRuling?.decision || "No ruling")}</strong>
            </div>
          </div>
          <div className="oracle-ruling-detail">
            <div><span>Confidence</span><strong>{Number(selectedRuling?.confidence || 0)}%</strong></div>
            <p>{selectedRuling?.reasoning_summary || "Select or create a ruling to inspect the evidence support decision."}</p>
            <div className="oracle-package-list">
              {packageList.map((item) => (
                <article key={item.package_id || item.claim_id}>
                  <strong>{item.claim_id}</strong>
                  <span>{item.package_hash || "No package hash"}</span>
                </article>
              ))}
              {!packageList.length ? <small>No Truth Packages attached.</small> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="oracle-grid oracle-grid--tables">
        <div className="oracle-panel">
          <div className="oracle-panel-head">
            <div>
              <span>Cases Table</span>
              <strong>{cases.length} records</strong>
            </div>
          </div>
          <div className="oracle-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Status</th>
                  <th>Claims</th>
                  <th>Rule</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => (
                  <tr key={item.case_id}>
                    <td><strong>{item.title}</strong><small>{item.question}</small></td>
                    <td>{label(item.status)}</td>
                    <td>{(item.claim_ids || []).join(", ") || "No claims"}</td>
                    <td><button type="button" onClick={() => ruleCase(item)}>Rule</button></td>
                  </tr>
                ))}
                {!cases.length ? <tr><td colSpan="4">No Oracle cases yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="oracle-panel">
          <div className="oracle-panel-head">
            <div>
              <span>Rulings Table</span>
              <strong>{rulings.length} records</strong>
            </div>
          </div>
          <div className="oracle-ruling-list">
            {rulings.map((item) => (
              <button key={item.ruling_id} type="button" onClick={() => setSelectedRuling(item)}>
                <strong>{label(item.decision)}</strong>
                <span>{item.case_id} / {Number(item.confidence || 0)}%</span>
              </button>
            ))}
            {!rulings.length ? <p>No rulings yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="oracle-panel">
        <div className="oracle-panel-head">
          <div>
            <span>Warnings</span>
            <strong>{warningList.length} warnings</strong>
          </div>
        </div>
        <div className="oracle-warning-list">
          {warningList.map((warning) => <span key={warning}>{label(warning)}</span>)}
          {!warningList.length ? <p>No warnings for selected ruling.</p> : null}
        </div>
      </section>
    </main>
  );
}
