// src/pages/sales/DemoDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import PageHeaderPortal from "@/components/sales/PageHeaderPortal.jsx";
import { useBrandKit } from "@/hooks/useBrandKit.js";
import FundingCalculator from "@/components/sales/FundingCalculator.jsx";

export default function DemoDashboard() {
  const { brand } = useBrandKit?.() || { brand: {} };
  const name = brand?.name || "Your Organization";
  const tagline = brand?.tagline || "Powered by Silicon Heartland Foundation.";
  const primary = brand?.primary || "#e11d2d";
  const accent = brand?.accent || "#ffffff";

  return (
    <>
      {/* Full-bleed hero over the header */}
      <PageHeaderPortal>
        <section className="lux-hero frost" style={{ padding: "24px 24px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
            <div>
              <div className="lux-eyebrow">Solutions · Sales · Demo</div>
              <h1 className="lux-title" style={{ margin: "6px 0 6px" }}>{name}</h1>
              <p className="lux-sub" style={{ margin: 0 }}>{tagline}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Link to="/sales/demo-lesson" className="sh-btn">Launch Training</Link>
                <Link to="/sales/demo-quiz" className="sh-btn sh-btn--soft">Start Quiz</Link>
                <Link to="/sales/brand" className="sh-btn sh-btn--secondary">Brand in 1 min</Link>
                <Link to="/sales/demo-proposal" className="sh-btn sh-btn--secondary">Open Proposal</Link>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, minWidth: 280 }}>
              <Kpi label="Learners Enrolled" value="128" />
              <Kpi label="Completion Rate" value="92%" />
              <Kpi label="Employer Candidates" value="36" />
              <Kpi label="Funding Eligible (est.)" value="$185k" />
            </div>
          </div>
        </section>
      </PageHeaderPortal>

      {/* Body */}
      <section className="lux-page" style={{ display: "grid", gap: 16 }}>
        {/* Funding calculator */}
        <FundingCalculator />

        {/* Value props by audience */}
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
          <Card title="Employers">
            <ul className="ul-clean">
              <li>Day-1 skills micro-lessons + graded quizzes</li>
              <li>Pipeline to certified talent</li>
              <li>Manager dashboards & ROI reporting</li>
            </ul>
          </Card>
          <Card title="Schools & Career Centers">
            <ul className="ul-clean">
              <li>District branding in minutes</li>
              <li>Funding boosters: SEL + Financial Literacy</li>
              <li>Credits, rewards, employer-aligned projects</li>
            </ul>
          </Card>
          <Card title="Youth Programs (After-school / Camps)">
            <ul className="ul-clean">
              <li>Plug-in curriculum + attendance reporting</li>
              <li>Grant-friendly SEL and finance modules</li>
              <li>Rewards wallet, badges & NFTs</li>
            </ul>
          </Card>
        </div>

        {/* What’s in every package */}
        <Card title="Included in Every Package">
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
            <BadgeList
              heading="SEL & Wellness"
              items={["Micro-lessons", "Check-ins", "Reflection prompts"]}
              color={primary}
              ink={accent}
            />
            <BadgeList
              heading="Financial Literacy"
              items={["Debt Clock", "Credit Reporting (sim)", "Budget & Goals"]}
              color={primary}
              ink={accent}
            />
            <BadgeList
              heading="Engagement & Outcomes"
              items={["Rewards & Credits", "NFT Badges", "Employer Pipeline", "Certifications"]}
              color={primary}
              ink={accent}
            />
          </div>
        </Card>

        {/* Quick links */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="sh-btn" to="/sales/demo-lesson">View Sample Lesson</Link>
          <Link className="sh-btn sh-btn--soft" to="/sales/demo-quiz">Try the Quiz</Link>
          <Link className="sh-btn sh-btn--secondary" to="/sales/brand">Open Brand Kit</Link>
          <Link className="sh-btn sh-btn--secondary" to="/sales/bundles">Packages & Pricing</Link>
        </div>
      </section>
    </>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="card lux-card" style={{ padding: 12 }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22 }}>{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="card lux-card" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function BadgeList({ heading, items = [], color = "#e11d2d", ink = "#fff" }) {
  return (
    <div className="card lux-card" style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{heading}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((t, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: 999,
              background: color,
              color: ink,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
