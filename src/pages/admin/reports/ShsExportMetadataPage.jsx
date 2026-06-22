import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getReportRecords } from "@/data/shsReports/shsReportStorage";
import ShsExportMetadataPanel from "./components/ShsExportMetadataPanel.jsx";
import "./shsReports.css";

export default function ShsExportMetadataPage() {
  const location = useLocation();
  const reportId = new URLSearchParams(location.search).get("reportId");
  const report = useMemo(() => {
    const records = getReportRecords();
    return records.find((item) => item.reportId === reportId || item.id === reportId) || records[0];
  }, [reportId]);

  return (
    <main className="shs-reports-command">
      <section className="shs-reports-hero">
        <div>
          <p>Reports Command</p>
          <h1>Export Metadata</h1>
          <span>Prepared export metadata, source readiness summary, lock status, and Save as PDF instruction.</span>
        </div>
      </section>
      <ShsExportMetadataPanel report={report} />
    </main>
  );
}
