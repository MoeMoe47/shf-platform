import React from "react";

export default function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h1 style={{ margin: 0 }}>{title}</h1>
      {subtitle ? <p style={{ margin: "6px 0 0" }}>{subtitle}</p> : null}
    </div>
  );
}
