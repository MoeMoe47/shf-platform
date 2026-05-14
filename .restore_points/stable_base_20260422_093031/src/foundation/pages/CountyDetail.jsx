import React from "react";
import { useParams } from "react-router-dom";

function titleCase(value = "") {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function CountyDetail() {
  const { slug } = useParams();
  const county = titleCase(slug || "unknown");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f1e9",
        color: "#3f2d1d",
        padding: "40px 28px 56px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
              SHF County Surface
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 44,
                lineHeight: 1.05,
                fontWeight: 700,
              }}
            >
              {county} County
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.hash = "#/";
            }}
            style={{
              height: 44,
              padding: "0 18px",
              borderRadius: 14,
              border: "1px solid rgba(160,129,96,0.18)",
              background: "rgba(255,255,255,0.78)",
              color: "#6b4a2b",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Return to Impact Map
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr 0.95fr",
            gap: 20,
          }}
        >
          <section
            style={{
              borderRadius: 28,
              border: "1px solid rgba(165,132,97,0.14)",
              background: "rgba(255,255,255,0.62)",
              minHeight: 420,
              padding: 24,
              boxShadow: "0 12px 30px rgba(81,58,36,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(90,67,45,0.68)",
                marginBottom: 10,
              }}
            >
              County Command Surface
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>
              {county} Performance Overview
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0 }}>
              This county surface is back online. The route is working, the page is visible,
              and this is now the safe base for rebuilding the full county experience.
            </p>
          </section>

          <section
            style={{
              borderRadius: 28,
              border: "1px solid rgba(165,132,97,0.14)",
              background: "rgba(255,255,255,0.62)",
              minHeight: 420,
              padding: 24,
              boxShadow: "0 12px 30px rgba(81,58,36,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(90,67,45,0.68)",
                marginBottom: 10,
              }}
            >
              Verification Snapshot
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div><strong>Truth Status:</strong> Ready for county rebuild</div>
              <div><strong>County:</strong> {county}</div>
              <div><strong>Route:</strong> /county/{slug || "unknown"}</div>
              <div><strong>State:</strong> Stable visible layout</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
