import { TRACKING_SIGNAL_TYPES, createTrackingId } from "./shsTrackingTypes";

function signal(type, sourceEvent, summary, priority = "medium") {
  return {
    signal_id: createTrackingId(`trk_sig_${type}`),
    signal_type: TRACKING_SIGNAL_TYPES.includes(type) ? type : "governance_attention",
    source_event_id: sourceEvent.tracking_event_id,
    client_id: sourceEvent.client_id || "",
    project_id: sourceEvent.project_id || "",
    report_id: sourceEvent.report_id || "",
    agent_id: sourceEvent.agent_id || "",
    summary,
    priority,
    reviewed_locally: false,
    safe_for_report_review: ["report_engagement", "client_value_signal", "impact_report_candidate"].includes(type),
    requires_human_review: true,
  };
}

export function generateTrackingSignals(events = [], reviewedSignals = []) {
  const signals = [];
  events.filter((event) => !event.archived).forEach((event) => {
    const stream = event.metadata?.stream_id || "";
    if (stream === "reports_usage" || event.event_type === "report") {
      signals.push(signal("report_engagement", event, "Report usage may support ClientOps review.", "medium"));
    }
    if (event.metadata?.blocker || event.risk_level === "critical") {
      signals.push(signal("governance_attention", event, "High-risk or blocked event needs governance review.", "high"));
    }
    if (stream === "direct_connect_proof" && event.metadata?.proof_ready === false) {
      signals.push(signal("proof_gap", event, "Direct-source proof gap should be resolved before report use.", "high"));
    }
    if (stream === "agent_activity" && Number(event.metadata?.activity_count || 0) >= 5) {
      signals.push(signal("agent_activity_spike", event, "Agent activity increased and may need operator review.", "medium"));
    }
    if (stream === "support_maintenance") {
      signals.push(signal("support_hotspot", event, "Support or maintenance pattern may affect retention.", "medium"));
    }
    if (stream === "revenue_renewal_signal") {
      signals.push(signal("revenue_signal", event, "Revenue or renewal signal may be useful for planning.", "medium"));
    }
    if (stream === "sales_activity") {
      signals.push(signal("upgrade_opportunity", event, "Sales movement may indicate an upgrade opportunity.", "low"));
    }
    if (stream === "qa_readiness" && event.risk_level !== "low") {
      signals.push(signal("qa_blocker", event, "QA readiness needs review.", "high"));
    }
    if (stream === "production_movement" && event.metadata?.delay) {
      signals.push(signal("production_delay", event, "Production movement suggests delay risk.", "medium"));
    }
    if (event.visibility === "client_report_candidate") {
      signals.push(signal("client_value_signal", event, "Internal value signal may support client reporting after review.", "medium"));
    }
    if (event.event_type === "impact") {
      signals.push(signal("impact_report_candidate", event, "Impact candidate remains blocked until Data Approval review.", "high"));
    }
  });

  return signals.map((item) => ({
    ...item,
    reviewed_locally: reviewedSignals.includes(item.signal_id),
  }));
}

export function summarizeTrackingSignals(signals = []) {
  return {
    signal_count: signals.length,
    upgrade_opportunity_count: signals.filter((signalItem) => signalItem.signal_type === "upgrade_opportunity").length,
    renewal_risk_count: signals.filter((signalItem) => signalItem.signal_type === "renewal_risk").length,
    governance_attention_count: signals.filter((signalItem) => signalItem.signal_type === "governance_attention").length,
    report_engagement_count: signals.filter((signalItem) => signalItem.signal_type === "report_engagement").length,
  };
}

