// src/components/lordOutcomes/tables/EmployerOutcomesTable.jsx
import React from "react";

export default function EmployerOutcomesTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="lord-card">No employer data available.</div>;
  }

  return (
    <section className="lord-card">
      <div className="lord-card-title">Employer Impact</div>
      <div className="lord-table-wrapper">
        <table className="lord-table">
          <thead>
            <tr>
              <th>Employer</th>
              <th>State</th>
              <th>Industry</th>
              <th>Tier</th>
              <th>Hires</th>
              <th>90-Day Retention</th>
              <th>Avg Starting Wage</th>
              <th>Programs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.state}</td>
                <td>{e.industry}</td>
                <td>
                  <span className="lord-badge">{e.tier}</span>
                </td>
                <td>{e.hires}</td>
                <td>
                  {e.retention90Count} (
                  {e.hires
                    ? Math.round((e.retention90Count / e.hires) * 100)
                    : 0}
                  %)
                </td>
                <td>${e.avgStartingWage.toFixed(2)}/hr</td>
                <td>{e.programs.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
