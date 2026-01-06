import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SalesLayout from "@/layouts/SalesLayout.jsx";

// start simple, swap to your real pages next
const Northstar = () => <div style={{padding:24,fontSize:22}}>Northstar OK</div>;
const Leads     = () => <div style={{padding:24,fontSize:22}}>Leads OK</div>;
const Pipeline  = () => <div style={{padding:24,fontSize:22}}>Pipeline OK</div>;

export default function SalesRoutes() {
  return (
    <Routes>
      <Route element={<SalesLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Northstar />} />
        <Route path="leads" element={<Leads />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="*" element={<div style={{padding:24}}>Not found (Sales)</div>} />
      </Route>
    </Routes>
  );
}
