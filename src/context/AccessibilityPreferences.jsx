// src/context/AccessibilityPreferences.jsx
//
// Phase 2B — minimal, capability-based UI preferences. Audited: no
// existing generic preference system covers this (ReadingLevelProvider is
// real but only covers reading-level content variants; there was nothing
// for motion/contrast/text-size/captions/transcript/audio/keyboard). This
// stores INTERFACE PREFERENCES ONLY — never a diagnosis, disability
// category, or medical information. A student is never labeled; the UI
// only ever asks "what would help," matching the audit's explicit
// instruction not to build a single "disabled mode."
import React from "react";

const KEY = "curriculum:a11yPrefs:v1";

const DEFAULTS = {
  reducedMotion: false,
  largerText: false,
  higherContrast: false,
  captionsPreferred: false,
  transcriptPreferred: false,
  simplifiedReading: false, // when true, LessonBody requests ReadingLevelProvider's "simple" variant
  audioSupport: false,      // when true, surfaces the existing SpeakBtn TTS control more prominently
  keyboardOptimized: false, // when true, widens focus rings / interactive target spacing
};

function readStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

const Ctx = React.createContext({ prefs: DEFAULTS, setPref: () => {}, resetPrefs: () => {} });

export function useAccessibilityPreferences() {
  return React.useContext(Ctx);
}

export default function AccessibilityPreferencesProvider({ children }) {
  const [prefs, setPrefs] = React.useState(readStored);

  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  // Respect the OS-level reduced-motion signal as an honest starting
  // point (not overriding an explicit student choice already saved).
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) return; // student already has explicit saved prefs
      const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      if (mql?.matches) setPrefs((p) => ({ ...p, reducedMotion: true }));
    } catch {}
  }, []);

  const setPref = React.useCallback((key, value) => {
    if (!(key in DEFAULTS)) return;
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  const resetPrefs = React.useCallback(() => setPrefs({ ...DEFAULTS }), []);

  const value = React.useMemo(() => ({ prefs, setPref, resetPrefs }), [prefs, setPref, resetPrefs]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
