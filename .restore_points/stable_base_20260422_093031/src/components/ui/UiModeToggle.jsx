// src/components/ui/UiModeToggle.jsx
import React from "react";
import { useUiMode, useSetUiMode } from "@/hooks/useUiMode.js";

/** Renders a pill button that flips legacy ↔ new for the given namespace */
export default function UiModeToggle({ ns = "treasury", className = "" }) {
  const mode = useUiMode(ns);
  const setMode = useSetUiMode(ns);
  const next = mode === "new" ? "legacy" : "new";
  const label = mode === "new" ? "Switch to Legacy" : "Try New Dashboard";

  return (
    <button
      className={`btn ${className}`}
      onClick={() => setMode(next)}
      title={`Current: ${mode}. Click to switch to ${next}`}
      aria-label={`Toggle UI mode. Current ${mode}`}
    >
      {label}
    </button>
  );
}
