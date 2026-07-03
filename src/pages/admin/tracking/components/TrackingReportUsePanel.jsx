import React from "react";

export default function TrackingReportUsePanel({ streams, signals, metrics }) {
  const usefulForReports = streams.filter((stream) => stream.useful_for_reports).length;
  const usefulForUpsells = streams.filter((stream) => stream.useful_for_upsells).length;
  const usefulForRetention = streams.filter((stream) => stream.useful_for_retention).length;
  const usefulForGovernance = streams.filter((stream) => stream.useful_for_governance).length;

  return (
    <section className="tracking-panel">
      <div className="panel-heading"><p>Usefulness</p><h2>Report / Upsell / Retention / Governance Use</h2></div>
      <div className="tracking-metrics">
        <article><span>Report streams</span><strong>{usefulForReports}</strong></article>
        <article><span>Upsell streams</span><strong>{usefulForUpsells}</strong></article>
        <article><span>Retention streams</span><strong>{usefulForRetention}</strong></article>
        <article><span>Governance streams</span><strong>{usefulForGovernance}</strong></article>
      </div>
      <p>Report usage: {metrics.report_usage_count} · Upgrade signals: {metrics.upgrade_signal_count} · Governance attention: {metrics.governance_attention_count} · Local signals: {signals.length}</p>
    </section>
  );
}

