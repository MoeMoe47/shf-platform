import React from "react";

export default function AlertCard({ title, message, recommendation }) {
  return (
    <article className="alert-card" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      <p>
        <strong>Recommended Action:</strong> {recommendation}
      </p>
    </article>
  );
}
