// src/components/lordOutcomes/tables/FundingImpactTable.jsx
import React from "react";

export default function FundingImpactTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="lord-card">No funding data available.</div>;
  }

  return (
    <section className="lord-card">
      <div className="lord-card-title">Funding Impact (Mock)</div>
      <div className="lord-table-wrapper">
        <table className="lord-table">
          <thead>
            <tr>
              <th>Funding Stream</th>
              <th>Category</th>
              <th>States</th>
              <th>Participants Served</th>
              <th>Jobs Placed</th>
              <th>Credentials</th>
              <th>Est. Annualized Wages</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.category}</td>
                <td>{f.states.join(", ")}</td>
                <td>{f.participantsServed}</td>
                <td>{f.jobsPlaced}</td>
                <td>{f.credentials}</td>
                <td>${f.estAnnualizedWages.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
