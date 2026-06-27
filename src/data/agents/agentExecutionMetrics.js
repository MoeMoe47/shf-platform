import { AGENT_EXECUTION_ALLOWED_ACTION_TYPES, AGENT_EXECUTION_BLOCKED_ACTION_TYPES } from "./agentExecutionSafety";

export function calculateAgentExecutionMetrics(records = [], requests = []) {
  const safeRecords = Array.isArray(records) ? records : [];
  const safeRequests = Array.isArray(requests) ? requests : [];
  return {
    allowed_action_count: AGENT_EXECUTION_ALLOWED_ACTION_TYPES.length,
    blocked_action_count: AGENT_EXECUTION_BLOCKED_ACTION_TYPES.length,
    request_count: safeRequests.length,
    eligible_requests: safeRequests.filter((request) => request.status === "eligible" || request.status === "executed_local").length,
    blocked_requests: safeRequests.filter((request) => request.status === "blocked").length,
    record_count: safeRecords.length,
    executed_local_records: safeRecords.filter((record) => record.status === "executed_local").length,
    blocked_records: safeRecords.filter((record) => record.status === "blocked").length,
    failed_records: safeRecords.filter((record) => record.status === "failed").length,
    dangerous_flag_violations: safeRecords.filter((record) => (
      record.production_action_executed
      || record.report_published
      || record.public_data_mutated
      || record.public_approved_mutated
      || record.shf_impact_data_mutated
      || record.external_message_sent
      || record.webhook_sent
      || record.notification_sent
      || record.warehouse_write_performed
      || record.auth_modified
    )).length,
  };
}
