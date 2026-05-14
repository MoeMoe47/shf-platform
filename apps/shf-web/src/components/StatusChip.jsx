import React from "react";

export default function StatusChip({ value }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 10px",
      border: "1px solid #ccc",
      borderRadius: "999px",
      fontSize: "12px"
    }}>
      {value}
    </span>
  );
}
