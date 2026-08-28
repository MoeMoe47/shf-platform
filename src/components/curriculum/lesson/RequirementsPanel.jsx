// src/components/curriculum/lesson/RequirementsPanel.jsx
//
// Approved mock's "Assignment Requirements" panel — Phase 1 honesty
// constraint: there is no canonical Assignment Completion Policy backend
// anywhere in this repo (Assignments.jsx's own header comment marks its
// data as "Placeholder data (swap when API is ready)", with no per-lesson
// linkage to a real requirement set). This panel must not present a fake
// "2 of 4 complete" checklist as verified fact. It renders a UI contract
// that is ready for real requirement data the moment a canonical source
// exists, and an honest, visually-developed fallback until then — a
// fidelity-correction pass (2026-08-27) replaced the plain paragraph-only
// empty state with a proper empty-state treatment (icon badge + heading +
// detail), matching the panel density of Evidence/Career, while still
// never fabricating a requirement row.
import React from "react";
import { ClipboardIcon } from "@/components/curriculum/icons.jsx";

export default function RequirementsPanel() {
  return (
    <section id="lesson-requirements" className="ld-card ld-panelCard" aria-label="Assignment requirements">
      <div className="ld-panelTitleRow">
        <h2 className="ld-panelTitle">Requirements</h2>
      </div>
      <div className="ld-reqEmptyState">
        <span className="ld-reqEmptyIcon" aria-hidden="true">
          <ClipboardIcon size={17} />
        </span>
        <div>
          <p className="ld-reqEmptyTitle">Not yet assigned</p>
          <p className="ld-panelNote">
            Requirements will appear here once this lesson is assigned with a completion policy. Nothing
            below is submitted or verified automatically.
          </p>
        </div>
      </div>
    </section>
  );
}
