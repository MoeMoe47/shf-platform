import React, { useMemo, useState } from "react";

export default function CountyInteractionLayer({
  countyCentroids = {},
  county = "Franklin",
  profile,
  onSelectCounty,
  onOpenDetail,
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
  const recommendedAction = profile?.recommendedAction || "Open County Detail";

  const analystSummary = useMemo(() => {
    return (
      profile?.analystSummary ||
      `${countyName} is showing elevated intervention pressure, documentation sensitivity, and stalled reading recovery. Recommended next move: assign intervention and verify service delivery within the next reporting window.`
    );
  }, [profile, countyName]);

  const sim = simResult?.output || null;

  const riskColor =
    /high/i.test(risk) ? "#ff7070" :
    /attention|warn|moderate/i.test(risk) ? "#f3b14f" :
    "#7fe0a1";

  async function handleRunSimulation() {
    setSimLoading(true);
    setSimError("");
    setSimResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8090/run", {
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

  const panelStyle = {
    borderRadius: "14px",
    border: "1px solid rgba(120, 162, 224, 0.14)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.015) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: countyCentroids?.[countyName?.toLowerCase()]?.top || "42%",
          left: countyCentroids?.[countyName?.toLowerCase()]?.left || "56%",
          width: sim ? "72px" : "54px",
          height: sim ? "72px" : "54px",
          transform: "translate(-50%, -50%)",
          borderRadius: "999px",
          background: sim
            ? `radial-gradient(circle, ${riskColor}44 0%, ${riskColor}18 38%, transparent 72%)`
            : "radial-gradient(circle, rgba(255,132,58,0.28) 0%, rgba(255,132,58,0.12) 38%, rgba(255,132,58,0.02) 70%, transparent 100%)",
          filter: "blur(2px)",
          pointerEvents: "none",
        }}
      />

      <button
        type="button"
        title={`${countyName} County`}
        aria-label={`${countyName} County`}
        onClick={() => {
          if (typeof onSelectCounty === "function") onSelectCounty("Franklin");
          setOpen(true);
        }}
        style={{
          position: "absolute",
          top: countyCentroids?.[countyName?.toLowerCase()]?.top || "42%",
          left: countyCentroids?.[countyName?.toLowerCase()]?.left || "56%",
          width: sim ? "26px" : "22px",
          height: sim ? "26px" : "22px",
          borderRadius: "999px",
          border: sim ? `1px solid ${riskColor}` : 0,
          background: sim
            ? `linear-gradient(180deg, ${riskColor} 0%, ${riskColor}cc 100%)`
            : "linear-gradient(180deg, #ff8a44 0%, #ff6e2f 100%)",
          boxShadow: sim
            ? `0 0 18px ${riskColor}, 0 0 44px ${riskColor}aa, 0 0 92px ${riskColor}55`
            : "0 0 14px rgba(255,110,47,1), 0 0 34px rgba(255,110,47,0.75), 0 0 72px rgba(255,110,47,0.35)",
          transform: "translate(-50%, -50%)",
          cursor: "pointer",
          pointerEvents: "auto",
        }}
      />

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
              width: "min(560px, calc(100vw - 24px))",
              borderLeft: "1px solid rgba(120, 162, 224, 0.18)",
              background: "linear-gradient(180deg, rgba(7, 13, 24, 0.985) 0%, rgba(4, 9, 18, 0.995) 100%)",
              boxShadow: "-28px 0 80px rgba(0,0,0,0.5), inset 1px 0 0 rgba(255,255,255,0.03)",
              padding: "22px 20px 22px",
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
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(208, 220, 236, 0.60)",
                  }}
                >
                  County Command Drawer
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  {countyName}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(120, 162, 224, 0.22)",
                  background: "rgba(255,255,255,0.03)",
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
                ...panelStyle,
                padding: "18px 18px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(208, 220, 236, 0.58)",
                }}
              >
                Active County
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "40px",
                  lineHeight: 1,
                  fontWeight: 900,
                  color: "rgba(245, 249, 255, 0.98)",
                  letterSpacing: "-0.03em",
                }}
              >
                {countyName}
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {[
                ["Risk", risk, riskColor],
                ["Confidence", confidence, "rgba(245, 249, 255, 0.96)"],
                ["Funding", funding, "rgba(245, 249, 255, 0.96)"],
                ["Status", status, "rgba(245, 249, 255, 0.96)"],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  style={{
                    ...panelStyle,
                    padding: "14px 16px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(208, 220, 236, 0.60)",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: "10px",
                      fontSize: "18px",
                      fontWeight: 900,
                      color,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "16px",
                ...panelStyle,
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(208, 220, 236, 0.60)",
                  marginBottom: "10px",
                }}
              >
                Analyst Summary
              </div>
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: 1.62,
                  color: "rgba(220, 230, 242, 0.88)",
                }}
              >
                {analystSummary}
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                ...panelStyle,
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(208, 220, 236, 0.60)",
                  marginBottom: "10px",
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
                marginTop: "16px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => onOpenDetail && onOpenDetail()}
                style={{
                  height: "42px",
                  padding: "0 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 180, 98, 0.30)",
                  background: "linear-gradient(180deg, #da7a33 0%, #a8541d 100%)",
                  color: "#fff2e7",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                OPEN COUNTY DETAIL
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRunSimulation();
                }}
                disabled={simLoading}
                style={{
                  height: "42px",
                  padding: "0 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(120, 162, 224, 0.22)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#eef4ff",
                  fontWeight: 900,
                  cursor: simLoading ? "wait" : "pointer",
                  opacity: simLoading ? 0.8 : 1,
                }}
              >
                {simLoading ? "RUNNING..." : "RUN SIMULATION"}
              </button>
            </div>

            {(simLoading || simError || sim) && (
              <div
                style={{
                  marginTop: "18px",
                  ...panelStyle,
                  padding: "16px",
                  border: sim ? `1px solid ${riskColor}33` : panelStyle.border,
                  boxShadow: sim
                    ? `0 0 28px ${riskColor}22, inset 0 1px 0 rgba(255,255,255,0.04)`
                    : panelStyle.boxShadow,
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(208, 220, 236, 0.60)",
                    marginBottom: "10px",
                  }}
                >
                  Simulation Result
                </div>

                {simLoading && <div>Running county simulation...</div>}

                {!simLoading && simError && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(255, 95, 95, 0.08)",
                      border: "1px solid rgba(255, 95, 95, 0.16)",
                      color: "#ff9d9d",
                    }}
                  >
                    {String(simError)}
                  </div>
                )}

                {!simLoading && !simError && sim && (
                  <div style={{ display: "grid", gap: "14px", lineHeight: 1.55 }}>
                    <div>
                      <div style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.12em" }}>HEADLINE</div>
                      <div style={{ marginTop: "6px", fontWeight: 900, fontSize: "18px" }}>{sim.headline}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.12em" }}>SUMMARY</div>
                      <div style={{ marginTop: "6px", color: "rgba(220,230,242,0.88)" }}>{sim.summary}</div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          ...panelStyle,
                          padding: "12px",
                          border: `1px solid ${riskColor}33`,
                          boxShadow: `0 0 20px ${riskColor}18, inset 0 1px 0 rgba(255,255,255,0.04)`,
                        }}
                      >
                        <div style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.12em" }}>RISK</div>
                        <div style={{ marginTop: "6px", fontWeight: 800, color: riskColor }}>
                          {sim.riskLevel} ({sim.riskScore})
                        </div>
                      </div>

                      <div style={{ ...panelStyle, padding: "12px" }}>
                        <div style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.12em" }}>CONFIDENCE</div>
                        <div style={{ marginTop: "6px", fontWeight: 800 }}>{sim.confidence}%</div>
                      </div>

                      <div style={{ ...panelStyle, padding: "12px" }}>
                        <div style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.12em" }}>URGENCY</div>
                        <div style={{ marginTop: "6px", fontWeight: 800 }}>{sim.urgency}</div>
                      </div>

                      <div style={{ ...panelStyle, padding: "12px" }}>
                        <div style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.12em" }}>FUNDING IMPACT</div>
                        <div style={{ marginTop: "6px", fontWeight: 800 }}>{sim.fundingImpact}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.12em" }}>RECOMMENDED ACTION</div>
                      <div style={{ marginTop: "6px", fontWeight: 900, fontSize: "18px" }}>{sim.recommendedAction}</div>
                    </div>

                    {sim.projection && (
                      <div
                        style={{
                          ...panelStyle,
                          padding: "14px",
                          boxShadow: "0 0 24px rgba(255,120,60,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.12em", marginBottom: "8px" }}>PROJECTION</div>
                        <div style={{ color: "rgba(220,230,242,0.88)", lineHeight: 1.65 }}>
                          • Risk if action: {sim.projection.risk_if_action}<br />
                          • Risk if no action: {sim.projection.risk_if_no_action}<br />
                          • Funding if action: {sim.projection.funding_if_action}<br />
                          • Funding if no action: {sim.projection.funding_if_no_action}<br />
                          • {sim.projection.compliance_if_action}<br />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
