import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import CapitalRoutes from "@/router/CapitalRoutes.jsx";
import { initDecisionListener } from "@/pages/exchange/decisionListener.js";

function getMount() {
  let el =
    document.querySelector('[data-app="capital"]') ||
    document.getElementById("root") ||
    document.getElementById("app");

  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    el.dataset.app = "capital";
    document.body.appendChild(el);
  }
  return el;
}

const mount = getMount();

initDecisionListener(() => ({
  currentRecommendation: {},
  currentTimelineStep: "risk_signal"
}));


createRoot(mount).render(
  <React.StrictMode>
    <HashRouter>
      <CapitalRoutes />
    </HashRouter>
  </React.StrictMode>
);
