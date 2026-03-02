export function executiveSection(data) {
  const m = data.metrics || {};
  return `
    <h2>Executive Summary</h2>
    <p>${data.executiveSummary || "Summary pending baseline ingestion."}</p>

    <h2>Baseline Metrics</h2>
    <table>
      <tr><th>Indicator</th><th>Value</th><th>Source</th></tr>
      <tr><td>Employment Q2</td><td>${m.employment_q2 ?? "—"}</td><td>${m.wioa_source ?? "—"}</td></tr>
      <tr><td>Employment Q4</td><td>${m.employment_q4 ?? "—"}</td><td>${m.wioa_source ?? "—"}</td></tr>
      <tr><td>Median Earnings (Q2)</td><td>${m.median_earnings_q2 ?? "—"}</td><td>${m.wioa_source ?? "—"}</td></tr>
      <tr><td>Credential Attainment</td><td>${m.credential_rate ?? "—"}</td><td>${m.wioa_source ?? "—"}</td></tr>
      <tr><td>Participants Served</td><td>${m.participants_served ?? "—"}</td><td>${m.wioa_source ?? "—"}</td></tr>
    </table>

    <h2>Allocation Simulation</h2>
    <p class="subtle">Simulation results appear here once model outputs are wired into report data.</p>
  `;
}
