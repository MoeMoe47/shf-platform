// src/components/sales/FundingCalculator.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const DEFAULTS = {
  audience: "school", // "school" | "youth" | "employer"
  participants: 120,
  months: 12,
};

const PRICING = {
  school:    { basePPM: 12, upliftPM: 20 }, // $/user/month, est. funding benefit per user / month
  youth:     { basePPM: 10, upliftPM: 25 },
  employer:  { basePPM: 20, upliftPM: 0  }, // ROI is more productivity/placement (we’ll still show cost)
};

const ADDONS = [
  { key: "sel",        label: "SEL Module",             ppm: 3 },
  { key: "finance",    label: "Financial Literacy",     ppm: 0 }, // included in every package
  { key: "rewards",    label: "Rewards, NFTs, Badges",  ppm: 2 },
  { key: "pipeline",   label: "Employer Pipeline",      ppm: 2 },
  { key: "certs",      label: "Certifications Track",   ppm: 3 },
];

export default function FundingCalculator() {
  const nav = useNavigate();
  const [audience, setAudience] = React.useState(DEFAULTS.audience);
  const [participants, setParticipants] = React.useState(DEFAULTS.participants);
  const [months, setMonths] = React.useState(DEFAULTS.months);
  const [picked, setPicked] = React.useState(() => new Set(["finance", "pipeline"])); // finance included

  const { basePPM, upliftPM } = PRICING[audience];
  const addonsPPM = ADDONS.reduce((sum, a) => sum + (picked.has(a.key) ? a.ppm : 0), 0);
  const ppm = basePPM + addonsPPM;

  const monthlyCost  = participants * ppm;
  const totalCost    = monthlyCost * months;
  const monthlyLift  = participants * upliftPM;
  const totalLift    = monthlyLift * months;
  const net          = totalLift - totalCost;
  const roiPct       = totalCost > 0 ? Math.round((totalLift / totalCost - 1) * 100) : 0;

  const toggle = (key) => {
    setPicked((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const gotoProposal = () => {
    const addons = Array.from(picked).join(",");
    const qs = new URLSearchParams({
      audience,
      n: String(participants),
      m: String(months),
      base: String(basePPM),
      addonsPPM: String(addonsPPM),
      uplift: String(upliftPM),
      addons,
    }).toString();
    nav(`/sales/demo-proposal?${qs}`);
  };

  return (
    <section className="card lux-card" style={{ padding: 16 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          <label className="sh-label" style={{ display: "grid", gap: 6 }}>
            Audience
            <select className="sh-input" value={audience} onChange={(e)=>setAudience(e.target.value)}>
              <option value="school">School / Career Center</option>
              <option value="youth">After-school / Camps</option>
              <option value="employer">Employer Training</option>
            </select>
          </label>

          <label className="sh-label" style={{ display: "grid", gap: 6 }}>
            Participants
            <input
              className="sh-input"
              type="number"
              min="1"
              value={participants}
              onChange={(e)=>setParticipants(Math.max(1, Number(e.target.value||0)))}
            />
          </label>

          <label className="sh-label" style={{ display: "grid", gap: 6 }}>
            Months
            <select className="sh-input" value={months} onChange={(e)=>setMonths(Number(e.target.value))}>
              <option value="3">3</option>
              <option value="6">6</option>
              <option value="9">9</option>
              <option value="12">12</option>
            </select>
          </label>
        </div>

        <fieldset style={{ border: "1px solid var(--ring)", borderRadius: 12, padding: 12 }}>
          <legend style={{ padding: "0 6px", color: "var(--ink-soft)" }}>Add-ons</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ADDONS.map(a => (
              <label key={a.key} className="sh-label" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={picked.has(a.key)}
                  onChange={()=>toggle(a.key)}
                />
                {a.label} {a.ppm ? `(+$${a.ppm}/user/mo)` : "(included)"}
              </label>
            ))}
          </div>
        </fieldset>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
          <Stat label="$/user/mo" value={`$${ppm.toFixed(2)}`} />
          <Stat label="Monthly cost" value={`$${fmt(monthlyCost)}`} />
          <Stat label="Est. monthly funding" value={`$${fmt(monthlyLift)}`} />
          <Stat label="ROI" value={`${isFinite(roiPct) ? roiPct : 0}%`} />
        </div>

        <div className="sh-hr" style={{ height: 1, background: "var(--ring)" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          <Stat label="Total cost" value={`$${fmt(totalCost)}`} big />
          <Stat label="Est. total funding" value={`$${fmt(totalLift)}`} big />
          <Stat label="Net impact" value={`${net >= 0 ? "" : "-" }$${fmt(Math.abs(net))}`} big />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="sh-btn" onClick={gotoProposal}>Send to Proposal</button>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, big=false }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: big ? 22 : 18 }}>{value}</div>
    </div>
  );
}

const fmt = (n) => Number(n || 0).toLocaleString();
