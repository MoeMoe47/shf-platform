import "@/styles/unified-shell.css";
// src/entries/admin.main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import RootProviders from "./RootProviders.jsx";
import AdminRoutes from "@/router/AdminRoutes.jsx";
import "@/index.css";
import getMount from "./getMount.js"; // <- use shared mount helper

const mount = getMount("admin");

if (!mount) {
  // Safety guard so we see a clear message if HTML is miswired
  // and we avoid the "Target container is not a DOM element" crash.
  // You’ll see this in the console instead of a hard runtime error.
  // eslint-disable-next-line no-console
  console.error('[admin.main] No mount node found for appId "admin".');
} else {
  ReactDOM.createRoot(mount).render(
    <React.StrictMode>
      <RootProviders appId="admin">
        <HashRouter>
          <AdminRoutes />
        </HashRouter>
      </RootProviders>
    </React.StrictMode>
  );
}
