import React from "react";
import { useAccessibilityProfile } from "./AccessibilityProfileContext.jsx";

/**
 * Reading-level controller:
 * - level: "core" | "simple" | "advanced"
 * - getVariant(lesson, level) → returns content/overview at chosen level when present.
 * Structure expected on lesson:
 *   lesson.contentVariants = { core: [...], simple: [...], advanced: [...] }
 *   lesson.overviewVariants = { core: "...", simple: "...", advanced: "..." }
 *
 * SHF AIEL Phase 4 — reading-support reconciliation (docs/
 * SHF_AIEL_PROFILE_CONTRACT_V1.md §3): where this provider is mounted
 * *inside* the canonical AccessibilityProfileProvider's tree, the
 * canonical `learningSupport.preferredReadingSupport` field becomes the
 * single authoritative value and this provider stops writing
 * `sh:readingLevel` — that is true for Curriculum (curriculum.main.jsx
 * nests this provider inside RootProviders). Other apps that mount this
 * provider *outside* RootProviders (e.g. civic.main.jsx, which wraps
 * RootProviders in this provider, not the other way around) never see a
 * real AccessibilityProfileProvider ancestor, so `isAvailable` is false
 * and this provider keeps its exact original localStorage-only behavior,
 * completely unmodified — Phase 4 does not touch those apps.
 */
const RLctx = React.createContext(null);
export function useReadingLevel(){ return React.useContext(RLctx) || { level:"core", setLevel(){}, getVariant:(l)=>l }; }

const VALID_LEVELS = new Set(["core", "simple", "advanced"]);

export default function ReadingLevelProvider({ children, defaultLevel="core" }){
  const profile = useAccessibilityProfile();
  const canonicalAvailable = !!profile.isAvailable;
  const canonicalLevel = String(profile.preferences?.learningSupport?.preferredReadingSupport || "").toLowerCase();

  const [localLevel, setLocalLevel] = React.useState(() => localStorage.getItem("sh:readingLevel") || defaultLevel);

  React.useEffect(() => {
    if (canonicalAvailable) return; // canonical profile owns persistence for this mount
    try { localStorage.setItem("sh:readingLevel", localLevel); } catch {}
  }, [localLevel, canonicalAvailable]);

  const level = canonicalAvailable
    ? (VALID_LEVELS.has(canonicalLevel) ? canonicalLevel : "core")
    : localLevel;

  const setLevel = React.useCallback((next) => {
    if (!VALID_LEVELS.has(next)) return;
    if (canonicalAvailable) {
      profile.patch({ learningSupport: { preferredReadingSupport: next.toUpperCase() } }).catch(() => {});
      return;
    }
    setLocalLevel(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalAvailable, profile]);

  function getVariant(lesson){
    if (!lesson) return lesson;
    const ov = lesson.overviewVariants?.[level] ?? lesson.overview;
    const cv = lesson.contentVariants?.[level] ?? lesson.content;
    return { ...lesson, overview: ov, content: cv };
  }

  const value = React.useMemo(()=>({ level, setLevel, getVariant }),[level, setLevel]);
  return <RLctx.Provider value={value}>{children}</RLctx.Provider>;
}

/** Tiny switcher UI */
export function ReadingLevelSwitch(){
  const { level, setLevel } = useReadingLevel();
  const opt = (val, label) => (
    <button
      key={val}
      className={`sh-btn sh-btn--secondary ${level===val?"is-active":""}`}
      onClick={()=>setLevel(val)}
      aria-pressed={level===val}
    >{label}</button>
  );
  return (
    <div className="sh-actionsRow" role="group" aria-label="Reading level">
      {opt("simple","Simple")}
      {opt("core","Core")}
      {opt("advanced","Advanced")}
    </div>
  );
}
