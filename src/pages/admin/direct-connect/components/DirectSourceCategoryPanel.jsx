import React from "react";

export default function DirectSourceCategoryPanel({ approved = [], deferred = [] }) {
  return (
    <section className="dc-proof-card" aria-label="Direct-source categories">
      <div className="dc-section-head">
        <span>Source Categories</span>
        <strong>{approved.length} approved / {deferred.length} deferred</strong>
      </div>
      <div className="dc-category-columns">
        <div>
          <h3>Approved Local Categories</h3>
          {approved.map((category) => (
            <article key={category.category_id}>
              <strong>{category.label}</strong>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
        <div>
          <h3>Deferred / Not Enabled</h3>
          {deferred.map((category) => (
            <article key={category.category_id}>
              <strong>{category.category_id}</strong>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
