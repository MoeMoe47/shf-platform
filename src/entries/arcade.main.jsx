import "@/styles/unified-shell.css";
// src/entries/arcade.main.jsx
// ------------------------------------------------------------
// L1X Arcade entry – standalone shell
//  - No SHF Foundation sidebar
//  - Uses L1X arcade theme only
// ------------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import "@/styles/arcade-shell.css";
import "@/styles/arcade.css";

import RootProviders from "./RootProviders.jsx";
import ArcadeRoutes from "@/router/ArcadeRoutes.jsx";

const mountEl =
  document.querySelector('[data-app="arcade"]') ||
  document.getElementById("root");

if (!mountEl) {
  throw new Error("[arcade.main] #root or [data-app=arcade] not found");
}

ReactDOM.createRoot(mountEl).render(
  <React.StrictMode>
    <RootProviders appId="arcade">
      <HashRouter>
        <ArcadeRoutes />
      </HashRouter>
    </RootProviders>
  </React.StrictMode>,
);
