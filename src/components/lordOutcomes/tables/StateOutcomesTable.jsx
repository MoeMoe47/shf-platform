import React from "react";

export default function StateOutcomesTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="shf-card">No state data available.</div>;
  }

  return (
    <section className="shf-card">
      <h2 className="shf-card-title">State Outcomes</h2>
      <div className="shf-table-wrapper">
        <table className="shf-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Participants</th>
              <th>Jobs Placed</th>
              <th>Avg Wage</th>
              <th>Credentials Awarded</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.state_code}>
                <td>{s.state_name}</td>
                <td>{s.participants}</td>
                <td>{s.jobs_placed}</td>
                <td>
                  {s.avg_wage != null ? `$${s.avg_wage.toFixed(2)}/hr` : "—"}
                </td>
                <td>{s.credentials_awarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
