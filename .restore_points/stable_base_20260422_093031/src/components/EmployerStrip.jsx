// src/components/EmployerStrip.jsx
import React from "react";

export default function EmployerStrip({ employers = [], partners = [] }) {
  const items = employers.length ? employers.slice(0, 8) : partners.map(p => p.name).slice(0, 8);
  if (!items.length) return null;

  return (
    <div className="sh-legend" aria-label="Hiring partners">
      {items.map((name, i) => (
        <span key={i} className="sh-chip soft" title={name}>
          {name}
        </span>
      ))}
    </div>
  );
}
