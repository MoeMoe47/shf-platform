import ExchangeRoutes from "@/routes/exchangeRoutes";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CapitalLayout from "@/layouts/CapitalLayout.jsx";
import OperatorControlPanel from "@/pages/capital/OperatorControlPanel.jsx";
import SHSExchangeMissionControl from "@/pages/exchange/SHSExchangeMissionControl.jsx";
import IEPDashboardPage from "@/pages/iep/IEPDashboardPage";
import IEPCommandCenter from "@/pages/iep-command/IEPCommandCenter";
import IEPCommandCenterV2 from "@/pages/iep-command-v2/IEPCommandCenterV2";

export default function CapitalRoutes() {
  return (
    <Routes>
        {ExchangeRoutes()}
      <Route path="/" element={<CapitalLayout />}>
        <Route index element={<Navigate to="operator" replace />} />
        <Route path="operator" element={<OperatorControlPanel />} />
        <Route path="*" element={<Navigate to="operator" replace />} />
      </Route>
      <Route path="exchange-mission" element={<SHSExchangeMissionControl />} />
      <Route path="iep-command" element={<IEPCommandCenter />} />
      <Route path="iep-command-v2" element={<IEPCommandCenterV2 />} />


      <Route path="iep-dashboard" element={<IEPDashboardPage />} />

</Routes>
  );
}