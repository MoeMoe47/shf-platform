import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function Tournaments() {
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("arcade:tournaments:view", { app: "arcade" }); } catch {} }, [emit]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>Tournaments</h1>
        <p className="muted">Weekly and seasonal competitions. (Placeholder)</p>
        <div style={{ marginTop: 8 }}>
          <Link className="sh-btn sh-btn--secondary" to="/tournaments/weekly">Open Weekly Cup</Link>
        </div>
      </div>
    </div>
  );
}
