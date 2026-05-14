import React from "react";

const ACTIONS = [
  { key: "execute", label: "Execute", tone: "rgba(34,197,94,0.95)" },
  { key: "review", label: "Review", tone: "rgba(59,130,246,0.95)" },
  { key: "hold", label: "Hold", tone: "rgba(239,68,68,0.95)" },
];

export default function DecisionActionBar({ activeAction, setActiveAction }) {
  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "inline-flex",
        gap: 12,
        padding: 12,
        borderRadius: 18,
        border: "1px solid rgba(120,170,255,0.18)",
        background: "rgba(6,12,22,0.62)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 18px 48px rgba(0,0,0,0.3)",
      }}
    >
      {ACTIONS.map((action) => {
        const active = activeAction === action.key;
        return (
          <button
            key={action.key}
            onClick={() => setActiveAction(action.key)}
            style={{
              border: active
                ? `1px solid ${action.tone}`
                : "1px solid rgba(120,170,255,0.16)",
              background: active
                ? `linear-gradient(180deg, ${action.tone} 0%, rgba(15,23,42,0.9) 100%)`
                : "linear-gradient(180deg, rgba(19,28,43,0.88) 0%, rgba(9,13,22,0.92) 100%)",
              color: "#f8fbff",
              padding: "12px 20px",
              minWidth: 126,
              borderRadius: 14,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 0.35,
              boxShadow: active
                ? "0 12px 24px rgba(0,0,0,0.32)"
                : "none",
            }}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
