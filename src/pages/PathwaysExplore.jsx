// src/pages/PathwaysExplore.jsx
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { track } from "../utils/analytics.js";
import useCanonicalCareers from "../hooks/useCanonicalCareers.js";
import { CareerPublicHero, CareerSectionHeader } from "../components/career/CareerPublicPrimitives.jsx";

const PathwayDetailDrawer = React.lazy(() => import("../components/PathwayDetailDrawer.jsx"));
const preloadDrawer = () => import("../components/PathwayDetailDrawer.jsx");

/* ---------- helpers ---------- */
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
  return (
    <div className="pathRow" role="group" aria-label={pathway?.title || "Pathway"}>
      <div>
        <div style={{ fontWeight: 600 }}>{pathway.title}</div>
        {pathway?.canonicalCareer ? <div className="subtle">Career family record</div> : null}
      </div>
      <div>
        <div className="sh-actionsRow">
          <Link className="sh-btn sh-btn--primary" to={`/pathways/${encodeURIComponent(pathway.slug)}`}>View pathway</Link>
          <Link className="sh-btn sh-btn--secondary" to={`/careers/${encodeURIComponent(pathway.slug)}`}>View career</Link>
          <button className="sh-btn sh-btn--secondary" onMouseEnter={preloadDrawer} onFocus={preloadDrawer}
                  onClick={onOpen} aria-label={`Preview ${pathway.title}`}>Preview</button>
        </div>
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
  const location = useLocation();
  const isPathways = location.pathname === "/pathways";
  const { data: pathways = [], loading, error, loadCareer } = useCanonicalCareers();

  const [activeCluster, setActiveCluster] = useState(null);
  const [activePathway, setActivePathway] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const clusters = useMemo(() => groupByCluster(pathways), [pathways]);
  const activeClusterItems = useMemo(
    () => clusters.find((c) => c.cluster === activeCluster)?.items ?? [],
    [clusters, activeCluster]
  );

  const handleViewPathwayCard = async (p) => {
    preloadDrawer();
    try {
      setActivePathway((await loadCareer(p.slug)) || p);
    } catch {
      setActivePathway(p);
    }
    setDrawerOpen(true);
    try { track("pathway_drawer_opened", { pathwayId: p?.id, from: "explore_card" }); } catch {}
  };

  return (
    <main className="career-explore" aria-labelledby="career-explore-title">
      <CareerPublicHero
        eyebrow={isPathways ? "Career pathways" : "Explore careers"}
        title={isPathways ? "See how careers connect." : "Explore careers with a clear next step."}
        titleId="career-explore-title"
        description="Browse canonical Career records by family, then open a public detail page when a direction interests you."
      />
      <CareerSectionHeader eyebrow={isPathways ? "Reference catalog" : "Career catalog"} title="Explore by career family" description="These groupings are drawn from the active Career API catalog." />
      {loading && <p role="status">Loading careers…</p>}
      {error && <p role="alert">Career information is temporarily unavailable.</p>}
      {!loading && !error && !pathways.length && <p>No active careers are available.</p>}
      <section className="career-public__card career-exploreCatalog" aria-label="Career family catalog">
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
      </section>

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
                  <div className="subtle">Career family record</div>
                </div>
                <div className="sh-actionsRow">
                  <Link className="sh-btn sh-btn--primary" to={`/pathways/${encodeURIComponent(p.slug)}`}>View pathway</Link>
                  <Link className="sh-btn sh-btn--secondary" to={`/careers/${encodeURIComponent(p.slug)}`}>View career</Link>
                  <button className="sh-btn sh-btn--secondary" onClick={() => handleViewPathwayCard(p)} aria-label={`Preview ${p.title}`}>Preview</button>
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
    </main>
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
