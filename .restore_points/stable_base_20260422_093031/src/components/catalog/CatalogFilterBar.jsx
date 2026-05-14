import React from "react";

const tabs = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI Innovation Track" },
  { id: "smart", label: "Smart Contracts" },
  { id: "stack", label: "Silicon Stack" },
  { id: "deaf", label: "Deaf Pilot" },
];

export default function CatalogFilterBar() {
  const [active, setActive] = React.useState("all");
  return (
    <nav className="cat-tabs" aria-label="Catalog filters">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`cat-tab ${active === t.id ? "is-active" : ""}`}
          onClick={() => setActive(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
