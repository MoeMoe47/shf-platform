import React from "react";
import { Link } from "react-router-dom";

export default function PortfolioHint({
  note = "From here, save a Portfolio artifact.",
  label = "Save to Portfolio",
  onSave, // Optional → when provided, we show a button instead of a link
}) {
  return (
    <div
      className="mini-hint"
      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: 8 }}
    >
      <span className="sh-badge is-ghost">Tip</span>
      <span>{note}</span>
      {onSave ? (
        <button className="sh-btn is-ghost" onClick={onSave}>{label}</button>
      ) : (
        <Link className="sh-btn is-ghost" to="portfolio">Open Portfolio</Link>
      )}
    </div>
  );
}
