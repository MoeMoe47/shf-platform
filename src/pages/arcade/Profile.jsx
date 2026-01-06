import React, { useEffect } from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function ArcadeProfile() {
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("arcade:profile:view", { app: "arcade" }); } catch {} }, [emit]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>Profile</h1>
        <p className="muted">Player stats and settings. (Placeholder)</p>
      </div>
    </div>
  );
}
