import React, { useEffect } from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function SalesCoach() {
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("sales:coach:view", { app: "sales" }); } catch {} }, [emit]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>Sales Coach</h1>
        <p className="muted">Guided flows and Q&A. (Placeholder)</p>
      </div>
    </div>
  );
}
