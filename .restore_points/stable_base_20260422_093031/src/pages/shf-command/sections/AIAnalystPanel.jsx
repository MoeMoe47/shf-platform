import React from "react";
import { buildOracleAnalystView } from "./shf-oracle-analyst-adapter";
import { useSHFOracle } from "../hooks/useSHFOracle";

export default function AIAnalystPanel({
  entityId = null,
  oracleTruth = null,
  headerExtra = null,
  changedTitle = "What changed",
  changedText = "Franklin County moved into a stronger funding-readiness posture after outcome verification and reporting coverage improved.",
  whyTitle = "Why it matters",
  whyPoints = [
    "Readiness improved enough to support a stronger grant narrative.",
    "Operator attention can shift from verification drag to action execution.",
    "County-level momentum now supports faster program packaging."
  ],
  nextMoveTitle = "Next move",
  nextMoveText = "Prepare the county expansion brief, confirm outstanding field reports, and move the package into execution review.",
  actionLabel = "Execute recommended action",
  onAction = null,
}) {
  const { truth: hookTruth } = useSHFOracle(entityId || null);

  const effectiveTruth = hookTruth || oracleTruth || null;
  const oracleView = effectiveTruth ? buildOracleAnalystView(effectiveTruth) : null;

  const displayChangedText = oracleView?.changedText || changedText;
  const displayWhyPoints = oracleView?.whyPoints || whyPoints;
  const displayNextMoveText = oracleView?.nextMoveText || nextMoveText;
  const displayActionLabel = actionLabel;

  return (
    <section className="shf-panel shf-analyst-panel">
      <div className="shf-panel__header shf-analyst-panel__header">
        <div>
          <div className="shf-panel__small-label">AI ANALYST</div>
          <h2>Decision Engine</h2>
        </div>
        {headerExtra ? <div className="shf-analyst-panel__header-extra">{headerExtra}</div> : null}
      </div>

      <div className="shf-panel__body">
        <div className="shf-analyst-block shf-analyst-block--changed">
          <div className="shf-analyst-block__eyebrow">{changedTitle}</div>
          <p>{displayChangedText}</p>
        </div>

        <div className="shf-analyst-block shf-analyst-block--why">
          <div className="shf-analyst-block__eyebrow">{whyTitle}</div>
          <ul className="shf-analyst-list">
            {displayWhyPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="shf-analyst-block shf-analyst-block--next">
          <div className="shf-analyst-block__eyebrow">{nextMoveTitle}</div>
          <p>{displayNextMoveText}</p>
        </div>

        <div className="shf-analyst-execute">
          <button
            type="button"
            className="shf-analyst-execute__btn"
            onClick={() => onAction?.()}
          >
            {displayActionLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
