import React from "react";
import { isEnabled } from "@/shared/appFlags.js";
import EvidenceButtons from "@/components/shared/EvidenceButtons.jsx";

export default function EvidenceSlot({ lesson, vLesson, onPrintEvidence, evidenceCount=0 }) {
  if (!isEnabled("career", "evidencePack")) return null;
  return (
    <div className="accred-actions">
      <EvidenceButtons lesson={lesson} vLesson={vLesson} evidenceCount={evidenceCount} onPrintEvidence={onPrintEvidence} />
    </div>
  );
}
