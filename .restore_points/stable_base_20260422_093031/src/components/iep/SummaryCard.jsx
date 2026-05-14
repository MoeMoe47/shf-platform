import React from "react";

export default function SummaryCard({ title, body }) {
  return (
    <article className="summary-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
