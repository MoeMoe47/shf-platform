// src/pages/CareerPlanner.jsx
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { track } from "../utils/analytics.js";
import usePathways from "../hooks/usePathways.js";
import impactDefault from "../data/impact.js";
import recommendPlans from "../utils/recommendPlans.js";

const FundingWizard            = React.lazy(() => import("../components/FundingWizard.jsx"));
const CareerConsultantPanel    = React.lazy(() => import("../components/CareerConsultantPanel.jsx"));
const PlanSelector             = React.lazy(() => import("../components/PlanSelector.jsx"));
const PathwayPersonalizerSheet = React.lazy(() => import("../components/PathwayPersonalizerSheet.jsx"));
const PathwayDetailDrawer      = React.lazy(() => import("../components/PathwayDetailDrawer.jsx"));
const FundingPlanCard          = React.lazy(() => import("../components/FundingPlanCard.jsx"));
const CollabPanel              = React.lazy(() => import("../components/CollabPanel.jsx"));
const CoachBookingCard         = React.lazy(() => import("../components/CoachBookingCard.jsx"));
const TasksCard                = React.lazy(() => import("../components/TasksCard.jsx"));

const preloadPersonalizer = () => import("../components/PathwayPersonalizerSheet.jsx");
const preloadDrawer       = () => import("../components/PathwayDetailDrawer.jsx");
const preloadTasks        = () => import("../components/TasksCard.jsx");

const IMPACT_LS_KEY   = "sh_impact_override_v1";
const ADMIN_LS_KEY    = "sh_admin";
const FUNDING_LS_KEY  = "sh_funding_plan_v1";

function CardSkel({ h = 140 }) {
  return <div className="skel skel--card" style={{ height: h }} aria-hidden="true" />;
}

/* ---------- Admin helpers ---------- */
function useIsAdmin() {
  const [admin, setAdmin] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("admin") === "1") { localStorage.setItem(ADMIN_LS_KEY, "1"); return true; }
      if (sp.get("admin") === "0") { localStorage.removeItem(ADMIN_LS_KEY); return false; }
      return localStorage.getItem(ADMIN_LS_KEY) === "1";
    } catch { return false; }
  });

  useEffect(() => {
    const onKey = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        setAdmin(true);
        try { localStorage.setItem(ADMIN_LS_KEY, "1"); } catch {}
        try { track("admin_shortcut_used", { combo: "Alt+I" }); } catch {}
        window.dispatchEvent(new CustomEvent("open-impact-editor"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () => {
    setAdmin((v) => {
      const nv = !v;
      try { nv ? localStorage.setItem(ADMIN_LS_KEY,"1") : localStorage.removeItem(ADMIN_LS_KEY); } catch {}
      return nv;
    });
  };

  return [admin, toggle];
}

function loadImpactOverride() {
  try { return JSON.parse(localStorage.getItem(IMPACT_LS_KEY) || "null"); }
  catch { return null; }
}

function useImpactData(base) {
  const [override, setOverride] = useState(() => loadImpactOverride());
  const data = override && typeof override === "object" ? override : base;

  const save = (obj) => {
    try {
      localStorage.setItem(IMPACT_LS_KEY, JSON.stringify(obj));
      setOverride(obj);
      try { track("impact_override_saved"); } catch {}
    } catch (e) { console.error(e); }
  };
  const reset = () => {
    try {
      localStorage.removeItem(IMPACT_LS_KEY);
      setOverride(null);
      try { track("impact_override_reset"); } catch {}
    } catch {}
  };
  return { data, save, reset, isOverridden: !!override };
}

/* ---------- Simple Modal ---------- */
function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="app-scrim is-visible" onClick={onClose} aria-hidden="true"
           style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", zIndex:80 }} />
      <div role="dialog" aria-modal="true" aria-label={title || "Dialog"}
           onClick={(e)=>e.stopPropagation()}
           style={{ position:"fixed", inset:"10% auto auto 50%", transform:"translateX(-50%)",
                    width:"min(880px, 92vw)", background:"#fff", border:"1px solid var(--ring)",
                    borderRadius:12, boxShadow:"0 20px 60px rgba(0,0,0,.25)", zIndex:90,
                    display:"flex", flexDirection:"column" }}>
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                         padding:12, borderBottom:"1px solid var(--ring)" }}>
          <strong style={{ color:"var(--ink)" }}>{title}</strong>
          <button className="sh-btn sh-btn--secondary" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div style={{ padding:12 }}>{children}</div>
      </div>
    </>
  );
}

