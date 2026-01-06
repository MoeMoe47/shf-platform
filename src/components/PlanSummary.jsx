// src/components/PlanSummary.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function PlanSummary({ plan }) {
  const credit = useCreditCtx();
  const p = plan || { id: "plan-demo", name: "Starter Plan", steps: ["Explore", "Practice", "Apply"] };

  function finalize() {
    try {
      credit?.earn?.({
        action: "career.plan.saved",
        rewards: { corn: 1 },
        scoreDelta: 1,
        meta: { planId: p.id }
      });
      window.dispatchEvent(new CustomEvent("career:plan:saved", { detail: { planId: p.id }}));
      window.shToast?.("✅ Plan finalized · +1 🌽 · +1 score");
    } catch {}
  }

  return (
    <section className="card card--pad" role="region" aria-labelledby="plan-sum-title">
      <h3 id="plan-sum-title" className="h4" style={{ marginTop: 0 }}>Plan Summary</h3>
      <div className="subtle">Name: <strong>{p.name}</strong></div>
      <ul className="sh-listPlain" style={{ marginTop: 8 }}>
        {p.steps.map((s, i) => <li key={i}>• {s}</li>)}
      </ul>
      <div className="sh-actionsRow" style={{ marginTop: 8 }}>
        <button className="sh-btn" onClick={finalize}>Finalize</button>
      </div>
    </section>
  );
}
