import React from "react";
import AIAnalystPanel from "@/pages/shf-command/sections/AIAnalystPanel";
import TrustVerificationPanel from "@/pages/shf-command/sections/TrustVerificationPanel";
import ReportsBriefingsPanel from "@/pages/shf-command/sections/ReportsBriefingsPanel";

function titleCase(value = "") {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function countyToEntityId(slug) {
  const normalized = String(slug || "").toLowerCase();
  if (normalized === "franklin") return "test_case_001";
  if (normalized === "cuyahoga") return "test_case_002";
  if (normalized === "hamilton") return "test_case_003";
  return "test_case_001";
}

function getCountySlug() {
  if (typeof window === "undefined") return "";
  const match = String(window.location.hash || "").match(/^#\/county\/([^/]+)$/i);
  return match?.[1] || "";
}

const TRUST_ITEMS = [
  { label: "Reporting Coverage", value: "Oracle driven" },
  { label: "Verification", value: "Live" },
  { label: "Readiness", value: "Live" },
  { label: "Confidence", value: "Live" },
];

const REPORT_ITEMS = [
  { label: "Board Brief", status: "Ready", confidence: "High" },
  { label: "Grant Narrative", status: "Pending", confidence: "Medium" },
  { label: "Audit Pack", status: "Ready", confidence: "High" },
];

function ReportsInstitutionalList({ items = [], onExportClick = null }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onExportClick?.(item)}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px solid rgba(165,132,97,0.14)",
            background: "rgba(255,255,255,0.78)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 700, color: "#4b3624" }}>{item.label}</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: item.status === "Ready" ? "#166534" : "#92400e",
              }}
            >
              {item.status}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: item.confidence === "High" ? "#14532d" : "#7c2d12",
              }}
            >
              {item.confidence} Confidence
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function CountyDetail() {
  const slug = getCountySlug();
  const county = titleCase(slug || "unknown");
  const entityId = countyToEntityId(slug);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f1e9",
        color: "#3f2d1d",
        padding: "28px 22px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <header
          style={{
            borderRadius: 24,
            border: "1px solid rgba(165,132,97,0.16)",
            background: "rgba(255,255,255,0.7)",
            padding: "22px 24px",
            boxShadow: "0 12px 28px rgba(81,58,36,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(90,67,45,0.68)",
                marginBottom: 8,
              }}
            >
              SHF County Command Surface
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 42,
                lineHeight: 1.05,
                fontWeight: 800,
              }}
            >
              {county} County
            </h1>
            <div
              style={{
                marginTop: 8,
                color: "rgba(90,67,45,0.78)",
                fontSize: 15,
              }}
            >
              County-level decision surface aligned to the SHF command system.
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.hash = "#/";
            }}
            style={{
              height: 46,
              padding: "0 18px",
              borderRadius: 14,
              border: "1px solid rgba(160,129,96,0.18)",
              background: "rgba(255,255,255,0.85)",
              color: "#6b4a2b",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Return to Impact Map
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(165,132,97,0.14)",
                background: "rgba(255,255,255,0.68)",
                padding: 20,
                boxShadow: "0 12px 30px rgba(81,58,36,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(90,67,45,0.68)",
                  marginBottom: 8,
                }}
              >
                County Overview
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                Live County Command Overview
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "#4b3624",
                }}
              >
                This county surface now uses the same Oracle-driven panel system as the SHF command center,
                giving you a safe county-level base for verification, reporting, and next-action decisions.
              </p>
            </div>

            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(165,132,97,0.14)",
                background: "rgba(255,255,255,0.68)",
                padding: 10,
                boxShadow: "0 12px 30px rgba(81,58,36,0.06)",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.35)",
                  fontWeight: 700,
                  color: "#065f46",
                  marginBottom: 10,
                }}
              >
                ⚡ ORACLE STATUS — Certified • Ready for Action • Confidence 100
              </div>

              <AIAnalystPanel
                entityId={entityId}
                onAction={() => {
                  console.log("Execute Oracle action for:", entityId);
                }}
              />
            </div>

            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(165,132,97,0.14)",
                background: "rgba(255,255,255,0.68)",
                padding: 10,
                boxShadow: "0 12px 30px rgba(81,58,36,0.06)",
              }}
            >
              <ReportsBriefingsPanel entityId={entityId} items={REPORT_ITEMS} />
              <div style={{ marginTop: 12 }}>
                <ReportsInstitutionalList
                  items={REPORT_ITEMS}
                  onExportClick={(item) => {
                    console.log("Open county report:", county, item.label);
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(165,132,97,0.14)",
                background: "rgba(255,255,255,0.68)",
                padding: 10,
                boxShadow: "0 12px 30px rgba(81,58,36,0.06)",
              }}
            >
              <TrustVerificationPanel entityId={entityId} items={TRUST_ITEMS} />
            </div>

            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(165,132,97,0.14)",
                background: "rgba(255,255,255,0.68)",
                padding: 22,
                boxShadow: "0 12px 30px rgba(81,58,36,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(90,67,45,0.68)",
                  marginBottom: 8,
                }}
              >
                County Metadata
              </div>
              <div style={{ display: "grid", gap: 12, color: "#4b3624" }}>
                <div><strong>County:</strong> {county}</div>
                <div><strong>Entity ID:</strong> {entityId}</div>
                <div><strong>Route:</strong> /county/{slug || "unknown"}</div>
                <div><strong>Mode:</strong> SHF county command surface</div>
                <div><strong>Decision Layer:</strong> State → County → Case</div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = `#/case/${entityId}`;
                  }}
                  style={{
                    height: 44,
                    marginTop: 6,
                    padding: "0 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(99,102,241,0.35)",
                    background: "rgba(99,102,241,0.10)",
                    color: "#4338ca",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  Open Case Command Surface
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
