// src/context/EffectiveAccessibilityContext.jsx
//
// SHF AIEL Phase 3 — the Effective Accessibility Context (docs/
// SHF_AIEL_PROFILE_CONTRACT_V1.md §7): a pure, in-memory computation from
// the canonical AccessibilityProfileContext plus the live OS
// prefers-reduced-motion signal. It has no persistence of its own and
// makes no network calls — every consumer (CelebrationProvider,
// CompanionProvider) reads from here instead of touching the raw profile
// or localStorage directly.
import React from "react";
import { useAccessibilityProfile } from "./AccessibilityProfileContext.jsx";

const Ctx = React.createContext({
  reducedMotion: false,
  celebrationIntensity: "FULL",
  textScale: "DEFAULT",
  contrastMode: "DEFAULT",
  focusEmphasis: "DEFAULT",
  targetSize: "DEFAULT",
  captionPreference: "AUTO",
  transcriptPreference: "AUTO",
  preferredReadingSupport: "CORE",
  readAloudPreference: "AUTO",
});

export function useEffectiveAccessibilityContext() {
  return React.useContext(Ctx);
}

function useSystemReducedMotion() {
  const [matches, setMatches] = React.useState(() => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  });
  React.useEffect(() => {
    let mq;
    try { mq = window.matchMedia("(prefers-reduced-motion: reduce)"); } catch { return; }
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, []);
  return matches;
}

export function EffectiveAccessibilityContextProvider({ children }) {
  const { preferences } = useAccessibilityProfile();
  const systemReducedMotion = useSystemReducedMotion();

  const value = React.useMemo(() => {
    const motionPreference = preferences?.sensory?.motionPreference || "AUTO";
    const reducedMotion = motionPreference === "REDUCED" || (motionPreference === "AUTO" && systemReducedMotion);
    return {
      reducedMotion,
      celebrationIntensity: preferences?.sensory?.celebrationIntensity || "FULL",
      textScale: preferences?.presentation?.textScale || "DEFAULT",
      contrastMode: preferences?.presentation?.contrastMode || "DEFAULT",
      focusEmphasis: preferences?.interaction?.focusEmphasis || "DEFAULT",
      targetSize: preferences?.interaction?.targetSize || "DEFAULT",
      captionPreference: preferences?.media?.captionPreference || "AUTO",
      transcriptPreference: preferences?.media?.transcriptPreference || "AUTO",
      preferredReadingSupport: preferences?.learningSupport?.preferredReadingSupport || "CORE",
      readAloudPreference: preferences?.learningSupport?.readAloudPreference || "AUTO",
    };
  }, [preferences, systemReducedMotion]);

  // SHF AIEL Phase 4 — the one place that turns the computed context into
  // real DOM state a stylesheet can react to. Each SHF app is its own
  // separate HTML page (multi-page build, not a client-routed SPA), so
  // setting these on document.documentElement here can never leak across
  // apps — src/styles/curriculum-a11y.css additionally gates every rule
  // on [data-app="curriculum"], so only that app's own page responds.
  React.useEffect(() => {
    try {
      const root = document.documentElement;
      root.dataset.a11yTextScale = value.textScale;
      root.dataset.a11yContrast = value.contrastMode;
      root.dataset.a11yFocus = value.focusEmphasis;
      root.dataset.a11yTargetSize = value.targetSize;
    } catch {
      // non-DOM environment (SSR/tests) — nothing to do
    }
  }, [value.textScale, value.contrastMode, value.focusEmphasis, value.targetSize]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
