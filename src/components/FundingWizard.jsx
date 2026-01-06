// src/components/FundingWizard.jsx
import React from "react";
import buildFundingPlan from "../utils/buildFundingPlan.js";
import { track } from "../utils/analytics.js";

export default function FundingWizard({ onSave = () => {} }) {
  const [form, setForm] = React.useState({
    state: "",
    unemployed: false,
    veteran: false,
    hsGrad: true,
    age: "",
    householdSize: "",
  });
  const [result, setResult] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e?.preventDefault?.();
    setBusy(true);
    try {
      const plan = buildFundingPlan({
        state: form.state,
        unemployed: !!form.unemployed,
        veteran: !!form.veteran,
        hsGrad: !!form.hsGrad,
        age: Number(form.age || 0) || null,
        householdSize: Number(form.householdSize || 0) || null,
      });
      setResult(plan);
      onSave(plan);
      try {
        track(
          "funding_plan_saved",
          { programsCount: plan?.steps?.length || 0, estCoverage: plan?.estCoverage },
          { silent: true }
        );
      } catch {}
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Funding Wizard">
      <form className="sh-formGrid" onSubmit={submit} aria-describedby="fw-help">
        <div className="sh-field">
          <label htmlFor="fw-state">State</label>
          <input
            id="fw-state"
            className="sh-inputText"
            placeholder="e.g., OH"
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            autoComplete="address-level1"
          />
        </div>

        <div className="sh-field">
          <label htmlFor="fw-age">Age</label>
          <input
            id="fw-age"
            type="number"
            min="14"
            max="99"
            className="sh-inputText"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
          />
        </div>

        <div className="sh-field">
          <label htmlFor="fw-household">Household size</label>
          <input
            id="fw-household"
            type="number"
            min="1"
            max="12"
            className="sh-inputText"
            value={form.householdSize}
            onChange={(e) => update("householdSize", e.target.value)}
          />
        </div>

        <div className="sh-field">
          <label className="sh-checkbox">
            <input
              type="checkbox"
              checked={!!form.unemployed}
              onChange={(e) => update("unemployed", e.target.checked)}
            />
            <span>Currently unemployed</span>
          </label>
        </div>

        <div className="sh-field">
          <label className="sh-checkbox">
            <input
              type="checkbox"
              checked={!!form.veteran}
              onChange={(e) => update("veteran", e.target.checked)}
            />
            <span>Veteran / eligible dependent</span>
          </label>
        </div>

        <div className="sh-field">
          <label className="sh-checkbox">
            <input
              type="checkbox"
              checked={!!form.hsGrad}
              onChange={(e) => update("hsGrad", e.target.checked)}
            />
            <span>High school graduate (or equivalent)</span>
          </label>
        </div>

        <div className="sh-actionsRow" style={{ marginTop: 6 }}>
          <button className="sh-btn sh-btn--primary" type="submit" disabled={busy}>
            {busy ? "Building…" : "Build funding plan"}
          </button>
          <div className="subtle" id="fw-help">
            We’ll suggest stacked programs like WIOA/ETPL, GI Bill®, state grants, and employer tuition.
          </div>
        </div>
      </form>

      {/* Live result preview (kept lightweight; FundingPlanCard renders the “nice” version) */}
      <div aria-live="polite" style={{ marginTop: 10 }}>
        {!result ? null : (
          <div className="sh-callout">
            <div className="subtle">Estimated coverage: <strong>{title(result.estCoverage)}</strong></div>
            <ul className="sh-listPlain" style={{ marginTop: 8, display: "grid", gap: 6 }}>
              {result.steps.map((s) => (
                <li key={s.id} className="sh-row" style={{ gap: 8 }}>
                  <span className="sh-chip sh-chip--soft">{s.program}</span>
                  <span>{s.action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <style>{`
        .sh-formGrid{
          display:grid; gap:8px;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          align-items:end;
        }
        .sh-field{ display:flex; flex-direction:column; gap:4px; }
        .sh-checkbox{ display:flex; align-items:center; gap:8px; cursor:pointer; }
        .sh-callout{
          border:1px solid var(--ring,#e5e7eb);
          border-radius:10px; padding:10px; background:var(--surface,#fff);
        }
      `}</style>
    </section>
  );
}

function title(s) {
  return String(s || "").replace(/\b\w/g, (m) => m.toUpperCase());
}
