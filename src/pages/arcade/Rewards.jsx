import React, { useEffect } from "react";
import WalletButton from "@/components/WalletButton.jsx";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function ArcadeRewards() {
  const { emit } = typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };
  useEffect(() => { try { emit?.("arcade:rewards:view", { app: "arcade" }); } catch {} }, [emit]);

  return (
    <div className="page pad">
      <div className="card card--pad">
        <h1 style={{ margin: 0 }}>Rewards</h1>
        <p className="muted">Open your in-app wallet to view and convert points.</p>
        <WalletButton className="sh-btn sh-btn--primary" />
      </div>
    </div>
  );
}
