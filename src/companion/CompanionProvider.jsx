// src/companion/CompanionProvider.jsx
// The SHF Companion Runtime. Mounted once per app entry (via
// RootProviders.jsx, the one file both career.main.jsx and
// curriculum.main.jsx already share — see audit notes), so its *code* is
// shared even though Career and Curriculum are separate React trees at
// runtime (this repo is a multi-page build, not a client-routed SPA).
//
// Canonical flow: Curriculum/Career page → companion.emit(event) →
// this runtime → Behavior Resolver (celebrationRegistry/reactionRegistry)
// → reducer → Brainiact UI. Pages never touch animation implementation
// details directly (see companionConfig.MOTION_TOKENS).
import React, { useEffect, useMemo, useReducer, useRef } from "react";
import { announce } from "@/components/ally/A11yTools.jsx";
import { useUser } from "@/context/UserContext.jsx";
import { getCompanionContext } from "@/lib/companion/api.js";
import { useAccessibilityProfile } from "@/context/AccessibilityProfileContext.jsx";
import { useEffectiveAccessibilityContext } from "@/context/EffectiveAccessibilityContext.jsx";
import { COMPANION_WIRE_EVENT } from "./companionEvents.js";
import { resolveCelebration, resolveReaction } from "./celebrationRegistry.js";
import { getHint as engineGetHint, nextHintLevel } from "./visualHintEngine.js";
import { getPersona, STORAGE_KEYS } from "./companionConfig.js";
import { companionReducer, initialCompanionState, COMPANION_MODES } from "./companionReducer.js";

const CompanionContext = React.createContext(null);

function readBool(key, fallback = false) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}
function writeBool(key, value) {
  try { localStorage.setItem(key, value ? "1" : "0"); } catch {}
}
function readSystemReducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

