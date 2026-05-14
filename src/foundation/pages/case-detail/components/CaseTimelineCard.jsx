import React from "react";

export default function CaseTimelineCard({
  timeline,
  cardStyle,
  SectionLabel,
}) {
  const items = timeline?.visible || [];
  const hiddenCount = timeline?.hiddenCount || 0;

  return (
    <div style={cardStyle}>
      <SectionLabel>Case Timeline</SectionLabel>
      <div style={{ display: "grid", gap: 12 }}>
        {items.length ? (
          items.map((e, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                border: "1px solid rgba(165,132,97,0.14)",
                borderRadius: 16,
                background: "rgba(255,255,255,0.78)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                {e.title}
              </div>
              <div style={{ marginBottom: 6 }}>{e.detail}</div>

              {e.repeatCount && e.repeatCount > 1 ? (
                <div style={{ fontSize: 12, color: "#92400e", marginBottom: 6 }}>
                  repeated x{e.repeatCount}
                </div>
              ) : null}

              <small>{e.time ? new Date(e.time).toLocaleString() : "—"}</small>
            </div>
          ))
        ) : (
          <div>No events yet.</div>
        )}

        {hiddenCount > 0 ? (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.22)",
              color: "#92400e",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {hiddenCount} older backlog events hidden to keep the timeline readable.
          </div>
        ) : null}
      </div>
    </div>
  );
}
