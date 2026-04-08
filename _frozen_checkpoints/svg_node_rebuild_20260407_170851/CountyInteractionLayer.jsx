import React, { useMemo, useState } from "react";

export default function CountyInteractionLayer({
  countyCentroids = {},
  county = "Franklin",
  profile,
  onSelectCounty,
}) {
  const [open, setOpen] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState("");
  const [simResult, setSimResult] = useState(null);

  const countyName = county || profile?.label || "Franklin";
  const risk = profile?.riskStatus || "High Risk";
  const confidence = profile?.confidence || "91%";
  const funding = profile?.funding || "$1.2M";
  const status = profile?.mapMetrics?.status || "Monitored";

  const analystSummary = useMemo(() => {
    return (
      profile?.analystSummary ||
      `${countyName} is showing elevated intervention pressure.`
    );
  }, [profile, countyName]);

  const sim = simResult?.output || null;

  const riskColor =
    /high/i.test(risk) ? "#ff7070" :
    /attention|warn/i.test(risk) ? "#f3b14f" :
    "#7fe0a1";

  async function handleRunSimulation() {
    setSimLoading(true);
    setSimError("");
    setSimResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8090/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: countyName }),
      });

      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      setSimError("Simulation failed");
    } finally {
      setSimLoading(false);
    }
  }

  const counties = [
    { key: "franklin", label: "Franklin", color: "#ff8a44" },
    { key: "cuyahoga", label: "Cuyahoga", color: "#f3b14f" },
    { key: "hamilton", label: "Hamilton", color: "#ff7070" },
    { key: "lucas", label: "Lucas", color: "#7aa6ff" },
    { key: "summit", label: "Summit", color: "#7fe0a1" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 4 }}>
      
      {/* NODES */}
      {counties.map((node) => {
        const isActive = countyName.toLowerCase() === node.key;
        const centroid = countyCentroids[node.key];
        if (!centroid) return null;
        const top = centroid.top;
        const left = centroid.left;
        const color = isActive ? riskColor : node.color;

        return (
          <React.Fragment key={node.key}>
            <div
              className={isActive ? "county-node-halo is-active" : "county-node-halo"}
              style={{
                position: "absolute",
                top,
                left,
                width: "50px",
                height: "50px",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
              }}
            />
            <button
              className={isActive ? "county-node-dot is-active" : "county-node-dot"}
              onClick={() => {
                onSelectCounty?.(node.label);
                setOpen(true);
              }}
              style={{
                position: "absolute",
                top,
                left,
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: color,
                boxShadow: isActive
                  ? `0 0 22px ${color}, 0 0 48px ${color}88`
                  : `0 0 10px ${color}66`,
                boxShadow: isActive
                  ? `0 0 22px ${color}, 0 0 48px ${color}88`
                  : `0 0 10px ${color}66`,
                transform: "translate(-50%, -50%)",
                cursor: "pointer",
              }}
            />
          </React.Fragment>
        );
      })}

      {/* DRAWER */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }}
          />
          <aside
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "400px",
              background: "#0b1320",
              color: "#fff",
              padding: "20px",
            }}
          >
            <h2>{countyName}</h2>
            <p>{analystSummary}</p>

            <button onClick={handleRunSimulation}>
              Run Simulation
            </button>

            {simLoading && <p>Loading...</p>}
            {simError && <p>{simError}</p>}
            {sim && <pre>{JSON.stringify(sim, null, 2)}</pre>}
          </aside>
        </div>
      )}
    </div>
  );
}




/* ===== NODE PULSE ===== */
const style = document.createElement('style');
style.innerHTML = `
@keyframes shfNodePulse {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
`;
document.head.appendChild(style);
