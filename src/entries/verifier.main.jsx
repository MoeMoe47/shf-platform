import "@/styles/shell.css";
import React from "react";
import { createRoot } from "react-dom/client";
import Verifier from "@/pages/Verifier.jsx";
import "@/styles/partner-layer.css";
import "@/styles/unified-shell.css";
import "@/styles/app-shell.css";
createRoot(document.getElementById("app")).render(<Verifier />);
