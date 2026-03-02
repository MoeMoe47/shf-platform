export function technicalSection(data) {
  return `
    <h2>Technical Report</h2>
    <p>This document provides methodology, data lineage, formulas, and sensitivity analysis.</p>

    <h2>Data Sources</h2>
    <ul>
      ${(data.sources || []).map(s => `<li>${s}</li>`).join("") || "<li>Sources pending</li>"}
    </ul>

    <h2>Methodology</h2>
    <div style="white-space:pre-wrap;">${data.methodologyText || "Methodology pending"}</div>

    <h2>Limitations</h2>
    <ul>
      <li>Public benchmark baselines may differ from local operational cohorts.</li>
      <li>Modeled projections are not deterministic guarantees.</li>
      <li>All assumptions are documented and version-controlled.</li>
    </ul>
  `;
}
