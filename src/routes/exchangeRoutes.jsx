import React from "react";
import { Route } from "react-router-dom";
import ExchangeLayout from "@/pages/exchange/ExchangeLayout";
import OperatorDashboard from "@/pages/exchange/OperatorDashboard";
import ProviderDashboard from "@/pages/exchange/ProviderDashboard";
import InvestorDashboard from "@/pages/exchange/InvestorDashboard";
import PublicTransparency from "@/pages/exchange/PublicTransparency";
import CommandCenter from "@/pages/exchange/CommandCenter";

export default function ExchangeRoutes() {
  return (
    <Route path="exchange" element={<ExchangeLayout />}>
      <Route index element={<CommandCenter />} />
      <Route path="command" element={<CommandCenter />} />
      <Route path="operator" element={<OperatorDashboard />} />
      <Route path="provider" element={<ProviderDashboard />} />
      <Route path="investor" element={<InvestorDashboard />} />
      <Route path="public" element={<PublicTransparency />} />
    </Route>
  );
}
