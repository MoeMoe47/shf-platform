import React from "react";
import { SelectedEntityProvider } from "@/system/context/SelectedEntityContext";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import CapitalRoutes from "@/router/CapitalRoutes.jsx";

function CapitalApp() {
  return (
    <React.StrictMode>
      <SelectedEntityProvider>
        <HashRouter>
          <CapitalRoutes />
        </HashRouter>
      </SelectedEntityProvider>
    </React.StrictMode>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Capital entry mount failed: missing #root element');
}

createRoot(rootEl).render(<CapitalApp />);
