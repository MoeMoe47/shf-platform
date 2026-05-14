import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import TreasuryLayout from "@/layouts/TreasuryLayout.jsx";
import DevDocsViewer from "@/pages/dev/Docs.jsx";

const Portfolio = lazy(() => import("@/pages/treasury/Portfolio.jsx"));
const Dashboard = lazy(() => import("@/pages/treasury/Dashboard.jsx"));
const Assets = lazy(() => import("@/pages/treasury/Assets.jsx"));
const Ledger = lazy(() => import("@/pages/treasury/Ledger.jsx"));
const Proofs = lazy(() => import("@/pages/treasury/Proofs.jsx"));
const Settings = lazy(() => import("@/pages/treasury/Settings.jsx"));
const Help = lazy(() => import("@/pages/treasury/Help.jsx"));
const TxDetails = lazy(() => import("@/pages/treasury/TransactionDetails.jsx"));
const OperatorControlPanel = lazy(() => import("@/pages/treasury/OperatorControlPanel.jsx"));

export default function TreasuryRoutes() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: "#111" }}>Loading treasury…</div>}>
      <Routes>
        <Route path="/__docs" element={<DevDocsViewer />} />

        <Route path="/" element={<TreasuryLayout />}>
          <Route index element={<Navigate to="operator" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="transaction/:id" element={<TxDetails />} />
          <Route path="proofs" element={<Proofs />} />
          <Route path="operator" element={<OperatorControlPanel />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="*" element={<Navigate to="operator" replace />} />
        </Route>

        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
    </Suspense>
  );
}
