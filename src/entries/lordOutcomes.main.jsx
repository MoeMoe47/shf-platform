import React from "react";
import ReactDOM from "react-dom/client";
import LordOutcomesRoutes from "@/router/LordOutcomesRoutes.jsx";
import "@/styles/lordOutcomes.css";
import "@/styles/lordOutcomes.deepSpace.patch.css";

// === LOO CORE STYLE STACK (NO MOCK THEMES) ===








// === LOO ONLY BACKGROUND ===

document.documentElement.setAttribute("data-app", "lordOutcomes");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LordOutcomesRoutes />
  </React.StrictMode>
);
