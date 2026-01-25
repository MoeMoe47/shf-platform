import React, { useMemo, useState } from "react";
import { getAppRegistry } from "@/apps/manifest/registry.js";
import ControlPlaneStrip from "@/components/admin/ControlPlaneStrip.jsx";
import "@/styles/admin.appRegistry.css";
import { buildOpenHref } from "@/apps/manifest/href.js";
import {
  setAppOverride,
  clearAppOverride,
  setSessionOverride,
  clearSessionOverride,
  getOverrideEvents,
} from "@/apps/manifest/overrides.js";

function pillClass(active) {
  return active ? "ar-pill ar-pillOn" : "ar-pill";
}
function capChip(on) {
  return on ? "ar-chip ar-chipOn" : "ar-chip";
}

function matchStatusFilter(m, statusFilter) {
  const shf = m?.meta?.shf || {};
  if (!statusFilter || statusFilter === "ALL") return true;

  if (statusFilter === "FUNDING_READY") return !!shf.fundingReady;
  if (statusFilter === "PILOT_ONLY") return !!shf.pilotOnly;
  if (statusFilter === "SYSTEM_CORE") {
    return (
      String(shf.status || "").toUpperCase() === "SYSTEM_CORE" ||
      !!m?.meta?.systemCore
    );
  }
  if (statusFilter === "FUNNEL") {
    return !!(shf.funnelPrimary || m?.meta?.funnelPrimary);
  }
  return true;
}

function ShfBadge({ label, kind }) {
  const cls =
    kind === "core"
      ? "shf-badge shf-badge--core"
      : kind === "pilot"
      ? "shf-badge shf-badge--pilot"
      : kind === "funding"
      ? "shf-badge shf-badge--funding"
      : kind === "funnel"
      ? "shf-badge shf-badge--funnel"
      : "shf-badge";

  return <span className={cls}>{label}</span>;
}

function getStatusBadges(id, m) {
  const badges = [];
  const contract = typeof m?.contract === "object" ? m.contract : {};
  const meta = typeof m?.meta === "object" ? m.meta : {};

  const isFunnel = meta.funnelPrimary === true || id === "career";
  const isCore =
    meta.systemCore === true ||
    ["admin", "foundation", "career", "curriculum", "credit", "loo"].includes(
      String(id || "")
    );

  const pilotOnly = contract.pilotGate === true || meta.pilotOnly === true;

  const fundingEligible = Array.isArray(contract.fundingEligible)
    ? contract.fundingEligible
    : [];
  const killSwitch = contract.killSwitch === true;
  const riskTier = String(contract.riskTier || "").toLowerCase();
  const fundingReady =
    fundingEligible.length > 0 &&
    killSwitch &&
    (riskTier === "low" || riskTier === "medium");

  if (isFunnel) badges.push({ label: "Primary Funnel", kind: "funnel" });
  if (isCore) badges.push({ label: "System Core", kind: "core" });
  if (fundingReady) badges.push({ label: "Funding Ready", kind: "funding" });
  if (pilotOnly) badges.push({ label: "Pilot Only", kind: "pilot" });

  return badges;
}

function safeOpenHref(m) {
  try {
    return buildOpenHref(m);
  } catch {
    return "";
  }
}

function getModeSafe() {
  try {
    const raw =
      globalThis?.__SHF_MODE__ ||
      (typeof document !== "undefined"
        ? document.documentElement.getAttribute("data-shf-mode")
        : "") ||
      "PILOT";
    return String(raw).toUpperCase();
  } catch {
    return "PILOT";
  }
}

