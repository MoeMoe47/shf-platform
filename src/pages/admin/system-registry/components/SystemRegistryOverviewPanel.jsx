import React from "react";

export default function SystemRegistryOverviewPanel({ metrics, readiness }) {
  return (
    <section className="system-registry-panel overview">
      <div className="panel-heading"><p>Overview</p><h2>Architecture Intelligence</h2></div>
      <div className="metric-grid">
        <article><span>Total layers</span><strong>{metrics.total_layers}</strong></article>
        <article><span>Readiness score</span><strong>{readiness.score}</strong></article>
        <article><span>Validators</span><strong>{metrics.validators_declared}</strong></article>
        <article><span>Routes</span><strong>{metrics.routes_declared}</strong></article>
      </div>
    </section>
  );
}

