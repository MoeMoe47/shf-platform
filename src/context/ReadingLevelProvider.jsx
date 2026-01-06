import React from "react";

/**
 * Reading-level controller:
 * - level: "core" | "simple" | "advanced"
 * - getVariant(lesson, level) → returns content/overview at chosen level when present.
 * Structure expected on lesson:
 *   lesson.contentVariants = { core: [...], simple: [...], advanced: [...] }
 *   lesson.overviewVariants = { core: "...", simple: "...", advanced: "..." }
 */
const RLctx = React.createContext(null);
export function useReadingLevel(){ return React.useContext(RLctx) || { level:"core", setLevel(){}, getVariant:(l)=>l }; }

export default function ReadingLevelProvider({ children, defaultLevel="core" }){
  const [level, setLevel] = React.useState(() => localStorage.getItem("sh:readingLevel") || defaultLevel);
  React.useEffect(() => { try{ localStorage.setItem("sh:readingLevel", level);}catch{} }, [level]);

  function getVariant(lesson){
    if (!lesson) return lesson;
    const ov = lesson.overviewVariants?.[level] ?? lesson.overview;
    const cv = lesson.contentVariants?.[level] ?? lesson.content;
    return { ...lesson, overview: ov, content: cv };
  }

  const value = React.useMemo(()=>({ level, setLevel, getVariant }),[level]);
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
