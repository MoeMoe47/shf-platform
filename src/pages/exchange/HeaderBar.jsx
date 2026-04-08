import "./exchange-rhythm-polish.css";
function HeaderBar({ refresh, resetToLiveState }) {
  return (
    <div
      className="command-header" data-rhythm="header"
      style={{
        ...panel,
        height: 78,
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        padding: "0 16px",
        background: "rgba(8,15,24,0.52)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(92,140,198,0.14)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.015), 0 10px 28px rgba(0,0,0,0.24), 0 0 34px rgba(26,74,128,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {["✚", "▪", "◔"].map((icon, i) => (
            <div
              key={i}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: "1px solid rgba(120,170,230,0.16)",
                background: "rgba(8,15,24,0.74)",
                color: "#8ed2ff",
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.015)",
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        <div
          style={{
            width: 1,
            height: 28,
            background:
              "linear-gradient(180deg, rgba(120,170,230,0) 0%, rgba(120,170,230,0.24) 50%, rgba(120,170,230,0) 100%)",
            margin: "0 4px 0 2px",
          }}
        />

        <div
          className="command-logo"
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: "rgba(10,18,30,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 0 0 1px rgba(120,170,230,0.14), 0 0 22px rgba(68,146,234,0.16)",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <CommandLogo />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div
            style={{
              color: "#edf5fe",
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              lineHeight: 1.05,
            }}
          >
            Silicon Heartland Outcome Exchange
          </div>
          <div
            style={{
              color: "#7a92a9",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Operational Command Layer
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            height: 34,
            padding: "0 18px",
            borderRadius: 999,
            background: "rgba(20,70,52,0.52)",
            border: "1px solid rgba(94,214,154,0.16)",
            color: "#abf2c9",
            fontSize: 12,
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            boxShadow: "0 0 20px rgba(40,140,95,0.10)",
            whiteSpace: "nowrap",
          }}
        >
          Unclassified / Operational Data
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 348,
            height: 40,
            borderRadius: 12,
            border: "1px solid rgba(120,170,230,0.14)",
            background: "rgba(8,15,24,0.72)",
            color: "#7e97ac",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            fontSize: 14,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.015)",
          }}
        >
          ⌕&nbsp; Search
        </div>

        <button
          onClick={resetToLiveState}
          style={{
            height: 40,
            padding: "0 16px",
            borderRadius: 12,
            border: "1px solid rgba(122,224,178,0.18)",
            background: "rgba(17,60,44,0.34)",
            color: "#cffff0",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.015)",
            whiteSpace: "nowrap",
          }}
        >
          Reset to Live
        </button>

        <button
          onClick={refresh}
          style={{
            height: 40,
            padding: "0 18px",
            borderRadius: 12,
            border: "1px solid rgba(120,170,230,0.16)",
            background: "rgba(8,15,24,0.76)",
            color: "#edf5fe",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.015)",
            whiteSpace: "nowrap",
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default HeaderBar;