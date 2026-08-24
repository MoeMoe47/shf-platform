// src/pages/sales/Settings.jsx
//
// The previous version wrote to civic:privacy/civic:attestations/
// civic:publog — leftover Civic-app keys, same cross-app contamination
// pattern found and fixed in Proposals.jsx. Rebuilt with a minimal,
// genuinely Sales-scoped settings surface using "sales:*" keys.
import React from "react";

const KEY = "sales:settings";

function loadSettings() {
  try {
    return { crmConnected: false, notifyOnNewLead: true, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { crmConnected: false, notifyOnNewLead: true };
  }
}

export default function Settings() {
  const [settings, setSettings] = React.useState(loadSettings);

  function update(next) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch {}
  }

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Settings</h1>
          <p className="db-subtitle">Sales app preferences</p>
        </div>
      </header>

      <div className="card card--pad" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Connect CRM</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft, #6b7280)" }}>Sync pipeline and leads with an external CRM.</div>
          </div>
          <button type="button" className="sh-btn sh-btn--soft" onClick={() => update({ crmConnected: !settings.crmConnected })}>
            {settings.crmConnected ? "Connected ✓" : "Connect"}
          </button>
        </div>

        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Notify on new lead</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft, #6b7280)" }}>Alert when an employer-bridged lead arrives.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.notifyOnNewLead}
            onChange={(e) => update({ notifyOnNewLead: e.target.checked })}
          />
        </label>
      </div>
    </section>
  );
}
