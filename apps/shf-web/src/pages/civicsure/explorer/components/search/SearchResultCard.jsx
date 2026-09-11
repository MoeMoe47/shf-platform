// SearchResultCard.jsx — the shared result card pattern reused across
// all 8 result types. Renders entity type, title (optionally
// highlighting the matched query term with a semantic <mark>), a
// short plain-English description, 1-3 contextual metrics, a status
// (StatusBadge where the label maps to the suite's shared vocabulary,
// a plain .cse-pill for lifecycle labels like "Active"/"Final"), a
// short match-explanation line, and a real "View →" link where a
// demo detail route exists — an honest inert placeholder otherwise.
// Programs/Providers/Counties/Outcomes additionally get a compare
// checkbox, since those are the four types Compare View supports.
// DEMO / FRAME DATA (see ../../searchResultsMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { getResultTypeLabel, getStatusBadgeState, getMatchExplanation } from "../../searchResultsMockData.js";

const COMPARABLE_TYPES = new Set(["program", "provider", "county", "outcome"]);

const ACTION_LABELS = {
  program: "View Program",
  provider: "View Provider",
  county: "View County",
  funding: "Follow the Money",
  agency: "View Agency",
  outcome: "View Outcome",
  evidence: "View Evidence",
  report: "View Report",
};

function highlight(text, query) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function SearchResultCard({ result, query, isSelected, onToggleSelect }) {
  const badgeState = getStatusBadgeState(result.statusLabel);
  const explanation = getMatchExplanation(result, query);
  const isComparable = COMPARABLE_TYPES.has(result.type);

  const metaLine = [result.geography, result.category].filter(Boolean).join(" | ");

  return (
    <article className="cse-card cse-srch-card">
      <div className="cse-srch-card__head">
        <div>
          <p className="cse-srch-card__type">{getResultTypeLabel(result.type)}</p>
          <h3 className="cse-srch-card__title">{highlight(result.title, query)}</h3>
        </div>
        {isComparable ? (
          <label className="cse-srch-card__select">
            <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(result)} />
            Select to compare
          </label>
        ) : null}
      </div>

      <p className="cse-srch-card__meta">{metaLine}</p>
      <p className="cse-srch-card__description">{highlight(result.description, query)}</p>

      <div className="cse-srch-card__metrics">
        {result.meta.map((m) => (
          <div key={m.label}>
            <span className="cse-srch-card__metric-label">{m.label}</span>
            <span className="cse-srch-card__metric-value">{m.value}</span>
          </div>
        ))}
        <div>
          <span className="cse-srch-card__metric-label">Status</span>
          <span className="cse-srch-card__metric-value">
            {badgeState ? <StatusBadge state={badgeState} /> : <span className="cse-pill">{result.statusLabel}</span>}
          </span>
        </div>
      </div>

      {explanation ? <p className="cse-srch-card__explanation">{explanation}</p> : null}

      <div className="cse-srch-card__foot">
        {result.detailRoute ? (
          <a className="cse-srch-card__action" href={result.detailRoute}>
            {ACTION_LABELS[result.type]}
            <ExplorerIcon name="arrowRight" />
          </a>
        ) : result.type === "report" ? (
          <button
            type="button"
            className="cse-srch-card__action cse-srch-card__action--placeholder"
            aria-disabled="true"
            title="Demo — immutable report route not yet available"
          >
            View Report
          </button>
        ) : (
          <span className="cse-srch-card__action cse-srch-card__action--placeholder" aria-disabled="true" title="Coming soon">
            Not yet available
          </span>
        )}
      </div>
    </article>
  );
}
