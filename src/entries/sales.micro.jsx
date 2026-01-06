import React from "react";
import { createRoot } from "react-dom/client";
import SalesRoutes from "@/router/SalesRoutes.jsx";

const mount = document.getElementById("root");
if (!mount) throw new Error("Sales root not found");

createRoot(mount).render(<SalesRoutes />);
