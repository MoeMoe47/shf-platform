import React from "react";

export default function DetailPanel({ title, children }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}
