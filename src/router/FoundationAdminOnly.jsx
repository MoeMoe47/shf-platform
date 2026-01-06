import React, { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Link } from "react-router-dom";

const PlacementKPIs = lazy(() => import("@/pages/admin/PlacementKPIs.jsx"));
const PartnerJobs   = lazy(() => import("@/pages/admin/PartnerJobs.jsx"));

export default function FoundationAdminOnly(){
  return (
    <HashRouter>
      <div style={{padding:16, background:"#f8fafc", minHeight:"100vh"}}>
        <header style={{display:"flex",gap:14,alignItems:"baseline"}}>
          <h1 style={{margin:0}}>Admin</h1>
          <nav style={{display:"flex",gap:10,marginBottom:12}}>
      <a href="#/admin/placement-kpis">Placement KPIs</a>
      <a href="#/admin/investor-northstar">Investor Northstar</a>
      <a href="#/admin/talent-sources">Talent Sources</a>
      <a href="#/admin/attribution">Attribution</a>
      <a href="#/admin/partner-jobs">Partner Jobs (CSV)</a>
    </nav>
        </header>
        <Suspense fallback={<div style={{padding:16}}>Loading…</div>}>
          <Routes>
            <Route path="/admin/placement-kpis" element={<PlacementKPIs/>}/>
            <Route path="/admin/partner-jobs"   element={<PartnerJobs/>}/>
            <Route path="*" element={<div style={{padding:16}}>Pick a tool above.</div>} />
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}
