// src/components/FundingPlanCard.jsx
import React from "react";
import { track } from "../utils/analytics.js";

export default function FundingPlanCard({ plan }) {
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    return (
      <section className="card card--pad" aria-label="Funding Plan">
        <h3 className="h3" style={{ marginTop: 0 }}>Funding Plan</h3>
        <p className="subtle" style={{ margin: 0 }}>
          No plan yet. Use the Funding Wizard to build a checklist of steps.
        </p>
      </section>
    );
  }

  function printChecklist() {
    try {
      const html = renderChecklistHTML(plan);
      const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
      try { track("funding_checklist_printed", { steps: plan.steps.length }, { silent: true }); } catch {}
    } catch {}
  }

  function copySteps() {
    try {
      const text = plan.steps.map((s, i) => `${i + 1}. ${s.program} — ${s.action}`).join("\n");
      navigator.clipboard?.writeText(text);
      try { track("funding_steps_copied", { steps: plan.steps.length }, { silent: true }); } catch {}
      alert("Copied funding steps to clipboard.");
    } catch {}
  }

  return (
    <section className="card card--pad" aria-label="Funding Plan">
      <div className="sh-row" style={{ alignItems: "center" }}>
        <h3 className="h3" style={{ margin: 0 }}>Funding Plan</h3>
        <div style={{ flex: 1 }} />
        <span className="sh-chip soft">Coverage: {title(plan.estCoverage)}</span>
      </div>

      <ul className="sh-listPlain" style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {plan.steps.map((s, idx) => (
          <li
            key={s.id || idx}
            className="sh-row"
            style={{ border: "1px solid var(--ring)", borderRadius: 10, padding: 8, gap: 8 }}
          >
            <span className="sh-chip">{s.program}</span>
            <div style={{ flex: 1 }}>
              <div><strong>Action:</strong> {s.action}</div>
              {Array.isArray(s.docs) && s.docs.length > 0 && (
                <div className="subtle" style={{ marginTop: 4 }}>
                  <strong>Docs:</strong> {s.docs.join(", ")}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {Array.isArray(plan.contacts) && plan.contacts.length > 0 && (
        <>
          <div className="subtle" style={{ marginTop: 10 }}><strong>Contacts & Hints</strong></div>
          <ul className="sh-listPlain" style={{ marginTop: 6 }}>
            {plan.contacts.map((c, i) => (
              <li key={i} className="sh-row" style={{ gap: 8 }}>
                <span className="sh-chip sh-chip--soft">{c.program}</span>
                <span className="subtle">{c.urlHint}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="sh-actionsRow" style={{ marginTop: 10 }}>
        <button className="sh-btn" onClick={copySteps}>Copy steps</button>
        <button className="sh-btn sh-btn--primary" onClick={printChecklist}>Download checklist</button>
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */
function title(s) {
  return String(s || "").replace(/\b\w/g, (m) => m.toUpperCase());
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderChecklistHTML(plan) {
  const rows = plan.steps
    .map(
      (s, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb;width:28px;">${i + 1}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">
          <div style="font-weight:700">${escapeHtml(s.program)}</div>
          <div>${escapeHtml(s.action)}</div>
          ${Array.isArray(s.docs) && s.docs.length
            ? `<div style="color:#6b7280;font-size:12px;margin-top:4px">Docs: ${escapeHtml(s.docs.join(", "))}</div>`
            : ""}
        </td>
        <td style="padding:8px;border:1px solid #e5e7eb;width:120px;">
          <input type="checkbox" style="transform:scale(1.2)" />
        </td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Funding Checklist</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @media print {
      @page { margin: 14mm; }
      .no-print { display: none !important; }
    }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#111; }
  </style>
</head>
<body>
  <h2 style="margin:0 0 8px 0;">Funding Checklist</h2>
  <div style="margin-bottom:12px;color:#6b7280">Estimated coverage: <strong>${escapeHtml(
    title(plan.estCoverage)
  )}</strong></div>
  <table style="border-collapse:collapse;width:100%">${rows}</table>
  <div class="no-print" style="margin-top:12px;">
    <button onclick="window.print()">Print</button>
  </div>
</body>
</html>`;
}
