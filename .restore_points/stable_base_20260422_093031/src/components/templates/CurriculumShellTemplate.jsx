// src/layouts/CurriculumShellTemplate.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import Toast from "@/components/ui/Toast.jsx";

export default function CurriculumShellTemplate({
  title,
  minutes,
  role = "student",
  breadcrumbs,
  actions = [],
  /** optional lesson nav */
  prevHref,
  nextHref,
  onPrev,          // () => void (optional)
  onNext,          // () => void (optional)
  onMarkComplete,  // () => void (optional) — page can also dispatch "lesson:complete"
  progressPct = 0,
  loadingIndex = false,
  children,
}) {
  const { curriculum = "asl" } = useParams();
  const safeTitle = title || "Untitled";

  const [toast, setToast] = React.useState("");
  const [progress, setProgress] = React.useState(clamp(progressPct));

  const fireToast = React.useCallback((m) => {
    setToast(m);
    clearTimeout(window.__shToastT);
    window.__shToastT = setTimeout(() => setToast(""), 1800);
  }, []);

  // Wire lightweight event bus for progress + XP
  React.useEffect(() => {
    const onXP = (e) => {
      const { points = 10, msg = "Nice work!" } = e.detail || {};
      fireToast(`+${points} XP • ${msg}`);
    };
    const onComplete = () => {
      setProgress(100);
      fireToast("Next lesson unlocked 🎉");
    };
    const onProgress = (e) => {
      const { pct } = e.detail || {};
      if (typeof pct === "number") {
        const clamped = clamp(pct);
        setProgress(clamped);
        if (clamped === 100) onComplete();
      }
    };
    window.addEventListener("sh:xp", onXP);
    window.addEventListener("sh:complete", onComplete);
    window.addEventListener("sh:progress", onProgress);
    return () => {
      window.removeEventListener("sh:xp", onXP);
      window.removeEventListener("sh:complete", onComplete);
      window.removeEventListener("sh:progress", onProgress);
    };
  }, [fireToast]);

  // J / K keyboard nav shortcut
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "j" || e.key === "J") {
        if (nextHref) onNext?.();
      } else if (e.key === "k" || e.key === "K") {
        if (prevHref) onPrev?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref, onPrev, onNext]);

  return (
    <>
      {/* Header card */}
      <section className="sh-card" role="group" aria-label="Lesson header">
        <div className="sh-cardStripe" />
        <div className="sh-cardBody">
          {/* Breadcrumbs */}
          <div className="sh-cardContent" style={{display:"flex", alignItems:"center", gap:12, justifyContent:"space-between"}}>
            <p className="subtle" style={{ margin: 0 }}>
              {Array.isArray(breadcrumbs) && breadcrumbs.length ? (
                breadcrumbs.map((b, i) =>
                  b?.href ? (
                    <span key={i}>
                      <Link to={b.href}>{b.label}</Link>
                      {i < breadcrumbs.length - 1 ? " / " : ""}
                    </span>
                  ) : (
                    <span key={i}>
                      {b?.label}
                      {i < breadcrumbs.length - 1 ? " / " : ""}
                    </span>
                  )
                )
              ) : (
                <Link to={`/${curriculum}/lessons`}>{String(curriculum).toUpperCase()}</Link>
              )}
            </p>

            {/* Progress mini-bar */}
            <div
              className="sh-progressWrap"
              aria-label={`Progress ${progress}%`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              role="progressbar"
              style={{ minWidth: 160 }}
            >
              <div className="sh-progressBar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Title + meta + actions */}
          <div className="sh-cardContent" style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <h1 className="h1" style={{ margin: 0 }}>{safeTitle}</h1>
              <div className="subtle" style={{ whiteSpace: "nowrap" }}>
                {Number.isFinite(minutes) ? `${minutes} min` : null}
                {role && role !== "student" ? ` · ${role}` : ""}
              </div>
            </div>

            {actions?.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {actions.map((a, i) =>
                  a?.href ? (
                    <Link key={i} to={a.href} className="sh-btn sh-btn--secondary">
                      {a.label}
                    </Link>
                  ) : (
                    <button key={i} className="sh-btn" onClick={a.onClick}>
                      {a.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body (your sections) */}
      {children}

      {/* Footer nav */}
      <footer className="sh-footer" role="navigation" aria-label="Lesson navigation">
        <div className="sh-footerInner">
          {/* Prev */}
          {prevHref ? (
            <Link
              to={prevHref}
              className="sh-btn sh-btn--secondary"
              rel="prev"
              onClick={(e) => onPrev?.(e)}
            >
              ← Prev
            </Link>
          ) : (
            <button className="sh-btn sh-btn--secondary" disabled onClick={onPrev}>
              ← Prev
            </button>
          )}

          {/* Complete */}
          <button
            className="sh-btn sh-btn--primary"
            onClick={(e) => {
              onMarkComplete?.(e);          // page can do credit + "lesson:complete"
              window.dispatchEvent(new CustomEvent("sh:complete")); // shell-level complete
            }}
          >
            Mark as Complete
          </button>

          {/* Next */}
          {nextHref ? (
            <Link
              to={nextHref}
              className="sh-btn sh-btn--secondary"
              rel="next"
              onClick={(e) => onNext?.(e)}
            >
              Next →
            </Link>
          ) : (
            <button className="sh-btn sh-btn--secondary" disabled onClick={onNext}>
              Next →
            </button>
          )}
        </div>
      </footer>

      {/* Toast */}
      <Toast msg={toast} />
    </>
  );
}

function clamp(n) {
  const x = Number(n ?? 0);
  return Number.isNaN(x) ? 0 : Math.max(0, Math.min(100, x));
}
