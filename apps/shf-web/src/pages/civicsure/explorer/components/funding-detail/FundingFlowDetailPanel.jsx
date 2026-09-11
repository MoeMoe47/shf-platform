// FundingFlowDetailPanel.jsx — the panel shown beneath the Money Flow
// lineage when a node is selected: entity name, amount, source
// authority, reporting period, status, explanation, and — for
// Provider/Program nodes with a matching demo detail page — a real
// "Explore →" action. Also shows the node's neighbors in the chain
// (previous/next) as plain text, satisfying this page's requirement
// for a text equivalent to the flow arrows. DEMO / FRAME DATA (see
// ../../fundingDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function FundingFlowDetailPanel({ detail, prevLabel, nextLabel, exploreHref, exploreLabel }) {
  if (!detail) return null;

  return (
    <section className="cse-card cse-fnd-flow-detail" aria-live="polite" aria-label="Selected money flow step">
      <div className="cse-fnd-flow-detail__head">
        <h3>{detail.name}</h3>
        <StatusBadge state={detail.status} />
      </div>

      {detail.amount ? <p className="cse-fnd-flow-detail__amount">{detail.amount}</p> : null}

      <dl className="cse-fnd-flow-detail__facts">
        <div>
          <dt>Source authority</dt>
          <dd>{detail.sourceAuthority}</dd>
        </div>
        <div>
          <dt>Reporting period</dt>
          <dd>{detail.reportingPeriod}</dd>
        </div>
      </dl>

      <p className="cse-fnd-flow-detail__explanation">{detail.explanation}</p>

      <p className="cse-fnd-flow-detail__relationship">
        {prevLabel ? <span>← {prevLabel}</span> : null}
        {nextLabel ? <span>{nextLabel} →</span> : null}
      </p>

      {exploreHref ? (
        <a className="cse-btn cse-btn--outline" href={exploreHref}>
          {exploreLabel}
          <ExplorerIcon name="arrowRight" />
        </a>
      ) : exploreLabel ? (
        <span className="cse-fnd-flow-detail__placeholder" aria-disabled="true" title="Coming soon">
          {exploreLabel} — not yet available
        </span>
      ) : null}
    </section>
  );
}
