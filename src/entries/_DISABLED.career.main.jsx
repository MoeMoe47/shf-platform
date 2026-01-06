// src/entries/career.main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import RootProviders from "@/entries/RootProviders.jsx";

// Shell + theme styles so the career app looks like the rest of SHF
import "@/styles/theme-shf.css";
import "@/styles/unified-shell.css";
import "@/styles/unified-shell.optin.css";
import "@/styles/app-shell.css";
import "@/styles/career-shell.css";
import "@/styles/util-wash.css";

const APP = "career";

/**
 * Find the mount node for this app.
 * It prefers: <div id="root" data-app="career"> from career.html
 * but will fall back to any [data-app="career"] if needed.
 */
function getMount(id = "root", appAttrValue = APP) {
  // 1) Try by id first (your career.html has <div id="root" data-app="career">)
  const byId = document.getElementById(id);
  if (byId && byId.dataset && byId.dataset.app === appAttrValue) {
    return byId;
  }

  // 2) Fallback: anything with data-app="career"
  const byAttr = document.querySelector(`[data-app="${appAttrValue}"]`);
  if (byAttr) return byAttr;

  // 3) If we can’t find it, throw a clear error
  throw new Error(
    `[career.main] Could not find mount node with id="${id}" and data-app="${appAttrValue}"`
  );
}

function bootstrap() {
  const mount = getMount("root", APP);
  const root = createRoot(mount);

  root.render(
    <React.StrictMode>
      <RootProviders appScope={APP}>
        <HashRouter>
        </HashRouter>
      </RootProviders>
    </React.StrictMode>
  );

  return root;
}

// Boot immediately when loaded by career.html
bootstrap();

// Hot Module Replacement (Vite) – keeps the career app live while you edit
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("[career.main] HMR reload");
    bootstrap();
  });
}
