import React from "react";

function EventCard({ evt }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: 12,
        background: "rgba(255,255,255,0.03)",
        marginBottom: 10,
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
          {evt.event_type}
        </strong>
        <span
          style={{
            opacity: 0.7,
            fontSize: 12,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {evt.created_at}
        </span>
      </div>

      <div
        style={{
          fontSize: 13,
          opacity: 0.9,
          marginBottom: 4,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        <strong>Entity:</strong> {evt.entity_type} / {evt.entity_id}
      </div>

      <div
        style={{
          fontSize: 13,
          opacity: 0.9,
          marginBottom: 8,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        <strong>Actor:</strong> {evt.actor_id}
      </div>

      <div
        style={{
          maxHeight: 220,
          overflow: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: 8,
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <pre
          style={{
            margin: 0,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            maxWidth: "100%",
          }}
        >
          {JSON.stringify(evt.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function OperatorEventTimeline({ events = [], loading = false, error = "" }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 16,
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ margin: 0 }}>Operator Event Timeline</h3>
        <span style={{ opacity: 0.7, fontSize: 12 }}>{events.length} events</span>
      </div>

      {loading ? <div>Loading events…</div> : null}
      {error ? <div style={{ color: "#ff8080", marginBottom: 10, wordBreak: "break-word", overflowWrap: "anywhere" }}>{error}</div> : null}

      {!loading && !events.length ? (
        <div style={{ opacity: 0.7 }}>No operator events yet.</div>
      ) : null}

      {!loading && events.map((evt) => <EventCard key={evt.id} evt={evt} />)}
    </section>
  );
}
