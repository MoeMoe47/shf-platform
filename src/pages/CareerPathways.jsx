// src/pages/CareerPlanner.jsx
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { track } from "../utils/analytics.js";
import usePathways from "../hooks/usePathways.js";
import recommendPlans from "../utils/recommendPlans.js";
import { SharedCoachingNotes } from "../components/CareerConsultantPanel.jsx";
import { markDarkScope } from "../utils/careerTheme.js";
import "../styles/career-pathways.css";

const FundingWizard            = React.lazy(() => import("../components/FundingWizard.jsx"));
const CareerConsultantPanel    = React.lazy(() => import("../components/CareerConsultantPanel.jsx"));
const PlanSelector             = React.lazy(() => import("../components/PlanSelector.jsx"));
const PathwayPersonalizerSheet = React.lazy(() => import("../components/PathwayPersonalizerSheet.jsx"));
const PathwayDetailDrawer      = React.lazy(() => import("../components/PathwayDetailDrawer.jsx"));
const FundingPlanCard          = React.lazy(() => import("../components/FundingPlanCard.jsx"));
const CollabPanel              = React.lazy(() => import("../components/CollabPanel.jsx"));
const CoachBookingCard         = React.lazy(() => import("../components/CoachBookingCard.jsx"));
const TasksCard                = React.lazy(() => import("../components/TasksCard.jsx"));

// Cluster → icon glyph. Purely presentational (no photo assets exist for
// pathways in this dataset — see src/data/pathways.json — so real category
// icons are used instead of fabricated stock photography).
const CLUSTER_ICON = {
  "Green Energy + Sustainability": "🌱",
  "AI‑Resistant + Human‑Centered": "🧠",
  "AI‑Building + Tech": "💻",
  "Skilled Trades": "🛠️",
  "Finance & Business": "💼",
};
function clusterIcon(cluster) {
  return CLUSTER_ICON[cluster] || "🎯";
}

const usd0 = (n) => {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n) || 0); }
  catch { return `$${Math.round(Number(n) || 0)}`; }
};

/* ---------- Team Workspace: tabbed presentation over 4 EXISTING,
   UNCHANGED components (SharedCoachingNotes, CollabPanel, TasksCard,
   CoachBookingCard). Each still owns its own real storage key; only the
   layout groups them under tabs instead of stacking full-width sections. */