export function CompanionProvider({ appScope, children }) {
  const persona = getPersona(appScope);
  // SHF AIEL Phase 3 — reduceAnimation is seeded from and kept in sync
  // with the canonical Effective Accessibility Context, not this
  // provider's own independent companion:reduceAnimation localStorage key
  // (docs/SHF_AIEL_PERSISTENCE_API_CONTRACT_V1.md — two writable sources
  // for the same preference must never coexist; see accessibilityProfile
  // below for the write path this toggle now uses).
  const accessibilityProfile = useAccessibilityProfile();
  const { reducedMotion: canonicalReducedMotion } = useEffectiveAccessibilityContext();
  const [state, dispatch] = useReducer(
    companionReducer,
    { appScope, persona },
    (base) =>
      initialCompanionState({
        ...base,
        hidden: readBool(STORAGE_KEYS.HIDDEN, false),
        reduceAnimation: canonicalReducedMotion,
        focus: readBool(STORAGE_KEYS.FOCUS, false),
        systemReducedMotion: readSystemReducedMotion(),
        progressionLevel: (() => {
          try { return Number(localStorage.getItem(STORAGE_KEYS.PROGRESSION_LEVEL)) || 1; } catch { return 1; }
        })(),
      })
  );

  const celebrationTimerRef = useRef(null);

  // SHF Ecosystem Phase 11 — Companion Context. Fetched once per mount,
  // never polled (no long-term memory, no background chatter — a page
  // reload is the refresh mechanism, matching Calendar Intelligence's own
  // per-load-only fetch pattern). A failure here degrades quietly: the
  // Companion simply has no guidance to show and stays fully functional
  // for Hint/Coach/Celebration, which do not depend on it.
  const { role } = useUser();
  const [companionContext, setCompanionContext] = React.useState(null);
  useEffect(() => {
    let active = true;
    getCompanionContext(role)
      .then((data) => { if (active) setCompanionContext(data); })
      .catch(() => { if (active) setCompanionContext(null); });
    return () => { active = false; };
  }, [role]);

  // System reduced-motion preference — live, not just read-once.
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia("(prefers-reduced-motion: reduce)"); } catch { return; }
    const onChange = () => dispatch({ type: "SET_SYSTEM_REDUCED_MOTION", value: mq.matches });
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, []);

  // Persist user-controllable preferences. reduceAnimation is no longer
  // persisted here at all — it is a read-through of the canonical profile
  // (synced below), not an independent local write.
  useEffect(() => { writeBool(STORAGE_KEYS.HIDDEN, state.hidden); }, [state.hidden]);
  useEffect(() => { writeBool(STORAGE_KEYS.FOCUS, state.focus); }, [state.focus]);

  // One-directional sync: the canonical Effective Accessibility Context
  // is the source of truth; this only ever flows into local reducer
  // state, never the other way (setReduceAnimation below writes through
  // to the canonical profile instead of dispatching directly).
  useEffect(() => {
    dispatch({ type: "SET_REDUCE_ANIMATION", value: canonicalReducedMotion });
  }, [canonicalReducedMotion]);

  // The one wire listener the whole app talks to Brainiact through.
  useEffect(() => {
    const onCompanionEvent = (e) => {
      const { name, payload } = e?.detail || {};
      if (!name) return;

      if (name === "focus_enabled") { dispatch({ type: "SET_FOCUS", value: true }); return; }
      if (name === "focus_disabled") { dispatch({ type: "SET_FOCUS", value: false }); return; }

      const celebration = resolveCelebration(name);
      if (celebration) {
        dispatch({ type: "CELEBRATE", tier: celebration.tier, animation: celebration.animation, message: celebration.message });
        if (celebration.message) announce(`Brainiact: ${celebration.message}`);
        if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = setTimeout(() => {
          dispatch({ type: "CELEBRATION_DONE" });
          celebrationTimerRef.current = null;
        }, Math.min(celebration.durationMs || 2000, 5000)); // hard cap — "never prevent the student from continuing"
        return;
      }

      const reaction = resolveReaction(name);
      if (reaction) {
        dispatch({ type: "REACT", animation: reaction.animation, message: reaction.message });
        return;
      }

      // Unknown event: fail safe, no state change, no throw.
      if (import.meta.env.DEV) console.warn(`[companion] unknown event ignored: ${name}`, payload);
    };
    window.addEventListener(COMPANION_WIRE_EVENT, onCompanionEvent);
    return () => {
      window.removeEventListener(COMPANION_WIRE_EVENT, onCompanionEvent);
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  // React to the app's real, existing rewards stream (useRewards.js /
  // wallet:points, fired from ~14 real lesson-flow call sites across
  // LessonBody.jsx variants and MicroQuiz.jsx) rather than inventing a
  // second parallel currency or celebration system. Brainiact only reads
  // this signal for a small reaction — it never writes points/badges, and
  // does not duplicate CelebrationLayer.jsx's toast/confetti (that
  // component stays unmounted, as it already was before this change).
  useEffect(() => {
    const onRewardsEarned = (e) => {
      const points = Number(e?.detail?.points ?? 0);
      if (!(points > 0) || state.focus) return;
      dispatch({ type: "REACT", animation: "fistPump", message: `+${points} PTS` });
    };
    window.addEventListener("rewards:earned", onRewardsEarned);
    return () => window.removeEventListener("rewards:earned", onRewardsEarned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.focus]);

  // Centralized Alt+C — previously duplicated in CareerLayout.jsx and
  // CurriculumLayout.jsx; now one listener for both apps.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        dispatch({ type: "SET_COACH_OPEN", open: !state.coachOpen });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.coachOpen]);

  const api = useMemo(() => ({
    state,
    // SHF Ecosystem Phase 11 — read-only Companion Context/guidance (see
    // src/lib/companion/api.js). `null` while loading or on failure; the
    // UI must treat that as "no guidance available right now," never as
    // an empty-but-complete answer.
    companionContext,
    emit(name, payload) {
      try { window.dispatchEvent(new CustomEvent(COMPANION_WIRE_EVENT, { detail: { name, payload } })); } catch {}
    },
    setMode(mode) { dispatch({ type: "SET_MODE", mode }); },
    setExpanded(expanded) { dispatch({ type: "SET_EXPANDED", expanded }); },
    setHidden(hidden) { dispatch({ type: "SET_HIDDEN", hidden }); },
    setReduceAnimation(value) {
      // Optimistic local update for immediate UI feedback; the canonical
      // write below is the actual source of truth and will reconcile this
      // value back in via the sync effect once it resolves.
      dispatch({ type: "SET_REDUCE_ANIMATION", value });
      accessibilityProfile
        .patch({ sensory: { motionPreference: value ? "REDUCED" : "AUTO" } })
        .catch(() => {
          // Best-effort — a failed write leaves the optimistic local
          // value in place until the next canonical sync corrects it.
        });
    },
    setFocus(value) { dispatch({ type: "SET_FOCUS", value }); },
    openCoach() { dispatch({ type: "SET_COACH_OPEN", open: true }); },
    closeCoach() { dispatch({ type: "SET_COACH_OPEN", open: false }); },
    toggleCoach() { dispatch({ type: "SET_COACH_OPEN", open: !state.coachOpen }); },

    // Hint Mode — progressive-help API, agency stays with the student.
    requestHint({ conceptId, level = "gesture" }) {
      dispatch({ type: "REQUEST_HINT", conceptId, level });
      return engineGetHint(conceptId, level);
    },
    showAnotherClue() {
      if (!state.hint) return null;
      const next = nextHintLevel(state.hint.level);
      dispatch({ type: "SET_HINT_LEVEL", level: next });
      return engineGetHint(state.hint.conceptId, next);
    },
    explainIt() {
      if (!state.hint) return null;
      dispatch({ type: "SET_HINT_LEVEL", level: "explanation" });
      return engineGetHint(state.hint.conceptId, "explanation");
    },
    dismissHint() { dispatch({ type: "CLEAR_HINT" }); }, // "I'm good"

    setCareerMessage(message) { dispatch({ type: "SET_CAREER_MESSAGE", message }); },
  }), [state, companionContext, accessibilityProfile]);

  return <CompanionContext.Provider value={api}>{children}</CompanionContext.Provider>;
}

export function useCompanionContext() {
  const ctx = React.useContext(CompanionContext);
  if (!ctx) throw new Error("useCompanion() must be used within CompanionProvider");
  return ctx;
}

export { COMPANION_MODES };
