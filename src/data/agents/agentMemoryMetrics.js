import { scanAgentMemorySafety } from "./agentMemorySafety";

export function calculateAgentMemoryMetrics(records = [], packets = []) {
  const activeRecords = records.filter((record) => record.status === "active");
  const needsReviewRecords = records.filter((record) => record.status === "needs_review");
  const archivedRecords = records.filter((record) => record.status === "archived");
  const blockedItems = records.flatMap((record) => scanAgentMemorySafety(record).blocked_items);

  return {
    total_memory_records: records.length,
    active_memory_records: activeRecords.length,
    needs_review_records: needsReviewRecords.length,
    archived_memory_records: archivedRecords.length,
    context_packet_count: packets.length,
    blocked_item_count: blockedItems.length,
    safe_for_public_count: records.filter((record) => record.safe_for_public === true).length,
    public_approved_count: records.filter((record) => record.public_approved === true).length,
    shf_mutation_count: records.filter((record) => record.shf_impact_data_mutated === true).length,
    production_execution_count: records.filter((record) => record.production_action_executed === true).length,
  };
}
