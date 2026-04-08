import React from "react";

export default function CommandCenterReportActions({
  onGenerate,
  onOpenLatest,
}) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={onGenerate}>Generate Intelligence Brief</button>
      <button onClick={onOpenLatest}>Open Latest Brief</button>
    </div>
  );
}
