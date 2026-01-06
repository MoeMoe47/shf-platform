// src/components/PathwayPersonalizerSheet.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function PathwayPersonalizerSheet({ open = false, onClose = () => {}, pathway = null }) {
  const credit = useCreditCtx();
  const p = pathway || { id: "path-demo", name: "Demo Pathway" };

  if (!open) return null;

  function commit() {
    try {
      credit?.earn?.({
        action: "pathway.selected",
        rewards: { corn: 2 },
        scoreDelta: 3,
        meta: { pathwayId: p.id, name: p.name, via: "personalizer" }
      });
      window.dispatchEvent(new CustomEvent("pathway:selected", { detail: { pathwayId: p.id, name: p.name }}));
      window.shToast?.(`🧭 Selected: ${p.name} · +2 🌽 · +3 score`);
    } catch {}
    onClose();
  }

  return (
    <>
      <div className="app-scrim is-visible" onClick={onClose} aria-hidden="true" />
      <div className="card card--pad" role="dialog" aria-modal="true" aria-label="Personalize Pathway"
           style={{ position:"fixed", inset:"10% 0 0 0", maxWidth:560, margin:"0 auto", zIndex:70 }}>
        <div className="sh-row" style={{ alignItems:"center" }}>
          <h3 className="h4" style={{ margin:0 }}>Personalize: {p.name}</h3>
          <div style={{ flex:1 }} />
          <button className="sh-btn sh-btn--secondary" onClick={onClose}>✕</button>
        </div>
        <p className="subtle" style={{ marginTop:8 }}>Confirm this pathway to unlock tailored lessons.</p>
        <div className="sh-actionsRow" style={{ marginTop:8 }}>
          <button className="sh-btn" onClick={commit}>Choose pathway</button>
          <button className="sh-btn sh-btn--secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
}
