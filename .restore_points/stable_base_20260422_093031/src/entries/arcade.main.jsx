import "@/styles/shell.css";
import "@/styles/unified-shell.css";
import "@/styles/app-shell.css";

// DEV shim: intercept /growth/* so Tower never blacks out when API is offline
import "@/dev/growthMock.fetch-shim.js";
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
  
    <RootProviders appId="arcade">
      <HashRouter>
        <ArcadeRoutes />
      </HashRouter>
    </RootProviders>
  ,
);
