import "@/styles/unified-shell.css";
// src/entries/foundation.main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import RootProviders from "./RootProviders.jsx";
import FoundationRoutes from "@/router/FoundationRoutes.jsx";

import "@/styles/foundation.css";
import "@/styles/apps-gallery.css";

const mount =
  document.querySelector('[data-app="foundation"]') ||
  document.getElementById("root");

if (!mount) {
  throw new Error("Foundation mount element not found");
}

ReactDOM.createRoot(mount).render(
  <React.StrictMode>
    <RootProviders appId="foundation">
      <HashRouter>
        <FoundationRoutes />
      </HashRouter>
    </RootProviders>
  </React.StrictMode>
);
