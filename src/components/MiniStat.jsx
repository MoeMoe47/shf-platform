import React from "react";
export default function MiniStat({ label, value }) {
  return (
    <div className="sh-miniStat">
      <div className="sh-metaLabel">{label}</div>
      <div className="sh-metaValue">{value}</div>
      <style>{`.sh-miniStat{background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px}`}</style>
    </div>
  );
}
