import React from "react";
import { createRoot } from "react-dom/client";

let el = document.getElementById("app");
if (!el) { el = document.createElement("div"); el.id = "app"; document.body.appendChild(el); }

console.log("[sales.smoke] mounting");
createRoot(el).render(
  React.createElement("div", {style:{padding:24,fontFamily:"system-ui"}}, "SALES SMOKE ✅")
);
