// src/pages/sales/SalesDashboardPro.jsx
import React from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";

/* ---------- render into the layout’s header slot ---------- */
function PageHeaderPortal({ children }) {
  if (typeof document === "undefined") return null;
  const host = document.getElementById("page-header-slot");
  return host ? createPortal(children, host) : null;
}

/* ---------- full-bleed hero behavior (cover the header) ---------- */
function useFullBleedHero() {
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.querySelector(".sal-shell");
    const slot = document.getElementById("page-header-slot");
    root?.classList.add("has-hero");                 // make header glass/transparent
    slot?.classList.add("is-full", "over-header");   // hero covers the header area
    return () => {
      root?.classList.remove("has-hero");
      slot?.classList.remove("is-full", "over-header");
    };
  }, []);
}

/* ---------- utils ---------- */
const usd0 = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/* tiny sparkline path */
function sparkPath(data = [], w = 64, h = 24, pad = 0) {
  if (!data.length) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const y = (v) => h - pad - ((v - min) / range) * (h - pad * 2);
  return data.reduce((d, v, i) => {
    const x = pad + i * stepX;
    return d + (i ? ` L${x.toFixed(1)} ${y(v).toFixed(1)}` : `M${x.toFixed(1)} ${y(v).toFixed(1)}`);
  }, "");
}

export default function SalesDashboardPro() {
  useFullBleedHero();

  // demo data
  const pipeline = [
    { id: "o1", name: "Cleveland City Schools", stage: "Qualified",   amount:  48000, owner: "Alex" },
    { id: "o2", name: "Franklin District",      stage: "Proposal",    amount: 120000, owner: "Sam"  },
    { id: "o3", name: "Summit Charter",         stage: "Lead",        amount:  25000, owner: "Alex" },
    { id: "o4", name: "Medina County Schools",  stage: "Negotiation", amount: 210000, owner: "Rae"  },
  ];
  const leads30d = 128;
  const proposalsOut = pipeline.filter(p => p.stage === "Proposal").length;
  const openPipeline = pipeline.reduce((s, p) => s + p.amount, 0);
  const mrr = 28400;

  const activities = [
    { id:"a1", who:"Alex", what:"Sent proposal", acct:"Franklin District", when:"2h" },
    { id:"a2", who:"Rae",  what:"Logged call",   acct:"Medina County Schools", when:"5h" },
    { id:"a3", who:"Sam",  what:"Created quote", acct:"Summit Charter", when:"yesterday" },
  ];

  const tasks = [
    { id:"t1", text:"Follow up: Franklin proposal", due:"Today" },
    { id:"t2", text:"Schedule demo for CCS",        due:"Tomorrow" },
    { id:"t3", text:"Confirm pricing with finance", due:"Fri" },
  ];

  const target = 500000, forecast = 403000;
  const pct = Math.max(0, Math.min(100, Math.round((forecast / target) * 100)));

  const trends = {
    leads:     [12, 18, 16, 22, 28, 24, 30, 26],
    pipeline:  [240, 260, 255, 300, 280, 310, 330],
    proposals: [8, 11,  9, 12, 13, 15, 17],
    mrr:       [22000, 23000, 24000, 25000, 26000, 28400],
  };

  return (
    <>
      {/* ===== HERO now renders into the page-header slot and covers the header ===== */}
      <PageHeaderPortal>
        <section className="lux-hero frost">
          <div className="lux-heroL">
            <div className="lux-eyebrow">SOLUTIONS · SALES</div>
            <h1 className="lux-title">Sales Dashboard</h1>
            <p className="lux-sub">Clean, fast, and presentation-ready.</p>
            <div className="lux-cta">
              <Link to="/sales/proposal?new=1" className="sh-btn">New Proposal</Link>
              <Link to="/sales/pricing?mode=quote" className="sh-btn sh-btn--soft">Create Quote</Link>
            </div>
          </div>

          <div className="lux-heroKpis">
            <div className="lux-kpi glow">
              <div className="lux-kpi-label">Open Pipeline</div>
              <div className="lux-kpi-value">{usd0(openPipeline)}</div>
              <MiniSpark data={trends.pipeline} />
            </div>
            <div className="lux-kpi glow">
              <div className="lux-kpi-label">Forecast (QTD)</div>
              <div className="lux-kpi-value">{usd0(forecast)}</div>
              <div className="lux-kpi-meter"><span style={{ width: `${pct}%` }} /></div>
              <div className="lux-kpi-foot">{pct}% of {usd0(target)}</div>
            </div>
          </div>
        </section>
      </PageHeaderPortal>

      {/* ===== BODY ===== */}
      <section className="dash-pro lux-page">
        <div className="dash-filters lux-stick" role="region" aria-label="Filters">
          <input className="f-search" placeholder="Search accounts or opportunities…" aria-label="Search" />
          <div className="seg">
            <button className="seg-btn is-active" type="button">All</button>
            <button className="seg-btn" type="button">New</button>
            <button className="seg-btn" type="button">Expiring</button>
          </div>
          <select className="f-range" aria-label="Date range">
            <option>This Quarter</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
          </select>
        </div>

        <div className="pro-kpis">
          <KPI label="Leads (30d)"      value={leads30d}           trend={trends.leads} />
          <KPI label="Open Pipeline"    value={usd0(openPipeline)} trend={trends.pipeline} />
          <KPI label="Proposals Out"    value={proposalsOut}       trend={trends.proposals} />
          <KPI label="MRR"              value={usd0(mrr)}          trend={trends.mrr} />
        </div>

        <div className="pro-grid">
          <div className="pro-main">
            <Widget title="Pipeline Preview" className="lux-card span-2">
              <PipelineMini items={pipeline} />
            </Widget>

            <Widget title="Top Opportunities" className="lux-card">
              <TopOpps items={[...pipeline].sort((a,b)=>b.amount-a.amount)} />
            </Widget>

            <Widget title="Recent Activity" className="lux-card">
              <RecentActivity items={activities} />
            </Widget>
          </div>

          <aside className="pro-aside">
            <Widget title="Forecast · QTD vs Target" className="lux-card">
              <ForecastGauge value={forecast} target={target} />
            </Widget>

            <Widget title="My Tasks" className="lux-card">
              <Tasks items={tasks} />
            </Widget>

            <Widget title="Quick Links" className="lux-card">
              <ul className="qlist" role="list">
                <li><Link to="/sales/calc">Impact Calculator</Link></li>
                <li><Link to="/sales/bundles">Bundles</Link></li>
                <li><Link to="/sales/ledger">Ledger</Link></li>
                <li><Link to="/sales/demo">Demo Hub</Link></li>
              </ul>
            </Widget>

            <Widget title="Alerts" className="lux-card">
              <Alerts items={[
                { id:"al1", tone:"warn", text:"3 quotes expiring in 5 days" },
                { id:"al2", tone:"info", text:"ROI builder has a new template" },
              ]}/>
            </Widget>
          </aside>
        </div>
      </section>
    </>
  );
}

