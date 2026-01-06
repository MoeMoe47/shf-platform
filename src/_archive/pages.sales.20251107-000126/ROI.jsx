import React, { useEffect } from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function ROI() {
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("sales:roi:view", { app: "sales" }); } catch {} }, [emit]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>ROI</h1>
        <p className="muted">Showcase expected outcomes and cost savings. (Placeholder)</p>
      </div>
    </div>
  );
}
