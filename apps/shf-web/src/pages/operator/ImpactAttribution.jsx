import React, { useEffect, useMemo, useState } from "react";
import ErrorBanner from "../../components/ErrorBanner";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import { getImpactAttribution } from "../../services/impact-attribution-client";

const fieldStyle = { display: "block", width: "100%", minHeight: 36, marginTop: 4 };
const metrics = [
  ["truth.fact_count", "Truth Facts"],
  ["lesson_completion.count", "Lesson Completions"],
  ["project_accepted.count", "Accepted Projects"],
];
const scopes = [
  ["WHOLE_NETWORK", "Whole Network"],
  ["SHF_SUPPORTED_NETWORK", "SHF-Supported Network"],
  ["SHF_DIRECT", "Direct SHF"],
  ["ORGANIZATION", "Organization"],
];

export default function ImpactAttribution() {
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [filters, setFilters] = useState({
    metric_key: "truth.fact_count",
    scope: "WHOLE_NETWORK",
    from: "2026-01-01",
    until: "2027-01-01",
    organization_id: "org_shf_001",
  });

  const summary = useMemo(() => [
    ["Direct SHF", result?.directShf ?? 0],
    ["SHF-Supported Network", result?.supportedNetwork ?? 0],
    ["Whole Network", result?.wholeNetwork ?? 0],
    ["Producing Organizations", result?.producingOrganizations?.length ?? 0],
  ], [result]);

  async function load() {
    setError("");
    try {
      const response = await getImpactAttribution(filters);
      setResult(response.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div>
      <PageHeader title="Impact Attribution" subtitle="Direct SHF and SHF-Supported Network aggregation" />
      <ErrorBanner message={error} />

      <section aria-label="Impact Attribution Filters">
        <form onSubmit={(event) => { event.preventDefault(); load(); }} className="impact-filters" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(5, minmax(0, 1fr))", alignItems: "end" }}>
          <label>
            Metric
            <select aria-label="Metric" value={filters.metric_key} onChange={(event) => update("metric_key", event.target.value)} style={fieldStyle}>
              {metrics.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            Scope
            <select aria-label="Scope" value={filters.scope} onChange={(event) => update("scope", event.target.value)} style={fieldStyle}>
              {scopes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            From
            <input aria-label="From" type="date" value={filters.from} onChange={(event) => update("from", event.target.value)} style={fieldStyle} />
          </label>
          <label>
            Until
            <input aria-label="Until" type="date" value={filters.until} onChange={(event) => update("until", event.target.value)} style={fieldStyle} />
          </label>
          <button type="submit">Refresh</button>
        </form>
      </section>

      <section aria-label="Impact Attribution Summary" className="impact-summary" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginTop: 20 }}>
        {summary.map(([label, value]) => (
          <article key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 14, minWidth: 0 }}>
            <div style={{ fontSize: 13 }}>{label}</div>
            <strong style={{ fontSize: 28 }}>{value}</strong>
          </article>
        ))}
      </section>

      <section aria-label="Attribution Lineage" style={{ marginTop: 20, overflowX: "auto" }}>
        <h3>Attribution Lineage</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr>
              <th align="left">Producing Organization</th>
              <th align="left">Metric Contribution</th>
              <th align="left">Support Classification</th>
              <th align="left">Support Reason</th>
              <th align="left">Source</th>
              <th align="left">Period Date</th>
            </tr>
          </thead>
          <tbody>
            {(result?.items || []).map((item) => (
              <tr key={item.factId}>
                <td>{item.producerOrganizationId}</td>
                <td>{item.value}</td>
                <td><StatusChip value={item.supportClassification} /></td>
                <td>{item.supportReasons.length ? item.supportReasons.join(", ") : "Direct or independent"}</td>
                <td>{item.sourceType}</td>
                <td>{String(item.occurredAt).slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {result && !result.items.length ? <p>No attribution facts found for this scope.</p> : null}
      </section>

      <style>{`
        @media (max-width: 820px) {
          .impact-filters,
          .impact-summary { grid-template-columns: 1fr !important; }
          table { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
