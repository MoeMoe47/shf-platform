import React from "react";
import { Outlet } from "react-router-dom";

export default function BareLayout() {
  return (
    <main id="ai-main" style={{minHeight:"100vh", color:"#fff", background:"#000"}}>
      <div style={{padding:"16px", fontFamily:"system-ui"}}>
        <div style={{opacity:.8, fontSize:12}}>BareLayout</div>
        <Outlet />
      </div>
    </main>
  );
}
