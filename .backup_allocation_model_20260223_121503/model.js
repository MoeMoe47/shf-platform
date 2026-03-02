/**
 * SHF Allocation OS (Demo) — Franklin County, OH
 * Purpose: Executive-grade allocation simulation using transparent math.
 * Replace placeholder baselines with Ohio WIOA + Ohio DRC + BLS (Columbus) benchmarks.
 */

export const DEFAULTS = {
  totalFunding: 10_000_000,
  assumedParticipants: 500, // demo participant volume proxy

  programs: {
    A: {
      name: "Program A (Rapid Placement)",
      placementRate: 0.63,
      retention90Rate: 0.68,
      medianWageHourly: 18.4,
      recidivismDeltaWhenEmployed: 0.10, // proxy until Ohio DRC citation is plugged in
    },
    B: {
      name: "Program B (Cert + Recovery Integrated)",
      placementRate: 0.67,
      retention90Rate: 0.74,
      medianWageHourly: 19.6,
      recidivismDeltaWhenEmployed: 0.14, // proxy until Ohio DRC citation is plugged in
    },
  },
};

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const round = (n, d = 0) => {
  const p = 10 ** d;
  return Math.round(n * p) / p;
};

export function retainedPlacements(participants, placementRate, retention90Rate) {
  return participants * placementRate * retention90Rate;
}

export function costPerRetained(totalFunding, retained) {
  return retained > 0 ? totalFunding / retained : Infinity;
}

export function wageImpact12m(retained, wageHourly) {
  // Conservative: 40 hrs/week * 52 weeks
  return retained * wageHourly * 40 * 52;
}

export function recidivismReductionProxy(retained, deltaWhenEmployed) {
  // normalized proxy around 500 retained placements (demo-friendly)
  const normalized = clamp(retained / 500, 0, 2);
  return clamp(normalized * deltaWhenEmployed, 0, 0.30);
}

export function efficiencyScore(costPerRetainedPlacement, wageImpact, recidRed) {
  // Transparent scoring (0-100), tweak later once real baselines are in.
  const costScore = clamp(100 - (costPerRetainedPlacement / 200), 0, 100);
  const wageScore = clamp((wageImpact / 1_000_000) * 2, 0, 100);
  const riskScore = clamp(recidRed * 400, 0, 100);
  return clamp(0.45 * costScore + 0.35 * wageScore + 0.20 * riskScore, 0, 100);
}

/**
 * shiftPct: percent (0..0.50) moved from Program A -> Program B
 */
export function simulate(base = DEFAULTS, shiftPct = 0.10) {
  const pct = clamp(shiftPct, 0, 0.50);
  const { totalFunding, assumedParticipants, programs } = base;
  const A = programs.A;
  const B = programs.B;

  // Baseline: all participants in A (demo baseline)
  const baseRet = retainedPlacements(assumedParticipants, A.placementRate, A.retention90Rate);
  const baseCost = costPerRetained(totalFunding, baseRet);
  const baseWage = wageImpact12m(baseRet, A.medianWageHourly);
  const baseRecid = recidivismReductionProxy(baseRet, A.recidivismDeltaWhenEmployed);
  const baseEff = efficiencyScore(baseCost, baseWage, baseRecid);

  // Adjusted: participant split as proxy for funding split (demo)
  const pB = assumedParticipants * pct;
  const pA = assumedParticipants * (1 - pct);

  const retA = retainedPlacements(pA, A.placementRate, A.retention90Rate);
  const retB = retainedPlacements(pB, B.placementRate, B.retention90Rate);
  const adjRet = retA + retB;

  const adjCost = costPerRetained(totalFunding, adjRet);
  const adjWage = wageImpact12m(retA, A.medianWageHourly) + wageImpact12m(retB, B.medianWageHourly);

  const adjRecid = clamp(
    recidivismReductionProxy(retA, A.recidivismDeltaWhenEmployed) +
      recidivismReductionProxy(retB, B.recidivismDeltaWhenEmployed),
    0,
    0.30
  );

  const adjEff = efficiencyScore(adjCost, adjWage, adjRecid);

  return {
    pct,
    base: { retained: baseRet, costPerRetained: baseCost, wageImpact: baseWage, recidivismReduction: baseRecid, efficiency: baseEff },
    adjusted: { retained: adjRet, costPerRetained: adjCost, wageImpact: adjWage, recidivismReduction: adjRecid, efficiency: adjEff },
  };
}