/* ---------- widgets ---------- */
function Widget({ title, subtitle, className = "", children }) {
  return (
    <section className={`widget ${className}`}>
      <header className="widget-h">
        <h2 className="widget-title">{title}</h2>
        {subtitle && <div className="widget-sub">{subtitle}</div>}
      </header>
      <div className="widget-body">{children}</div>
    </section>
  );
}

function MiniSpark({ data = [] }) {
  const d = sparkPath(data, 72, 28, 2);
  return (
    <svg className="spark" viewBox="0 0 72 28" width="72" height="28" aria-hidden="true">
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="rgba(225,29,45,.45)" />
          <stop offset="100%" stopColor="rgba(225,29,45,0)" />
        </linearGradient>
      </defs>
      <path d={d} className="spark-line" />
      <path d={`${d} L72 28 L0 28 Z`} className="spark-fill" />
    </svg>
  );
}

function KPI({ label, value, trend }) {
  return (
    <div className="kpi card lux-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-row">
        <div className="kpi-value">{value}</div>
        {trend?.length ? <MiniSpark data={trend} /> : null}
      </div>
    </div>
  );
}

function PipelineMini({ items }) {
  return (
    <ul className="pipe-list" role="list">
      {items.map(op => (
        <li key={op.id} className="pipe-row hover-lift">
          <div className="pipe-main">
            <div className="pipe-title">{op.name}</div>
            <div className="pipe-meta">
              <span className={`badge stage-${slug(op.stage)}`}>{op.stage}</span>
              <span className="pipe-owner">{op.owner}</span>
            </div>
          </div>
          <div className="pipe-amt">{usd0(op.amount)}</div>
        </li>
      ))}
    </ul>
  );
}

function TopOpps({ items }) {
  return (
    <table className="tbl lux-table">
      <thead><tr><th>Account</th><th>Stage</th><th className="t-end">Amount</th></tr></thead>
      <tbody>
        {items.slice(0,6).map(op=>(
          <tr key={op.id} className="hover-lift">
            <td>{op.name}</td>
            <td><span className={`badge stage-${slug(op.stage)}`}>{op.stage}</span></td>
            <td className="t-end">{usd0(op.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RecentActivity({ items }) {
  return (
    <ul className="act-list" role="list">
      {items.map(a=>(
        <li key={a.id} className="act-row hover-lift">
          <div className="act-main">
            <strong>{a.who}</strong> {a.what} — <span className="act-acct">{a.acct}</span>
          </div>
          <div className="act-when">{a.when}</div>
        </li>
      ))}
    </ul>
  );
}

function Tasks({ items }) {
  const [done, setDone] = React.useState(() => new Set());
  const toggle = (id) => setDone(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <ul className="task-list" role="list">
      {items.map(t=>(
        <li key={t.id} className={`task-row hover-lift ${done.has(t.id) ? "is-done" : ""}`}>
          <label>
            <input type="checkbox" checked={done.has(t.id)} onChange={()=>toggle(t.id)} />
            <span>{t.text}</span>
          </label>
          <span className="task-due">{t.due}</span>
        </li>
      ))}
    </ul>
  );
}

function ForecastGauge({ value, target }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / target) * 100)));
  return (
    <div className="gauge">
      <div className="gauge-bar">
        <div className="gauge-fill shimmer" style={{ width: `${pct}%` }} />
      </div>
      <div className="gauge-meta">
        <div className="gauge-value">{usd0(value)}</div>
        <div className="gauge-target">Target {usd0(target)} · {pct}%</div>
      </div>
    </div>
  );
}

function Alerts({ items = [] }) {
  return (
    <ul className="alert-list" role="list">
      {items.map(it=>(
        <li key={it.id} className={`alert ${it.tone || "info"} hover-lift`}>
          <span className="dot" aria-hidden />
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}

function slug(s = ""){ return s.toLowerCase().replace(/\s+/g, "-"); }
