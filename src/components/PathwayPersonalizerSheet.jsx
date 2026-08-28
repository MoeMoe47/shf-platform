// src/components/PathwayPersonalizerSheet.jsx
//
// Repaired to match the contract CareerPathways.jsx has always expected
// (open, onClose, pathways, initialValues, onSave, onComplete) instead of
// being a confirm-only dialog. Generates real Plan A/B/C via
// recommendPlans(inputs, pathways) using only the fields that function
// actually consumes (checked its full implementation, not just its doc
// comment — recommendPlans() never reads `state` despite the JSDoc listing
// it, so no location field is collected here).
//
// Reward call switched from useCreditCtx().earn (that context has no such
// method — addEvent/completeTask/clearLocal only, so the original call was
// always a silent no-op) to window.shfCredit.earn, the same working global
// bridge CoachBookingCard.jsx already uses successfully on this page.
import React from "react";
import { track } from "../utils/analytics.js";
import recommendPlans from "../utils/recommendPlans.js";

const HOURS_MIN = 1;
const HOURS_MAX = 80;
const AGE_MIN = 14;
const AGE_MAX = 99;
const HOUSEHOLD_MIN = 1;
const HOUSEHOLD_MAX = 12;

function earn(detail) {
  try {
    if (window.shfCredit?.earn) return window.shfCredit.earn(detail);
    window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail }));
  } catch {}
}

function clusterOptions(pathways) {
  const set = new Set();
  for (const p of Array.isArray(pathways) ? pathways : []) {
    if (p && typeof p.cluster === "string" && p.cluster.trim()) set.add(p.cluster);
  }
  return Array.from(set).sort();
}

