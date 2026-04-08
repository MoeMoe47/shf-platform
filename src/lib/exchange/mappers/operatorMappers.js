export function mapOperatorSummary(summary = {}) {
  return {
    poolCount: Number(summary.pool_count || 0),
    openDisputeCount: Number(summary.open_dispute_count || 0),
    committedAmountTotal: Number(summary.committed_amount_total || 0),
    reservedAmountTotal: Number(summary.reserved_amount_total || 0),
    deployedAmountTotal: Number(summary.deployed_amount_total || 0),
  };
}
