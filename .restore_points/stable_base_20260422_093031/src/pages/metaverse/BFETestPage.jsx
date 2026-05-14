import React, { useEffect, useMemo, useState } from "react";

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function computeConfidence(data, history) {
  if (!data) return 0;

  const decisions = Number(data.decisions ?? 0);
  const outcomes = Number(data.outcomes ?? 0);
  const success = Number(data.success_rate ?? 0);

  const volumeFactor = Math.min((decisions + outcomes) / 10, 1);
  const historyFactor = Math.min(history.length / 7, 1);
  const score = ((success * 0.5) + (volumeFactor * 0.3) + (historyFactor * 0.2)) * 100;

  return Math.round(score);
}

function computeVolatility(history) {
  if (history.length < 3) return "Low";

  const diffs = [];
  for (let i = 1; i < history.length; i += 1) {
    diffs.push(Math.abs(history[i] - history[i - 1]));
  }

  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  if (avgDiff < 0.08) return "Low";
  if (avgDiff < 0.2) return "Medium";
  return "High";
}

function computeRecommendedAction(data, trend, volatility, confidence) {
  if (!data) return "Await More Data";

  const success = Number(data.success_rate ?? 0);
  const decisions = Number(data.decisions ?? 0);

  if (success >= 0.9 && volatility === "Low" && confidence >= 80) {
    return decisions >= 3 ? "Test Controlled Expansion" : "Maintain Current Strategy";
  }

  if (trend.includes("Improving") && confidence >= 70) {
    return "Increase Decision Volume";
  }

  if (volatility === "High") {
    return "Investigate Strategy Instability";
  }

  if (success < 0.6) {
    return "Intervene Before Scaling";
  }

  return "Maintain Current Strategy";
}

function computePrediction(data, history, trend, volatility, confidence) {
  if (!data) {
    return {
      nextLikelyOutcome: "UNKNOWN",
      riskLevel: "UNKNOWN",
      projectedSuccess: 0,
      continuationProbability: 0,
    };
  }

  const success = Number(data.success_rate ?? 0);
  const recentAvg =
    history.length > 0
      ? history.reduce((a, b) => a + b, 0) / history.length
      : success;

  let projection = recentAvg;

  if (trend.includes("Improving")) projection += 0.05;
  if (trend.includes("Declining")) projection -= 0.08;

  if (volatility === "Medium") projection -= 0.04;
  if (volatility === "High") projection -= 0.1;

  projection += ((confidence / 100) - 0.5) * 0.08;

  projection = clamp(projection);

  let riskLevel = "Low";
  if (projection < 0.85 || volatility === "Medium") riskLevel = "Medium";
  if (projection < 0.6 || volatility === "High") riskLevel = "High";

  const nextLikelyOutcome = projection >= 0.7 ? "SUCCESS" : "AT RISK";
  const continuationProbability = Math.round(clamp(projection * 0.92 + 0.04) * 100);

  return {
    nextLikelyOutcome,
    riskLevel,
    projectedSuccess: Math.round(projection * 100),
    continuationProbability,
  };
}

function buildAnalystSummary(data, trend, history, confidence, volatility, action, prediction) {
  if (!data) return "Analyst waiting for BFE data.";

  const decisions = Number(data.decisions ?? 0);
  const outcomes = Number(data.outcomes ?? 0);
  const success = Number(data.success_rate ?? 0);

  if (decisions === 0 && outcomes === 0) {
    return "No BFE activity detected yet. Record decisions and outcomes to activate intelligence.";
  }

  if (success >= 0.9 && volatility === "Low") {
    return `System performance is stable at a high level. Predicted continuation probability: ${prediction.continuationProbability}%. Recommend: ${action.toLowerCase()}.`;
  }

  if (success >= 0.75 && trend.includes("Improving")) {
    return `Performance is improving with ${confidence}% confidence. Projected success over the next 5 cycles is ${prediction.projectedSuccess}%. Recommend: ${action.toLowerCase()}.`;
  }

  if (success >= 0.6 && volatility === "Medium") {
    return `System performance is moderate and somewhat variable. Risk is ${prediction.riskLevel.toLowerCase()}. Recommend tighter execution and controlled testing.`;
  }

  if (success < 0.6) {
    return `Performance is weak. Predicted next likely outcome is ${prediction.nextLikelyOutcome.toLowerCase()}. Recommend intervention before scaling decisions.`;
  }

  return `System is active with ${confidence}% confidence. Next likely outcome: ${prediction.nextLikelyOutcome.toLowerCase()}.`;
}

