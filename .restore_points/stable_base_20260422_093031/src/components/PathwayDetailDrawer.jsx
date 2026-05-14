// src/components/PathwayDetailDrawer.jsx
import React, { useEffect, useRef } from "react";

/**
 * Drawer/modal:
 * - Close by ✕, Close button, scrim click, or Esc
 * - Stops propagation so underlying "Open" buttons don't fire
 * - Locks body scroll while open
 * - Moves focus to ✕ on open, restores focus to opener on close
 */
export default function PathwayDetailDrawer({
  open = false,
  pathway = null,
  plan = null,                 // kept for compatibility (unused here)
  fundingPlan = null,          // kept for compatibility (unused here)
  onClose = () => {},
  onStart = () => {},
  onSaveToPlan = () => {},     // kept for compatibility
  onBookCoach = () => {},      // kept for compatibility
}) {
  if (!open || !pathway) return null;

  const closeBtnRef = useRef(null);
  const openerRef = useRef(null);

  const handleClose = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    onClose();
  };

  // Esc to close + body scroll lock + focus management
  useEffect(() => {
    // remember who opened us
    openerRef.current = document.activeElement;

    const onKey = (e) => e.key === "Escape" && handleClose(e);
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // move focus to ✕ after paint
    setTimeout(() => closeBtnRef.current?.focus({ preventScroll: true }), 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // restore focus to the opener
      openerRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jm = pathway?.jobsMeta || {};
  const weeks = Number(pathway?.estWeeks || 0);
  const cost = Number(pathway?.estCost || 0);

  return (
    <>
      {/* Scrim – click to close */}
      <div className="pd-scrim" onClick={handleClose} aria-hidden="true" />

      {/* Modal */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label={pathway?.title || "Pathway"}
        className="pd-modal"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="pd-head">
          <div>
            <h2 className="pd-title">{pathway?.title}</h2>
            {pathway?.cluster ? <div className="pd-subtle">{pathway.cluster}</div> : null}
          </div>

          <div className="pd-actions">
            <button
              type="button"
              className="sh-btn sh-btn--secondary"
              onClick={() => window.print()}
            >
              Print
            </button>
            <button
              type="button"
              className="sh-btn sh-btn--secondary"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  navigator.share?.({
                    title: pathway?.title,
                    text: `Check this pathway: ${pathway?.title} — ${pathway?.cluster || ""}`,
                    url: window.location.href,
                  });
                } catch {}
              }}
            >
              Share
            </button>
            <button
              type="button"
              ref={closeBtnRef}
              className="pd-x"
              aria-label="Close"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>
        </header>

        <div className="pd-body">
          <div className="pd-kpis">
            {pathway?.cluster ? <span className="sh-chip">{pathway.cluster}</span> : null}

            <div className="pd-kpi">
              <div className="pd-kpiLabel">Time to paycheck</div>
              <div className="pd-kpiValue">{weeks ? `${weeks} wks` : "Varies"}</div>
            </div>

            <div className="pd-kpi">
              <div className="pd-kpiLabel">Net cost after aid</div>
              <div className="pd-kpiValue">{usd(cost)}</div>
            </div>

            <div className="pd-kpi">
              <div className="pd-kpiLabel">Median start wage</div>
              <div className="pd-kpiValue">{usd(jm.medianStart || 0)}</div>
            </div>
          </div>

          {/* First modules */}
          {Array.isArray(pathway?.modules) && pathway.modules.length ? (
            <div className="pd-section">
              <div className="pd-sectionTitle">First modules</div>
              <ul className="sh-listPlain pd-list">
                {pathway.modules.slice(0, 3).map((m, i) => (
                  <li key={m.slug || i} className="sh-row">
                    <span className="sh-chip sh-chip--soft">M{i + 1}</span>
                    <span>{m.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Outcomes / local signal */}
          <div className="pd-section">
            <div className="pd-sectionTitle">Outcomes & local signal</div>
            <ul className="sh-listPlain pd-list">
              <li className="sh-row">
                <span className="sh-chip sh-chip--soft">Median start</span>
                <span>{usd(jm.medianStart || 0)}</span>
              </li>
              {jm.openingsIndex != null && (
                <li className="sh-row">
                  <span className="sh-chip sh-chip--soft">Openings index</span>
                  <span>{Number(jm.openingsIndex)}/100</span>
                </li>
              )}
              {Array.isArray(jm.localEmployers) && jm.localEmployers.length ? (
                <li className="sh-row">
                  <span className="sh-chip sh-chip--soft">Local employers</span>
                  <span>{jm.localEmployers.slice(0, 6).join(", ")}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <footer className="pd-foot">
          <button type="button" className="sh-btn" onClick={handleClose}>
            Close
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="sh-btn sh-btn--primary"
            onClick={(e) => {
              e.stopPropagation();
              onStart(pathway);
              onClose(); // close after starting
            }}
          >
            Start now
          </button>
        </footer>
      </section>

      {/* Scoped styles */}
      <style>{`
        .pd-scrim{
          position: fixed; inset: 0;
          background: rgba(0,0,0,.45);
          z-index: 9998;
        }
        .pd-modal{
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: min(720px, 92vw);
          max-height: min(86vh, 960px);
          display: flex; flex-direction: column;
          background: var(--card,#fff);
          color: var(--ink,#111);
          border: 1px solid var(--ring,#e5e7eb);
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0,0,0,.2);
          z-index: 9999;
          overflow: hidden;
        }
        .pd-head{
          display:flex; align-items:flex-start; justify-content:space-between; gap:8px;
          padding: 14px 16px;
          border-bottom:1px solid var(--ring,#e5e7eb);
          background: linear-gradient(to bottom, #fff, var(--ivory,#faf8f3));
        }
        .pd-title{ margin:0; font-size:20px; color:var(--ink,#0f172a); }
        .pd-subtle{ color:var(--ink-soft,#6b7280); font-size:13px; }
        .pd-actions{ display:flex; gap:8px; align-items:center; }
        .pd-x{
          background:none; border:1px solid var(--ring,#e5e7eb);
          border-radius:10px; padding:6px 10px; cursor:pointer;
        }
        .pd-body{ padding: 12px 16px; overflow:auto; }
        .pd-kpis{ display:grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:8px; align-items:stretch; }
        .pd-kpi{
          border:1px solid var(--ring,#e5e7eb); border-radius:10px; background:var(--card,#fff);
          padding:10px;
        }
        .pd-kpiLabel{ font-size:12px; color:var(--ink-soft,#6b7280); margin-bottom:4px; }
        .pd-kpiValue{ font-weight:700; color:var(--ink,#0f172a); }
        .pd-section{ margin-top:12px; }
        .pd-sectionTitle{ font-weight:700; color:var(--ink,#0f172a); margin-bottom:6px; }
        .pd-list{ display:grid; gap:6px; }
        .pd-foot{
          display:flex; align-items:center; gap:8px;
          padding: 12px 16px;
          border-top:1px solid var(--ring,#e5e7eb);
          background: var(--beige,#efe7dc);
        }
      `}</style>
    </>
  );
}

/* local USD formatter */
function usd(n) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  } catch {
    return `$${Number(n || 0).toLocaleString()}`;
  }
}
