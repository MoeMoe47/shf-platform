// src/pages/PathwaysExplore.jsx
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { track } from "../utils/analytics.js";
import usePathways from "../hooks/usePathways.js";
import impact from "../data/impact.js";

const PathwayDetailDrawer = React.lazy(() => import("../components/PathwayDetailDrawer.jsx"));
const ProofOutcomesSection = React.lazy(() => import("../components/ProofOutcomesSection.jsx"));
const preloadDrawer = () => import("../components/PathwayDetailDrawer.jsx");

function CardSkel({ h = 140 }) {
  return <div className="skel skel--card" style={{ height: h }} aria-hidden="true" />;
}

/* ---------- Mini ImpactStrip (read-only) ---------- */
function ImpactStripMini({ kpis = [], updatedAt, ctaHref = "/career" }) {
  const safe = Array.isArray(kpis) && kpis.length ? kpis : [
    { label: "Avg time to first paycheck", value: "—" },
    { label: "Avg cost after aid", value: "—" },
    { label: "90-day employment", value: "—" },
  ];
  return (
    <section className="card card--pad" aria-label="Program impact (summary)">
      <div className="sh-row" style={{ alignItems: "center", marginBottom: 8 }}>
        <h3 className="h3" style={{ margin: 0 }}>Impact Snapshot</h3>
        <div style={{ flex: 1 }} />
        {updatedAt && <div className="sh-muted" style={{ fontSize: 12, marginRight: 8 }}>Updated {updatedAt}</div>}
        <a className="sh-btn sh-btn--secondary" href={ctaHref}
           onClick={() => { try { track("impact_cta_clicked", { to: ctaHref, from: "explore" }); } catch {} }}>
          Build Your Plan →
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {safe.map((k, i) => (
          <div key={i} style={{ border: "1px solid var(--ring,#e5e7eb)", borderRadius: 12, padding: 10, background: "#fff" }}>
            <div className="sh-muted" style={{ fontSize: 12 }}>{k.label}</div>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{k.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */
function usd(n){
  try { return new Intl.NumberFormat(undefined,{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n||0)); }
  catch { return `$${Number(n||0).toLocaleString()}`; }
}
function groupByCluster(pathways=[]){
  const m=new Map();
  for(const p of pathways){
    const k=p?.cluster||"Other";
    if(!m.has(k)) m.set(k,[]);
    m.get(k).push(p);
  }
  return Array.from(m.entries()).map(([cluster,items])=>({cluster,items}));
}
function PathwayRow({ pathway, onOpen }) {
  const weeks = Number(pathway?.estWeeks || 0);
  const cost = Number(pathway?.estCost || 0);
  return (
    <div className="pathRow" role="group" aria-label={pathway?.title || "Pathway"}>
      <div>
        <div style={{ fontWeight: 600 }}>{pathway.title}</div>
        <div className="subtle">{weeks ? `${weeks} weeks` : "Timeline varies"} • {usd(cost)}</div>
      </div>
      <div>
        <button className="sh-btn sh-btn--secondary" onMouseEnter={preloadDrawer} onFocus={preloadDrawer}
                onClick={onOpen} aria-label={`Open ${pathway.title}`}>Open</button>
      </div>
    </div>
  );
}

/* Drawer with focus restore */
function ClusterDrawer({ open, title, onClose, children }) {
  React.useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [open, onClose]);

  const closeBtnRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      const t=setTimeout(()=>closeBtnRef.current?.focus?.({preventScroll:true}),0);
      return ()=>clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;
  return (
    <>
      <div className={`app-scrim ${open ? "is-visible" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside id="cluster-browser" className="clusterDrawer" role="dialog" aria-modal="true"
             aria-label={title || "Cluster"} onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
        <header className="sh-row" style={{alignItems:"center",justifyContent:"space-between",gap:8,padding:12,borderBottom:"1px solid var(--ring)"}}>
          <strong style={{ color: "var(--ink)" }}>{title}</strong>
          <button type="button" ref={closeBtnRef} className="sh-btn sh-btn--secondary" onClick={onClose}
                  aria-label="Close cluster browser">✕ Close</button>
        </header>
        <div style={{ padding: 12, overflow: "auto" }}>{children}</div>
      </aside>
      <style>{`.clusterDrawer{position:fixed;inset:0 0 0 auto;width:min(92vw,520px);background:var(--card,#fff);border-left:1px solid var(--ring,#e5e7eb);box-shadow:0 10px 30px rgba(0,0,0,.18);z-index:60;display:flex;flex-direction:column;}`}</style>
    </>
  );
}

export default function PathwaysExplore() {
  useEffect(() => { try { track("pathways_explore_viewed", {}, { silent: true }); } catch {} }, []);
  const { data: pathways = [] } = usePathways();

  const [activeCluster, setActiveCluster] = useState(null);
  const [activePathway, setActivePathway] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const clusters = useMemo(() => groupByCluster(pathways), [pathways]);
  const activeClusterItems = useMemo(
    () => clusters.find((c) => c.cluster === activeCluster)?.items ?? [],
    [clusters, activeCluster]
  );

  const handleViewPathwayCard = (p) => {
    preloadDrawer();
    setActivePathway(p);
    setDrawerOpen(true);
    try { track("pathway_drawer_opened", { pathwayId: p?.id, from: "explore_card" }); } catch {}
  };

  return (
    <div className="sh-grid sh-grid--1">
      <div className="card card--pad">
        <div className="sh-row" style={{ alignItems: "center" }}>
          <h3 className="h3" style={{ margin: 0 }}>Explore by Cluster</h3>
          <div style={{ flex: 1 }} />
          {activeCluster ? (
            <span className="sh-chip" title="Active cluster filter">
              {activeCluster}
              <button type="button" className="sh-btn sh-btn--tiny" style={{ marginLeft: 8, padding: "2px 6px" }}
                      aria-label={`Remove ${activeCluster}`} onClick={() => setActiveCluster(null)}>✕</button>
            </span>
          ) : null}
        </div>

        <div className="clusterGrid" role="list" style={{ marginTop: 8 }}>
          {clusters.map(({ cluster, items }) => (
            <div key={cluster} role="listitem" className="clusterCard">
              <div className="sh-row" style={{ justifyContent: "space-between", gap: 8 }}>
                <div className="sh-row" style={{ gap: 8 }}>
                  <span className="sh-chip">{cluster}</span>
                  <span className="subtle">{items.length} pathways</span>
                </div>
                <div className="sh-actionsRow">
                  <button className="sh-btn sh-btn--secondary"
                          onClick={() => setActiveCluster(cluster)}
                          aria-haspopup="dialog"
                          aria-expanded={activeCluster === cluster ? "true" : "false"}
                          aria-controls="cluster-browser">
                    Browse
                  </button>
                </div>
              </div>

              <div className="clusterList" aria-live="polite">
                {items.slice(0, 3).map((p) => (
                  <PathwayRow key={p.id} pathway={p} onOpen={() => handleViewPathwayCard(p)} />
                ))}
                {items.length > 3 ? (
                  <button className="sh-linkBtn" onClick={() => setActiveCluster(cluster)}
                          aria-label={`View all ${items.length} in ${cluster}`} style={{ marginTop: 4 }}>
                    View all {items.length}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outcomes / proof */}
      <Suspense fallback={<CardSkel />}>
        <div className="card card--pad">
          <ProofOutcomesSection pathways={pathways} />
        </div>
      </Suspense>

      {/* Impact summary */}
      <ImpactStripMini kpis={impact?.kpis || []} updatedAt={impact?.updatedAt} ctaHref="/career" />

      {/* Drawer for individual pathway */}
      <Suspense fallback={null}>
        <PathwayDetailDrawer open={drawerOpen} pathway={activePathway}
                             onClose={() => setDrawerOpen(false)} onStart={() => setDrawerOpen(false)} />
      </Suspense>

      {/* Cluster drawer */}
      <ClusterDrawer open={!!activeCluster} title={activeCluster ? `Cluster: ${activeCluster}` : ""} onClose={() => setActiveCluster(null)}>
        {!activeClusterItems.length ? (
          <p className="subtle">No items in this cluster.</p>
        ) : (
          <ul className="sh-listPlain">
            {activeClusterItems.map((p) => (
              <li key={p.id} className="pathRow" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div className="subtle">
                    {p.estWeeks ? `${p.estWeeks} weeks` : "Timeline varies"} • {usd(p.estCost)}
                  </div>
                </div>
                <div className="sh-actionsRow">
                  <button className="sh-btn sh-btn--secondary" onClick={() => handleViewPathwayCard(p)} aria-label={`Open ${p.title}`}>Open</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ClusterDrawer>

      <style>{`
        .clusterGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}
        .clusterCard{border:1px solid var(--ring,#e5e7eb);border-radius:12px;padding:10px;background:var(--card,#fff);}
        .clusterList{display:grid;gap:6px;margin-top:8px;}
        .pathRow{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;border:1px solid var(--ring,#e5e7eb);border-radius:10px;padding:8px;background:var(--card,#fff);}
      `}</style>
    </div>
  );
}

/* --- SHF: Pathway selected (drop-in listener stays) --- */
(() => {
  if (typeof window === "undefined" || window.__shfHook_pathway) return; window.__shfHook_pathway = true;
  const once = (k) => { if (!k) return true; if (localStorage.getItem(k)) return false; localStorage.setItem(k,"1"); return true; };
  window.addEventListener("pathway:selected", (e) => {
    const d = (e && e.detail) || {};
    const key = d.pathwayId ? `shf.award.path.${d.pathwayId}` : "";
    if (!once(key)) return;
    try {
      window.shfCredit?.earn?.({ action: "pathway.select", rewards: { corn: 2 }, scoreDelta: 4, meta: { pathwayId: d.pathwayId, name: d.name } });
      window.shToast?.(`🛣️ Pathway chosen: ${d.name || d.pathwayId} · +2 🌽 · +4 score`);
    } catch {}
  });
})();
