import React from "react";
import useIEPIntegration from "@/apps/iep/useIEPIntegration";

function money(value) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `$${value || 0}`;
  }
}

export default function IEPSystemCard() {
  const system = window.__SHS_EDU__ || {};
const summary = system.summary || {};
const riskEvents = system.riskEvents || [];
const funding = system.fundingSnapshot || {};
  const topRisk = riskEvents?.[0];

  return (
    <section
      aria-label="Education IEP system status"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(18,24,38,0.92) 0%, rgba(12,16,28,0.96) 100%)",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
        color: "#e8edf7",
        minHeight: 220,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.58)",
              marginBottom: 4,
            }}
          >
            Education Lane
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: 1.1,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            IEP System Status
          </h3>
        </div>

        <div
          style={{
            borderRadius: 999,
            padding: "8px 10px",
            background: "rgba(255,79,0,0.14)",
            border: "1px solid rgba(255,79,0,0.28)",
            color: "#ff9a66",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Readiness {funding?.readinessScore ?? 0}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {[
          ["Students", summary?.totalStudents ?? 0],
          ["High Risk", summary?.highRiskCount ?? 0],
          ["Verified", summary?.verifiedImprovementCount ?? 0],
          ["Funding", money(funding?.projectedIDEAFunding ?? summary?.projectedFunding ?? 0)],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              borderRadius: 12,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.56)",
                marginBottom: 6,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                lineHeight: 1,
                color: "#ffffff",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderRadius: 12,
          padding: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.56)",
            marginBottom: 6,
          }}
        >
          Recommended action
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 4,
          }}
        >
          {topRisk?.recommendedAction || "No action needed"}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          {topRisk
            ? `${topRisk.studentName} · ${topRisk.type} · ${topRisk.severity} risk · confidence ${Math.round((topRisk.confidence || 0) * 100)}%`
            : "No active IEP risk events"}
        </div>
      </div>
    </section>
  );
}
