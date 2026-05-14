import React from "react";

/** Live region for announcing dynamic updates (points, progress, etc.) */
export function LiveAnnouncer(){
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onAnnounce = (e) => { if (ref.current) ref.current.textContent = e.detail?.msg || ""; };
    window.addEventListener("a11y:announce", onAnnounce);
    return () => window.removeEventListener("a11y:announce", onAnnounce);
  }, []);
  return <div ref={ref} role="status" aria-live="polite" aria-atomic="true" className="sh-srOnly"></div>;
}

/** Skip link (put as first child of your app container) */
export function SkipToContent({ targetId="main" }){
  return <a href={`#${targetId}`} className="car-skip">Skip to main content</a>;
}

/** Helper to announce messages */
export function announce(msg){
  try{ window.dispatchEvent(new CustomEvent("a11y:announce", { detail: { msg } })); }catch{}
}

/** Keyboard focus ring polyfill (if you want explicit class) */
export function useFocusVisibleClass(){
  React.useEffect(() => {
    const onKey = (e)=>{ if (e.key === "Tab") document.documentElement.classList.add("focus-ring"); };
    const onMouse = ()=> document.documentElement.classList.remove("focus-ring");
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onMouse);
    return ()=>{ window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onMouse); };
  }, []);
  return null;
}

/** AA+ checklist (inline) — keep near dev toggles or link from /accessibility */
export function A11yChecklist(){
  const items = [
    "Color contrast ≥ 4.5:1 (text), ≥ 3:1 (UI/graphics).",
    "Meaningful focus order; visible focus outline.",
    "All interactive elements reachable by keyboard; no key traps.",
    "ARIA roles/labels where semantic HTML isn’t enough.",
    "Skip link; sticky header doesn’t hide anchor targets (scroll-padding-top set).",
    "Images have alt text; decorative images have empty alt.",
    "TTS / transcripts provided for media & long text.",
    "Form fields with labels, descriptions, and error text.",
    "Motion respects prefers-reduced-motion.",
    "No color-only meaning; include icons/patterns or text.",
    "Live updates announced via aria-live (e.g., points, progress).",
  ];
  return (
    <div className="card card--pad">
      <strong>Accessibility AA+ Checklist</strong>
      <ul style={{marginTop:8}}>
        {items.map((t,i)=><li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}
