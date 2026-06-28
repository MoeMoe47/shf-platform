import React from "react";
import { PRODUCTION_AUTOMATION_V2_SAFETY_COPY } from "@/data/agents/productionAutomationV2Safety";

const FLAGS = [
  ["execution_enabled_v2", "execution_enabled_v2"],
  ["Production Mutation", "production_action_executed"],
  ["Report Published", "report_published"],
  ["Public Data", "public_data_mutated"],
  ["public_approved", "public_approved_mutated"],
  ["SHF Impact Data", "shf_impact_data_mutated"],
  ["External Message", "external_message_sent"],
  ["Webhook", "webhook_sent"],
  ["Notification", "notification_sent"],
  ["Warehouse Write", "warehouse_write_performed"],
  ["Auth Modified", "auth_modified"],
];

export default function ProductionAutomationSafetyPanel({ run, metrics }) {
  return (
    <section className="agent-workbench-panel production-automation-safety" aria-label="Production Automation V2 Safety Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Automation Safety</span>
          <strong>{run?.blockers?.length ? "Blocked" : "Local only"}</strong>
        </div>
      </div>
      <div className="agent-workbench-safe-stub__body">
        <p className="agent-workbench-safety-note">{PRODUCTION_AUTOMATION_V2_SAFETY_COPY}</p>
        <div className="agent-workbench-metrics">
          <article><span>Blocked Runs</span><strong>{metrics.blocked_runs}</strong></article>
          <article><span>Completed</span><strong>{metrics.completed_runs}</strong></article>
          <article><span>Avg Readiness</span><strong>{metrics.average_readiness_score}%</strong></article>
          <article><span>Flag Violations</span><strong>{metrics.dangerous_flag_violations}</strong></article>
        </div>
        <div className="agent-workbench-flag-grid">
          {FLAGS.map(([label, key]) => (
            <div key={key}>
              <span>{label}</span>
              <strong>{String(run?.[key] ?? false)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
