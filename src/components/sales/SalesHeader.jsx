// src/components /sales/CivicHeader.jsx
import React from "react";
import CrossAppLink from "@/components/nav/CrossAppLink.jsx";

export default function CivicHeader() {
  // Focus Mode chip state (already present)
  const [focusOn, setFocusOn] = React.useState(
    () => (typeof document !== "undefined" && document.documentElement?.dataset?.focus === "1") || false
  );

  React.useEffect(() => {
    const update = () => {
      try {
        setFocusOn(document.documentElement?.dataset?.focus === "1");
      } catch {}
    };
    window.addEventListener("focusmode:change", update);
    window.addEventListener("focusmode:toggle", update);
    document.addEventListener?.("visibilitychange", update);
    return () => {
      window.removeEventListener("focusmode:change", update);
      window.removeEventListener("focusmode:toggle", update);
      document.removeEventListener?.("visibilitychange", update);
    };
  }, []);

  /* ───────────────── Accreditation toggle (global) ───────────────── */
  const [showAccred, setShowAccred] = React.useState(() => {
    try { return localStorage.getItem("ui:showAccreditation") === "1"; } catch { return false; }
  });

  const toggleAccred = React.useCallback(() => {
    setShowAccred((prev) => {
      const next = !prev;
      try { localStorage.setItem("ui:showAccreditation", next ? "1" : "0"); } catch {}
      // Notify any listeners (e.g., LessonBody) to react immediately.
      try {
        window.dispatchEvent(new CustomEvent("ui.accreditation.toggle", { detail: { on: next ? 1 : 0 } }));
      } catch {}
      return next;
    });
  }, []);

  // Keep header switch in sync if another component flips it
  React.useEffect(() => {
    const onExternal = (e) => {
      const on = !!(e?.detail?.on ?? (localStorage.getItem("ui:showAccreditation") === "1"));
      setShowAccred(on);
    };
    window.addEventListener("ui.accreditation.toggle", onExternal);
    window.addEventListener("storage", onExternal); // cross-tab sync
    return () => {
      window.removeEventListener("ui.accreditation.toggle", onExternal);
      window.removeEventListener("storage", onExternal);
    };
  }, []);

  return (
    <>
      <a className="crb-brand" href=" /sales.html#/" aria-label="SHF Civic — Home">
        <img src="/logo-foundation.png" alt="" className="crb-brandImg" />
        <span className="crb-wordmark" aria-hidden>SHF CIVIC</span>

        {/* ✅ Focus indicator chip (shows only when Focus Mode is ON) */}
        <span
          className="sh-chip soft"
          role="status"
          aria-live="polite"
          style={{
            marginLeft: 8,
            display: focusOn ? "inline-flex" : "none",
            alignItems: "center",
            gap: 6
          }}
          title="Focus Mode is active"
        >
          Focus On
        </span>
      </a>

      <nav className="crb-crossapp" aria-label="Apps">
        <CrossAppLink className="sh-btn sh-btn--soft" app="career"     to="/dashboard">Career</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="curriculum" to="/asl/dashboard">Curriculum</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="credit"     to="/report">Credit</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="debt"       to="/dashboard">Debt</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="treasury"   to="/dashboard">Treasury</CrossAppLink>
        <CrossAppLink className="sh-btn sh-btn--soft" app="employer"   to="/dashboard">Employer</CrossAppLink>
      </nav>

      <div className="crb-headerSpacer" />

      <div className="crb-actions" role="group" aria-label="Header actions" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {/* 🎓 NEW: Accreditation toggle (global) */}
        <label className="sh-chip" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showAccred}
            onChange={toggleAccred}
            style={{ marginRight: 6 }}
            aria-label="Show Accreditation"
          />
          🎓 Show Accreditation
        </label>

        {/* Existing actions */}
        <a className="sh-btn sh-btn--soft" href="/foundation.html#/">Foundation</a>
        <a className="sh-btn" href=" /sales.html#/help" aria-label="Help">❓ Help</a>
      </div>
    </>
  );
}
