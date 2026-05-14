import React from "react";
import DecisionActionBar from "./DecisionActionBar";
import RecommendationStrip from "./RecommendationStrip";
import StatusRail from "./StatusRail";

function SmallIconButton({ children }) {
  return (
    <button
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: "1px solid rgba(120,170,255,0.14)",
        background: "rgba(10,18,30,0.48)",
        color: "#dbe8ff",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function Panel({ title, children }) {
  return (
    <section
      style={{
        border: "1px solid rgba(148,163,184,0.12)",
        background: "rgba(7,14,24,0.52)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "15px 18px",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: 0.3,
          color: "#eef5ff",
          borderBottom: "1px solid rgba(148,163,184,0.10)",
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function MetricRow({ tone, label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "14px 1fr auto",
        alignItems: "center",
        gap: 10,
        padding: "14px 18px",
        borderBottom: "1px solid rgba(148,163,184,0.08)",
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          display: "inline-block",
          background: tone,
          boxShadow: `0 0 12px ${tone}55`,
        }}
      />
      <span style={{ fontSize: 15, fontWeight: 700, color: "#dfeaff" }}>
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 900, color: "#f7fbff" }}>
        {value}
      </span>
    </div>
  );
}

function RegionMarker({ left, top, tone, core }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 106,
        height: 106,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        border: `4px solid ${tone}`,
        boxShadow: `0 0 0 10px ${tone}22, 0 0 26px ${tone}44`,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: core,
          boxShadow: `0 0 20px ${core}88`,
        }}
      />
    </div>
  );
}

function ActionCard({ icon, text, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 92,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 20px",
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.10)",
        background: "rgba(9,16,29,0.55)",
        color: "#eef4ff",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 24, fontWeight: 800, color: tone }}>
        {text}
      </span>
    </button>
  );
}

