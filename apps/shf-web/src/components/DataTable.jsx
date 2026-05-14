import React from "react";

export default function DataTable({ columns = [], rows = [] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id || row.case_id || row.program_id || idx}>
            {columns.map((col) => (
              <td key={col.key} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
