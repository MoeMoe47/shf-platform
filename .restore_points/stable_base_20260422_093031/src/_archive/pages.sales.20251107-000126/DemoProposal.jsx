// src/pages/sales/DemoProposal.jsx
import React from "react";
import PageHeaderPortal from "@/components/sales/PageHeaderPortal.jsx";
import { useBrandKit } from "@/hooks/useBrandKit.js";

export default function DemoProposal(){
  const { brand } = useBrandKit?.() || { brand: {} };
  const name = brand?.name || "Your Organization";
  const tagline = brand?.tagline || "Career growth at scale.";
  const primary = brand?.primary || "#e11d2d";
  const accent = brand?.accent || "#ffffff";
  const logo = brand?.logoDataUrl || "";

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const audience   = params.get("audience") || "school";
  const n          = num(params.get("n"), 120);
  const m          = num(params.get("m"), 12);
  const base       = num(params.get("base"), 12);
  const addonsPPM  = num(params.get("addonsPPM"), 4);
  const uplift     = num(params.get("uplift"), audience === "employer" ? 0 : 20);
  const addonsList = (params.get("addons") || "finance,pipeline").split(",").filter(Boolean);

  const ppm = base + addonsPPM;
  const monthlyCost = n * ppm;
  const totalCost   = monthlyCost * m;
  const monthlyLift = n * uplift;
  const totalLift   = monthlyLift * m;
  const net         = totalLift - totalCost;
  const roiPct      = totalCost > 0 ? Math.round((totalLift / totalCost - 1) * 100) : 0;

  const audienceTitle = {
    school: "School / Career Center",
    youth: "After-school / Camps",
    employer: "Employer Training",
  }[audience] || "Program";

  const onPrint = () => window.print();

  return (
    <div className="demo-proposal">
      <style>{css(primary)}</style>

      {/* Full-bleed cover hero */}
      <PageHeaderPortal>
        <section className="lux-hero frost" style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center" }}>
            <div className="dp-logo">
              {logo ? <img alt="client logo" src={logo} /> : <span>Logo</span>}
            </div>
            <div>
              <div className="lux-eyebrow">Proposal</div>
              <h1 className="lux-title" style={{ margin: "6px 0 6px" }}>{name}</h1>
              <p className="lux-sub" style={{ margin: 0 }}>{tagline}</p>
            </div>
            <div>
              <button className="sh-btn" onClick={onPrint}>Print / Save PDF</button>
            </div>
          </div>
        </section>
      </PageHeaderPortal>

      <section className="lux-page" style={{ display: "grid", gap: 16 }}>
        {/* Summary tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
          <Tile label="Audience" value={audienceTitle} />
          <Tile label="Participants" value={fmt(n)} />
          <Tile label="Duration" value={`${m} months`} />
          <Tile label="$/user/mo" value={`$${ppm.toFixed(2)}`} />
        </div>

        {/* Funding & ROI */}
        <section className="card lux-card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Funding & ROI</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
            <Big label="Total Cost" value={`$${fmt(totalCost)}`} />
            <Big label="Est. Funding/Benefit" value={`$${fmt(totalLift)}`} />
            <Big label="Net Impact" value={`${net >= 0 ? "" : "-"}$${fmt(Math.abs(net))}`} />
          </div>
          <div style={{ marginTop: 12, fontSize: 14, color: "var(--ink-soft)" }}>
            ROI: <strong>{isFinite(roiPct) ? roiPct : 0}%</strong> based on estimated monthly benefit of ${fmt(uplift)} per participant.
          </div>
        </section>

        {/* Package */}
        <section className="card lux-card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Package Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
            <Bucket title="Core">
              <li>Micro-lessons & quizzes</li>
              <li>Branded experience</li>
              <li>Manager / admin dashboards</li>
            </Bucket>
            <Bucket title="Included for all">
              <li>Financial Literacy (Debt Clock, Credit sim, Budget)</li>
              <li>Rewards & Credits</li>
            </Bucket>
            <Bucket title="Add-ons">
              {addonsList.length ? addonsList.map(a => <li key={a}>{labelOf(a)}</li>) : <li>None</li>}
            </Bucket>
          </div>
        </section>

        {/* Next steps */}
        <section className="card lux-card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Next Steps</h3>
          <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            <li>Confirm participant count and start date.</li>
            <li>Finalize package selection and funding pathway.</li>
            <li>Run a 30-day pilot (no-risk), then expand.</li>
          </ol>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="sh-btn" onClick={onPrint}>Print / Save PDF</button>
          </div>
        </section>
      </section>
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="card lux-card" style={{ padding: 12 }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 20 }}>{value}</div>
    </div>
  );
}
function Big({ label, value }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22 }}>{value}</div>
    </div>
  );
}
function Bucket({ title, children }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <ul className="ul-clean" style={{ margin: 0, paddingLeft: 16 }}>
        {children}
      </ul>
    </div>
  );
}

function labelOf(key){
  switch (key) {
    case "sel": return "SEL Module";
    case "finance": return "Financial Literacy";
    case "rewards": return "Rewards, NFTs, Badges";
    case "pipeline": return "Employer Pipeline";
    case "certs": return "Certifications Track";
    default: return key;
  }
}

function num(v, fallback){ const n = Number(v); return Number.isFinite(n) ? n : fallback; }
const fmt = (n) => Number(n || 0).toLocaleString();

const css = (primary) => `
.demo-proposal{ --dp-primary: ${primary}; }
.demo-proposal .dp-logo{
  width:72px; height:72px; border-radius:12px; overflow:hidden;
  display:grid; place-items:center; background:#fff; border:1px solid var(--ring);
}
.demo-proposal .dp-logo img{ width:100%; height:100%; object-fit:contain; }

/* Print */
@media print{
  .lux-hero .sh-btn{ display:none !important; }
  .lux-page .sh-btn{ display:none !important; }
}
`;
