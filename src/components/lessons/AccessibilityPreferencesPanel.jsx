// src/components/lessons/AccessibilityPreferencesPanel.jsx
// Phase 2B — small, reusable settings panel for AccessibilityPreferences.
// Capability-based checkboxes, not a disability category selector.
import React from "react";
import { useAccessibilityPreferences } from "@/context/AccessibilityPreferences.jsx";

const OPTIONS = [
  { key: "reducedMotion", label: "Reduce motion and animation" },
  { key: "largerText", label: "Larger text" },
  { key: "higherContrast", label: "Higher contrast" },
  { key: "captionsPreferred", label: "Prefer captions when available" },
  { key: "transcriptPreferred", label: "Prefer transcripts when available" },
  { key: "simplifiedReading", label: "Simplified reading level when available" },
  { key: "audioSupport", label: "Show read-aloud controls prominently" },
  { key: "keyboardOptimized", label: "Larger focus outlines and click targets" },
];

export default function AccessibilityPreferencesPanel() {
  const { prefs, setPref, resetPrefs } = useAccessibilityPreferences();

  return (
    <section className="card card--pad" aria-label="Accessibility preferences">
      <strong>Accessibility preferences</strong>
      <p className="subtle" style={{ marginTop: 4 }}>
        These change how lessons are displayed for you. Nothing here is shared as a diagnosis or medical information.
      </p>
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {OPTIONS.map((opt) => (
          <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={!!prefs[opt.key]}
              onChange={(e) => setPref(opt.key, e.target.checked)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <button type="button" className="sh-btn is-ghost" style={{ marginTop: 10 }} onClick={resetPrefs}>
        Reset to defaults
      </button>
    </section>
  );
}
