import React, { useEffect } from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function Ledger() {
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("sales:ledger:view", { app: "sales" }); } catch {} }, [emit]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>Ledger</h1>
        <p className="muted">Transactions and audit trail. (Placeholder)</p>
      </div>
    </div>
  );
}
