import React from "react";
import "./game-theory.css";

const API_ROOT = "/api/game-theory";

async function gameTheoryRequest(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `Game Theory request failed: ${response.status}`);
  }
  return data;
}

function label(value) {
  return String(value || "unknown").replace(/_/g, " ");
}

function Score({ label: scoreLabel, value }) {
  const safeValue = Number(value || 0);
  return (
    <article className="gt-score">
      <span>{scoreLabel}</span>
      <strong>{safeValue}</strong>
      <div><i style={{ width: `${Math.max(0, Math.min(100, safeValue))}%` }} /></div>
    </article>
  );
}

export default function GameTheoryPage() {
  const [health, setHealth] = React.useState(null);
  const [playbook, setPlaybook] = React.useState([]);
  const [scenarios, setScenarios] = React.useState([]);
  const [analyses, setAnalyses] = React.useState([]);
  const [selectedScenario, setSelectedScenario] = React.useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({
    scenario_type: "funding_loss",
    title: "Funding renewal risk",
    description: "Analyze stakeholder incentives and strategic risk before a funder renewal conversation.",
    app_id: "shs",
    program_id: "program_demo",
    client_id: "client_demo",
    stakeholder_ids: "funder, partner, client",
    claim_ids: "",
    oracle_case_ids: "",
    severity: "medium",
    time_horizon: "short_term",
  });

  const loadGameTheory = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [healthPayload, playbookPayload, scenariosPayload, analysesPayload] = await Promise.all([
        gameTheoryRequest("/health"),
        gameTheoryRequest("/strategy-playbook"),
        gameTheoryRequest("/scenarios"),
        gameTheoryRequest("/analyses"),
      ]);
      const nextScenarios = Array.isArray(scenariosPayload.scenarios) ? scenariosPayload.scenarios : [];
      const nextAnalyses = Array.isArray(analysesPayload.analyses) ? analysesPayload.analyses : [];
      setHealth(healthPayload || null);
      setPlaybook(Array.isArray(playbookPayload.entries) ? playbookPayload.entries : []);
      setScenarios(nextScenarios);
      setAnalyses(nextAnalyses);
      setSelectedScenario((current) => current || nextScenarios[0] || null);
      setSelectedAnalysis((current) => current || nextAnalyses[nextAnalyses.length - 1] || null);
    } catch (nextError) {
      setError(nextError.message || "Game Theory Layer is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGameTheory();
  }, [loadGameTheory]);

  const createScenario = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      stakeholder_ids: form.stakeholder_ids.split(",").map((item) => item.trim()).filter(Boolean),
      claim_ids: form.claim_ids.split(",").map((item) => item.trim()).filter(Boolean),
      oracle_case_ids: form.oracle_case_ids.split(",").map((item) => item.trim()).filter(Boolean),
    };
    const response = await gameTheoryRequest("/scenarios", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setSelectedScenario(response.scenario || null);
    await loadGameTheory();
  };

  const analyzeScenario = async (scenarioId) => {
    const response = await gameTheoryRequest(`/scenarios/${scenarioId}/analyze`, { method: "POST" });
    setSelectedAnalysis(response.analysis || null);
    await loadGameTheory();
  };

  const warnings = Array.isArray(selectedAnalysis?.warnings) ? selectedAnalysis.warnings : [];

  return (
    <main className="game-theory-page">
      <section className="gt-hero">
        <div>
          <p className="gt-kicker">SHS Strategic Prediction</p>
          <h1>Game Theory Layer V1</h1>
          <p>Models stakeholder behavior, incentives, cooperation, conflict, and likely outcome effects. Predictions are strategic analysis, not verified facts.</p>
        </div>
        <div className="gt-badge">Truth Spine + Oracle + Alignment-Aware</div>
      </section>

      {error ? <div className="gt-alert">{error}</div> : null}

      <section className="gt-metrics" aria-label="Game Theory health">
        <article><span>Status</span><strong>{health?.policy_status || "unknown"}</strong></article>
        <article><span>Scenarios</span><strong>{Number(health?.scenarios_total || 0)}</strong></article>
        <article><span>Analyses</span><strong>{Number(health?.analyses_total || 0)}</strong></article>
        <article><span>Layer</span><strong>{loading ? "Loading" : "V1"}</strong></article>
      </section>

      <section className="gt-grid">
        <div className="gt-panel">
          <div className="gt-panel-head">
            <div>
              <span>Scenario Creation</span>
              <strong>Strategic input</strong>
            </div>
          </div>
          <form className="gt-form" onSubmit={createScenario}>
            <label>Type
              <select value={form.scenario_type} onChange={(event) => setForm({ ...form, scenario_type: event.target.value })}>
                {["funding_loss", "funding_gain", "partner_loss", "partner_gain", "public_trust_drop", "adoption_growth", "client_churn_risk", "upsell_opportunity", "custom"].map((item) => <option key={item} value={item}>{label(item)}</option>)}
              </select>
            </label>
            <label>Severity
              <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}>
                {["low", "medium", "high", "critical"].map((item) => <option key={item} value={item}>{label(item)}</option>)}
              </select>
            </label>
            <label>Time Horizon
              <select value={form.time_horizon} onChange={(event) => setForm({ ...form, time_horizon: event.target.value })}>
                {["immediate", "short_term", "medium_term", "long_term"].map((item) => <option key={item} value={item}>{label(item)}</option>)}
              </select>
            </label>
            <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label>Stakeholder IDs<input value={form.stakeholder_ids} onChange={(event) => setForm({ ...form, stakeholder_ids: event.target.value })} /></label>
            <label>Claim IDs<input placeholder="claim_a, claim_b" value={form.claim_ids} onChange={(event) => setForm({ ...form, claim_ids: event.target.value })} /></label>
            <label>Oracle Case IDs<input placeholder="case_a, case_b" value={form.oracle_case_ids} onChange={(event) => setForm({ ...form, oracle_case_ids: event.target.value })} /></label>
            <button type="submit">Create Scenario</button>
          </form>
        </div>

        <div className="gt-panel">
          <div className="gt-panel-head">
            <div>
              <span>Analysis Result</span>
              <strong>{label(selectedAnalysis?.recommended_strategy || "No analysis")}</strong>
            </div>
          </div>
          {selectedAnalysis ? (
            <>
              <div className="gt-score-grid">
                <Score label="Strategic Risk" value={selectedAnalysis.strategic_risk_score} />
                <Score label="Cooperation" value={selectedAnalysis.cooperation_score} />
                <Score label="Conflict" value={selectedAnalysis.conflict_score} />
                <Score label="Incentive Alignment" value={selectedAnalysis.incentive_alignment_score} />
                <Score label="Confidence" value={selectedAnalysis.confidence} />
              </div>
              <div className="gt-deltas">
                <span>Outcome {selectedAnalysis.expected_outcome_delta}</span>
                <span>Trust {selectedAnalysis.trust_delta}</span>
                <span>Adoption {selectedAnalysis.adoption_delta}</span>
                <span>Funding {selectedAnalysis.funding_delta}</span>
                <span>Operational Risk {selectedAnalysis.operational_risk_delta}</span>
              </div>
              <p className="gt-note">{selectedAnalysis.reasoning_summary}</p>
            </>
          ) : (
            <p className="gt-note">Create or select a scenario, then run analysis.</p>
          )}
        </div>
      </section>

      <section className="gt-grid gt-grid--tables">
        <div className="gt-panel">
          <div className="gt-panel-head">
            <div>
              <span>Strategy Playbook</span>
              <strong>{playbook.length} entries</strong>
            </div>
          </div>
          <div className="gt-playbook">
            {playbook.map((entry) => (
              <article key={entry.strategy_id}>
                <strong>{entry.label}</strong>
                <p>{entry.use_when}</p>
                <span>{entry.boundary}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="gt-panel">
          <div className="gt-panel-head">
            <div>
              <span>Scenarios Table</span>
              <strong>{scenarios.length} records</strong>
            </div>
          </div>
          <div className="gt-list">
            {scenarios.map((scenario) => (
              <button key={scenario.scenario_id} type="button" onClick={() => setSelectedScenario(scenario)}>
                <strong>{scenario.title}</strong>
                <span>{label(scenario.scenario_type)} / {label(scenario.severity)} / {label(scenario.status)}</span>
                <em>{scenario.scenario_id}</em>
                <b onClick={(event) => { event.stopPropagation(); analyzeScenario(scenario.scenario_id); }}>Analyze</b>
              </button>
            ))}
            {!scenarios.length ? <p>No scenarios yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="gt-panel">
        <div className="gt-panel-head">
          <div>
            <span>Warnings</span>
            <strong>{warnings.length} warnings</strong>
          </div>
        </div>
        <div className="gt-warnings">
          {warnings.map((warning) => <span key={warning}>{label(warning)}</span>)}
          {!warnings.length ? <p>No warnings for selected analysis.</p> : null}
        </div>
        {selectedScenario ? <p className="gt-note">Selected scenario: {selectedScenario.scenario_id}. Game Theory does not verify, public-approve, rank, rule, execute, or publish.</p> : null}
      </section>
    </main>
  );
}

