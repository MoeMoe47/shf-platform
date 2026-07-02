import React from "react";
import { SHS_ORCHESTRATOR_SAFETY_COPY } from "@/data/orchestrator/shsOrchestratorSafety";

const FLAGS = [
  ["Execution", "execution_enabled"],
  ["Production Mutation", "production_mutation_enabled"],
  ["Public Publish", "public_publish_enabled"],
  ["Public Approved Mutation", "public_approved_mutation_enabled"],
  ["SHF Impact Mutation", "shf_impact_data_mutation_enabled"],
  ["External Delivery", "external_delivery_enabled"],
  ["Warehouse Write", "warehouse_write_enabled"],
  ["Auth Mutation", "auth_mutation_enabled"],
];

export default function OrchestratorSafetyPanel({ plan }) {
  return (
    <section className="orch-card">
      <div className="orch-section-head">
        <div>
          <span>Safety</span>
          <h2>Dangerous Flags</h2>
        </div>
      </div>
      <p className="orch-boundary-copy">{SHS_ORCHESTRATOR_SAFETY_COPY}</p>
      <div className="orch-flag-grid">
        {FLAGS.map(([label, key]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{String(plan?.[key] ?? false)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
