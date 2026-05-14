// (dev) disabled SW import
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import RootProviders from "./RootProviders.jsx";
import SalesRoutesBaseline from "@/router/SalesRoutes.BASELINE.jsx";

const el = document.getElementById("app");
if (!el) throw new Error("Missing #app");

createRoot(el).render(
  <React.StrictMode>
    <HashRouter basename="/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RootProviders appScope="sales">
        <SalesRoutesBaseline />
      </RootProviders>
    </HashRouter>
  </React.StrictMode>
);