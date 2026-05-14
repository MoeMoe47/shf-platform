import React from "react";

export default function DebtEducation() {
  const qs = (window.location.hash.includes("?") ? window.location.hash.split("?")[1] : "") || "";
  const qstr = qs ? `?${qs}` : "";

  const cards = [
    { title: "Budgeting 101", href: `/curriculum.html#/asl/lessons${qstr}` },
    { title: "Understanding Interest", href: `/curriculum.html#/asl/lessons${qstr}` },
    { title: "Credit Scores & Reports", href: `/career.html#/credit/report${qstr}` },
  ];

  return (
    <div className="page pad" data-page="debt-education">
      <header className="card card--pad">
        <h1 style={{ margin: 0 }}>Financial Literacy</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>
          Learn core concepts and apply them to your payoff plan.
        </p>
      </header>

      <div className="skel skel--row" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
        {cards.map((c, i) => (
          <a key={i} className="card card--pad" href={c.href} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 700 }}>{c.title}</div>
            <div style={{ marginTop: 8, color: "var(--ink-soft)" }}>Open →</div>
          </a>
        ))}
      </div>
    </div>
  );
}
