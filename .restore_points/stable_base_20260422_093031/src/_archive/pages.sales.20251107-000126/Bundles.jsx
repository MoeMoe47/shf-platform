import React, { useEffect } from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function Bundles() {
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("sales:bundles:view", { app: "sales" }); } catch {} }, [emit]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>Bundles</h1>
        <p className="muted">Program bundles and SKUs. (Placeholder)</p>
      </div>
    </div>
  );
}
