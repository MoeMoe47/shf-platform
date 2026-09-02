// src/context/AccessibilityProfileContext.jsx
//
// SHF AIEL Phase 3 — canonical Personal Accessibility Profile provider.
// Raw persistence only: fetches the profile once per mount, exposes
// revision-checked patch()/reset() methods, and performs the one-time,
// idempotent legacy localStorage migration (docs/SHF_AIEL_PERSISTENCE_
// API_CONTRACT_V1.md §17-18). This provider does not compute anything —
// see EffectiveAccessibilityContext.jsx for the derived/OS-aware layer
// consumed by Celebration/Companion.
//
// Server-row-always-wins: migration only ever runs when the GET response
// says isDefault === true (no row exists yet). A learner who has already
// made an explicit canonical choice is never overwritten by stale legacy
// local data.
import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import { getProfile, patchProfile, resetProfile } from "@/lib/accessibilityProfile/api.js";

const DEFAULT_PREFERENCES = {
  presentation: { textScale: "DEFAULT", contrastMode: "DEFAULT" },
  interaction: { focusEmphasis: "DEFAULT", targetSize: "DEFAULT" },
  media: { captionPreference: "AUTO", transcriptPreference: "AUTO" },
  sensory: { motionPreference: "AUTO", celebrationIntensity: "FULL" },
  learningSupport: { preferredReadingSupport: "CORE", readAloudPreference: "AUTO" },
};

const Ctx = React.createContext({
  loading: true,
  error: null,
  preferences: DEFAULT_PREFERENCES,
  revision: null,
  isDefault: true,
  patch: async () => {},
  reset: async () => {},
  // SHF AIEL Phase 4 — lets a shared, multi-app consumer (e.g.
  // ReadingLevelProvider.jsx, mounted by Curriculum AND by other apps
  // outside this provider's tree) detect whether it is actually inside a
  // real AccessibilityProfileProvider, vs. seeing only this default stub.
  // false here; the real provider's value below sets it true.
  isAvailable: false,
});

export function useAccessibilityProfile() {
  return React.useContext(Ctx);
}

const LEGACY_CURRICULUM_KEY = "curriculum:a11yPrefs:v1";
const LEGACY_COMPANION_REDUCE_ANIMATION_KEY = "companion:reduceAnimation";
const LEGACY_READING_LEVEL_KEY = "sh:readingLevel";

