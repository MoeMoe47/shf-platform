import { getCommands, getCommandHistory } from "@/system/command-bus/shsCommandStorage";
import { calculateCommandMetrics } from "@/system/command-bus/shsCommandMetrics";
import { calculateCommandReadiness } from "@/system/command-bus/shsCommandReadiness";
import { getEventBusEvents, getEventBusSubscribers } from "@/system/event-bus/shsEventStorage";
import { SHS_EVENT_CHANNELS } from "@/system/event-bus/shsEventBusTypes";
import { calculateEventBusMetrics } from "@/system/event-bus/shsEventMetrics";
import { calculateEventBusReadiness } from "@/system/event-bus/shsEventReadiness";
import { getJobs } from "@/system/job-scheduler/shsJobQueue";
import { getJobHistory } from "@/system/job-scheduler/shsJobHistory";
import { calculateJobMetrics } from "@/system/job-scheduler/shsJobMetrics";
import { calculateJobReadiness } from "@/system/job-scheduler/shsJobReadiness";
import { getNotifications } from "@/system/notification-fabric/shsNotificationStorage";
import { calculateNotificationMetrics } from "@/system/notification-fabric/shsNotificationMetrics";
import { calculatePersistenceMetrics } from "@/system/persistence/persistenceMetrics";
import { calculateTrackingReadiness } from "@/system/tracking/shsTrackingReadiness";
import { TRACKING_EVENT_TYPES, TRACKING_SIGNAL_TYPES } from "@/system/tracking/shsTrackingTypes";
import { calculateRegistrySystemReadiness } from "@/system/system-registry/shsSystemRegistryReadiness";
import { calculateSystemRegistryMetrics } from "@/system/system-registry/shsSystemRegistryMetrics";
import { listLayers } from "@/system/system-registry/shsSystemDependencyGraph";
import { getShsOrchestratorTemplates } from "@/data/orchestrator/shsOrchestratorStorage";
import { calculateShsOrchestratorMetrics } from "@/data/orchestrator/shsOrchestratorMetrics";
import { EXECUTIVE_SOURCE_GROUPS, createLayerStatus } from "./shsExecutiveCommandCenterTypes";
import { getExecutiveNavigationTarget } from "./shsExecutiveCommandCenterNavigation";

