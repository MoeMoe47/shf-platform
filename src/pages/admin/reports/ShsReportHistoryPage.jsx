import React, { useState } from "react";
import { getReportHistory } from "@/data/shsReports/shsReportStorage";
import ShsReportHistoryTable from "./components/ShsReportHistoryTable.jsx";
import "./shsReports.css";

export default function ShsReportHistoryPage() {
  const [reports, setReports] = useState(() => getReportHistory());

  return (
    <main className="shs-reports-command">
      <section className="shs-reports-hero">
        <div>
          <p>Reports Command</p>
          <h1>Report History</h1>
          <span>Locked exports, draft records, versions, lifecycle status, visibility, and export metadata.</span>
        </div>
      </section>
      <ShsReportHistoryTable reports={reports} onVersionCreated={() => setReports(getReportHistory())} />
    </main>
  );
}
