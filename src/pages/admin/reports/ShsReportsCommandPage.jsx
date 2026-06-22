import React, { useEffect, useState } from "react";
import { getReportRecords } from "@/data/shsReports/shsReportStorage";
import ShsReportDashboard from "./components/ShsReportDashboard.jsx";
import "./shsReports.css";

export default function ShsReportsCommandPage() {
  const [reports, setReports] = useState(() => getReportRecords());

  useEffect(() => {
    function refresh() {
      setReports(getReportRecords());
    }
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return (
    <main className="shs-reports-command">
      <ShsReportDashboard reports={reports} />
    </main>
  );
}