export default function PathwayPersonalizerSheet({
  id,
  open = false,
  onClose = () => {},
  pathway = null,       // optional single-pathway context (kept for compatibility)
  pathways = [],        // the collection recommendPlans scores against
  initialValues = null, // re-populate the form when reopening after a prior run
  onSave,
  onComplete,
}) {
  const dialogRef = React.useRef(null);
  const firstFieldRef = React.useRef(null);
  const returnFocusRef = React.useRef(null);

  const clusters = React.useMemo(() => clusterOptions(pathways), [pathways]);

  const [targetCluster, setTargetCluster] = React.useState("");
  const [skillsText, setSkillsText] = React.useState("");
  const [hoursPerWeek, setHoursPerWeek] = React.useState(10);
  const [device, setDevice] = React.useState("unknown");
  const [transport, setTransport] = React.useState("unknown");
  const [hsGrad, setHsGrad] = React.useState(true);
  const [unemployed, setUnemployed] = React.useState(false);
  const [veteran, setVeteran] = React.useState(false);
  const [age, setAge] = React.useState("");
  const [householdSize, setHouseholdSize] = React.useState("");

  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [announce, setAnnounce] = React.useState("");

  // (Re)seed the form whenever the sheet opens — from initialValues if the
  // host has them (a prior run), else from the optional single-pathway
  // context, else plain defaults.
  React.useEffect(() => {
    if (!open) return;
    setTargetCluster(initialValues?.targetCluster || pathway?.cluster || "");
    setSkillsText((initialValues?.priorSkills || []).join(", "));
    setHoursPerWeek(initialValues?.hoursPerWeek ?? 10);
    setDevice(initialValues?.device || "unknown");
    setTransport(initialValues?.transport || "unknown");
    setHsGrad(initialValues?.hsGrad ?? true);
    setUnemployed(initialValues?.unemployed ?? false);
    setVeteran(initialValues?.veteran ?? false);
    setAge(initialValues?.age ?? "");
    setHouseholdSize(initialValues?.householdSize ?? "");
    setErrors({});
    setNotice("");
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Accessible dialog: focus trap, Escape, body-scroll lock, focus restore —
  // mirrors the proven pattern already used for dialogs in this codebase.
  React.useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    const t = setTimeout(() => firstFieldRef.current?.focus(), 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const node = dialogRef.current;
        if (!node) return;
        const items = Array.from(
          node.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter((el) => !el.disabled);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  function validate() {
    const errs = {};
    const hrs = Number(hoursPerWeek);
    if (hoursPerWeek === "" || hoursPerWeek == null || Number.isNaN(hrs)) {
      errs.hoursPerWeek = "Enter how many hours per week you can commit.";
    } else if (hrs < HOURS_MIN || hrs > HOURS_MAX) {
      errs.hoursPerWeek = `Enter a number between ${HOURS_MIN} and ${HOURS_MAX}.`;
    }
    if (age !== "" && age != null) {
      const a = Number(age);
      if (Number.isNaN(a) || a < AGE_MIN || a > AGE_MAX) {
        errs.age = `Age must be between ${AGE_MIN} and ${AGE_MAX}, or left blank.`;
      }
    }
    if (householdSize !== "" && householdSize != null) {
      const h = Number(householdSize);
      if (Number.isNaN(h) || h < HOUSEHOLD_MIN || h > HOUSEHOLD_MAX) {
        errs.householdSize = `Household size must be between ${HOUSEHOLD_MIN} and ${HOUSEHOLD_MAX}, or left blank.`;
      }
    }
    return errs;
  }

  function normalizeInputs() {
    return {
      targetCluster: targetCluster || null,
      priorSkills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
      hoursPerWeek: Number(hoursPerWeek),
      device,
      transport,
      hsGrad: !!hsGrad,
      unemployed: !!unemployed,
      veteran: !!veteran,
      age: age === "" ? undefined : Number(age),
      householdSize: householdSize === "" ? undefined : Number(householdSize),
    };
  }

  function handleSubmit(e) {
    e?.preventDefault?.();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      setAnnounce("There were problems with your answers — check the highlighted fields.");
      return;
    }

    setSubmitting(true);
    setNotice("");

    const inputs = normalizeInputs();

    // Never fabricate or duplicate pathways to fill gaps — filter honestly.
    const pool = (Array.isArray(pathways) ? pathways : []).filter(Boolean);
    const scoped = inputs.targetCluster
      ? pool.filter((x) => x && x.cluster === inputs.targetCluster)
      : pool;

    if (scoped.length === 0) {
      setSubmitting(false);
      setNotice(
        inputs.targetCluster
          ? `No pathways currently exist in "${inputs.targetCluster}". Try a different industry or "All industries".`
          : "No pathways are currently available to personalize."
      );
      setAnnounce("No matching pathways were found.");
      return;
    }

    let plans = [];
    try {
      plans = recommendPlans(inputs, scoped) || [];
    } catch (err) {
      setSubmitting(false);
      setNotice("We couldn't generate a recommendation from that combination — please adjust your answers and try again.");
      setAnnounce("Recommendation generation failed.");
      try { track("plan_personalizer_failed", { reason: String(err?.message || err) }, { silent: true }); } catch {}
      return;
    }

    if (!plans.length) {
      setSubmitting(false);
      setNotice("No plans could be generated from your answers yet. Try widening your industry choice.");
      setAnnounce("No plans were generated.");
      return;
    }

    // Genuine completion only past this point — reward/analytics/close all
    // gated behind a real, non-empty result.
    try { onSave?.(inputs); } catch {}
    try { onComplete?.({ inputs, plans }); } catch {}

    earn({
      action: "pathway.personalized",
      rewards: { corn: 2 },
      scoreDelta: 3,
      meta: { plans: plans.length, targetCluster: inputs.targetCluster || null },
    });
    try {
      window.shToast?.(`🧭 Generated ${plans.length} plan${plans.length === 1 ? "" : "s"} · +2 🌽 · +3 score`);
    } catch {}
    try { track("plan_personalizer_saved", { via: "onComplete", plans: plans.length }); } catch {}

    setSubmitting(false);
    setAnnounce(`Generated ${plans.length} plan${plans.length === 1 ? "" : "s"}.`);
    onClose();
  }

  return (
    <>
      <div className="pp-scrim" onClick={onClose} aria-hidden="true" />
      <div
        id={id}
        ref={dialogRef}
        className="pp-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pp-title"
        aria-describedby="pp-desc"
      >
        <div className="pp-head">
          <div>
            <h2 id="pp-title" className="pp-title">Personalize your plan</h2>
            <p id="pp-desc" className="pp-desc">
              Answer a few questions to generate Plan A (fastest), Plan B (least cost), and Plan C (highest placement).
            </p>
          </div>
          <button type="button" className="sh-btn sh-btn--secondary pp-close" onClick={onClose} aria-label="Close personalizer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="pp-grid">
            <div className="pp-field">
              <label htmlFor="pp-cluster">Target industry</label>
              <select id="pp-cluster" ref={firstFieldRef} value={targetCluster} onChange={(e) => setTargetCluster(e.target.value)}>
                <option value="">All industries</option>
                {clusters.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="pp-field">
              <label htmlFor="pp-hours">Hours per week you can commit</label>
              <input
                id="pp-hours"
                type="number"
                min={HOURS_MIN}
                max={HOURS_MAX}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                aria-invalid={!!errors.hoursPerWeek}
                aria-describedby={errors.hoursPerWeek ? "pp-hours-err" : "pp-hours-help"}
                required
              />
              <span id="pp-hours-help" className="pp-help">Used to estimate how long each pathway will take.</span>
              {errors.hoursPerWeek && (
                <span id="pp-hours-err" role="alert" className="pp-error">{errors.hoursPerWeek}</span>
              )}
            </div>

            <div className="pp-field">
              <label htmlFor="pp-device">Device for coursework</label>
              <select id="pp-device" value={device} onChange={(e) => setDevice(e.target.value)}>
                <option value="unknown">Not sure</option>
                <option value="desktop">Desktop</option>
                <option value="laptop">Laptop</option>
                <option value="tablet">Tablet</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>

            <div className="pp-field">
              <label htmlFor="pp-transport">Getting to in-person sessions</label>
              <select id="pp-transport" value={transport} onChange={(e) => setTransport(e.target.value)}>
                <option value="unknown">Not sure</option>
                <option value="car">Car</option>
                <option value="public">Public transit</option>
                <option value="bike">Bike</option>
                <option value="walk">Walk</option>
                <option value="remote_only">Remote only</option>
              </select>
            </div>

            <div className="pp-field pp-field--wide">
              <label htmlFor="pp-skills">Existing skills (optional)</label>
              <input
                id="pp-skills"
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="e.g., customer service, basic wiring, Excel"
                aria-describedby="pp-skills-help"
              />
              <span id="pp-skills-help" className="pp-help">
                Comma-separated. Helps match pathways you're already partway ready for.
              </span>
            </div>

            <div className="pp-field">
              <label htmlFor="pp-age">Age (optional)</label>
              <input
                id="pp-age"
                type="number"
                min={AGE_MIN}
                max={AGE_MAX}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "pp-age-err" : undefined}
              />
              {errors.age && <span id="pp-age-err" role="alert" className="pp-error">{errors.age}</span>}
            </div>

            <div className="pp-field">
              <label htmlFor="pp-household">Household size (optional)</label>
              <input
                id="pp-household"
                type="number"
                min={HOUSEHOLD_MIN}
                max={HOUSEHOLD_MAX}
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                aria-invalid={!!errors.householdSize}
                aria-describedby={errors.householdSize ? "pp-household-err" : undefined}
              />
              {errors.householdSize && (
                <span id="pp-household-err" role="alert" className="pp-error">{errors.householdSize}</span>
              )}
            </div>

            <label className="pp-checkbox">
              <input type="checkbox" checked={hsGrad} onChange={(e) => setHsGrad(e.target.checked)} />
              High school graduate (or equivalent)
            </label>
            <label className="pp-checkbox">
              <input type="checkbox" checked={unemployed} onChange={(e) => setUnemployed(e.target.checked)} />
              Currently unemployed
            </label>
            <label className="pp-checkbox">
              <input type="checkbox" checked={veteran} onChange={(e) => setVeteran(e.target.checked)} />
              Veteran / eligible dependent
            </label>
          </div>

          {notice && <div role="alert" className="pp-notice">{notice}</div>}

          <div aria-live="polite" className="sh-srOnly">{announce}</div>

          <div className="pp-actions">
            <button type="submit" className="sh-btn sh-btn--primary" disabled={submitting}>
              {submitting ? "Generating…" : "Generate Plan A/B/C"}
            </button>
            <button type="button" className="sh-btn sh-btn--secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .pp-scrim{ position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:var(--z-dialog, 900); }
        .pp-sheet{
          position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
          width:min(720px, 92vw); max-height:min(88vh, 900px); overflow:auto;
          background:#fff; color:var(--ink,#111); border:1px solid var(--ring,#e5e7eb);
          border-radius:16px; box-shadow:0 24px 60px rgba(0,0,0,.25);
          z-index:calc(var(--z-dialog, 900) + 1);
          padding:16px;
        }
        .pp-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .pp-title{ margin:0 0 4px; font-size:20px; }
        .pp-desc{ margin:0; color:var(--ink-soft,#6b7280); font-size:13px; }
        .pp-close{ min-width:44px; min-height:44px; flex:none; }
        .pp-grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:12px; margin-top:14px; }
        .pp-field{ display:flex; flex-direction:column; gap:4px; min-width:0; }
        .pp-field--wide{ grid-column:1 / -1; }
        .pp-field label{ font-size:13px; font-weight:700; }
        .pp-field input, .pp-field select{
          min-height:44px; padding:8px 10px; border-radius:8px; border:1px solid var(--ring,#e5e7eb);
          background:#fff; color:inherit; font:inherit;
        }
        .pp-field input[aria-invalid="true"], .pp-field select[aria-invalid="true"]{ border-color:#dc2626; }
        .pp-help{ font-size:12px; color:var(--ink-soft,#6b7280); }
        .pp-error{ font-size:12px; color:#dc2626; }
        .pp-checkbox{ display:flex; align-items:center; gap:8px; font-size:14px; min-height:44px; }
        .pp-notice{ margin-top:12px; padding:10px 12px; border:1px solid #f3d19e; background:#fff7ea; border-radius:10px; font-size:13px; }
        .pp-actions{ display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
        .pp-actions .sh-btn{ min-height:44px; }
        @media (prefers-reduced-motion: reduce){ .pp-sheet{ transition:none; } }
        @media (max-width:480px){ .pp-sheet{ width:94vw; padding:12px; top:50%; } }
      `}</style>
    </>
  );
}
