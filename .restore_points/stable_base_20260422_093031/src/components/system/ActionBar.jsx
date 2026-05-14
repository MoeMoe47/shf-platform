export default function ActionBar({ children }) {
  return (
    <div
      style={{
        marginTop: 24,
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
      }}
    >
      {children}
    </div>
  );
}
