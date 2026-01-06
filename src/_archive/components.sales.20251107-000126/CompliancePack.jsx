// src/components/sales/CompliancePack.jsx
import React from "react";

export default function CompliancePack(){
  const openDoc = (title, body) => {
    const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:ui-sans-serif,system-ui;-webkit-print-color-adjust:exact;padding:24px}
    h1{margin:.2em 0} .muted{color:#6b7280}</style>
    <h1>${title}</h1><div class="muted">Demo template</div>${body}`);
    w.document.close(); w.focus();
  };
  return (
    <section className="card card--pad" style={{ display:"grid", gap:10 }}>
      <h3 style={{ margin:0 }}>Compliance Pack</h3>
      <button className="sh-btn sh-btn--secondary" onClick={()=>openDoc("FERPA One-Pager", `<p>Data handling map, roles, retention…</p>`)}>FERPA One-Pager</button>
      <button className="sh-btn sh-btn--secondary" onClick={()=>openDoc("COPPA Statement", `<p>Under-13 protections, parent consent…</p>`)}>COPPA Statement</button>
      <button className="sh-btn sh-btn--secondary" onClick={()=>openDoc("DPIA Template", `<p>Template with risks & mitigations…</p>`)}>DPIA Template</button>
    </section>
  );
}
