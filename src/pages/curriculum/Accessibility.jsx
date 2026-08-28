// src/pages/curriculum/Accessibility.jsx
// Phase 2B — reachable home for AccessibilityPreferencesPanel. Kept
// separate from the shared src/pages/Settings.jsx (also used by the
// Career app) to avoid touching a cross-app file for a Curriculum-only
// capability.
import React from "react";
import AccessibilityPreferencesPanel from "@/components/lessons/AccessibilityPreferencesPanel.jsx";

export default function CurriculumAccessibility() {
  return (
    <div className="stack">
      <AccessibilityPreferencesPanel />
    </div>
  );
}
