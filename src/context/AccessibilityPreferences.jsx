// src/context/AccessibilityPreferences.jsx
//
// This file is a thin translation adapter over the canonical
// AccessibilityProfileContext, preserving the exact same flat external
// API (`prefs`/`setPref`/`resetPrefs`) that AccessibilityPreferencesPanel.jsx
// and MediaRow.jsx already call, so neither needed a UI rewrite.
//
// SHF AIEL Phase 4 update: the former boolean reading-level checkbox (no
// real consumer anywhere — see Phase 3's own header note, now retired)
// has been replaced by `preferredReadingSupport`, a direct passthrough of
// the real three-value canonical enum (CORE|SIMPLE|ADVANCED). This is no
// longer a second competing signal: ReadingLevelProvider.jsx now reads
// and writes this exact same canonical field when mounted inside
// Curriculum (see that file's own header for the detection mechanism),
// so this control and the Reading Level mechanism share one authoritative
// value. This adapter owns no storage of its own at all any more.
import React from "react";
import { useAccessibilityProfile } from "./AccessibilityProfileContext.jsx";

const DEFAULTS = {
  reducedMotion: false,
  largerText: false,
  higherContrast: false,
  captionsPreferred: false,
  transcriptPreferred: false,
  preferredReadingSupport: "CORE",
  audioSupport: false,
  keyboardOptimized: false,
  celebrationIntensity: "FULL",
};

function toFlatPrefs(preferences) {
  const p = preferences || {};
  return {
    reducedMotion: p.sensory?.motionPreference === "REDUCED",
    largerText: p.presentation?.textScale === "LARGE" || p.presentation?.textScale === "EXTRA_LARGE",
    higherContrast: p.presentation?.contrastMode === "HIGH",
    captionsPreferred: p.media?.captionPreference === "PREFER",
    transcriptPreferred: p.media?.transcriptPreference === "PREFER",
    preferredReadingSupport: p.learningSupport?.preferredReadingSupport || "CORE",
    audioSupport: p.learningSupport?.readAloudPreference === "PROMINENT",
    keyboardOptimized: p.interaction?.focusEmphasis === "ENHANCED",
    celebrationIntensity: p.sensory?.celebrationIntensity || "FULL",
  };
}

const Ctx = React.createContext({ prefs: DEFAULTS, setPref: () => {}, resetPrefs: () => {} });

export function useAccessibilityPreferences() {
  return React.useContext(Ctx);
}

export default function AccessibilityPreferencesProvider({ children }) {
  const profile = useAccessibilityProfile();
  const prefs = React.useMemo(() => toFlatPrefs(profile.preferences), [profile.preferences]);

  const setPref = React.useCallback((key, value) => {
    if (!(key in DEFAULTS)) return;

    const patchByKey = {
      reducedMotion: { sensory: { motionPreference: value ? "REDUCED" : "AUTO" } },
      largerText: { presentation: { textScale: value ? "LARGE" : "DEFAULT" } },
      higherContrast: { presentation: { contrastMode: value ? "HIGH" : "DEFAULT" } },
      captionsPreferred: { media: { captionPreference: value ? "PREFER" : "AUTO" } },
      transcriptPreferred: { media: { transcriptPreference: value ? "PREFER" : "AUTO" } },
      preferredReadingSupport: ["CORE", "SIMPLE", "ADVANCED"].includes(value) ? { learningSupport: { preferredReadingSupport: value } } : null,
      audioSupport: { learningSupport: { readAloudPreference: value ? "PROMINENT" : "AUTO" } },
      keyboardOptimized: { interaction: { focusEmphasis: value ? "ENHANCED" : "DEFAULT", targetSize: value ? "LARGE" : "DEFAULT" } },
      celebrationIntensity: ["FULL", "SUBTLE", "OFF"].includes(value) ? { sensory: { celebrationIntensity: value } } : null,
    };
    const patch = patchByKey[key];
    if (!patch) return;
    profile.patch(patch).catch(() => {
      // Best-effort — the UI will reflect whatever the canonical profile
      // actually holds on the next read; there is no local fallback state
      // to reconcile since this adapter has none of its own.
    });
  }, [profile]);

  const resetPrefs = React.useCallback(() => {
    profile.reset().catch(() => {});
  }, [profile]);

  const value = React.useMemo(() => ({ prefs, setPref, resetPrefs }), [prefs, setPref, resetPrefs]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