function safeCall(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function layer(input) {
  return createLayerStatus({
    ...input,
    route: input.route || getExecutiveNavigationTarget(input.layer_id),
  });
}

function summaryFromReadiness(readiness = {}, fallbackScore = 82) {
  const blockers = readiness.blockers || [];
  const warnings = readiness.warnings || [];
  const score = readiness.score ?? readiness.readiness_score ?? fallbackScore;
  return { score, blockers, warnings };
}

export function getApprovedExecutiveSourceGroups() {
  return [...EXECUTIVE_SOURCE_GROUPS];
}

export function readExecutiveSourceSummaries() {
  const registryLayers = safeCall(() => listLayers(), []);
  const registryReadiness = safeCall(() => calculateRegistrySystemReadiness(registryLayers), { score: 80, ready: false, safety: { safe: true } });
  const registryMetrics = safeCall(() => calculateSystemRegistryMetrics(registryLayers), { total_layers: registryLayers.length });

  const commands = safeCall(() => getCommands(), []);
  const commandHistory = safeCall(() => getCommandHistory(), []);
  const commandMetrics = calculateCommandMetrics(commands);
  const commandReadiness = calculateCommandReadiness({ commands, safety: { safe: true } });

  const events = safeCall(() => getEventBusEvents(), []);
  const subscribers = safeCall(() => getEventBusSubscribers(), []);
  const eventMetrics = calculateEventBusMetrics(events, subscribers);
  const eventReadiness = calculateEventBusReadiness({ events, subscribers });

  const jobs = safeCall(() => getJobs(), []);
  const jobHistory = safeCall(() => getJobHistory(), []);
  const jobMetrics = calculateJobMetrics(jobs, jobHistory);
  const jobReadiness = calculateJobReadiness({ jobs, history: jobHistory });

  const notifications = safeCall(() => getNotifications(), []);
  const notificationMetrics = calculateNotificationMetrics(notifications);

  const persistenceMetrics = safeCall(() => calculatePersistenceMetrics(), { repository_count: 0, database_adapter_status: "unavailable" });
  const trackingReadiness = calculateTrackingReadiness({
    streams: TRACKING_EVENT_TYPES,
    signals: TRACKING_SIGNAL_TYPES,
    events: [],
    entityLinks: [],
    timeline: [],
  });
  const orchestratorTemplates = safeCall(() => getShsOrchestratorTemplates(), []);
  const orchestratorMetrics = calculateShsOrchestratorMetrics([], [], orchestratorTemplates);

  return [
    layer({
      layer_id: "system_registry",
      layer_name: "System Registry",
      category: "governance",
      readiness_score: registryReadiness.score,
      health_score: registryMetrics.average_health || registryReadiness.score,
      data_posture: "derived_local",
      open_items: registryReadiness.ready ? 0 : 1,
      blockers: registryReadiness.ready ? [] : ["registry_readiness_needs_review"],
      warnings: registryReadiness.safety?.issues?.slice?.(0, 3).map((issue) => issue.layer_id || issue.reason) || [],
      source_reference: "src/system/system-registry",
      metrics: registryMetrics,
    }),
    layer({
      layer_id: "system_orchestrator",
      layer_name: "System Orchestrator",
      category: "runtime",
      readiness_score: orchestratorTemplates.length ? 86 : 70,
      health_score: orchestratorTemplates.length ? 88 : 72,
      data_posture: orchestratorTemplates.length ? "derived_local" : "unavailable",
      open_items: orchestratorMetrics.blocked_count,
      warnings: ["request_and_plan_records_not_loaded_to_avoid_source_mutation"],
      source_reference: "src/data/orchestrator",
      metrics: orchestratorMetrics,
    }),
    layer({
      layer_id: "command_bus",
      layer_name: "Command Bus",
      category: "runtime",
      ...summaryFromReadiness(commandReadiness),
      readiness_score: commandReadiness.score,
      health_score: commandReadiness.score,
      data_posture: commands.length ? "persisted_local" : "unavailable",
      open_items: commandMetrics.queued_commands + commandMetrics.blocked_commands,
      source_reference: "src/system/command-bus",
      metrics: { ...commandMetrics, history_count: commandHistory.length },
    }),
    layer({
      layer_id: "event_bus",
      layer_name: "Event Bus / Message Fabric",
      category: "runtime",
      readiness_score: eventReadiness.score,
      health_score: eventReadiness.score,
      data_posture: events.length ? "persisted_local" : "sample",
      open_items: eventMetrics.blocked_events || 0,
      blockers: eventReadiness.blockers,
      warnings: eventReadiness.warnings,
      source_reference: "src/system/event-bus",
      metrics: { ...eventMetrics, channel_count: SHS_EVENT_CHANNELS.length },
    }),
    layer({
      layer_id: "job_scheduler",
      layer_name: "Job Scheduler",
      category: "runtime",
      readiness_score: jobReadiness.score,
      health_score: jobReadiness.score,
      data_posture: jobs.length ? "persisted_local" : "unavailable",
      open_items: jobMetrics.queued_count + jobMetrics.delayed_count + jobMetrics.blocked_count,
      blockers: jobReadiness.blockers,
      warnings: jobReadiness.warnings,
      source_reference: "src/system/job-scheduler",
      metrics: { ...jobMetrics, history_count: jobHistory.length },
    }),
    layer({
      layer_id: "notification_alert_fabric",
      layer_name: "Notification & Alert Fabric",
      category: "runtime",
      readiness_score: notificationMetrics.alert_type_count === 10 ? 88 : 70,
      health_score: notificationMetrics.blocked_count ? 76 : 88,
      data_posture: notifications.length ? "persisted_local" : "unavailable",
      open_items: notificationMetrics.inbox_count + notificationMetrics.queued_count + notificationMetrics.blocked_count,
      warnings: notifications.length ? [] : ["no_local_notifications_recorded"],
      source_reference: "src/system/notification-fabric",
      metrics: notificationMetrics,
    }),
    layer({
      layer_id: "tracking_intelligence",
      layer_name: "Tracking Intelligence",
      category: "intelligence",
      readiness_score: trackingReadiness.score,
      health_score: trackingReadiness.score,
      data_posture: "derived_local",
      open_items: trackingReadiness.warnings.length,
      blockers: trackingReadiness.blockers,
      warnings: trackingReadiness.warnings,
      source_reference: "src/system/tracking",
      metrics: { event_type_count: TRACKING_EVENT_TYPES.length, signal_type_count: TRACKING_SIGNAL_TYPES.length },
    }),
    layer({
      layer_id: "durable_persistence",
      layer_name: "Durable Persistence",
      category: "runtime",
      readiness_score: persistenceMetrics.repository_count ? 90 : 70,
      health_score: persistenceMetrics.local_adapter_enabled ? 90 : 70,
      data_posture: "live_local",
      warnings: persistenceMetrics.database_adapter_enabled ? [] : ["database_adapter_disabled_placeholder"],
      source_reference: "src/system/persistence",
      metrics: persistenceMetrics,
    }),
    layer({ layer_id: "agent_workbench", layer_name: "Agent Workbench", category: "agents", readiness_score: 82, health_score: 82, data_posture: "needs_review", open_items: 1, warnings: ["agent_task_counts_require_source_review"], source_reference: "src/pages/admin/agents" }),
    layer({ layer_id: "agent_workflow_engine", layer_name: "Agent Workflow Engine", category: "agents", readiness_score: 82, health_score: 82, data_posture: "derived_local", warnings: ["workflow_status_summarized_from_v1_docs"], source_reference: "docs/AGENT_WORKFLOW_ENGINE_V1.md" }),
    layer({ layer_id: "controlled_executor", layer_name: "Controlled Executor", category: "agents", readiness_score: 86, health_score: 86, data_posture: "derived_local", warnings: ["execution_remains_disabled_preview_only"], source_reference: "docs/AGENT_CONTROLLED_EXECUTOR_V1.md" }),
    layer({ layer_id: "production_automation", layer_name: "Production Automation", category: "operations", readiness_score: 84, health_score: 84, data_posture: "derived_local", warnings: ["local_planning_only_no_production_mutation"], source_reference: "docs/PRODUCTION_AUTOMATION_V2.md" }),
    layer({ layer_id: "direct_connect_proof", layer_name: "Direct Connect Direct-Source Proof", category: "integration", readiness_score: 88, health_score: 88, data_posture: "derived_local", warnings: ["direct_source_proof_only_no_live_external_integration"], source_reference: "docs/SHS_DIRECT_CONNECT_BATCH2_DIRECT_SOURCE_PROOF.md" }),
    layer({ layer_id: "shs_reports", layer_name: "SHS Reports", category: "reports", readiness_score: 84, health_score: 84, data_posture: "needs_review", open_items: 1, warnings: ["report_publication_requires_existing_approval_controls"], source_reference: "src/pages/admin/reports" }),
    layer({ layer_id: "governance_truth_oracle", layer_name: "Governance / Truth Spine / Oracle", category: "governance", readiness_score: 90, health_score: 90, data_posture: "derived_local", warnings: ["manual_governance_review_required_for_release_decisions"], source_reference: "docs/MANUAL_GOVERNANCE_REVIEWS_V1.md" }),
    layer({ layer_id: "client_operations_business_signals", layer_name: "Client Operations and Business Signals", category: "business", readiness_score: 78, health_score: 80, data_posture: "needs_review", open_items: 2, warnings: ["client_risk_and_revenue_signals_are_local_summary_only", "no_private_client_payloads_loaded"], source_reference: "hub/admin routes" }),
  ];
}
