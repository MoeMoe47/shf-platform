import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import CapitalRoutes from "@/router/CapitalRoutes.jsx";

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

// 🔥 SIMPLE GLOBAL TEST LISTENER
if (typeof window !== "undefined") {
  window.addEventListener("shf:ai_action", (e) => {
    console.log("🔥 EVENT RECEIVED IN ENTRY:", e.detail);
  });
}




createRoot(mount).render(
  <React.StrictMode>
    <HashRouter>
      <CapitalRoutes />
    </HashRouter>
  </React.StrictMode>
);