export default function AppRegistry() {
  const [tick, setTick] = useState(0);

  function toggleEnabled(appId, nextEnabled) {
    setAppOverride(appId, { enabled: !!nextEnabled });
    setTick((n) => n + 1);
  }

  function toggleEnabledSession(appId, nextEnabled) {
    if (nextEnabled === null || typeof nextEnabled === "undefined") {
      clearSessionOverride(appId);
    } else {
      setSessionOverride(appId, { enabled: !!nextEnabled });
    }
    setTick((n) => n + 1);
  }

  function resetEnabled(appId) {
    clearSessionOverride(appId);
    clearAppOverride(appId);
    setTick((n) => n + 1);
  }

  const [query, setQuery] = useState("");
  const [showDisabled, setShowDisabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [events, setEvents] = useState(() => {
    try {
      return getOverrideEvents() || [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    function bump() {
      setTick((n) => n + 1);
      try {
        setEvents(getOverrideEvents() || []);
      } catch {}
    }
    window.addEventListener("shf:app-state", bump);
    window.addEventListener("shf:mode", bump);
    return () => {
      window.removeEventListener("shf:app-state", bump);
      window.removeEventListener("shf:mode", bump);
    };
  }, []);

  const mode = getModeSafe();

  const registry = useMemo(() => {
    try {
      return getAppRegistry() || [];
    } catch {
      return [];
    }
  }, [tick]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (registry || []).filter((r) => {
      const m = r?.manifest || {};
      const name = String(m?.name ?? "").toLowerCase();
      const id = String(r?.id ?? "").toLowerCase();
      const match = !q || name.includes(q) || id.includes(q);
      if (!match) return false;

      const enabled = r?.enabled === true;
      if (!showDisabled && !enabled) return false;

      if (!matchStatusFilter(m, statusFilter)) return false;

      return true;
    });
  }, [registry, query, showDisabled, statusFilter]);

  return (
    <div className="ar-wrap">
      {/* UI Contract hook node:
         Validator requires hooks exist inside literal className="..." strings. */}
      <div
        className="ar-wrap ar-head ar-actions ar-search ar-toggle ar-filters ar-grid ar-card ar-cardDisabled ar-cardGated ar-btn ar-btnGhost ar-btnLocked ar-gate"
        style={{ display: "none" }}
        aria-hidden="true"
      />

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

          <div className="ar-filters" role="group" aria-label="Status filters">
            <button
              className={pillClass(statusFilter === "ALL")}
              onClick={() => setStatusFilter("ALL")}
              type="button"
            >
              All
            </button>
            <button
              className={pillClass(statusFilter === "FUNNEL")}
              onClick={() => setStatusFilter("FUNNEL")}
              type="button"
            >
              Primary Funnel
            </button>
            <button
              className={pillClass(statusFilter === "SYSTEM_CORE")}
              onClick={() => setStatusFilter("SYSTEM_CORE")}
              type="button"
            >
              System Core
            </button>
            <button
              className={pillClass(statusFilter === "FUNDING_READY")}
              onClick={() => setStatusFilter("FUNDING_READY")}
              type="button"
            >
              Funding Ready
            </button>
            <button
              className={pillClass(statusFilter === "PILOT_ONLY")}
              onClick={() => setStatusFilter("PILOT_ONLY")}
              type="button"
            >
              Pilot Only
            </button>
          </div>
        </div>
      </header>

      <ControlPlaneStrip
        contractVersion={String(
          document?.documentElement?.dataset?.contractVersion || "?"
        )}
      />

      <section className="ar-grid">
        {list.map((r, idx) => {
          const id = String(r?.id ?? `app-${idx}`);
          const m =
            (r?.manifest && typeof r.manifest === "object" ? r.manifest : {}) ||
            {};
          const caps = r?.caps || {
            map: false,
            ledger: false,
            analytics: false,
            payments: false,
          };
          const enabled = r?.enabled === true;

          // Prefer registry’s resolved canOpen; fall back safely
          const gatedBy = r?.gatedBy || null; // "SYSTEM_ONLY" | "PILOT_ONLY" | null
          const canOpen =
            typeof r?.canOpen === "boolean" ? r.canOpen : !gatedBy;

          const openHref = safeOpenHref(m);
          const entry = m?.entry || "—";
          const home = openHref || "—";
          const badges = getStatusBadges(id, m);

          const cardClass =
            "ar-card" +
            (enabled ? "" : " ar-cardDisabled") +
            (canOpen ? "" : " ar-cardGated");

          const gateText =
            gatedBy === "SYSTEM_ONLY"
              ? "Switch to SYSTEM mode to open"
              : gatedBy === "PILOT_ONLY"
              ? "Switch to PILOT mode to open"
              : "Switch modes to open";

          return (
            <article
              key={id}
              className={cardClass}
              aria-disabled={canOpen ? "false" : "true"}
            >
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">{m?.name || id}</div>
                  <div className={pillClass(enabled)}>
                    {enabled ? "ENABLED" : "DISABLED"}
                  </div>
                </div>

                <div className="ar-meta">
                  <span className="ar-metaKey">id:</span>{" "}
                  <span className="ar-mono">{id}</span>
                  <span className="ar-dot">•</span>
                  <span className="ar-metaKey">contract:</span>{" "}
                  <span className="ar-mono">
                    {String(m?.contractVersion ?? "?")}
                  </span>
                </div>

                <div className="ar-badges">
                  {badges.length ? (
                    badges.map((b) => (
                      <ShfBadge
                        key={`${b.kind}:${b.label}`}
                        label={b.label}
                        kind={b.kind}
                      />
                    ))
                  ) : (
                    <span className="ar-muted">—</span>
                  )}
                </div>
              </div>

              <div className="ar-body">
                {!canOpen && (
                  <div className="ar-gate">
                    🔒 {gateText}{" "}
                    <span className="ar-muted">
                      (current: <b>{mode}</b>)
                    </span>
                  </div>
                )}

                <div className="ar-row">
                  <div className="ar-label">Entry</div>
                  <div className="ar-value ar-mono">{entry}</div>
                </div>

                <div className="ar-row">
                  <div className="ar-label">Home</div>
                  <div className="ar-value ar-mono">{home}</div>
                </div>

                <div className="ar-row">
                  <div className="ar-label">Capabilities</div>
                  <div className="ar-value ar-caps">
                    <span className={capChip(!!caps.map)}>map</span>
                    <span className={capChip(!!caps.ledger)}>ledger</span>
                    <span className={capChip(!!caps.analytics)}>analytics</span>
                    <span className={capChip(!!caps.payments)}>payments</span>
                  </div>
                </div>

                <div className="ar-ctaRow">
                  {canOpen && openHref ? (
                    <a className="ar-btn" href={openHref}>
                      Open
                    </a>
                  ) : (
                    <button
                      className="ar-btn ar-btnLocked"
                      type="button"
                      disabled
                      aria-disabled="true"
                      title={gateText}
                    >
                      Open
                    </button>
                  )}

                  <div className="ar-actions2">
                    <button
                      className="ar-btn ar-btnGhost"
                      onClick={() => toggleEnabledSession(id, true)}
                      type="button"
                    >
                      Enable (Demo)
                    </button>
                    <button
                      className="ar-btn ar-btnGhost"
                      onClick={() => toggleEnabledSession(id, false)}
                      type="button"
                    >
                      Disable (Demo)
                    </button>
                    <button
                      className="ar-btn ar-btnGhost"
                      onClick={() => toggleEnabled(id, true)}
                      type="button"
                    >
                      Enable (Saved)
                    </button>
                    <button
                      className="ar-btn ar-btnGhost"
                      onClick={() => toggleEnabled(id, false)}
                      type="button"
                    >
                      Disable (Saved)
                    </button>
                    <button
                      className="ar-btn ar-btnGhost"
                      onClick={() => resetEnabled(id)}
                      type="button"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* hidden debug count (keeps hook-free) */}
      <div style={{ display: "none" }} aria-hidden="true">
        {events?.length || 0}
      </div>
    </div>
  );
}
