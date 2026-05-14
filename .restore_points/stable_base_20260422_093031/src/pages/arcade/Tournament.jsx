import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function Tournament() {
  const { id = "weekly" } = useParams();
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("arcade:tournament:view", { app: "arcade", id }); } catch {} }, [emit, id]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>Tournament — {id}</h1>
        <p className="muted">Bracket, schedule, rewards. (Placeholder)</p>
      </div>
    </div>
  );
}
