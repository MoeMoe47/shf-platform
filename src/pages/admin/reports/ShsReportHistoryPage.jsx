import React, { useEffect, useState } from "react";
import { listShsReportDrafts, listShsReportRevisions } from "@/shared/reporting/shsReportDraftClient";
import ShsReportHistoryTable from "./components/ShsReportHistoryTable.jsx";
import "./shsReports.css";

export default function ShsReportHistoryPage() {
  const [reports, setReports] = useState([]);
  const [revisionsByReport, setRevisionsByReport] = useState({});
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    listShsReportDrafts()
      .then(async (items) => {
        const entries = await Promise.all(items.map(async (report) => [
          report.reportId,
          await listShsReportRevisions(report.reportId),
        ]));
        if (!active) return;
        setReports(items);
        setRevisionsByReport(Object.fromEntries(entries));
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("unavailable");
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="shs-reports-command">
      <section className="shs-reports-hero">
        <div>
          <p>Reports Command</p>
          <h1>Report History</h1>
          <span>Backend draft records, immutable revisions, lifecycle status, visibility, and export metadata.</span>
        </div>
      </section>
      {status === "loading" ? <p role="status">Loading backend report drafts…</p> : null}
      {status === "unavailable" ? <p role="alert">Backend report history unavailable.</p> : null}
      {status === "ready" ? <ShsReportHistoryTable reports={reports} revisionsByReport={revisionsByReport} /> : null}
    </main>
  );
}
