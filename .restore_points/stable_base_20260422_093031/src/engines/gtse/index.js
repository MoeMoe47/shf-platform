export function runGTSE(input) {
  const actions = input.candidate_actions || [];

  const results = actions.map((action) => {
    let score = 0;
    let risk = 0;

    if (action === "release_now") {
      score = (input.metrics?.success_rate || 0.8) - (input.costs?.release_risk_cost || 0.2);
      risk = 0.3;
    }

    if (action === "hold_for_verification") {
      score = (input.metrics?.funding_confidence || 0.75) * 1.2 - (input.costs?.delay_cost || 0.15);
      risk = 0.05;
    }

    if (action === "partial_release") {
      score = (input.metrics?.success_rate || 0.8) * 0.8;
      risk = 0.15;
    }

    if (action === "reassign_tasks") {
      score = 0.85;
      risk = 0.1;
    }

    return {
      action,
      score: score - (risk * 0.5),
      confidence: Math.min(1, input.metrics?.success_rate || 0.8),
      risk,
    };
  });

  const ranked = results.sort((a, b) => b.score - a.score);
  const best = ranked[0];

  return {
    recommended_action: best?.action,
    ranked_actions: ranked,
    confidence: best?.confidence || 0.75,
    explanation: "Best balance of outcome improvement and risk.",
  };
}
