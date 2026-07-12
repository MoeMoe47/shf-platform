import React from "react";

const BUSINESS_IDS = ["production_automation", "shs_reports", "client_operations_business_signals", "direct_connect_proof", "tracking_intelligence"];

export default function ExecutiveBusinessOperationsPanel({ layers, metrics }) {
  return (
    <section className="ecc-panel ecc-span-8">
      <div className="ecc-panel-heading"><p>Business Operations</p><h2>Sales, production, QA, ClientOps, reports, proof, revenue signals</h2></div>
      <div className="ecc-metrics-row">
        <article><span>Client risks</span><strong>{metrics.client_risks}</strong></article>
        <article><span>Revenue signals</span><strong>{metrics.revenue_signals}</strong></article>
        <article><span>Reports attention</span><strong>{metrics.reports_needing_attention}</strong></article>
      </div>
      <div className="ecc-card-grid">
        {layers.filter((layer) => BUSINESS_IDS.includes(layer.layer_id)).map((layer) => (
          <article key={layer.layer_id}><strong>{layer.layer_name}</strong><span>{layer.status} - {layer.data_posture}</span></article>
        ))}
      </div>
    </section>
  );
}