function MiniTrendChart({ history }) {
  const points = useMemo(() => {
    const width = 320;
    const height = 90;
    const pad = 10;

    if (!history.length) return "";

    return history
      .map((v, i) => {
        const x =
          pad + (i * (width - pad * 2)) / Math.max(1, history.length - 1);
        const y = height - pad - v * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [history]);

  return (
    <div
      style={{
        marginTop: 14,
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 8 }}>
        7-CYCLE SUCCESS TREND
      </div>
      <svg viewBox="0 0 320 90" width="100%" height="90" style={{ display: "block" }}>
        <polyline
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          points="10,80 310,80"
        />
        {points ? (
          <>
            <polyline
              fill="none"
              stroke="#00FFAA"
              strokeWidth="3"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {history.map((v, i) => {
              const x = 10 + (i * (320 - 20)) / Math.max(1, history.length - 1);
              const y = 90 - 10 - v * (90 - 20);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#00FFAA"
                  opacity="0.95"
                />
              );
            })}
          </>
        ) : (
          <text x="10" y="48" fill="rgba(255,255,255,0.6)" fontSize="12">
            Waiting for enough cycles...
          </text>
        )}
      </svg>
    </div>
  );
}

export default function BFETestPage() {
  const [bfeData, setBfeData] = useState(null);
  const [bfeTrend, setBfeTrend] = useState("→ Stable");
  const [bfeUpdatedAt, setBfeUpdatedAt] = useState(null);
  const [history, setHistory] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

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

          setHistory((prev) => {
            const next = [...prev, Number(data?.success_rate ?? 0)];
            return next.slice(-7);
          });

          setRecentEvents((prev) => {
            const next = [
              {
                id: `${Date.now()}`,
                ts: new Date().toLocaleTimeString(),
                decisions: Number(data?.decisions ?? 0),
                outcomes: Number(data?.outcomes ?? 0),
                success: Number(data?.success_rate ?? 0),
              },
              ...prev,
            ];
            return next.slice(0, 5);
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

  const confidence = useMemo(() => computeConfidence(bfeData, history), [bfeData, history]);
  const volatility = useMemo(() => computeVolatility(history), [history]);
  const recommendedAction = useMemo(
    () => computeRecommendedAction(bfeData, bfeTrend, volatility, confidence),
    [bfeData, bfeTrend, volatility, confidence]
  );
  const prediction = useMemo(
    () => computePrediction(bfeData, history, bfeTrend, volatility, confidence),
    [bfeData, history, bfeTrend, volatility, confidence]
  );

  const analystSummary = useMemo(
    () =>
      buildAnalystSummary(
        bfeData,
        bfeTrend,
        history,
        confidence,
        volatility,
        recommendedAction,
        prediction
      ),
    [bfeData, bfeTrend, history, confidence, volatility, recommendedAction, prediction]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(30,50,80,0.65), rgba(8,10,16,1) 55%)",
        color: "#fff",
        padding: "32px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            marginBottom: "24px",
            padding: "20px 24px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: "0.18em" }}>
            CLEAN ROOM TEST SURFACE
          </div>
          <h1 style={{ margin: "10px 0 8px 0", fontSize: "34px" }}>
            Behavioral Feedback Engine
          </h1>
          <p style={{ margin: 0, opacity: 0.82, maxWidth: 760 }}>
            This isolated page verifies that BFE is live, polling correctly, and rendering
            safely outside the Interplanetary Mission page.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "20px",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              minHeight: "320px",
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
              SYSTEM OVERVIEW
            </div>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>BFE Live Intelligence Panel</h2>

            {bfeData ? (
              <div style={{ marginTop: 18 }}>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  Decisions: <strong>{bfeData.decisions}</strong>
                </div>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  Outcomes: <strong>{bfeData.outcomes}</strong>
                </div>
                <div
                  style={{
                    marginBottom: 12,
                    fontSize: 16,
                    color:
                      bfeData.success_rate > 0.8
                        ? "#00FFAA"
                        : bfeData.success_rate > 0.5
                        ? "#FFD700"
                        : "#FF5C5C",
                  }}
                >
                  Success Rate: <strong>{(bfeData.success_rate * 100).toFixed(0)}%</strong>
                </div>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  Trend: <strong>{bfeTrend}</strong>
                </div>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  Confidence: <strong>{confidence}%</strong>
                </div>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  Volatility: <strong>{volatility}</strong>
                </div>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  Next Likely Outcome: <strong>{prediction.nextLikelyOutcome}</strong>
                </div>
                <div
                  style={{
                    marginBottom: 12,
                    fontSize: 16,
                    color:
                      prediction.riskLevel === "Low"
                        ? "#00FFAA"
                        : prediction.riskLevel === "Medium"
                        ? "#FFD700"
                        : "#FF5C5C",
                  }}
                >
                  Risk Level: <strong>{prediction.riskLevel}</strong>
                </div>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  Projected Success (next 5): <strong>{prediction.projectedSuccess}%</strong>
                </div>
                <div style={{ marginBottom: 12, fontSize: 16 }}>
                  Continuation Probability: <strong>{prediction.continuationProbability}%</strong>
                </div>
                <div style={{ marginBottom: 12, fontSize: 16, color: "#FFD700" }}>
                  Recommended Action: <strong>{recommendedAction}</strong>
                </div>
                <div style={{ fontSize: 13, opacity: 0.72 }}>
                  Last Updated: {bfeUpdatedAt || "—"}
                </div>

                <MiniTrendChart history={history} />
              </div>
            ) : (
              <div style={{ marginTop: 18, opacity: 0.82 }}>Loading BFE data...</div>
            )}
          </div>

          <div style={{ display: "grid", gap: "20px" }}>
            <div
              style={{
                padding: "24px",
                borderRadius: "18px",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,165,0,0.28)",
                boxShadow: "0 0 24px rgba(255,165,0,0.08)",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
                STATUS CARD
              </div>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>BFE SYSTEM STATUS</div>

              {bfeData ? (
                <>
                  <div style={{ marginBottom: 8 }}>Decisions: {bfeData.decisions}</div>
                  <div style={{ marginBottom: 8 }}>Outcomes: {bfeData.outcomes}</div>
                  <div
                    style={{
                      marginBottom: 8,
                      color:
                        bfeData.success_rate > 0.8
                          ? "#00FFAA"
                          : bfeData.success_rate > 0.5
                          ? "#FFD700"
                          : "#FF5C5C",
                    }}
                  >
                    Success: {(bfeData.success_rate * 100).toFixed(0)}%
                  </div>
                  <div style={{ marginBottom: 8 }}>Trend: {bfeTrend}</div>
                  <div style={{ marginBottom: 8 }}>Confidence: {confidence}%</div>
                  <div style={{ marginBottom: 8 }}>Volatility: {volatility}</div>
                  <div style={{ marginBottom: 8 }}>Next: {prediction.nextLikelyOutcome}</div>
                  <div style={{ marginBottom: 8 }}>Risk: {prediction.riskLevel}</div>
                  <div style={{ marginBottom: 8 }}>
                    Projection: {prediction.projectedSuccess}%
                  </div>
                  <div style={{ marginBottom: 8, color: "#FFD700" }}>
                    Action: {recommendedAction}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.72 }}>
                    Updated: {bfeUpdatedAt || "—"}
                  </div>
                </>
              ) : (
                <div>Loading...</div>
              )}
            </div>

            <div
              style={{
                padding: "24px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
                ANALYST SUMMARY
              </div>
              <div style={{ lineHeight: 1.6, opacity: 0.92 }}>
                {analystSummary}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "24px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
            RECENT BFE EVENTS
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {recentEvents.length ? (
              recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 1fr 1fr",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.22)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ opacity: 0.72 }}>{evt.ts}</div>
                  <div>Decisions: {evt.decisions}</div>
                  <div>Outcomes: {evt.outcomes}</div>
                  <div>Success: {(evt.success * 100).toFixed(0)}%</div>
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.72 }}>No recent events yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
