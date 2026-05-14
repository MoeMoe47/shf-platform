import React from "react";
import ReactDOM from "react-dom/client";
import FoundationApp from "./App";
import { installGlobalButtonClickSound } from "../shared/ui/globalButtonClickSound.js";

const mountNode = document.getElementById("root");

if (!mountNode) {
  throw new Error('SHF mount failed: missing #root element in foundation.html');
}

installGlobalButtonClickSound();

ReactDOM.createRoot(mountNode).render(
  <React.StrictMode>
    <FoundationApp />
  </React.StrictMode>
);