function ModeTabs({ selectedPanel, setSelectedPanel }) {
  const tabs = [
    { key: "executive", label: "Executive" },
    { key: "operations", label: "Operations" },
    { key: "summary", label: "Summary" },
  ];

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 10,
        padding: 10,
        borderRadius: 14,
        border: "1px solid rgba(120,170,255,0.14)",
        background: "rgba(8,18,34,0.30)",
        backdropFilter: "blur(8px)",
      }}
    >
      {tabs.map((tab) => {
        const active = selectedPanel === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setSelectedPanel(tab.key)}
            style={{
              height: 42,
              padding: "0 18px",
              borderRadius: 10,
              border: active
                ? "1px solid rgba(255,170,90,0.44)"
                : "1px solid rgba(120,170,255,0.14)",
              background: active
                ? "linear-gradient(180deg, rgba(186,102,52,0.90) 0%, rgba(91,46,21,0.92) 100%)"
                : "rgba(14,22,36,0.74)",
              color: "#f8fbff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0.25,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ExecutiveOverlay({
  activeAction,
  setActiveAction,
  selectedPanel,
  setSelectedPanel,
  recommendation,
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        color: "#eef5ff",
        padding: 18,
      }}
    >
      <div style={{ maxWidth: 1460, margin: "0 auto" }}>
        {/* HEADER */}
        <header
          style={{
            height: 62,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            border: "1px solid rgba(148,163,184,0.12)",
            background: "rgba(5,10,20,0.50)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SmallIconButton>☰</SmallIconButton>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  color: "#f8fbff",
                }}
              >
                SHS
              </span>
              <span
                style={{
                  fontSize: 17,
                  color: "rgba(220,232,252,0.82)",
                  fontWeight: 600,
                }}
              >
                Exchange Command
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 10,
                border: "1px solid rgba(120,170,255,0.14)",
                background: "rgba(10,18,30,0.48)",
                color: "#dbe8ff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Summary
            </button>
            <SmallIconButton>🔔</SmallIconButton>
            <SmallIconButton>⚙</SmallIconButton>
          </div>
        </header>

        {/* DECISION BANNER */}
        <section
          style={{
            minHeight: 112,
            display: "grid",
            placeItems: "center",
            paddingTop: 16,
            paddingBottom: 10,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                lineHeight: 1.08,
                fontWeight: 900,
                color: "#f4f8ff",
                textShadow: "0 10px 40px rgba(0,0,0,0.26)",
              }}
            >
              System Stable — 2 Regions Need Attention
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <StatusRail
                activeAction={activeAction}
                selectedPanel={selectedPanel}
              />
            </div>
          </div>
        </section>

        {/* MODE + RECOMMENDATION */}
        <section
          style={{
            display: "grid",
            justifyItems: "center",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <ModeTabs
            selectedPanel={selectedPanel}
            setSelectedPanel={setSelectedPanel}
          />
          <RecommendationStrip recommendation={recommendation} />
        </section>

        {/* MAIN GRID */}
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "280px minmax(0, 1fr)",
            gap: 18,
            alignItems: "stretch",
            minHeight: 620,
          }}
        >
          {/* LEFT RAIL */}
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              paddingTop: 34,
            }}
          >
            <Panel title="Overview">
              <MetricRow tone="#8bd85f" label="Active" value="1,450" />
              <MetricRow tone="#f59e0b" label="Overloaded" value="28" />
              <div style={{ borderBottom: 0 }}>
                <MetricRow tone="#ef4444" label="Critical" value="6" />
              </div>
            </Panel>

            <Panel title="AI Recommendation">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr",
                  gap: 12,
                  padding: 18,
                  alignItems: "start",
                }}
              >
                <div style={{ fontSize: 24, lineHeight: 1 }}>💡</div>
                <div
                  style={{
                    fontSize: 17,
                    lineHeight: 1.35,
                    fontWeight: 700,
                    color: "#edf4ff",
                  }}
                >
                  {recommendation.body}
                </div>
              </div>
            </Panel>
          </aside>

          {/* EARTH / MAP STAGE */}
          <section
            aria-label="Operational earth stage"
            style={{
              position: "relative",
              minHeight: 620,
              borderRadius: 22,
              overflow: "hidden",
              border: "1px solid rgba(148,163,184,0.08)",
              background:
                "radial-gradient(circle at 50% 18%, rgba(147,197,253,0.09), transparent 24%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.10), transparent 36%), linear-gradient(180deg, rgba(3,8,18,0.10), rgba(3,8,18,0.20))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.03), 0 24px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 15% 18%, rgba(255,255,255,0.72) 0 1px, transparent 2px), radial-gradient(circle at 28% 22%, rgba(255,255,255,0.35) 0 1px, transparent 2px), radial-gradient(circle at 62% 12%, rgba(255,255,255,0.45) 0 1px, transparent 2px), radial-gradient(circle at 80% 16%, rgba(255,255,255,0.32) 0 1px, transparent 2px), radial-gradient(circle at 88% 28%, rgba(255,255,255,0.24) 0 1px, transparent 2px), radial-gradient(circle at 12% 42%, rgba(255,255,255,0.18) 0 1px, transparent 2px)",
                opacity: 0.58,
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "-4%",
                right: "-4%",
                bottom: "-32%",
                height: "74%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 50% 25%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(180deg, rgba(122,168,226,0.72), rgba(17,36,68,0.92) 24%, rgba(4,8,16,1) 70%)",
                boxShadow:
                  "0 -8px 42px rgba(147,197,253,0.24), inset 0 20px 50px rgba(255,255,255,0.05)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "18%",
                width: "82%",
                height: "34%",
                transform: "translateX(-50%)",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse at center, rgba(125,185,255,0) 56%, rgba(175,225,255,0.16) 66%, rgba(125,185,255,0) 76%)",
                filter: "blur(12px)",
                opacity: 0.92,
                pointerEvents: "none",
              }}
            />

            <RegionMarker
              left="28%"
              top="54%"
              tone="rgba(139,216,95,0.92)"
              core="#d9ff98"
            />
            <RegionMarker
              left="55%"
              top="58%"
              tone="rgba(245,158,11,0.92)"
              core="#ffd27a"
            />
            <RegionMarker
              left="72%"
              top="50%"
              tone="rgba(239,68,68,0.92)"
              core="#ffc0b8"
            />
            <RegionMarker
              left="64%"
              top="43%"
              tone="rgba(239,68,68,0.92)"
              core="#ffc0b8"
            />

            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 18,
              }}
            >
              <DecisionActionBar
                activeAction={activeAction}
                setActiveAction={setActiveAction}
              />
            </div>
          </section>
        </main>

        {/* BOTTOM ACTION STRIP */}
        <section
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 18,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.12)",
            borderRadius: 18,
            background: "rgba(9,16,29,0.66)",
            backdropFilter: "blur(12px)",
          }}
        >
          <ActionCard
            icon="📍"
            text="New York Alert"
            tone="#fff4f2"
            onClick={() => setActiveAction("hold")}
          />
          <ActionCard
            icon="◯"
            text="Denver Overload"
            tone="#ffd9a8"
            onClick={() => setActiveAction("review")}
          />
          <ActionCard
            icon="✔"
            text="West Coast Stable"
            tone="#d9ffbf"
            onClick={() => setActiveAction("execute")}
          />
        </section>
      </div>
    </div>
  );
}
