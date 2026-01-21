import React, { useMemo, useState } from "react";
import { getAppRegistry } from "@/apps/manifest/registry.js";
import { buildOpenHref } from "@/apps/manifest/href.js";
import { setAppOverride, clearAppOverride } from "@/apps/manifest/overrides.js";

function pillClass(active) {
  return active ? "ar-pill ar-pillOn" : "ar-pill";
}

function capChip(on) {
  return on ? "ar-chip ar-chipOn" : "ar-chip";
}

export default function AppRegistry() {
  const [tick, setTick] = React.useState(0);

  function toggleEnabled(appId, nextEnabled) {
    setAppOverride(appId, { enabled: !!nextEnabled });
    setTick((n) => n + 1);
  }

  function resetEnabled(appId) {
    clearAppOverride(appId);
    setTick((n) => n + 1);
  }


  const [query, setQuery] = useState("");
  const [showDisabled, setShowDisabled] = useState(true);

  const registry = useMemo(() => getAppRegistry(), [tick]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();

    return registry
      .filter((r) => {
        const name = (r.manifest?.name || "").toLowerCase();
        const id = (r.id || "").toLowerCase();
        const match = !q || name.includes(q) || id.includes(q);
        if (!match) return false;

        const enabled = r.enabled === true;
        if (!showDisabled && !enabled) return false;

        return true;
      });
  }, [registry, query, showDisabled]);

  return (
    <div className="ar-wrap">
      <header className="ar-head">
        <div>
          <div className="ar-kicker">System</div>
          <h1 className="ar-title">App Registry</h1>
          <div className="ar-sub">
            Manifest-driven inventory of SHF apps (capabilities + status).
          </div>
        </div>

        <div className="ar-actions">
          <div className="ar-search">
            <span className="ar-searchIco">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps (name or id)…"
              aria-label="Search apps"
            />
          </div>

          <label className="ar-toggle">
            <input
              type="checkbox"
              checked={showDisabled}
              onChange={(e) => setShowDisabled(e.target.checked)}
            />
            <span>Show disabled</span>
          </label>
        </div>
      </header>

      <section className="ar-grid">
        {list.map(({ id, manifest: m, caps, enabled }) => {
          
          const openHref = buildOpenHref(m);

          return (
            <article key={id} className={enabled ? "ar-card" : "ar-card ar-cardDisabled"}>
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">{m?.name || id}</div>
                  <div className={pillClass(enabled)}>
                    {enabled ? "ENABLED" : "DISABLED"}
                  </div>
                </div>

                <div className="ar-meta">
                  <span className="ar-metaKey">id:</span> <span className="ar-mono">{id}</span>
                  <span className="ar-dot">•</span>
                  <span className="ar-metaKey">contract:</span>{" "}
                  <span className="ar-mono">{String(m?.contractVersion ?? "?")}</span>
                </div>
              </div>

              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Entry</div>
                  <div className="ar-value ar-mono">{entry || "—"}</div>
                </div>

                <div className="ar-row">
                  <div className="ar-label">Home</div>
                  <div className="ar-value ar-mono">{openHref || "—"}</div>
                </div>

                <div className="ar-row">
                  <div className="ar-label">Capabilities</div>
                  <div className="ar-chips">
                    <span className={capChip(caps.map)}>map</span>
                    <span className={capChip(caps.ledger)}>ledger</span>
                    <span className={capChip(caps.analytics)}>analytics</span>
                    <span className={capChip(caps.payments)}>payments</span>
                  </div>
                </div>
              </div>

              <div className="ar-foot">
                {openHref ? (
                  <a className="ar-btn" href={openHref}>
                    Open
                  </a>
                ) : (
                  <button className="ar-btn ar-btnGhost" disabled>
                    No entry
                  </button>
                )}
                
                <button
                  className="ar-btn"
                  onClick={() => toggleEnabled(id, true)}
                  disabled={enabled}
                  title="Enable this app (runtime override)"
                >
                  Enable
                </button>

                <button
                  className="ar-btn"
                  onClick={() => toggleEnabled(id, false)}
                  disabled={!enabled}
                  title="Disable this app (runtime override)"
                >
                  Disable
                </button>

                <button
                  className="ar-btn ar-btnGhost"
                  onClick={() => resetEnabled(id)}
                  title="Reset override (revert to manifest default)"
                >
                  Reset
                </button>
  

                <button
                  className="ar-btn ar-btnGhost"
                  onClick={() => {
                    try {
                      navigator.clipboard?.writeText(JSON.stringify(m, null, 2));
                    } catch {}
                  }}
                  title="Copy manifest JSON to clipboard"
                >
                  Copy manifest
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <style>{`
        .ar-wrap{ padding: 22px; max-width: 1280px; margin: 0 auto; }
        .ar-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding: 6px 0 18px; border-bottom: 1px solid rgba(255,255,255,.08); }
        .ar-kicker{ font-size:12px; letter-spacing:.12em; text-transform:uppercase; opacity:.65; }
        .ar-title{ margin:4px 0 6px; font-size:28px; line-height:1.1; }
        .ar-sub{ opacity:.75; font-size:13px; max-width: 560px; }

        .ar-actions{ display:flex; align-items:center; gap:14px; }
        .ar-search{ position:relative; }
        .ar-search input{
          width: 320px; max-width: 46vw;
          padding: 10px 12px 10px 34px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.04);
          outline: none;
        }
        .ar-search input:focus{ border-color: rgba(255,255,255,.22); background: rgba(255,255,255,.06); }
        .ar-searchIco{ position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:.7; }

        .ar-toggle{ display:flex; align-items:center; gap:8px; font-size:13px; opacity:.85; user-select:none; }
        .ar-toggle input{ transform: translateY(1px); }

        .ar-grid{
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          padding-top: 16px;
        }
        @media (max-width: 1100px){ .ar-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px){ .ar-grid{ grid-template-columns: 1fr; } .ar-search input{ width: 100%; } .ar-actions{ width: 100%; } .ar-head{ align-items:flex-start; flex-direction:column; } }

        .ar-card{
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.03);
          box-shadow: 0 10px 26px rgba(0,0,0,.18);
          overflow:hidden;
          transition: transform .15s ease, border-color .15s ease, background .15s ease;
        }
        .ar-card:hover{ transform: translateY(-1px); border-color: rgba(255,255,255,.16); background: rgba(255,255,255,.04); }
        .ar-cardDisabled{ opacity:.72; }
        .ar-top{ padding: 14px 14px 10px; }
        .ar-nameRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .ar-name{ font-size:16px; font-weight:650; letter-spacing:.01em; }
        .ar-meta{ font-size:12px; opacity:.75; display:flex; flex-wrap:wrap; gap:6px; align-items:center; padding-top: 6px; }
        .ar-metaKey{ opacity:.7; }
        .ar-dot{ opacity:.5; padding: 0 2px; }
        .ar-mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

        .ar-pill{
          font-size:11px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.04);
          opacity:.85;
          white-space:nowrap;
        }
        .ar-pillOn{ border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.06); opacity:.95; }

        .ar-body{ padding: 10px 14px 12px; border-top: 1px solid rgba(255,255,255,.06); border-bottom: 1px solid rgba(255,255,255,.06); }
        .ar-row{ display:flex; gap:10px; padding: 6px 0; }
        .ar-label{ width: 92px; font-size:12px; opacity:.65; }
        .ar-value{ flex:1; font-size:12px; opacity:.85; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .ar-chips{ display:flex; flex-wrap:wrap; gap:8px; }
        .ar-chip{
          font-size:11px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.03);
          opacity:.65;
        }
        .ar-chipOn{ opacity:.95; border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.06); }

        .ar-foot{ display:flex; gap:10px; justify-content:flex-end; padding: 12px 14px; }
        .ar-btn{
          border-radius: 12px;
          padding: 9px 12px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          text-decoration:none;
          color: inherit;
          font-size: 12px;
          cursor: pointer;
        }
        .ar-btn:hover{ background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.18); }
        .ar-btnGhost{ background: transparent; }
        .ar-btn[disabled]{ opacity:.55; cursor:not-allowed; }
      `}</style>
    </div>
  );
}