function TeamWorkspaceTabs({ pathwayId, planId, pathway, onBooked }) {
  const TABS = [
    { id: "notes",  label: "Consultant Notes",   icon: "📝" },
    { id: "collab", label: "Plan Collaboration", icon: "🤝" },
    { id: "tasks",  label: "Plan Tasks",         icon: "📋" },
    { id: "coach",  label: "Coach Booking",      icon: "📅" },
  ];
  // Preserves the pre-existing #tasks deep-link/scroll behavior (see
  // useHashScroll below): landing on #tasks now selects the Plan Tasks tab
  // instead of scrolling to a now-removed standalone Tasks section.
  const [active, setActive] = useState(() =>
    typeof window !== "undefined" && window.location.hash === "#tasks" ? "tasks" : "collab"
  );

  return (
    <div id="tasks" tabIndex={-1} className="cpw-teamWorkspace" aria-label="Team Workspace" style={{ outline: "none" }}>
      <h3 className="h3" style={{ marginTop: 0 }}>Team Workspace</h3>
      <div className="cpw-tabList" role="tablist" aria-label="Team workspace sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`cpw-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`cpw-tabpanel-${t.id}`}
            className="cpw-tab"
            onClick={() => setActive(t.id)}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div
        className="cpw-tabPanel"
        role="tabpanel"
        id={`cpw-tabpanel-${active}`}
        aria-labelledby={`cpw-tab-${active}`}
      >
        {active === "notes" && <SharedCoachingNotes pathwayId={pathwayId} />}
        {active === "collab" && (
          <Suspense fallback={<CardSkel />}>
            <CollabPanel planId={planId} />
          </Suspense>
        )}
        {active === "tasks" && (
          <Suspense fallback={<CardSkel h={120} />}>
            <TasksCard planId={planId || "draft"} pathway={pathway || {}} />
          </Suspense>
        )}
        {active === "coach" && (
          <Suspense fallback={<CardSkel h={90} />}>
            <CoachBookingCard pathway={pathway || undefined} onBooked={onBooked} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

const preloadPersonalizer = () => import("../components/PathwayPersonalizerSheet.jsx");
const preloadDrawer       = () => import("../components/PathwayDetailDrawer.jsx");
const preloadTasks        = () => import("../components/TasksCard.jsx");

const FUNDING_LS_KEY  = "sh_funding_plan_v1";

function CardSkel({ h = 140 }) {
  return <div className="skel skel--card" style={{ height: h }} aria-hidden="true" />;
}

/* ---------- ImpactStrip ----------
   CCV2 Phase 0 governance correction: this section previously displayed
   hardcoded, non-canonical cohort figures (formerly src/data/impact.js) as
   if they were verified institutional outcomes, with a browser query-param
   plus localStorage mechanism that let anyone locally edit those figures
   and have them render as if authoritative. Per the "govern facts, not
   ambition" principle, unverified institutional outcome numbers must not
   be presented as fact and must never be editable from the browser. No
   governed backend projection for these particular cohort-outcome metrics
   exists yet (see src/shared/reporting/ for the metrics that are governed
   today), so this now shows a bounded, honest unavailable state instead of
   fabricating or reintroducing numbers. */
function ImpactStrip({ ctaHref = "/explore" }) {
  return (
    <section className="card card--pad" aria-label="Program impact">
      <div className="cpw-impactHead">
        <h3 className="h3" style={{ margin: 0 }}>Impact Snapshot</h3>
      </div>
      <p className="cpw-impactSub" role="status">
        Verified outcome data is not currently available.
      </p>
      <p className="subtle" style={{ marginTop: 12, fontSize: 12 }}>
        This section will show verified cohort outcomes once a governed reporting source is connected. Not a guarantee.
      </p>
      <a className="cpw-sectionLink" href={ctaHref}
         style={{ display: "inline-block", marginTop: 4 }}
         onClick={() => { try { track("impact_cta_clicked", { to: ctaHref }); } catch {} }}>
        Learn more about the data →
      </a>
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

  // Dark mode is opt-in per page (see careerTheme.js) — activates only
  // while this page is mounted, so no other page is ever affected.
  // "career-pathways" gates this file's own .cpw-* / .pd-* / .pp-* dark
  // rules (career-pathways.css). "resume-builder" is ALSO set here — that
  // literal scope name is what the shared shell's existing dark CSS
  // (career-shell.css) checks to allow the shared header/sidebar to go
  // dark; it predates this page and was never renamed to something more
  // generic. Reusing it (rather than rewriting ~15 existing shell
  // selectors, which risks regressing Resume Builder's already-certified
  // dark mode) is the smallest-risk way to get shell chrome dark support
  // here too, fully within the existing shared theme system.
  useEffect(() => {
    markDarkScope("career-pathways", true);
    markDarkScope("resume-builder", true);
    return () => {
      markDarkScope("career-pathways", false);
      markDarkScope("resume-builder", false);
    };
  }, []);

  const { data: pathways = [], loading: pathwaysLoading, error: pathwaysError } = usePathways();

  const [sheetOpen, setSheetOpen]       = useState(false);
  const [inputs, setInputs]             = useState(null);
  const [plans, setPlans]               = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [fundingPlan, setFundingPlan]   = useState(null);

  const [activePathway, setActivePathway] = useState(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);

  // Session-only (not persisted, not a new storage key) — purely drives the
  // presentational stepper's "Launch" step from a real action (Start Plan
  // clicked) rather than inventing a fake progress signal.
  const [planStarted, setPlanStarted] = useState(false);

  // Focus management + status announcement for the Personalizer's generated
  // result (WCAG: move focus or announce after an async region update).
  const planHeadingRef = useRef(null);
  const [planAnnouncement, setPlanAnnouncement] = useState("");

  // Seed A/B/C from pathways on first load.
  // Fixed: recommendPlans(inputs, pathways, options) was being called as
  // recommendPlans(pathways) — the pathways array landed in `inputs`, the
  // real `pathways` param defaulted to [], and the function's own
  // norms.length===0 guard silently returned []. Passing an explicit empty
  // inputs object as the first argument is the smallest correct fix; a
  // real personalization (via the sheet) later overwrites this baseline.
  useEffect(() => {
    if (!plans.length && pathways.length) {
      try {
        const seeded = recommendPlans({}, pathways);
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

    // Accessible completion signal: announce, then move focus to the plan
    // region (the sheet is about to unmount, so focus must land somewhere
    // real rather than falling back to <body>).
    setPlanAnnouncement(
      list.length
        ? `Generated ${list.length} plan${list.length === 1 ? "" : "s"}: ${list.map((p, i) => `Plan ${String.fromCharCode(65 + i)}`).join(", ")}.`
        : "No plans were generated."
    );
    setTimeout(() => planHeadingRef.current?.focus(), 0);
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
    setPlanStarted(true);
    try { track("pathway_enroll_clicked", { pathwayId:p.id, planStrategy:plan?.strategy }); } catch {}
  };

  // Presentational stepper — every status is derived from real, already-
  // tracked state (no new persistence, no invented signal). "Launch" only
  // ever reflects a real Start Plan click this session.
  const hasPlans = plans.length > 0;
  const hasFunding = !!fundingPlan;
  const steps = [
    { id: "explore", name: "Explore", status: pathways.length ? "complete" : "active" },
    { id: "compare", name: "Compare", status: hasPlans ? "complete" : (pathways.length ? "active" : "upcoming") },
    { id: "fund",    name: "Fund",    status: hasFunding ? "complete" : (hasPlans ? "active" : "upcoming") },
    { id: "launch",  name: "Launch",  status: planStarted ? "complete" : "upcoming" },
  ];
  const stepStateLabel = { complete: "Complete", active: "In progress", upcoming: "Upcoming" };
  const personalized = inputs !== null;
  const topThreePlans = plans.slice(0, 3);

  return (
    <div className="cpw-page">
      {pathwaysLoading && <p role="status">Loading careers…</p>}
      {pathwaysError && <p role="alert">Career information is temporarily unavailable.</p>}
      <div aria-live="polite" className="sh-srOnly">{planAnnouncement}</div>

      <nav className="cpw-breadcrumb" aria-label="Breadcrumb">
        <a href="/career.html#/dashboard">My Career Center</a>
        <span className="cpw-crumbSep" aria-hidden="true">/</span>
        <span className="cpw-crumbCurrent">Career Pathways</span>
      </nav>

      <div className="cpw-hero">
        <div>
          <h1 className="cpw-heroTitle">Build Your Career Path</h1>
          <p className="cpw-heroSub">
            Compare pathways, create a plan, and understand the funding needed to reach your first paycheck.
          </p>
        </div>
        <div className="cpw-heroActions">
          <button
            className="sh-btn sh-btn--secondary"
            onClick={() => { try { track("plan_print_clicked"); } catch {} window.print(); }}
          >
            🖨️ Print Plan
          </button>
          <button
            className="sh-btn cpw-btnGradient"
            onClick={handleStartPersonalizer}
            onMouseEnter={preloadPersonalizer}
            onFocus={preloadPersonalizer}
            aria-expanded={sheetOpen ? "true" : "false"}
            aria-controls="personalizer-sheet"
          >
            ✨ Personalize My Plan
          </button>
        </div>
      </div>

      <div className="cpw-statusRow">
        <div className="cpw-stepper" role="list" aria-label="Career plan progress">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="cpw-step" role="listitem" data-status={s.status}>
                <span className="cpw-stepDot" aria-hidden="true">
                  {s.status === "complete" ? "✓" : i + 1}
                </span>
                <span className="cpw-stepLabel">
                  <span className="cpw-stepName">{s.name}</span>
                  <span className="cpw-stepState">{stepStateLabel[s.status]}</span>
                </span>
              </div>
              {i < steps.length - 1 && <span className="cpw-stepConnector" aria-hidden="true" />}
            </React.Fragment>
          ))}
        </div>

        <div className="cpw-planReadyPanel">
          <span className="cpw-planReadyIcon" aria-hidden="true">{personalized ? "🛡️" : "ℹ️"}</span>
          <div>
            <p className="cpw-planReadyTitle">{personalized ? "Personalized plan ready" : "Baseline plan ready"}</p>
            <p className="cpw-planReadySub">
              {personalized
                ? "Recommendations generated based on your profile."
                : "Using baseline recommendations — Personalize for a tailored plan."}
            </p>
          </div>
        </div>
      </div>

      <div className="cpw-layout">
        <div className="cpw-main">
          {/* Recommended Pathways — the same real Plan A/B/C, shown as cards */}
          <section aria-labelledby="cpw-pathways-h">
            <div className="cpw-sectionHead">
              <h2 id="cpw-pathways-h" className="cpw-sectionTitle">Recommended Pathways</h2>
              <a className="cpw-sectionLink" href="/career.html#/pathways">View all pathways →</a>
            </div>

            {topThreePlans.length ? (
              <div className="cpw-pathwayGrid">
                {topThreePlans.map((p, idx) => {
                  const cred = p?.pathway?.firstCredential?.name;
                  return (
                    <div key={p.id} className={`cpw-pathwayCard ${idx === 0 ? "is-recommended" : ""}`}>
                      <span className="cpw-pathwayRank" aria-hidden="true">{idx + 1}</span>
                      {idx === 0 && <span className="cpw-pathwayRecommended">Plan A · Recommended</span>}
                      <div className="cpw-pathwayTile" aria-hidden="true">{clusterIcon(p?.pathway?.cluster)}</div>
                      <div className="cpw-pathwayBody">
                        <h3 className="cpw-pathwayTitle">{p.title}</h3>
                        <div className="cpw-pathwayMeta">
                          {p?.pathway?.canonicalCareer ? (
                            <div className="cpw-pathwayMetaRow">
                              <span className="cpw-pathwayMetaLabel">Career facts</span>
                              <span className="cpw-pathwayMetaValue">Timeline and cost not specified</span>
                            </div>
                          ) : (
                            <>
                              <div className="cpw-pathwayMetaRow">
                                <span className="cpw-pathwayMetaLabel"><span aria-hidden="true">⏱️</span> Time to first paycheck</span>
                                <span className="cpw-pathwayMetaValue">{p.estWeeks} wks</span>
                              </div>
                              <div className="cpw-pathwayMetaRow">
                                <span className="cpw-pathwayMetaLabel"><span aria-hidden="true">💵</span> Est. cost after aid</span>
                                <span className="cpw-pathwayMetaValue">{usd0(p.netCostAfterAid)}</span>
                              </div>
                            </>
                          )}
                          {cred && (
                            <div className="cpw-pathwayMetaRow">
                              <span className="cpw-pathwayMetaLabel"><span aria-hidden="true">🎓</span> Credential</span>
                              <span className="cpw-pathwayMetaValue">{cred}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="cpw-pathwayActions">
                        <button className="sh-btn sh-btn--primary" onClick={() => handleViewPlan(p)}>View Details</button>
                        <a className="sh-btn sh-btn--secondary" href="/career.html#/pathways">Explore →</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="subtle" role="note">
                No plans yet. Click{" "}
                <button className="sh-btn sh-btn--tiny" onClick={handleStartPersonalizer}>Personalize</button>{" "}
                to generate Plan A/B/C.
              </div>
            )}
          </section>

          {/* Funding */}
          <section id="fund" tabIndex={-1} aria-label="Funding" style={{ outline: "none" }}>
            <div className="cpw-fundingRow">
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
            </div>
          </section>

          {/* Team Workspace carries the #tasks id itself now — see
              TeamWorkspaceTabs, which also pre-selects the Plan Tasks tab
              when landed on via #tasks, preserving the prior deep-link. */}
          <TeamWorkspaceTabs
            pathwayId={consultantPathway?.id}
            planId={selectedPlan?.id || null}
            pathway={consultantPathway || {}}
            onBooked={({ duration, pathwayId }) => {
              try { track("coach_booking_link_opened", { duration, pathwayId }); } catch {}
            }}
          />
        </div>

        <div className="cpw-rail">
          {/* Your Career Plan */}
          <div className="card card--pad cpw-planList">
            <div className="sh-row" style={{ alignItems: "center" }}>
              <h3 ref={planHeadingRef} tabIndex={-1} className="h3" style={{ margin: 0 }}>Your Career Plan</h3>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="cpw-sectionLink"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={handleStartPersonalizer}
              >
                🔄 Regenerate recommendations
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
                  showHeader={false}
                  compact
                />
              ) : (
                <div className="subtle" role="note">
                  No plans yet. Click{" "}
                  <button className="sh-btn sh-btn--tiny" onClick={handleStartPersonalizer}>Personalize</button>{" "}
                  to generate Plan A/B/C.
                </div>
              )}
            </Suspense>

            <div className="cpw-disclaimer">
              <span aria-hidden="true">🛡️</span>
              <span>These are recommendations, not guarantees. Outcomes vary by effort, experience, and local opportunities.</span>
            </div>
          </div>

          {/* Coach Mode — same CareerConsultantPanel, notes shown separately
              inside Team Workspace → Consultant Notes (showNotes=false) */}
          <Suspense fallback={<CardSkel />}>
            <CareerConsultantPanel
              pathway={consultantPathway || {}}
              title="Coach Mode"
              compact={false}
              showNotes={false}
            />
          </Suspense>

          {/* Impact */}
          <ImpactStrip ctaHref="/explore" />
        </div>
      </div>

      {/* Personalizer */}
      <Suspense fallback={null}>
        <PathwayPersonalizerSheet
          id="personalizer-sheet"
          open={sheetOpen}
          pathways={pathways}
          initialValues={inputs}
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
