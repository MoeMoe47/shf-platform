import React from "react";
import { Link } from "react-router-dom";

export default function ShsReportTypeCard({ type, actionTo = "/ops/reports/create" }) {
  return (
    <article className="shs-report-type-card">
      <div>
        <span>{type.templateVersion}</span>
        <h3>{type.displayName}</h3>
        <p>{type.description}</p>
      </div>
      <dl>
        <div><dt>Source</dt><dd>{type.requiredDataSources[0] || "reporting-layer"}</dd></div>
        <div><dt>Lifecycle</dt><dd>{type.requiresAuditReview ? "Audit review" : type.requiresBrandReview ? "Brand review" : "Data review"}</dd></div>
        <div><dt>Readiness</dt><dd>{type.requiredDataSources.length} required sources</dd></div>
      </dl>
      <Link to={`${actionTo}?type=${encodeURIComponent(type.id)}`}>Create report</Link>
    </article>
  );
}
