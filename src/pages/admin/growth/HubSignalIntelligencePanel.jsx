import React from "react";
import { ADAPTIVE_GROWTH_KEYS } from "@/system/adaptive-growth/growthSignalTypes.js";
import { mockHubGrowthSignals, scoreHubSignals } from "@/system/adaptive-growth/growthSignalScoring.js";
import { appendFeedbackEvent, readStorage, saveSignalScores, writeStorage } from "@/system/adaptive-growth/adaptiveGrowthStorage.js";

function money(value) {
  if (!value) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

function riskTone(score) {
  if (score >= 45) return "high";
  if (score >= 28) return "medium";
  return "low";
}

function getVisibleSignals(selectedLane, scoredSignals) {
  if (!selectedLane || selectedLane === "All Lanes") return scoredSignals;

  return scoredSignals.filter((score) =>
    score.recommendedLanes.some((lane) => lane.lane === selectedLane)
  );
}

export default function HubSignalIntelligencePanel({ selectedLane = "All Lanes" }) {
  const [signals] = React.useState(() => {
    const stored = readStorage(ADAPTIVE_GROWTH_KEYS.hubSignals, []);
    const seed = stored.length ? stored : mockHubGrowthSignals;
    if (!stored.length) writeStorage(ADAPTIVE_GROWTH_KEYS.hubSignals, seed);
    return seed;
  });

  const [scores, setScores] = React.useState(() => {
    const scored = scoreHubSignals(signals);
    saveSignalScores(scored);
    return scored;
  });

  const [selectedSignalId, setSelectedSignalId] = React.useState(scores[0]?.signalId || "");
  const [converted, setConverted] = React.useState(() => readStorage("shs_growth_converted_signals_v1", []));
  const [notice, setNotice] = React.useState("");

  React.useEffect(() => {
    const scored = scoreHubSignals(signals);
    setScores(scored);
    saveSignalScores(scored);
  }, [signals]);

  const visibleSignals = React.useMemo(
    () => getVisibleSignals(selectedLane, scores),
    [selectedLane, scores]
  );

  React.useEffect(() => {
    if (!visibleSignals.some((signal) => signal.signalId === selectedSignalId)) {
      setSelectedSignalId(visibleSignals[0]?.signalId || "");
    }
  }, [visibleSignals, selectedSignalId]);

  const selected = visibleSignals.find((signal) => signal.signalId === selectedSignalId) || visibleSignals[0];

  const convertToOpportunity = (score) => {
    if (!score) return;

    const opportunity = {
      id: `growth_from_${score.signalId}`,
      sourceSignalId: score.signalId,
      organizationName: score.sourcePartnerName,
      opportunityType: score.signalType,
      source: "Adaptive Growth Optimization Layer",
      serviceLanes: score.recommendedLanes.map((lane) => lane.lane),
      stage: "Service Fit",
      estimatedValue: score.estimatedValue,
      owner: "Growth Team",
      priority: score.priorityScore,
      conversionProbability: score.conversionProbability,
      frictionRisk: score.frictionRisk,
      nextStep: score.recommendedAction,
      notes: score.explanation,
      createdAt: new Date().toISOString(),
    };

    const nextConverted = [opportunity, ...converted.filter((item) => item.sourceSignalId !== score.signalId)].slice(0, 100);
    setConverted(nextConverted);
    writeStorage("shs_growth_converted_signals_v1", nextConverted);

    appendFeedbackEvent("growth.signal.converted_to_opportunity", {
      signalId: score.signalId,
      sourcePartnerName: score.sourcePartnerName,
      recommendedLanes: score.recommendedLanes,
      selectedLane: score.recommendedLanes[0]?.lane,
      metadata: {
        opportunityId: opportunity.id,
        estimatedValue: score.estimatedValue,
        conversionProbability: score.conversionProbability,
        frictionRisk: score.frictionRisk,
        recommendedAction: score.recommendedAction,
      },
    });

    try {
      window.dispatchEvent(new CustomEvent("shs:growth-signal-converted", {
        detail: {
          signalId: score.signalId,
          opportunityId: opportunity.id,
          sourcePartnerName: score.sourcePartnerName,
          recommendedLanes: score.recommendedLanes,
        },
      }));
      window.dispatchEvent(new CustomEvent("shs:growth-converted-opportunities-refresh"));
    } catch {
      // ignore dispatch failures
    }

    setNotice(`Converted ${score.sourcePartnerName} into a Growth opportunity.`);
    window.clearTimeout(window.__shsHubSignalNotice);
    window.__shsHubSignalNotice = window.setTimeout(() => setNotice(""), 2800);
  };

  const sendFeedback = (score, feedbackType) => {
    if (!score) return;

    appendFeedbackEvent(`growth.signal.feedback.${feedbackType}`, {
      signalId: score.signalId,
      sourcePartnerName: score.sourcePartnerName,
      recommendedLanes: score.recommendedLanes,
      selectedLane: score.recommendedLanes[0]?.lane,
      metadata: {
        feedbackType,
        priorityScore: score.priorityScore,
        conversionProbability: score.conversionProbability,
        frictionRisk: score.frictionRisk,
      },
    });

    setNotice(`Feedback recorded: ${feedbackType.replaceAll("_", " ")}.`);
    window.clearTimeout(window.__shsHubSignalNotice);
    window.__shsHubSignalNotice = window.setTimeout(() => setNotice(""), 2400);
  };

  if (!selected) {
    return (
      <section className="pg-panel pg-railPanel pg-hub-signal-panel">
        <div className="pg-panelHead">
          <div>
            <span className="pg-badge pg-badge--cyan">Hub Signal Intelligence</span>
            <h2>No signals</h2>
          </div>
        </div>
        <p className="pg-hub-empty">No Hub signals match the selected lane.</p>
      </section>
    );
  }

  return (
    <section className="pg-panel pg-railPanel pg-hub-signal-panel">
      <div className="pg-panelHead">
        <div>
          <span className="pg-badge pg-badge--cyan">Hub Signal Intelligence</span>
          <h2>Adaptive signal scoring</h2>
        </div>
        <span className="pg-countPill">{visibleSignals.length}</span>
      </div>

      <div className="pg-hub-signal-summary">
        <div>
          <span>Top Signal</span>
          <strong>{selected.sourcePartnerName}</strong>
        </div>
        <div>
          <span>Priority</span>
          <strong>{selected.priorityScore}</strong>
        </div>
        <div>
          <span>Conversion</span>
          <strong>{selected.conversionProbability}%</strong>
        </div>
        <div>
          <span>Friction</span>
          <strong className={`is-risk-${riskTone(selected.frictionRisk)}`}>{selected.frictionRisk}%</strong>
        </div>
      </div>

      <div className="pg-hub-signal-tabs">
        {visibleSignals.slice(0, 5).map((score) => (
          <button
            type="button"
            key={score.signalId}
            className={score.signalId === selected.signalId ? "is-active" : ""}
            onClick={() => {
              setSelectedSignalId(score.signalId);
              appendFeedbackEvent("growth.signal.reviewed", {
                signalId: score.signalId,
                sourcePartnerName: score.sourcePartnerName,
                recommendedLanes: score.recommendedLanes,
                selectedLane: score.recommendedLanes[0]?.lane,
                metadata: {
                  priorityScore: score.priorityScore,
                  conversionProbability: score.conversionProbability,
                  frictionRisk: score.frictionRisk,
                },
              });
            }}
          >
            <span>{score.sourcePartnerName}</span>
            <strong>{score.priorityScore}</strong>
          </button>
        ))}
      </div>

      <article className="pg-hub-signal-card">
        <div className="pg-hub-signal-card__head">
          <div>
            <h3>{selected.sourcePartnerName}</h3>
            <p>{selected.description}</p>
          </div>
          <em>{money(selected.estimatedValue)}</em>
        </div>

        <div className="pg-hub-lane-fit">
          {selected.recommendedLanes.map((lane) => (
            <span key={lane.lane}>
              {lane.lane}
              <strong>{lane.fit}%</strong>
            </span>
          ))}
        </div>

        <div className="pg-hub-recommendation">
          <strong>Recommended action</strong>
          <p>{selected.recommendedAction}</p>
        </div>

        <details className="pg-hub-why">
          <summary>Why this recommendation?</summary>
          <ul>
            {selected.explanation.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </details>

        <div className="pg-hub-actions">
          <button type="button" onClick={() => convertToOpportunity(selected)}>
            Convert to Opportunity
          </button>
          <button type="button" onClick={() => sendFeedback(selected, "accepted_recommendation")}>
            Mark Useful
          </button>
          <button type="button" onClick={() => sendFeedback(selected, "not_ready")}>
            Not Ready
          </button>
        </div>
      </article>

      {notice && <div className="pg-hub-signal-notice">{notice}</div>}
    </section>
  );
}
