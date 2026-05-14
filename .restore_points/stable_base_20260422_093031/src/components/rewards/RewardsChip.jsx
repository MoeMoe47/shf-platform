import React from "react";
import { useRewards } from "@/hooks/useRewards.js";

export default function RewardsChip({ className = "" }) {
  const { points } = useRewards();
  return (
    <span
      className={`sh-chip is-ghost ${className}`}
      title="Rewards Wallet"
      aria-label={`You have ${points} points.`}
      style={{ display:"inline-flex", alignItems:"center", gap:6 }}
    >
      <span aria-hidden>🏅</span>
      <span>{points} pts</span>
    </span>
  );
}
