// src/sales/screens/ImpactCalculator.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function ImpactCalculator() {
  const credit = useCreditCtx?.();
  const [students, setStudents] = React.useState(120);
  const [costPer, setCostPer]   = React.useState(350);
  const total = Number(students || 0) * Number(costPer || 0);

  function saveAndLog() {
    try {
      // credit bump for reps logging a calc
      credit?.earn?.({
        action: "sales.calc.saved",
        rewards: { corn: 2 },
        scoreDelta: 3,
        meta: { students, costPer, total }
      });
      // simulate polygon tx
      window.dispatchEvent(new CustomEvent("polygon:simulate:tx", {
        detail: { op: "impact_calc_log", payload: { students, costPer, total } }
      }));
      window.shToast?.("📈 Saved · +2 🌽 · +3 score");
    } catch {}
  }

  return (
    <section className="card card--pad" role="region" aria-label="Polygon Impact Calculator">
      <h3 className="h3" style={{ marginTop: 0 }}>Polygon Impact Calculator</h3>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 220px))", gap: 10 }}>
        <label className="sh-field">
          <div className="subtle">Students</div>
          <input className="sh-input" type="number" value={students} onChange={e=>setStudents(e.target.value)} />
        </label>
        <label className="sh-field">
          <div className="subtle">Cost / Student ($)</div>
          <input className="sh-input" type="number" value={costPer} onChange={e=>setCostPer(e.target.value)} />
        </label>
        <label className="sh-field">
          <div className="subtle">Total</div>
          <div style={{ fontWeight:700, padding:"8px 0" }}>${Number(total).toLocaleString()}</div>
        </label>
      </div>

      <div className="sh-actionsRow" style={{ marginTop: 10 }}>
        <button className="sh-btn sh-btn--primary" onClick={saveAndLog}>Save & Log</button>
      </div>
    </section>
  );
}
