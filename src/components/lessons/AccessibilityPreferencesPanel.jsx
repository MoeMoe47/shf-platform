// src/components/lessons/AccessibilityPreferencesPanel.jsx
// Phase 2B — small, reusable settings panel for AccessibilityPreferences.
// Capability-based checkboxes, not a disability category selector.
//
// SHF AIEL Phase 4: the former "Simplified reading level when available"
// checkbox (a boolean with no real consumer) is replaced below by a
// three-option Reading support select mapped directly onto the real,
// shared preferredReadingSupport contract that ReadingLevelProvider.jsx
// now also reads/writes — one authoritative value, not a second signal.
import React from "react";
import { useAccessibilityPreferences } from "@/context/AccessibilityPreferences.jsx";

const OPTIONS = [
  { key: "reducedMotion", label: "Reduce motion and animation" },
  { key: "largerText", label: "Larger text" },
  { key: "higherContrast", label: "Higher contrast" },
  { key: "captionsPreferred", label: "Prefer captions when available" },
  { key: "transcriptPreferred", label: "Prefer transcripts when available" },
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
        <label style={{ display: "grid", gap: 4 }}>
          <span>Reading support</span>
          <select
            value={prefs.preferredReadingSupport || "CORE"}
            onChange={(e) => setPref("preferredReadingSupport", e.target.value)}
          >
            <option value="CORE">Core</option>
            <option value="SIMPLE">Simple</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <span className="subtle">
            Applies to lesson sections that offer a matching version. Most lessons currently offer only one version.
          </span>
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Celebration intensity</span>
          <select
            value={prefs.celebrationIntensity || "FULL"}
            onChange={(e) => setPref("celebrationIntensity", e.target.value)}
          >
            <option value="FULL">Full</option>
            <option value="SUBTLE">Subtle</option>
            <option value="OFF">Off</option>
          </select>
        </label>
      </div>
      <button type="button" className="sh-btn is-ghost" style={{ marginTop: 10 }} onClick={resetPrefs}>
        Reset to defaults
      </button>
    </section>
  );
}
