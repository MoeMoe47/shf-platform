import React from "react";

export default function AgentMemorySafetyPanel({ memory, safety, metrics }) {
  return (
    <section className="agent-workbench-panel agent-memory-safety" aria-label="Agent Memory Safety Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Memory Safety</span>
          <strong>{safety?.blocked_items?.length ? "Review required" : "Internal safe"}</strong>
        </div>
      </div>
      <div className="agent-workbench-safe-stub__body">
        <p className="agent-workbench-safety-note">
          Memory records are SHS internal by default. V1 never marks memory public-approved, never publishes to SHF public surfaces, and never mutates SHF Impact Data Spine.
        </p>
        <div className="agent-workbench-flag-grid">
          <div><span>safe_for_public</span><strong>{String(memory?.safe_for_public ?? false)}</strong></div>
          <div><span>public_approved</span><strong>{String(memory?.public_approved ?? false)}</strong></div>
          <div><span>SHF Mutation</span><strong>{String(memory?.shf_impact_data_mutated ?? false)}</strong></div>
          <div><span>Production Action</span><strong>{String(memory?.production_action_executed ?? false)}</strong></div>
          <div><span>Contains PII</span><strong>{String(memory?.contains_pii ?? false)}</strong></div>
          <div><span>Contains Secret</span><strong>{String(memory?.contains_secret ?? false)}</strong></div>
        </div>
        <div className="agent-workbench-kv-grid">
          <div><span>Public Safe Records</span><strong>{metrics.safe_for_public_count}</strong></div>
          <div><span>Public Approved</span><strong>{metrics.public_approved_count}</strong></div>
          <div><span>SHF Mutations</span><strong>{metrics.shf_mutation_count}</strong></div>
          <div><span>Prod Executions</span><strong>{metrics.production_execution_count}</strong></div>
        </div>
      </div>
    </section>
  );
}
