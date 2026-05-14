import React, { useEffect } from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function Pricing() {
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("sales:pricing:view", { app: "sales" }); } catch {} }, [emit]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>Pricing</h1>
        <p className="muted">Tiers, seats, discounts. (Placeholder)</p>
      </div>
    </div>
  );
}
