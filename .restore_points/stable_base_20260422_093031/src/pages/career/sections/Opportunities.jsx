import React from "react";
export default function Opportunities({ items, onApply }) {
  return (
    <div className="card card--pad">
      <h3 style={{ marginTop: 0 }}>Opportunities Near Me</h3>
      <div className="table-wrap">
        <table className="sh-table">
          <thead><tr><th>Employer</th><th>Role</th><th>Wage</th><th>Location</th><th>Skills</th><th /></tr></thead>
          <tbody>
            {items.map(o => (
              <tr key={o.id}>
                <td>{o.employer}</td>
                <td>{o.role}{o.remote ? " (Remote)" : ""}</td>
                <td className="num">${o.wage}/hr</td>
                <td>{o.location}</td>
                <td className="db-subtitle">{o.skills.join(", ")}</td>
                <td><button className="btn" onClick={() => onApply?.(o)}>Apply</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
