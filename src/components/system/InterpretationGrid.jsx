export default function InterpretationGrid({ children }) {
  return (
    <div
      style={{
        marginTop: 20,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}
