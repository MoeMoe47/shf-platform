import React, { useEffect, useState } from "react";

export default function BFEStatusCard() {
  const [bfeData, setBfeData] = useState(null);
  const [bfeTrend, setBfeTrend] = useState("→ Stable");
  const [bfeUpdatedAt, setBfeUpdatedAt] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadBfe = () => {
      fetch("http://127.0.0.1:8090/bfe/summary")
        .then((res) => res.json())
        .then((data) => {
          if (!mounted) return;

          setBfeData((prev) => {
            const prevSuccess = prev ? Number(prev.success_rate ?? 0) : null;
            const nextSuccess = Number(data?.success_rate ?? 0);

            if (prevSuccess !== null) {
              if (nextSuccess > prevSuccess) setBfeTrend("↑ Improving");
              else if (nextSuccess < prevSuccess) setBfeTrend("↓ Declining");
              else setBfeTrend("→ Stable");
            }

            return data;
          });

          setBfeUpdatedAt(new Date().toLocaleTimeString());
        })
        .catch(() => {
          if (mounted) setBfeData(null);
        });
    };

    loadBfe();
    const interval = setInterval(loadBfe, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        width: 280,
        padding: 16,
        background: "rgba(0,0,0,0.62)",
        border: "1px solid rgba(255,165,0,0.45)",
        borderRadius: 12,
        color: "#fff",
        zIndex: 100,
        boxShadow: "0 0 24px rgba(255,165,0,0.16)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: 10,
          fontSize: 14,
          letterSpacing: "0.3px",
        }}
      >
        BFE SYSTEM STATUS
      </div>

      {bfeData ? (
        <>
          <div style={{ marginBottom: 6 }}>Decisions: {bfeData.decisions}</div>
          <div style={{ marginBottom: 6 }}>Outcomes: {bfeData.outcomes}</div>

          <div
            style={{
              color:
                bfeData.success_rate > 0.8
                  ? "#00FFAA"
                  : bfeData.success_rate > 0.5
                  ? "#FFD700"
                  : "#FF5C5C",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Success: {(bfeData.success_rate * 100).toFixed(0)}%
          </div>

          <div style={{ fontSize: 12, opacity: 0.92, marginBottom: 6 }}>
            Trend: {bfeTrend}
          </div>

          <div style={{ fontSize: 11, opacity: 0.7 }}>
            Updated: {bfeUpdatedAt || "—"}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, opacity: 0.85 }}>Loading...</div>
      )}
    </div>
  );
}
