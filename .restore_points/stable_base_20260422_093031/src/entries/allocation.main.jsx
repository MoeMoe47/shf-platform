import React from "react";
import { createRoot } from "react-dom/client";
import getMount from "./getMount.js";
import AllocationApp from "@/apps/allocation/AllocationApp.jsx";

const mount = getMount("allocation");
createRoot(mount).render(
  <React.StrictMode>
    <AllocationApp />
  </React.StrictMode>
);
