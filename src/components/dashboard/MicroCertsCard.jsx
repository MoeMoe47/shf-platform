import React from "react";

/**
 * MicroCertsCard
 * - Shows stacked tracks (e.g., ASL, Communication, Career Readiness)
 * - Each track has levels; earned levels are styled and show ✅
 * - Compact progress meter per track
 *
 * Props:
 *   tracks: Array<{
 *     id: string,
 *     title: string,
 *     color: string,            // hex for swatch
 *     earned: number,           // how many levels earned
 *     total: number,            // total levels
 *     levels: Array<{ id:string, title:string, earned:boolean, meta?:string }>
 *   }>
 */
export default function MicroCertsCard({ tracks = [] }) {
  return (
    <section className="sh-card" role="group" aria-labelledby="mc-title">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h2 id="mc-title" className="sh-cardTitle">Micro-Certifications</h2>
        <div className="sh-cardContent">
          {tracks.length === 0 ? (
            <p className="sh-muted">No tracks yet.</p>
          ) : (
            <div className="mc-grid">
              {tracks.map((t) => (
                <article key={t.id} className="mc-stack">
                  <header className="mc-head">
                    <div className="mc-title">
                      <span className="mc-swatch" style={{ background: t.color }} aria-hidden />
                      <span className="mc-titleText">{t.title}</span>
                    </div>
                    <div className="mc-meta">
                      <strong>{t.earned}</strong>/<span>{t.total}</span> earned
                    </div>
                  </header>

                  {/* Progress */}
                  <div className="mc-progress">
                    <div className="mc-track">
                      <div
                        className="mc-fill"
                        style={{ width: `${Math.round((t.earned / Math.max(1, t.total)) * 100)}%` }}
                        aria-hidden
                      />
                    </div>
                    <div className="mc-label">
                      {Math.round((t.earned / Math.max(1, t.total)) * 100)}%
                    </div>
                  </div>

                  {/* Levels */}
                  <ul className="mc-levels">
                    {t.levels.map((lv) => (
                      <li key={lv.id} className={`mc-level ${lv.earned ? "is-earned" : ""}`}>
                        <button type="button" className="mc-badge">
                          <span className="mc-lvl">{lv.id}</span>
                          <span className="mc-badgeMain">
                            <span className="mc-badgeTitle">{lv.title}</span>
                            {lv.meta && <span className="mc-badgeMeta">{lv.meta}</span>}
                          </span>
                          <span className="mc-dot" aria-hidden>{lv.earned ? "✅" : "•"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scoped styles (compact, matches your system) */}
      <style>{`
        .mc-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));
          gap:16px;
        }
        .mc-stack{
          border:1px solid var(--line, #dcd7ce);
          border-radius:12px;
          background:#fff;
          padding:12px;
          box-shadow:0 2px 6px rgba(0,0,0,.04);
        }
        .mc-head{
          display:flex;
          align-items:baseline;
          justify-content:space-between;
          gap:12px;
          margin-bottom:8px;
        }
        .mc-title{ display:inline-flex; align-items:center; gap:8px; font-weight:700; color:var(--ink,#0f172a); }
        .mc-swatch{ width:12px; height:12px; border-radius:3px; }
        .mc-meta{ font-size:12px; color:var(--ink-soft,#6b7280); }

        .mc-progress{ display:grid; gap:6px; margin-bottom:8px; }
        .mc-track{
          width:100%; height:8px; border:1px solid var(--line,#dcd7ce);
          border-radius:999px; overflow:hidden; background:#f3f4f6;
        }
        .mc-fill{ height:100%; background:var(--orange,#ff4f00); }

        .mc-label{ font-size:12px; color:var(--ink-soft,#6b7280); text-align:right; }

        .mc-levels{
          list-style:none; padding:0; margin:0; display:grid; gap:10px; position:relative;
        }
        .mc-level.is-earned .mc-badge{
          border-color:#10b981; background:#ecfdf5;
        }
        .mc-badge{
          width:100%; display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center;
          text-align:left; background:#fff; border:1px solid var(--line,#dcd7ce); border-radius:10px; padding:10px;
          cursor:pointer; transition:background .15s, border-color .15s, transform .04s, box-shadow .15s;
        }
        .mc-badge:hover{ background:var(--ivory,#faf8f3); }
        .mc-badge:active{ transform:translateY(1px); }

        .mc-lvl{
          font-weight:700; font-size:12px; color:#6b7280; background:#f3f4f6;
          border:1px solid var(--line,#dcd7ce); border-radius:8px; padding:4px 8px;
        }
        .mc-badgeMain{ min-width:0; }
        .mc-badgeTitle{
          color:var(--ink,#0f172a); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .mc-badgeMeta{ font-size:12px; color:#6b7280; }
        .mc-dot{ font-size:18px; line-height:1; }
      `}</style>
    </section>
  );
}