/* ---------- ImpactStrip (JSON-driven) ---------- */
function ImpactStrip({ kpis = [], ctaHref = "/explore", updatedAt, footnote, onEdit, admin, overridden }) {
  const safeKpis = Array.isArray(kpis) && kpis.length
    ? kpis
    : [
        { label: "Avg time to first paycheck", value: "—" },
        { label: "Avg cost after aid", value: "—" },
        { label: "90-day employment", value: "—" },
      ];

  return (
    <section className="card card--pad" aria-label="Program impact" style={{ border: "1px solid var(--ring)", background: "var(--card,#fff)" }}>
      <div className="sh-row" style={{ alignItems: "center", marginBottom: 8 }}>
        <h3 className="h3" style={{ margin: 0 }}>Impact Snapshot</h3>
        <div style={{ flex: 1 }} />
        {overridden && <span className="sh-chip" title="Using local override" style={{ marginRight: 8 }}>Local</span>}
        {updatedAt && <div className="sh-muted" style={{ fontSize: 12, marginRight: 8 }}>Updated {updatedAt}</div>}
        {admin && <button className="sh-btn" onClick={onEdit} style={{ marginRight: 8 }}>✏️ Edit Impact</button>}
        <a className="sh-btn sh-btn--secondary" href={ctaHref}
           onClick={() => { try { track("impact_cta_clicked", { to: ctaHref }); } catch {} }}>
          Explore Pathways →
        </a>
      </div>

      <div className="impactGrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        {safeKpis.map((k, i) => (
          <div key={i} className="impactItem" role="group"
               aria-label={`${k.label} ${k.value}`}
               style={{ border: "1px solid var(--ring,#e5e7eb)", borderRadius: 12, padding: 12, background: "#fff" }}>
            <div className="sh-muted" style={{ fontSize: 12 }}>{k.label}</div>
            <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <p className="subtle" style={{ marginTop: 8 }}>
        {footnote || "Figures are cohort medians; results may vary."}
      </p>
    </section>
  );
}

