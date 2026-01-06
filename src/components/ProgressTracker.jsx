// src/components/ProgressTracker.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function ProgressTracker({ value = 0, onChange = () => {} }) {
  const credit = useCreditCtx();
  const [pct, setPct] = React.useState(() => Math.max(0, Math.min(100, Number(value || 0))));
  const lastMilestoneRef = React.useRef(0);

  function setProgress(n) {
    const v = Math.max(0, Math.min(100, Number(n || 0)));
    setPct(v);
    onChange(v);

    // milestones at 25/50/75/100
    const steps = [25, 50, 75, 100];
    const hit = steps.find((s) => v >= s && lastMilestoneRef.current < s);
    if (hit != null) {
      lastMilestoneRef.current = hit;
      try {
        credit?.earn?.({
          action: "progress.milestone",
          rewards: { heart: 1 },
          scoreDelta: 5,
          meta: { milestoneId: `milestone-${hit}`, label: `${hit}%`, level: hit }
        });
        window.dispatchEvent(new CustomEvent("progress:milestone", { detail: { milestoneId: `milestone-${hit}`, label: `${hit}%`, level: hit }}));
        window.shToast?.(`🏁 Milestone ${hit}% · +1 ❤️ · +5 score`);
      } catch {}
    }
  }

  return (
    <div className="card card--pad" role="region" aria-label="Progress">
      <div className="sh-row" style={{ alignItems: "center" }}>
        <strong>Progress</strong>
        <div style={{ flex: 1 }} />
        <span className="subtle">{pct}%</span>
      </div>
      <div aria-label="Progress meter" style={{ height: 10, background:"#eee", borderRadius: 999, overflow:"hidden", marginTop: 8 }}>
        <div style={{ width: `${pct}%`, height:"100%", background:"#16a34a" }} />
      </div>
      <div className="sh-actionsRow" style={{ marginTop: 8 }}>
        {[25, 50, 75, 100].map((n) => (
          <button key={n} className="sh-btn sh-btn--secondary" onClick={() => setProgress(n)}>{n}%</button>
        ))}
      </div>
    </div>
  );
}
