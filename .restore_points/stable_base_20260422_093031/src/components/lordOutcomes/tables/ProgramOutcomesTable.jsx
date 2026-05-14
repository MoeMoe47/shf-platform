// src/components/lordOutcomes/tables/ProgramOutcomesTable.jsx
import React from "react";

export default function ProgramOutcomesTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="lord-card">No program data available.</div>;
  }

  return (
    <section className="lord-card">
      <div className="lord-card-title">Program Outcomes</div>
      <div className="lord-table-wrapper">
        <table className="lord-table">
          <thead>
            <tr>
              <th>Program</th>
              <th>Sector</th>
              <th>Participants</th>
              <th>Completions</th>
              <th>Jobs Placed</th>
              <th>Avg Wage</th>
              <th>Credentials</th>
              <th>States</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.sector}</td>
                <td>{p.participants}</td>
                <td>{p.completions}</td>
                <td>{p.jobsPlaced}</td>
                <td>${p.avgWage.toFixed(2)}/hr</td>
                <td>{p.credentials}</td>
                <td>{p.states.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
