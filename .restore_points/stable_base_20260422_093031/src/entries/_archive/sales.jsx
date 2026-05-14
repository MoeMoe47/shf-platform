import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import RootProviders from "@/entries/RootProviders.jsx";
import SalesRoutes from "@/router/SalesRoutes.jsx";

function mount() {
  let el = document.getElementById("app");
  if (!el) {
    el = document.createElement("div");
    el.id = "app";
    document.body.appendChild(el);
  }
  createRoot(el).render(
    <RootProviders>
      <HashRouter>
        <SalesRoutes />
      </HashRouter>
    </RootProviders>
  );
}
document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", mount, { once: true })
  : mount();
