import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PREF = "civic:pref:dashboard"; // "standard" | "northstar"

export default function DashboardSwitcher() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isNS = pathname.endsWith("/dashboard-ns");

  function setPref(next) {
    try { localStorage.setItem(PREF, next); } catch {}
  }

  const goOther = () => {
    if (isNS) { setPref("standard"); navigate("/dashboard", { replace: true }); }
    else { setPref("northstar"); navigate("/dashboard-ns", { replace: true }); }
  };

  return (
    <button className="sh-btn is-ghost" onClick={goOther} title="Switch dashboard">
      {isNS ? "← Standard Dashboard" : "⭐ Northstar Dashboard"}
    </button>
  );
}

// helper for index redirect
export function getPreferredDash() {
  try { return localStorage.getItem(PREF) || "standard"; } catch { return "standard"; }
}
