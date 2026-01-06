// src/utils/civic/evaluateCivicDNA.js
// Pure function: ({ questions, axes, answers }) -> profile
// answers: { [questionId]: -2|-1|0|1|2 }

export function evaluateCivicDNA(model, answers = {}) {
  if (!model || !model.questions || !model.axes) {
    return { axes: [], totals: {}, confidence: 0, normalized: {} };
  }
  const { questions, axes, scale } = model;
  const byAxis = Object.fromEntries(axes.map(a => [a.id, { score: 0, weight: 0 }]));
  let answered = 0;

  for (const q of questions) {
    const raw = Number(answers[q.id]);
    if (Number.isFinite(raw)) {
      answered++;
      const v = clamp(raw, scale?.min ?? -2, scale?.max ?? 2);
      const w = q.weight ?? 1;
      const sign = q.invert ? -1 : 1;
      const contrib = sign * v * w;
      byAxis[q.axis].score += contrib;
      byAxis[q.axis].weight += w * (scale?.max ?? 2); // for normalization range
    }
  }

  // normalize to 0..1 (0 = strong "negative", 0.5 = neutral, 1 = strong "positive")
  const normalized = {};
  const totals = {};
  axes.forEach(a => {
    const span = byAxis[a.id].weight || 1;
    const norm = 0.5 + 0.5 * (byAxis[a.id].score / span); // map [-1..1] -> [0..1]
    normalized[a.id] = clamp(norm, 0, 1);
    totals[a.id] = byAxis[a.id].score;
  });

  // confidence = share of answered questions
  const confidence = questions.length ? answered / questions.length : 0;

  return {
    axes, totals, normalized, confidence,
    // simple “party space” suggestion inside SHF spectrum:
    placement: civicPlacement(normalized)
  };
}

function civicPlacement(n) {
  // Example 2D placement using fiscal vs social, others as modifiers
  const fiscal = (n.fiscal ?? 0.5) - 0.5;  // -0.5..+0.5
  const social = (n.social ?? 0.5) - 0.5;
  // Quadrant naming is SHF-internal, neutral/no-persuasion
  let quadrant = "Center";
  if (fiscal >= 0 && social >= 0) quadrant = "Prosperity & Liberty";
  else if (fiscal < 0 && social >= 0) quadrant = "Stewardship & Liberty";
  else if (fiscal < 0 && social < 0) quadrant = "Stewardship & Community";
  else if (fiscal >= 0 && social < 0) quadrant = "Prosperity & Community";
  return { fiscal, social, quadrant };
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
