import React from "react";

function StatCard({ label, value, helper }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 16,
        minHeight: 118,
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ color: "#60a5fa", fontSize: 14 }}>{helper}</div>
    </div>
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function SystemSummaryCards({ summary }) {
  const poolCount = Number(summary?.pool_count || 0);
  const openDisputeCount = Number(summary?.open_dispute_count || 0);

  const committedAmountTotal = Number(summary?.committed_amount_total || 0) / 100;
  const reservedAmountTotal = Number(summary?.reserved_amount_total || 0) / 100;
  const deployedAmountTotal = Number(summary?.deployed_amount_total || 0) / 100;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(180px, 1fr))",
        gap: 16,
        overflowX: "auto",
      }}
    >
      <StatCard
        label="Pools"
        value={poolCount}
        helper="Registered funding pools"
      />
      <StatCard
        label="Open Disputes"
        value={openDisputeCount}
        helper="Governance queue"
      />
      <StatCard
        label="Committed"
        value={formatMoney(committedAmountTotal)}
        helper="Total committed capital"
      />
      <StatCard
        label="Reserved"
        value={formatMoney(reservedAmountTotal)}
        helper="Reserved against pools"
      />
      <StatCard
        label="Deployed"
        value={formatMoney(deployedAmountTotal)}
        helper="Settled / deployed capital"
      />
    </div>
  );
}
