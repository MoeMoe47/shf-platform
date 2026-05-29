import React, { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
const ExchangeLayout = lazy(() => import("@/pages/exchange/ExchangeLayout"));
import OperatorDashboard from "@/pages/exchange/OperatorDashboard";
import ProviderDashboard from "@/pages/exchange/ProviderDashboard";
import InvestorDashboard from "@/pages/exchange/InvestorDashboard";
import PublicTransparency from "@/pages/exchange/PublicTransparency";
import CommandCenter from "@/pages/exchange/CommandCenter";
import WorkspaceDashboard from "../pages/exchange/WorkspaceDashboard";


function ExchangeRouteFallback() {
  return (
    <div
      style={{
        minHeight: "320px",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        color: "rgba(226, 232, 240, 0.92)",
        background: "linear-gradient(180deg, rgba(8,24,44,.96), rgba(3,10,22,.98))",
      }}
    >
      Loading SHS Exchange surface…
    </div>
  );
}

function withExchangeLazyBoundary(element) {
  return <Suspense fallback={<ExchangeRouteFallback />}>{element}</Suspense>;
}

export default function ExchangeRoutes() {
  return (
    <Route path="exchange" element={withExchangeLazyBoundary(<ExchangeLayout />)}>
      <Route index element={<CommandCenter />} />
      <Route path="dashboard" element={<WorkspaceDashboard />} />
      <Route path="command" element={<CommandCenter />} />
      {/* SHS_UNIFIED_TRUTH_ROUTE_ALIAS_PATCH */}
      <Route path="unified-truth" element={<CommandCenter />} />
      <Route path="truth" element={<CommandCenter />} />
      <Route path="operator" element={<OperatorDashboard />} />
      <Route path="provider" element={<ProviderDashboard />} />
      <Route path="investor" element={<InvestorDashboard />} />
      <Route path="public" element={<PublicTransparency />} />
    </Route>
  );
}
