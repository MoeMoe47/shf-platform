import React, { useMemo, useState } from "react";

export default function FloatingFranklinNode({
  onSelect,
  countyName = "Franklin County",
  risk = "High Risk",
  confidence = "91%",
  funding = "$1.2M",
  status = "Monitored",
  summary = "",
  recommendedAction = "Open County Detail",
  top = "42%",
  left = "56%",
  onOpenDetail,
}) {
  const [open, setOpen] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState("");
  const [simResult, setSimResult] = useState(null);

  const drawerSummary = useMemo(() => {
    if (summary && summary.trim()) return summary.trim();
    return `${countyName} is showing elevated intervention pressure, documentation sensitivity, and stalled reading recovery. Recommended next move: assign intervention and verify service delivery within the next reporting window.`;
  }, [countyName, summary]);

  const riskColor =
    /high/i.test(risk) ? "#ff7070" :
    /attention|warn/i.test(risk) ? "#f3b14f" :
    "#7fe0a1";

  const handleOpen = () => {
    if (typeof onSelect === "function") onSelect("Franklin");
    setOpen(true);
  };

  async function handleRunSimulation() {
    setSimLoading(true);
    setSimError("");
    setSimResult(null);

    try {
      const res = await fetch("http://localhost:8090/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: "Layer09CaseSupportAgent",
          input: {
            region: countyName,
            issue: "Education Risk",
            priority: /high/i.test(risk) ? "High" : "Normal",
            confidence,
            funding,
            status,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Simulation request failed (${res.status})`);
      }

      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      setSimError(err?.message || "Simulation failed");
    } finally {
      setSimLoading(false);
    }
  }

  const prettyResult =
    simResult?.result ||
    simResult?.message ||
    simResult?.output ||
    simResult?.summary ||
    (typeof simResult === "string" ? simResult : "");

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 4,
        }}
      >
        <button
          type="button"
          onClick={handleOpen}
          title={countyName}
          aria-label={countyName}
          style={{
            position: "absolute",
            top,
            left,
            width: "22px",
            height: "22px",
            borderRadius: "999px",
            border: "0",
            background: "#ff6e2f",
            boxShadow:
              "0 0 18px rgba(255,110,47,1), 0 0 48px rgba(255,110,47,0.8)",
            transform: "translate(-50%, -50%)",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        />
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            pointerEvents: "auto",
          }}
        >
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(4, 10, 18, 0.62)",
              backdropFilter: "blur(5px)",
            }}
          />

          <aside
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(520px, calc(100vw - 24px))",
              borderLeft: "1px solid rgba(120, 162, 224, 0.22)",
              background:
                "linear-gradient(180deg, rgba(8, 14, 26, 0.985) 0%, rgba(5, 10, 20, 0.995) 100%)",
              boxShadow: "-24px 0 60px rgba(0,0,0,0.42)",
              padding: "22px 20px 20px",
              color: "#eef4ff",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(208, 220, 236, 0.60)",
                  }}
                >
                  County Command Drawer
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "30px",
                    fontWeight: 900,
                    lineHeight: 1,
                    color: "rgba(245, 249, 255, 0.98)",
                  }}
                >
                  {countyName}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  height: "38px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(120, 162, 224, 0.22)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#eef4ff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                CLOSE
              </button>
            </div>

            <div
              style={{
                marginTop: "18px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {[
                ["Risk", risk],
                ["Confidence", confidence],
                ["Funding", funding],
                ["Status", status],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(120, 162, 224, 0.14)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: "rgba(208, 220, 236, 0.62)",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontSize: "18px",
                      fontWeight: 900,
                      color: label === "Risk" ? riskColor : "rgba(245, 249, 255, 0.96)",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(120, 162, 224, 0.12)",
                background: "rgba(255,255,255,0.018)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "rgba(208, 220, 236, 0.62)",
                  marginBottom: "8px",
                }}
              >
                Analyst Summary
              </div>
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: 1.55,
                  color: "rgba(220, 230, 242, 0.84)",
                }}
              >
                {drawerSummary}
              </div>
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(120, 162, 224, 0.12)",
                background: "rgba(255,255,255,0.018)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "rgba(208, 220, 236, 0.62)",
                  marginBottom: "8px",
                }}
              >
                Recommended Action
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "rgba(245, 249, 255, 0.98)",
                }}
              >
                {recommendedAction}
              </div>
            </div>

            <div
              style={{
                marginTop: "18px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (typeof onOpenDetail === "function") onOpenDetail();
                }}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 180, 98, 0.32)",
                  background: "linear-gradient(180deg, #d87329 0%, #9d4d18 100%)",
                  color: "#fff2e7",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                OPEN COUNTY DETAIL
              </button>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRunSimulation(); }}
                disabled={simLoading}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(120, 162, 224, 0.22)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#eef4ff",
                  fontWeight: 800,
                  cursor: simLoading ? "wait" : "pointer",
                  opacity: simLoading ? 0.7 : 1,
                }}
              >
                {simLoading ? "RUNNING..." : "RUN SIMULATION"}
              </button>
            </div>

            {(simLoading || simError || simResult) && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(120, 162, 224, 0.12)",
                  background: "rgba(255,255,255,0.018)",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: "rgba(208, 220, 236, 0.62)",
                    marginBottom: "8px",
                  }}
                >
                  Simulation Result
                </div>

                {simLoading && (
                  <div style={{ fontSize: "14px", color: "rgba(220, 230, 242, 0.84)" }}>
                    Running county simulation...
                  </div>
                )}

                {!simLoading && simError && (
                  <div style={{ fontSize: "14px", color: "#ff9090" }}>
                    {simError}
                  </div>
                )}

                {!simLoading && !simError && prettyResult && (
                  <div
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.55,
                      color: "rgba(220, 230, 242, 0.84)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {prettyResult}
                  </div>
                )}

                {!simLoading && !simError && !prettyResult && simResult && (
                  <pre
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      lineHeight: 1.5,
                      color: "rgba(220, 230, 242, 0.84)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
