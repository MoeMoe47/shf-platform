import React from "react";
import { createRoot } from "react-dom/client";
import InstitutionalCatalog from "../pages/shu-institutional/InstitutionalCatalog.jsx";

const root = document.getElementById("app");

if (!root) {
  throw new Error("SHU Institutional Catalog root element is missing");
}

createRoot(root).render(
  <InstitutionalCatalog />
);
