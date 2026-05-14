import React from "react";
import { rollup } from "@/shared/ledger/ledgerClient.js";
import { exportEventsJSON, exportRollupJSON, exportCSV } from "@/utils/exports.js";

export default function Transparency(){
  const [summary, setSummary] = React.useState(rollup());
  const [json, setJson] = React.useState("");

  React.useEffect(() => {
    setSummary(rollup());
    setJson(exportRollupJSON());
  }, []);

  const download = (text, name, type="text/plain") => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pad">
      <h1>Open Ledger Transparency</h1>
      <p>Read-only summary of education value events across the SHF ecosystem.</p>

      <div className="cards">
        <div className="card">
          <h3>Total EVU</h3>
          <div className="big">{summary.total.toLocaleString()}</div>
        </div>
        <div className="card">
          <h3>Events</h3>
          <div className="big">{summary.count?.toLocaleString?.() ?? 0}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, display:"flex", gap:8, flexWrap:"wrap" }}>
        <button className="btn" onClick={() => download(exportEventsJSON(), "ledger-events.json", "application/json")}>Download Events (JSON)</button>
        <button className="btn" onClick={() => download(exportRollupJSON(), "ledger-rollup.json", "application/json")}>Download Rollup (JSON)</button>
        <button className="btn" onClick={() => download(exportCSV(), "ledger-events.csv", "text/csv")}>Download Events (CSV)</button>
      </div>

      <h3 style={{ marginTop: 24 }}>Rollup (JSON)</h3>
      <pre className="mono small">{json}</pre>
    </div>
  );
}
