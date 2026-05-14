// src/components/sales/SalesHeader.jsx
import Emoji from "@/components/ui/Emoji.jsx";

export default function SalesHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        padding: "10px 12px",
        borderBottom: "1px solid #eee",
        background: "var(--surface, #fff)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
        <Emoji name="rocket" label="Launch" />
        Sales Dashboard
      </h1>
    </header>
  );
}
