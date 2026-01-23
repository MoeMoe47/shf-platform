import React from "react";
import { loadManifest } from "@/apps/manifest/index.js";
import { Link } from "react-router-dom";


function toEntryHref(m, fallbackEntry) {
  const entry = (m && typeof m.entry === "string" && m.entry.trim()) ? m.entry.trim() : fallbackEntry;
  const homeHash = (m && typeof m.homeHash === "string" && m.homeHash.trim()) ? m.homeHash.trim() : "/";

  // Normalize: entry should look like "/ai.html" and hash should look like "/job-compass"
  const entryNorm = entry.startsWith("/") ? entry : ("/" + entry);
  const hashNorm = homeHash.startsWith("/") ? homeHash : ("/" + homeHash);

  // Final: "/ai.html#/job-compass"
  return `${entryNorm}#${hashNorm}`;
}

const Card = ({ title, desc, tag, to }) => {
  const inner = (
    <div className="sh-card">
      <div className="sh-cardTop">
        <div className="sh-cardTitle">{title}</div>
        {tag ? <div className="sh-chip">{tag}</div> : null}
      </div>
      <div className="sh-cardDesc">{desc}</div>
      <div className="sh-cardCta">Open →</div>
    </div>
  );

  return to ? (
    <Link to={to} className="sh-cardLink" aria-label={`Open ${title}`}>
      {inner}
    </Link>
  ) : (
    <div className="sh-cardLink sh-cardDisabled" aria-disabled="true">
      {inner}
    </div>
  );
};

export default function SolutionsHome() {
  
  const aiHref = (() => {
    try {
      const m = loadManifest("ai");
      return buildOpenHref(m) || "";
    } catch {
      return "";
    }
  })();
  return (
    <div className="sh-solutions">
      <div className="sh-hero">
        <div className="sh-heroKicker">Silicon Heartland Solutions</div>
        <h1 className="sh-heroTitle">Launchpad for Deployable Products</h1>
        <p className="sh-heroSub">
          This is the commercial surface area: packaged pilots, dashboards, and tools
          that can be deployed fast without touching the Foundation delivery layer.
        </p>

        <div className="sh-heroRow">
          {aiHref ? (
          <a className="sh-btn" href={aiHref || "#/"}>Open AI Workforce Compass</a>
        ) : (
          <button className="sh-btn" disabled title="AI app entry not available">Open AI Workforce Compass</button>
        )}
          <div className="sh-muted">Map stays in AI app by design.</div>
        </div>
      </div>

      <div className="sh-grid">
        <Card
          title="Pilot Kits"
          desc="Prebuilt program kits: scope, budget, metrics, and reporting templates."
          tag="Pilot-ready"
          to={null}
        />
        <Card
          title="Compliance + Reporting"
          desc="Evidence packs, audit trails, and exportable grant reporting."
          tag="Coming soon"
          to={null}
        />
        <Card
          title="Employer Hub"
          desc="Hiring pipeline, interview flows, and workforce analytics for partners."
          tag="Coming soon"
          to={null}
        />
        <Card
          title="Marketplace"
          desc="Digital + physical kits (curriculum, devices, and deployment bundles)."
          tag="Coming soon"
          to={null}
        />
        <Card
          title="Open Ledger"
          desc="Transparency layer for sponsors: funds → outcomes mapping."
          tag="Optional"
          to={null}
        />
        <Card
          title="Integrations"
          desc="Connectors: CSV, SIS/LMS, HRIS, and payment rails."
          tag="Coming soon"
          to={null}
        />
      </div>

      <style>{`
        .sh-solutions{ padding:24px; max-width:1100px; margin:0 auto; }
        .sh-hero{ padding:18px 18px 14px; border:1px solid rgba(255,255,255,.08); border-radius:18px; background: rgba(255,255,255,.03); }
        .sh-heroKicker{ font-size:12px; opacity:.75; letter-spacing:.08em; text-transform:uppercase; }
        .sh-heroTitle{ font-size:34px; line-height:1.05; margin:10px 0 8px; }
        .sh-heroSub{ font-size:15px; opacity:.85; margin:0 0 14px; max-width:720px; }
        .sh-heroRow{ display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
        .sh-solutions .sh-btn{ display:inline-flex; align-items:center; gap:10px; padding:10px 14px; border-radius:14px; border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); text-decoration:none; }
        .sh-muted{ font-size:12px; opacity:.7; }

        .sh-grid{ display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:14px; margin-top:14px; }
        @media (max-width: 980px){ .sh-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px){ .sh-grid{ grid-template-columns: 1fr; } }

        .sh-cardLink{ text-decoration:none; color:inherit; }
        .sh-card{ padding:14px; border-radius:18px; border:1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); transition: transform .12s ease, border-color .12s ease, background .12s ease; min-height:118px; display:flex; flex-direction:column; justify-content:space-between; }
        .sh-cardTop{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .sh-cardTitle{ font-size:16px; font-weight:650; }
        .sh-cardDesc{ font-size:13px; opacity:.82; margin-top:8px; }
        .sh-cardCta{ font-size:12px; opacity:.7; margin-top:12px; }
        .sh-chip{ font-size:11px; padding:4px 8px; border-radius:999px; border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); white-space:nowrap; opacity:.85; }

        .sh-cardLink:hover .sh-card{ transform: translateY(-1px); border-color: rgba(255,255,255,.16); background: rgba(255,255,255,.05); }
        .sh-cardDisabled{ cursor:not-allowed; opacity:.7; }
        .sh-cardDisabled:hover .sh-card{ transform:none; }
      `}</style>
    </div>
  );
}
