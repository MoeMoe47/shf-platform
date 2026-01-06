import React from "react";
import { isEnabled } from "@/shared/appFlags.js";
import EvidenceButtons from "@/components/shared/EvidenceButtons.jsx";

export default function AccreditationPanel({ lesson, vLesson, onPrintEvidence, evidenceCount = 0 }) {
  if (!isEnabled("civic", "evidencePack")) return null;
  return (
    <aside className="accred-panel">
      <header><h3>Accreditation / Evidence</h3></header>
      <ul className="accred-meta">
        <li><strong>Lesson:</strong> {lesson?.title || lesson?.id}</li>
        <li><strong>Evidence items:</strong> {evidenceCount}</li>
      </ul>
      <EvidenceButtons lesson={lesson} vLesson={vLesson} evidenceCount={evidenceCount} onPrintEvidence={onPrintEvidence} />
    </aside>
  );
}
