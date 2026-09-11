// FundingMoneyFlowPanel.jsx — the signature "Follow the Money"
// experience: Funding Source → Award → Program → Provider →
// Obligation → Delivery → Evidence → Outcome, each step a selectable
// node. Deliberately NOT a reuse of the small FollowTheMoneyCard —
// this page needs 8 selectable, data-driven nodes plus branching
// (one award funds multiple programs), which that static illustrative
// component was never built to support. No graph library: branching
// is represented as a simple list of program buttons beneath the
// Award node — selecting one swaps which Program/Provider/Obligation/
// Delivery/Evidence/Outcome chain the rest of the lineage shows,
// making clear this is one-to-many, not a false one-to-one flow.
// DEMO / FRAME DATA (see ../../fundingDetailMockData.js).
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import FundingFlowDetailPanel from "./FundingFlowDetailPanel.jsx";
import FundingReconciliationPanel from "./FundingReconciliationPanel.jsx";

const LEVELS = [
  { key: "source", kicker: "Funding Source" },
  { key: "award", kicker: "Award" },
  { key: "program", kicker: "Program" },
  { key: "provider", kicker: "Provider" },
  { key: "obligation", kicker: "Obligation" },
  { key: "delivery", kicker: "Delivery" },
  { key: "evidence", kicker: "Evidence" },
  { key: "outcome", kicker: "Outcome" },
];

function nodeForLevel(levelKey, moneyFlow, branch) {
  switch (levelKey) {
    case "source":
      return { title: moneyFlow.fundingSource.name, amount: moneyFlow.fundingSource.amount };
    case "award":
      return { title: moneyFlow.award.name, amount: moneyFlow.award.amount };
    case "program":
      return { title: branch.name, amount: branch.allocation };
    case "provider":
      return { title: branch.provider.name, amount: branch.provider.amount };
    case "obligation":
      return { title: branch.obligation.label, amount: null };
    case "delivery":
      return { title: branch.delivery.label, amount: null };
    case "evidence":
      return { title: branch.evidence.label, amount: null };
    case "outcome":
      return { title: branch.outcome.label, amount: null, tone: "green" };
    default:
      return { title: "", amount: null };
  }
}

function detailForLevel(levelKey, moneyFlow, branch) {
  switch (levelKey) {
    case "source":
      return moneyFlow.fundingSource.detail;
    case "award":
      return moneyFlow.award.detail;
    case "program":
      return branch.detail;
    case "provider":
      return branch.provider.detail;
    case "obligation":
      return branch.obligation.detail;
    case "delivery":
      return branch.delivery.detail;
    case "evidence":
      return branch.evidence.detail;
    case "outcome":
      return branch.outcome.detail;
    default:
      return null;
  }
}

function exploreForLevel(levelKey, branch) {
  if (levelKey === "program") {
    return branch.programId
      ? { href: `#/explorer/programs/${encodeURIComponent(branch.programId)}`, label: "Explore Program" }
      : { href: null, label: "Explore Program" };
  }
  if (levelKey === "provider") {
    return branch.provider.providerId
      ? { href: `#/explorer/providers/${encodeURIComponent(branch.provider.providerId)}`, label: "Explore Provider" }
      : { href: null, label: "Explore Provider" };
  }
  return { href: null, label: null };
}

export default function FundingMoneyFlowPanel({ funding }) {
  const { moneyFlow, reconciliation } = funding;
  const [selectedLevel, setSelectedLevel] = useState("source");
  const [selectedProgramKey, setSelectedProgramKey] = useState(moneyFlow.programs[0].key);

  const branch = moneyFlow.programs.find((p) => p.key === selectedProgramKey) || moneyFlow.programs[0];
  const levelIndex = LEVELS.findIndex((l) => l.key === selectedLevel);
  const detail = detailForLevel(selectedLevel, moneyFlow, branch);
  const explore = exploreForLevel(selectedLevel, branch);

  const handleSelectProgram = (programKey) => {
    setSelectedProgramKey(programKey);
    setSelectedLevel("program");
  };

  return (
    <div className="cse-fnd-panel" role="tabpanel" id="cse-fnd-tabpanel-money-flow" aria-labelledby="cse-fnd-tab-money-flow">
      <div className="cse-card cse-fnd-flow">
        <ol className="cse-fnd-flow__lineage" aria-label="Funding lineage — select a step to see details">
          {LEVELS.map((level, i) => {
            const node = nodeForLevel(level.key, moneyFlow, branch);
            const isSelected = level.key === selectedLevel;
            return (
              <React.Fragment key={level.key}>
                <li>
                  <button
                    type="button"
                    className={`cse-fnd-node${node.tone ? ` cse-fnd-node--${node.tone}` : ""}${isSelected ? " is-selected" : ""}`}
                    onClick={() => setSelectedLevel(level.key)}
                    aria-pressed={isSelected}
                  >
                    <span className="cse-fnd-node__kicker">{level.kicker}</span>
                    <span className="cse-fnd-node__title">{node.title}</span>
                    {node.amount ? <span className="cse-fnd-node__amount">{node.amount}</span> : null}
                  </button>
                </li>
                {i < LEVELS.length - 1 ? (
                  <li className="cse-fnd-flow__arrow" aria-hidden="true">
                    <ExplorerIcon name="arrowRight" />
                  </li>
                ) : null}
              </React.Fragment>
            );
          })}
        </ol>

        <div className="cse-fnd-flow__branches">
          <p>This award funds multiple programs — {moneyFlow.programsShownNote}</p>
          <div className="cse-fnd-flow__branch-list" role="group" aria-label="Programs funded by this award">
            {moneyFlow.programs.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`cse-fnd-branch-chip${p.key === selectedProgramKey ? " is-active" : ""}`}
                onClick={() => handleSelectProgram(p.key)}
                aria-pressed={p.key === selectedProgramKey}
              >
                <ExplorerIcon name="arrowRight" />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FundingFlowDetailPanel
        detail={detail}
        prevLabel={levelIndex > 0 ? LEVELS[levelIndex - 1].kicker : null}
        nextLabel={levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1].kicker : null}
        exploreHref={explore.href}
        exploreLabel={explore.label}
      />

      <FundingReconciliationPanel reconciliation={reconciliation} />
    </div>
  );
}
