import React from "react";
import { Routes, Route } from "react-router-dom";

function CareerHome() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: 0 }}>Career</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Career is mounted. If you see this, the shell + routing is healthy.
      </p>
    </div>
  );
}

export function CareerRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<CareerHome />} />
    </Routes>
  );
}
