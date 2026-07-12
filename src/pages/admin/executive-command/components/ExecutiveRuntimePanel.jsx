import React from "react";

const RUNTIME_IDS = ["command_bus", "event_bus", "job_scheduler", "notification_alert_fabric", "system_orchestrator", "durable_persistence"];

export default function ExecutiveRuntimePanel({ layers }) {
  return (
    <section className="ecc-panel ecc-span-6">
      <div className="ecc-panel-heading"><p>Runtime Fabric</p><h2>Command, events, jobs, alerts, orchestration, persistence</h2></div>
      <div className="ecc-card-grid">
        {layers.filter((layer) => RUNTIME_IDS.includes(layer.layer_id)).map((layer) => (
          <article key={layer.layer_id}><strong>{layer.layer_name}</strong><span>{layer.status} - {layer.readiness_score}</span><small>{layer.data_posture}</small></article>
        ))}
      </div>
    </section>
  );
}
