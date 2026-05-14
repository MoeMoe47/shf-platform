// src/pages /sales/Settings.jsx
import React from "react";

const KEY_PRIV = "civic:privacy";
const KEY_POINTS = "wallet:points";
const KEY_BADGES = "wallet:badges";
const KEY_ATTEST = "civic:attestations";
const KEY_PUBLOG = "civic:publog";

export default function Settings() {
  const [privacy, setPrivacy] = React.useState(() => loadJSON(KEY_PRIV, {
    allowExternalPublish: false,     // default safe-off
    publicHandle: ""                 // optional handle
  }));

  const save = (next) => { setPrivacy(next); saveJSON(KEY_PRIV, next); };

  const resetLocal = () => {
    try {
      localStorage.removeItem(KEY_POINTS);
      localStorage.removeItem(KEY_BADGES);
      localStorage.removeItem(KEY_ATTEST);
      localStorage.removeItem(KEY_PUBLOG);
    } catch {}
    // toast lives at page-level; safe to omit here per ask (no alerts)
  };

  return (
    <section className="crb-main">
      <header className="db-head">
        <h1 className="db-title">Settings & Privacy</h1>
        <p className="db-subtitle">Control how your data is handled. External publishing is blocked by default.</p>
      </header>

      <div className="db-grid">
        <article className="card card--pad" style={{display:"grid", gap:10}}>
          <strong>Privacy</strong>
          <label className="sh-checkbox" style={{display:"flex", gap:8, alignItems:"center"}}>
            <input
              type="checkbox"
              checked={!!privacy.allowExternalPublish}
              onChange={(e)=> save({ ...privacy, allowExternalPublish: e.target.checked })}
            />
            <span>Allow external publication of mission evidence (disabled by default)</span>
          </label>

          <label style={{display:"grid", gap:6}}>
            <span style={{fontSize:12, opacity:.8}}>Public handle (optional)</span>
            <input
              className="sh-input"
              value={privacy.publicHandle || ""}
              onChange={(e)=> save({ ...privacy, publicHandle: e.target.value })}
              placeholder="@student"
            />
          </label>

          <em style={{fontSize:12, opacity:.75}}>
            Note: Political or election-tagged content remains blocked by policy even if enabled.
          </em>
        </article>

        <article className="card card--pad" style={{display:"grid", gap:10}}>
          <strong>Developer</strong>
          <button className="sh-btn is-ghost" onClick={resetLocal}>Reset local rewards & logs</button>
        </article>
      </div>
    </section>
  );
}

function loadJSON(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } }
function saveJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