// Builds the one-time migration patch from whatever legacy signals exist.
// sh:readingLevel is read (copied), never deleted — ReadingLevelProvider
// remains the live, independent owner of that key; this only gives the
// canonical profile an initial, portable value to start from.
function buildLegacyMigrationPatch() {
  let patch = null;
  let touchedCurriculumKey = false;
  let touchedCompanionKey = false;

  try {
    const raw = localStorage.getItem(LEGACY_CURRICULUM_KEY);
    if (raw) {
      const legacy = JSON.parse(raw);
      patch = patch || {};
      patch.sensory = { ...(patch.sensory || {}) };
      patch.presentation = { ...(patch.presentation || {}) };
      patch.media = { ...(patch.media || {}) };
      patch.interaction = { ...(patch.interaction || {}) };
      patch.learningSupport = { ...(patch.learningSupport || {}) };
      if (typeof legacy.reducedMotion === "boolean") patch.sensory.motionPreference = legacy.reducedMotion ? "REDUCED" : "AUTO";
      if (typeof legacy.celebrationIntensity === "string" && ["FULL", "SUBTLE", "OFF"].includes(legacy.celebrationIntensity)) {
        patch.sensory.celebrationIntensity = legacy.celebrationIntensity;
      }
      if (typeof legacy.largerText === "boolean") patch.presentation.textScale = legacy.largerText ? "LARGE" : "DEFAULT";
      if (typeof legacy.higherContrast === "boolean") patch.presentation.contrastMode = legacy.higherContrast ? "HIGH" : "DEFAULT";
      if (typeof legacy.captionsPreferred === "boolean") patch.media.captionPreference = legacy.captionsPreferred ? "PREFER" : "AUTO";
      if (typeof legacy.transcriptPreferred === "boolean") patch.media.transcriptPreference = legacy.transcriptPreferred ? "PREFER" : "AUTO";
      if (typeof legacy.audioSupport === "boolean") patch.learningSupport.readAloudPreference = legacy.audioSupport ? "PROMINENT" : "AUTO";
      if (typeof legacy.keyboardOptimized === "boolean") {
        patch.interaction.focusEmphasis = legacy.keyboardOptimized ? "ENHANCED" : "DEFAULT";
        patch.interaction.targetSize = legacy.keyboardOptimized ? "LARGE" : "DEFAULT";
      }
      // simplifiedReading is intentionally NOT migrated here — it is a
      // legacy, never-actually-consumed boolean, distinct from the real
      // sh:readingLevel enum below (docs/SHF_AIEL_PERSISTENCE_API_
      // CONTRACT_V1.md §18 — do not blindly map it onto
      // preferredReadingSupport).
      touchedCurriculumKey = true;
    }
  } catch {
    // malformed legacy JSON — skip this source, migrate what we can from the others
  }

  try {
    const companionValue = localStorage.getItem(LEGACY_COMPANION_REDUCE_ANIMATION_KEY);
    if (companionValue === "1" || companionValue === "0") {
      patch = patch || {};
      patch.sensory = { ...(patch.sensory || {}) };
      // Only strengthens an existing REDUCED preference or sets one from
      // scratch — never downgrades a REDUCED preference the curriculum
      // key above already established.
      if (companionValue === "1" && patch.sensory.motionPreference !== "REDUCED") {
        patch.sensory.motionPreference = "REDUCED";
      } else if (companionValue === "0" && !patch.sensory.motionPreference) {
        patch.sensory.motionPreference = "AUTO";
      }
      touchedCompanionKey = true;
    }
  } catch {
    // ignore
  }

  try {
    const readingLevel = localStorage.getItem(LEGACY_READING_LEVEL_KEY);
    const mapped = { simple: "SIMPLE", core: "CORE", advanced: "ADVANCED" }[readingLevel];
    if (mapped) {
      patch = patch || {};
      patch.learningSupport = { ...(patch.learningSupport || {}), preferredReadingSupport: mapped };
    }
  } catch {
    // ignore
  }

  return { patch, touchedCurriculumKey, touchedCompanionKey };
}

export function AccessibilityProfileProvider({ children }) {
  const { role } = useUser();
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    preferences: DEFAULT_PREFERENCES,
    revision: null,
    isDefault: true,
  });
  const migrationAttempted = React.useRef(false);

  const load = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await getProfile(role);
      setState({
        loading: false,
        error: null,
        preferences: data.preferences || DEFAULT_PREFERENCES,
        revision: data.revision,
        isDefault: !!data.isDefault,
      });
      return data;
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error }));
      return null;
    }
  }, [role]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const data = await load();
      if (!active || !data) return;

      // One-time legacy migration — only when no server row exists yet.
      if (data.isDefault && !migrationAttempted.current) {
        migrationAttempted.current = true;
        const { patch, touchedCurriculumKey, touchedCompanionKey } = buildLegacyMigrationPatch();
        if (patch) {
          try {
            const created = await patchProfile(role, patch, null);
            if (!active) return;
            setState({
              loading: false,
              error: null,
              preferences: created.preferences,
              revision: created.revision,
              isDefault: false,
            });
            // Delete legacy keys only after the write is confirmed —
            // sh:readingLevel is deliberately never deleted (see header).
            try {
              if (touchedCurriculumKey) localStorage.removeItem(LEGACY_CURRICULUM_KEY);
              if (touchedCompanionKey) localStorage.removeItem(LEGACY_COMPANION_REDUCE_ANIMATION_KEY);
            } catch {
              // best-effort cleanup only
            }
          } catch {
            // Migration is best-effort; the learner keeps seeing the
            // platform default and can set preferences explicitly.
          }
        }
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const patch = React.useCallback(async (preferencesPatch) => {
    const result = await patchProfile(role, preferencesPatch, state.revision);
    setState({ loading: false, error: null, preferences: result.preferences, revision: result.revision, isDefault: false });
    return result;
  }, [role, state.revision]);

  const reset = React.useCallback(async (scope) => {
    const result = await resetProfile(role, state.revision, scope);
    setState({
      loading: false,
      error: null,
      preferences: result.preferences,
      revision: result.revision,
      isDefault: !!result.isDefault,
    });
    return result;
  }, [role, state.revision]);

  const value = React.useMemo(() => ({ ...state, patch, reset, reload: load, isAvailable: true }), [state, patch, reset, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
