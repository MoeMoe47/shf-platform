import React from "react";
import { audit } from "@/shared/audit/auditClient.js";

let exporters = {};
try { exporters = await import("@/shared/ledger/exporters.js"); } catch {}

const safe = (fn, fb) => (...args) => { try { return fn ? fn(...args) : fb && fb(...args); } catch {} };

export default function EvidenceButtons({ lesson, vLesson, evidenceCount = 0, onPrintEvidence }) {
  const dlCSV = safe(exporters.downloadEventsCSV, () => alert("CSV exporter not available."));
  const dlJSON = () => {
    const blob = new Blob([JSON.stringify({ lesson, vLesson, ts: Date.now() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${lesson?.id || "lesson"}-evidence.json`;
    a.click();
  };
  const dlPDF = () => (onPrintEvidence ? onPrintEvidence() : alert("PDF generator not wired."));

  const onExport = (type) => (e) => {
    e.preventDefault();
    audit("evidence_export", { type, lessonId: lesson?.id, count: evidenceCount });
    ({ csv: dlCSV, json: dlJSON, pdf: dlPDF }[type])();
  };

  return (
    <div className="accred-actions" style={{display:"flex", gap:8, flexWrap:"wrap"}}>
      <button className="sh-btn" onClick={onExport("csv")}>Download CSV</button>
      <button className="sh-btn" onClick={onExport("json")}>Download JSON</button>
      <button className="sh-btn" onClick={onExport("pdf")}>Create PDF</button>
    </div>
  );
}
