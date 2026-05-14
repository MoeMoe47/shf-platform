export default function ProofSection({ title, children }) {
  return (
    <div
      style={{
        marginTop: 28,
        padding: 18,
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.15)",
        background: "rgba(2,6,23,0.92)",
        color: "#e2e8f0"
      }}
    >
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}
