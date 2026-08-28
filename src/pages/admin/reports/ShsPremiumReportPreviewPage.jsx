import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ShsClientOrganizationProfilePage from "./components/ShsClientOrganizationProfilePage.jsx";
import ShsPremiumExecutiveSummaryPage from "./components/ShsPremiumExecutiveSummaryPage.jsx";
import ShsPremiumTableOfContentsPage from "./components/ShsPremiumTableOfContentsPage.jsx";
import ShsReportPreviewShell from "./components/ShsReportPreviewShell.jsx";
import { listShsReportDrafts } from "@/shared/reporting/shsReportDraftClient";
import "./shsPremiumReport.css";

function activePageFromPath(pathname) {
  if (pathname.endsWith("/client-profile")) return "client-profile";
  if (pathname.endsWith("/executive-summary")) return "executive-summary";
  return "toc";
}

export default function ShsPremiumReportPreviewPage() {
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(location.state?.reportId || "");
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let active = true;
    listShsReportDrafts()
      .then((items) => {
        if (!active) return;
        setReports(items);
        setSelectedReportId((current) => current || items[0]?.reportId || "");
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("unavailable");
      });
    return () => { active = false; };
  }, []);
  const report = useMemo(() => reports.find((item) => item.reportId === selectedReportId) || null, [reports, selectedReportId]);
  const activePage = activePageFromPath(location.pathname);

  return (
    <ShsReportPreviewShell
      report={report}
      reports={reports}
      selectedReportId={selectedReportId}
      onReportChange={setSelectedReportId}
      activePage={activePage}
    >
      {status === "unavailable" ? <p role="alert">Backend report draft unavailable.</p> : null}
      {activePage === "client-profile" ? (
        <ShsClientOrganizationProfilePage report={report} />
      ) : activePage === "executive-summary" ? (
        <ShsPremiumExecutiveSummaryPage report={report} />
      ) : (
        <ShsPremiumTableOfContentsPage report={report} />
      )}
    </ShsReportPreviewShell>
  );
}
