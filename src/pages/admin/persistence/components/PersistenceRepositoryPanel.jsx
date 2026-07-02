import React from "react";

export default function PersistenceRepositoryPanel({ repositories }) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Repository Layer</p>
        <h2>Feature Repositories</h2>
      </div>
      <div className="repo-list">
        {repositories.map((repository) => (
          <article key={repository.repository}>
            <div>
              <strong>{repository.label}</strong>
              <span>{repository.entity_type}</span>
            </div>
            <b>{repository.record_count}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

