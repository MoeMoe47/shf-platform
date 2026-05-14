// src/components/MicroCertsCard.jsx
import React from "react";

/**
 * tracks: [
 *   {
 *     name: "Web Dev",
 *     color: "#3b82f6",
 *     certs: [
 *       { id:"html-basics", title:"HTML Basics", level:1, earned:true,  dateISO:"2025-08-20", provider:"SHF", hours:6 },
 *       { id:"css-fund",    title:"CSS Fundamentals", level:2, earned:false, dateISO:null,      provider:"SHF", hours:8 },
 *       { id:"js-intro",    title:"JavaScript Intro", level:3, earned:false, dateISO:null,      provider:"SHF", hours:10 }
 *     ]
 *   }
 * ]
 */

export default function MicroCertsCard({
  tracks = [],
  onAddCert,           // (trackName) => void
  onToggleEarned,      // (trackName, certId, nextEarned) => void
  onViewCert,          // (certId) => void
}) {
  const total = tracks.reduce((sum, t) => sum + (t.certs?.length || 0), 0);
  const earned = tracks.reduce((sum, t) => sum + (t.certs?.filter(c => c.earned).length || 0), 0);
  const pct = total ? Math.round((earned / total) * 100) : 0;

  return (
    <div className="sh-mc">
      {/* Overall progress */}
      <div className="sh-mcTop">
        <div className="sh-mcSummary">
          <div className="sh-mcSummaryNums">
            <span className="sh-mcSummaryBig">{earned}</span>
            <span className="sh-mcSummarySmall">/ {total} earned</span>
          </div>
          <div
            className="sh-careerProgressTrack"
            aria-label={`Micro-certifications ${pct}% complete`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div className="sh-careerProgressFill" style={{ width: `${pct}%` }} />
          </div>
          <div className="sh-careerProgressLabel">{pct}% complete across all tracks</div>
        </div>
        <button
          className="sh-linkBtn"
          onClick={() => onAddCert && onAddCert("new")}
          type="button"
        >
          + Add Certification
        </button>
      </div>

      {/* Stacks by track */}
      <div className="sh-mcGrid">
        {tracks.map((track) => {
          const certs = (track.certs || []).slice().sort((a, b) => (a.level ?? 0) - (b.level ?? 0)); // don't mutate props
          const tEarned = certs.filter(c => c.earned).length;
          const tPct = certs.length ? Math.round((tEarned / certs.length) * 100) : 0;

          return (
            <section key={track.name} className="sh-mcStack">
              <header className="sh-mcStackHead">
                <div className="sh-mcStackTitle">
                  <span className="sh-mcSwatch" style={{ background: track.color || "#FF7C43" }} />
                  {track.name}
                </div>
                <div className="sh-mcTrackMeta">
                  {tEarned}/{certs.length} • {tPct}%
                </div>
              </header>

              <ol className="sh-mcLevels">
                <span className="sh-mcConnector" aria-hidden="true" />
                {certs.map((c, ci) => {
                  const lvl = c.level ?? ci + 1;
                  return (
                    <li key={c.id || `${track.name}-${ci}`} className={"sh-mcLevel" + (c.earned ? " sh-mcLevel--earned" : "")}>
                      {/* badge */}
                      <button
                        className="sh-mcBadge"
                        onClick={() => onViewCert && onViewCert(c.id)}
                        title={`View ${c.title}`}
                        type="button"
                      >
                        <span className="sh-mcBadgeLeft">
                          <span className="sh-mcBadgeLvl">L{lvl}</span>
                        </span>
                        <span className="sh-mcBadgeMain">
                          <span className="sh-mcBadgeTitle">{c.title}</span>
                          <span className="sh-mcBadgeMeta">
                            {(c.provider || "Provider")} • {(c.hours ?? "—")}h
                            {c.earned && c.dateISO ? ` • ${formatDate(c.dateISO)}` : ""}
                          </span>
                        </span>
                        <span className="sh-mcBadgeRight" aria-hidden="true">
                          <span className={"sh-mcDot" + (c.earned ? " sh-mcDot--ok" : "")}>●</span>
                        </span>
                      </button>

                      {/* actions */}
                      <div className="sh-mcActions">
                        <label className="sh-flagToggle">
                          <input
                            type="checkbox"
                            checked={!!c.earned}
                            onChange={(e) => onToggleEarned && onToggleEarned(track.name, c.id, e.target.checked)}
                          />
                          <span>Earned</span>
                        </label>
                        <button
                          className="sh-btnTiny"
                          type="button"
                          onClick={() => onViewCert && onViewCert(c.id)}
                        >
                          View
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="sh-actionsRow" style={{ marginTop: 8 }}>
                <button
                  className="sh-btn"
                  onClick={() => onAddCert && onAddCert(track.name)}
                  type="button"
                >
                  + Add micro-cert
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
