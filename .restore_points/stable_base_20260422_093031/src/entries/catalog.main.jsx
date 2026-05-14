import "@/styles/shell.css";
import React from "react";
import { createRoot } from "react-dom/client";
import Catalog from "@/pages/catalog/Catalog.jsx";
import "@/boot.jsx"; // keeps your global tokens/fonts
import "@/styles/unified-shell.css";
import "@/styles/app-shell.css";
createRoot(document.getElementById("app")).render(<Catalog />);
