// src/components/WalletButton.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { href as HREFS } from "@/router/paths.js";

/* ---------- tiny helpers ---------- */
function safeNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function formatInt(n) {
  try { return Math.round(n).toLocaleString(); }
  catch { return String(Math.round(n)); }
}
function renderTokens(balances = {}) {
  const t = balances.tokens || balances;
  const order = ["corn", "wheat", "heart", "rocket"];
  const emoji = { corn: "🌽", wheat: "🌾", heart: "❤️", rocket: "🚀" };

  const items = order
    .map((k) => [k, safeNum(t[k], 0)])
    .filter(([, v]) => v > 0)
    .slice(0, 2);

  if (!items.length) return null;

  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginLeft: 6,
        opacity: 0.9,
      }}
    >
      {items.map(([k, v]) => (
        <span
          key={k}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}
          title={`${k} ${formatInt(v)}`}
        >
          <span>{emoji[k]}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatInt(v)}</span>
        </span>
      ))}
    </span>
  );
}
function getPoints() {
  try { return Number(localStorage.getItem("rewards:points") || 0) || 0; }
  catch { return 0; }
}

/**
 * WalletButton
 * - app="credit" → uses cross-app anchor to Credit app wallet route
 * - app="local"  → uses <Link to="/wallet"> inside the current app
 * - shows SHF balance and (optionally) small token balances if present
 * - listens to rewards points updates (same-tab + cross-tab)
 */
export default function WalletButton({
  className = "",
  app = "credit",           // "credit" | "local"
  to = "/wallet",           // path within the target app
  size = "md",              // "sm" | "md"
  showIcon = true,
  showTokens = true,
  showPoints = false,       // NEW: show ⭐ points pill next to SHF (off by default)
}) {
  const credit = (typeof useCreditCtx === "function" ? useCreditCtx() : null) || {};
  const { balances = {}, loading } = credit;
  const shf = safeNum(balances.shf, 0);

  // NEW: reactive points state + same/cross tab listeners
  const [points, setPoints] = React.useState(() => getPoints());
  const [, setBump] = React.useState(0);
  React.useEffect(() => {
    const bump = () => { setBump((s) => s + 1); setPoints(getPoints()); };
    const onStorage = (e) => { if (e.key === "rewards:points") bump(); };

    window.addEventListener("rewards:update", bump); // same tab
    window.addEventListener("storage", onStorage);   // other tabs
    return () => {
      window.removeEventListener("rewards:update", bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const px = size === "sm" ? "4px 8px" : "6px 10px";
  const fs = size === "sm" ? 12 : 14;

  const aria = `Open wallet. SHF balance ${formatInt(shf)}${showPoints ? `, points ${formatInt(points)}` : ""}`;

  const content = (
    <>
      {showIcon && <span aria-hidden>💳</span>}
      <strong style={{ fontVariantNumeric: "tabular-nums" }}>
        {loading ? "—" : formatInt(shf)}
      </strong>
      <span className="subtle" style={{ fontSize: size === "sm" ? 10 : 12 }}>SHF</span>
      {showTokens && !loading && renderTokens(balances)}
      {showPoints && (
        <span
          title={`${formatInt(points)} points`}
          style={{
            marginLeft: 8,
            fontSize: size === "sm" ? 10 : 12,
            border: "1px solid var(--ring,#e5e7eb)",
            borderRadius: 999,
            padding: size === "sm" ? "2px 6px" : "2px 8px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--surface,#fff)",
          }}
        >
          <span aria-hidden>⭐</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatInt(points)}</span>
        </span>
      )}
    </>
  );

  const baseClass = `sh-btn ${className}`.trim();
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    padding: px,
    border: "1px solid var(--ring, #e5e7eb)",
    background: "var(--surface, #fff)",
    textDecoration: "none",
    fontSize: fs,
    lineHeight: 1.2,
  };

  // Cross-app anchor to the Credit app if available
  if (app === "credit" && HREFS?.credit) {
    return (
      <a
        href={HREFS.credit(to)}
        className={baseClass}
        style={baseStyle}
        title="Open wallet"
        aria-label={aria}
      >
        {content}
      </a>
    );
  }

  // In-app link (current router)
  return (
    <Link
      to={to}
      className={baseClass}
      style={baseStyle}
      title="Open wallet"
      aria-label={aria}
    >
      {content}
    </Link>
  );
}
