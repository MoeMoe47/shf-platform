import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ShsClientOrganizationProfilePage from "./components/ShsClientOrganizationProfilePage.jsx";
import ShsPremiumExecutiveSummaryPage from "./components/ShsPremiumExecutiveSummaryPage.jsx";
import ShsPremiumTableOfContentsPage from "./components/ShsPremiumTableOfContentsPage.jsx";
import ShsReportPreviewShell from "./components/ShsReportPreviewShell.jsx";
import { getReportById, shsPremiumReportSeeds } from "./shsPremiumReportData";
import "./shsPremiumReport.css";

function activePageFromPath(pathname) {
  if (pathname.endsWith("/client-profile")) return "client-profile";
  if (pathname.endsWith("/executive-summary")) return "executive-summary";
  return "toc";
}

export default function ShsPremiumReportPreviewPage() {
  const location = useLocation();
  const [selectedReportId, setSelectedReportId] = useState(shsPremiumReportSeeds[0].reportId);
  const report = useMemo(() => getReportById(selectedReportId), [selectedReportId]);
  const activePage = activePageFromPath(location.pathname);

  return (
    <ShsReportPreviewShell
      report={report}
      selectedReportId={selectedReportId}
      onReportChange={setSelectedReportId}
      activePage={activePage}
    >
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
