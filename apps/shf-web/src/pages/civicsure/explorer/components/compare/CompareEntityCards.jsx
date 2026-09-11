// CompareEntityCards.jsx — side-by-side identity cards for the
// selected entities. Real "View →" link where a matching demo detail
// route exists; an honest inert placeholder otherwise — same
// real-vs-placeholder convention as every other page in this suite.
// No composite score, no ranking treatment. DEMO / FRAME DATA (see
// ../../compareViewMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function CompareEntityCards({ entities }) {
  return (
    <div className={`cse-cmp-entity-cards cse-cmp-entity-cards--${entities.length}`} role="list" aria-label="Selected comparison items">
      {entities.map((entity) => (
        <article className="cse-card cse-cmp-entity-card" role="listitem" key={entity.id}>
          <p className="cse-cmp-entity-card__type">{entity.entityTypeLabel}</p>
          <h3 className="cse-cmp-entity-card__name">{entity.name}</h3>
          <dl className="cse-cmp-entity-card__grid">
            <div>
              <dt>Category</dt>
              <dd>{entity.category}</dd>
            </div>
            <div>
              <dt>Geography</dt>
              <dd>{entity.geography}</dd>
            </div>
            <div>
              <dt>Organization</dt>
              <dd>{entity.organization}</dd>
            </div>
            <div>
              <dt>Funding</dt>
              <dd>{entity.totalFunding}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge state={entity.activeStatus} />
              </dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>{entity.evidenceCoveragePercent}%</dd>
            </div>
          </dl>
          {entity.detailRoute ? (
            <a className="cse-cmp-entity-card__action" href={entity.detailRoute}>
              View {entity.entityTypeLabel}
              <ExplorerIcon name="arrowRight" />
            </a>
          ) : (
            <span className="cse-cmp-entity-card__action cse-cmp-entity-card__action--placeholder" aria-disabled="true" title="Coming soon">
              Not yet available
            </span>
          )}
        </article>
      ))}
    </div>
  );
}