/* ---------- Smooth-scroll to #hash anchors ---------- */
function useHashScroll() {
  useEffect(() => {
    const go = () => {
      const id = window.location.hash?.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        try { el.focus({ preventScroll: true }); } catch {}
      }
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
}

export default function CareerPlanner() {
  useEffect(() => { try { track("career_planner_viewed", {}, { silent: true }); } catch {} }, []);
  useHashScroll();

  const [admin, toggleAdmin] = useIsAdmin();
  const { data: pathways = [] } = usePathways();
  const impactStore = useImpactData(impactDefault);

  const [sheetOpen, setSheetOpen]       = useState(false);
  const [inputs, setInputs]             = useState(null);
  const [plans, setPlans]               = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [fundingPlan, setFundingPlan]   = useState(null);

  const [activePathway, setActivePathway] = useState(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);

  const [editorOpen, setEditorOpen]   = useState(false);
  const [editorText, setEditorText]   = useState(() => JSON.stringify(impactStore.data, null, 2));
  const [editorError, setEditorError] = useState("");

  // Alt+I → open editor
  useEffect(() => {
    const onOpen = () => setEditorOpen(true);
    window.addEventListener("open-impact-editor", onOpen);
    return () => window.removeEventListener("open-impact-editor", onOpen);
  }, []);

  // Keep editor text in sync when opening
  useEffect(() => { if (editorOpen) setEditorText(JSON.stringify(impactStore.data, null, 2)); }, [editorOpen, impactStore.data]);

  // Seed A/B/C from pathways on first load
  useEffect(() => {
    if (!plans.length && pathways.length) {
      try {
        const seeded = recommendPlans(pathways);
        setPlans(seeded);
        setSelectedPlanId(seeded[0]?.id || null);
      } catch (e) { console.error("Failed to generate plans:", e); }
    }
  }, [pathways, plans.length]);

  // Load funding plan from LS
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FUNDING_LS_KEY);
      if (raw) setFundingPlan(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist funding plan
  useEffect(() => {
    try {
      if (fundingPlan) localStorage.setItem(FUNDING_LS_KEY, JSON.stringify(fundingPlan));
      else localStorage.removeItem(FUNDING_LS_KEY);
    } catch {}
  }, [fundingPlan]);

  const selectedPlan = useMemo(
    () => (plans.find((p) => p.id === selectedPlanId) || plans[0] || null),
    [plans, selectedPlanId]
  );

  useEffect(() => { if (selectedPlan) preloadTasks(); }, [selectedPlan]);

  const handleStartPersonalizer = () => { preloadPersonalizer(); setSheetOpen(true); };
  const handlePersonalizerSave = (_inputs) => { setInputs(_inputs || null); try { track("plan_personalizer_saved", { via:"onSave" }); } catch {} };
  const handlePersonalizerComplete = (payload) => {
    if (!payload) return;
    const { inputs: ans, plans: recs } = payload;
    setInputs(ans || null);
    const list = Array.isArray(recs) ? recs : [];
    setPlans(list);
    setSelectedPlanId(list[0]?.id || null);
    setSheetOpen(false);
    try { track("plan_personalizer_saved", { via:"onComplete", plans: list.length }); } catch {}
  };

  const handleSelectPlan = (idOrPlan) => {
    const id = typeof idOrPlan === "string" ? idOrPlan : idOrPlan?.id;
    if (!id) return;
    setSelectedPlanId(id);
    const picked = plans.find((p) => p.id === id);
    try { track("plan_selected", { planId:id, strategy:picked?.strategy }); } catch {}
  };

  const resolvePlanPathway = (plan) => {
    if (!plan) return null;
    if (plan.pathway)  return plan.pathway;
    if (plan.pathwayId) return pathways.find((x) => x.id === plan.pathwayId) || null;
    return null;
  };

  const consultantPathway = resolvePlanPathway(selectedPlan) || activePathway || null;

  const handleViewPlan = (plan) => {
    const p = resolvePlanPathway(plan);
    if (!p) return;
    preloadDrawer();
    setActivePathway(p); setDrawerOpen(true);
    try { track("pathway_drawer_opened", { pathwayId:p.id, from:"plan_view" }); } catch {}
  };

  const handleStartFromPlan = (plan) => {
    const p = resolvePlanPathway(plan);
    if (!p) return;
    preloadDrawer();
    setActivePathway(p); setDrawerOpen(true);
    try { track("pathway_enroll_clicked", { pathwayId:p.id, planStrategy:plan?.strategy }); } catch {}
  };

  function saveEditor() {
    setEditorError("");
    try {
      const obj = JSON.parse(editorText);
      if (!obj || typeof obj !== "object") throw new Error("JSON must be an object");
      impactStore.save(obj);
      setEditorOpen(false);
    } catch (e) { setEditorError(String(e?.message || e)); }
  }
  function resetEditor() { impactStore.reset(); setEditorOpen(false); }

  return (
    <div className="sh-grid railGrid" style={{ gridTemplateColumns: "1fr" }}>
      {/* Plan A/B/C */}
      <div className="card card--pad">
        <div className="sh-row" style={{ alignItems: "center" }}>
          <h3 className="h3" style={{ margin: 0 }}>Your Career Plan</h3>
          <div style={{ flex: 1 }} />
          <button className="sh-btn sh-btn--secondary"
                  onClick={() => { try { track("plan_print_clicked"); } catch {} window.print(); }}
                  style={{ marginRight: 8 }}>
            🖨️ Print Plan
          </button>
          <button className="sh-btn"
                  onClick={handleStartPersonalizer}
                  onMouseEnter={preloadPersonalizer}
                  onFocus={preloadPersonalizer}
                  aria-expanded={sheetOpen ? "true" : "false"}
                  aria-controls="personalizer-sheet">
            Personalize
          </button>
          <button className="sh-btn sh-btn--soft" onClick={toggleAdmin}
                  title="Toggle Admin (persists in this browser)"
                  style={{ marginLeft: 8 }}
                  aria-pressed={admin ? "true" : "false"}>
            {admin ? "Admin: ON" : "Admin: OFF"}
          </button>
        </div>
        <p className="subtle" style={{ marginTop: 8 }}>
          Pick a path, see time-to-first-paycheck, and get a cost-after-aid snapshot.
        </p>

        <Suspense fallback={<CardSkel />}>
          {plans?.length ? (
            <PlanSelector
              plans={plans}
              selectedId={selectedPlan?.id || null}
              onPick={handleSelectPlan}
              onViewPath={handleViewPlan}
              onStart={handleStartFromPlan}
              onSelect={handleSelectPlan}
              onView={handleViewPlan}
            />
          ) : (
            <div className="subtle" role="note">
              No plans yet. Click{" "}
              <button className="sh-btn sh-btn--tiny" onClick={handleStartPersonalizer}>Personalize</button>{" "}
              to generate Plan A/B/C.
            </div>
          )}
        </Suspense>
      </div>

      {/* Funding */}
      <section id="fund" tabIndex={-1} aria-label="Funding" style={{ outline: "none" }}>
        <div className="card card--pad">
          <h3 className="h3" style={{ marginTop: 0 }}>Funding Wizard</h3>
          <p className="subtle" style={{ margin: "6px 0 10px 0" }}>
            Build a stacked aid plan (WIOA/ETPL, GI, employer tuition).
          </p>
          <Suspense fallback={<CardSkel />}>
            <FundingWizard onSave={setFundingPlan} />
          </Suspense>
        </div>

        <Suspense fallback={<CardSkel />}>
          <FundingPlanCard plan={fundingPlan} />
        </Suspense>
      </section>

      <Suspense fallback={<CardSkel />}>
        <CareerConsultantPanel pathway={consultantPathway || {}} />
      </Suspense>

      <Suspense fallback={<CardSkel />}>
        <CollabPanel planId={selectedPlan?.id || null} />
      </Suspense>

      {/* Tasks */}
      <section id="tasks" tabIndex={-1} aria-label="Tasks & Deadlines" style={{ outline: "none" }}>
        <Suspense fallback={<CardSkel h={120} />}>
          <TasksCard planId={selectedPlan?.id || "draft"} pathway={consultantPathway || {}} />
        </Suspense>
      </section>

      <Suspense fallback={<CardSkel h={90} />}>
        <CoachBookingCard
          pathway={consultantPathway || undefined}
          onBooked={({ duration, pathwayId }) => {
            try { track("coach_booking_link_opened", { duration, pathwayId }); } catch {}
          }}
        />
      </Suspense>

      {/* Impact */}
      <ImpactStrip
        kpis={impactStore.data?.kpis || []}
        ctaHref="/explore"
        updatedAt={impactStore.data?.updatedAt}
        footnote={impactStore.data?.footnote}
        admin={admin}
        overridden={impactStore.isOverridden}
        onEdit={() => setEditorOpen(true)}
      />

      {/* Personalizer */}
      <Suspense fallback={null}>
        <PathwayPersonalizerSheet
          id="personalizer-sheet"
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSave={handlePersonalizerSave}
          onComplete={handlePersonalizerComplete}
        />
      </Suspense>

      {/* Drawer */}
      <Suspense fallback={null}>
        <PathwayDetailDrawer
          open={drawerOpen}
          pathway={activePathway}
          plan={selectedPlan || null}
          fundingPlan={fundingPlan || null}
          onClose={() => setDrawerOpen(false)}
          onStart={() => setDrawerOpen(false)}
        />
      </Suspense>

      {/* Impact editor modal */}
      <Modal open={editorOpen && admin} title="Edit Impact JSON" onClose={() => setEditorOpen(false)}>
        <div style={{ display:"grid", gap:10 }}>
          <div className="sh-muted" style={{ fontSize:12 }}>
            Paste JSON with keys like <code>updatedAt</code>, <code>kpis</code>, and <code>footnote</code>.
          </div>
          <textarea
            value={editorText}
            onChange={(e)=>setEditorText(e.target.value)}
            rows={16}
            spellCheck={false}
            style={{ width:"100%", border:"1px solid var(--ring)", borderRadius:10, padding:10,
                     fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", fontSize:13 }}
          />
          {editorError && <div style={{ color:"#b91c1c", fontSize:13 }}>{editorError}</div>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="sh-btn sh-btn--soft" onClick={resetEditor}>Reset to Defaults</button>
            <button className="sh-btn sh-btn--secondary" onClick={()=>setEditorOpen(false)}>Cancel</button>
            <button className="sh-btn sh-btn--primary" onClick={saveEditor}>Save</button>
          </div>
          <div className="sh-muted" style={{ fontSize:12 }}>
            Tip: Press <strong>Alt/Option + I</strong> to open this editor quickly.
          </div>
        </div>
      </Modal>

      <style>{`.railGrid{display:grid;gap:12px}`}</style>
    </div>
  );
}

/* --- SHF: Career plan saved (drop-in listener stays) --- */
(() => {
  if (typeof window === "undefined" || window.__shfHook_plan) return; window.__shfHook_plan = true;
  const once = (k) => { if (!k) return true; if (localStorage.getItem(k)) return false; localStorage.setItem(k,"1"); return true; };
  window.addEventListener("career:plan:saved", (e) => {
    const d = (e && e.detail) || {};
    const key = d.planId ? `shf.award.plan.${d.planId}` : "";
    if (!once(key)) return;
    try {
      window.shfCredit?.earn?.({ action: "career.plan.save", rewards: { wheat: 2 }, scoreDelta: 5, meta: { planId: d.planId } });
      window.shToast?.("🧭 Plan saved · +2 🌾 · +5 score");
    } catch {}
  });
})();
