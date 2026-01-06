// src/components/RequireSubscription.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";

function hasSubscription(entitlements = []) {
  const set = new Set((entitlements || []).map(s => s.toLowerCase()));
  // treat any of these as “subscribed”
  return (
    set.has("all") ||
    set.has("premium") ||
    set.has("subscriber") ||
    set.has("curriculum")
  );
}

// DEV helpers: ?sub=1/0 or localStorage.setItem('dev:sub','1'|'0')
function applyDevOverride(defaultValue) {
  try {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("sub");
    if (q === "1" || q === "true") return true;
    if (q === "0" || q === "false") return false;

    const ls = localStorage.getItem("dev:sub");
    if (ls === "1" || ls === "true") return true;
    if (ls === "0" || ls === "false") return false;
  } catch {}
  return defaultValue;
}

export default function RequireSubscription({ children }) {
  const { entitlements = [], loading } = (typeof useEntitlements === "function" ? useEntitlements() : {}) || {};
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 20 }}>Checking subscription…</div>;
  }

  const ok = applyDevOverride(hasSubscription(entitlements));

  if (!ok) {
    const from = encodeURIComponent(
      (location.pathname || "") + (location.search || "") + (location.hash || "")
    );
    return <Navigate to={`/subscribe?app=curriculum&from=${from}`} replace />;
  }

  return children;
}
