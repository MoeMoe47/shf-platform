import React from "react";
import OperatorLayout from "../layouts/OperatorLayout";
import OperatorDashboard from "../pages/operator/OperatorDashboard";
import ProgramManagement from "../pages/operator/ProgramManagement";
import CaseManagement from "../pages/operator/CaseManagement";
import GovernmentAssurance from "../pages/operator/GovernmentAssurance";

export default function AppRoutes() {
  const hash = window.location.hash || "#/operator";

  let page = <OperatorDashboard />;

  if (hash === "#/operator/programs") {
    page = <ProgramManagement />;
  } else if (hash === "#/operator/cases") {
    page = <CaseManagement />;
  } else if (hash === "#/operator/government-assurance") {
    page = <GovernmentAssurance />;
  } else if (hash === "#/operator") {
    page = <OperatorDashboard />;
  }

  return <OperatorLayout>{page}</OperatorLayout>;
}
