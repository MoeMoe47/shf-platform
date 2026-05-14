export function money(value) {
  if (!value) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

export function average(values) {
  const clean = values.filter((value) => typeof value === "number");
  if (!clean.length) return 50;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function getPartnerById(partners, id) {
  return partners.find((partner) => partner.id === id);
}

export function getPartnerName(partners, id) {
  return getPartnerById(partners, id)?.name || id;
}

export function scoreBusinessRelationship(partnerA, partnerB) {
  const aIdeal = partnerA.idealMatches || [];
  const bIdeal = partnerB.idealMatches || [];

  const complementaryScore =
    (aIdeal.includes(partnerB.sector) ? 50 : 0) +
      (bIdeal.includes(partnerA.sector) ? 50 : 0) || 55;

  const sharedGeo = (partnerA.geography || []).some((geo) =>
    (partnerB.geography || []).includes(geo)
  )
    ? 100
    : 60;

  const trustScore = average([partnerA.trustScore, partnerB.trustScore]);
  const performanceScore = average([
    partnerA.completionRate,
    partnerB.completionRate,
    partnerA.responseSpeed,
    partnerB.responseSpeed,
  ]);

  const score = Math.round(
    complementaryScore * 0.32 +
      sharedGeo * 0.16 +
      trustScore * 0.24 +
      performanceScore * 0.28
  );

  return {
    score,
    crossSalePotential: Math.min(98, Math.round((score + complementaryScore) / 2)),
    riskLevel: score >= 85 ? "Low" : score >= 70 ? "Moderate" : "High",
  };
}

export function buildRelationshipMatches(partners, limit = 5) {
  const pairs = [];

  for (let i = 0; i < partners.length; i += 1) {
    for (let j = i + 1; j < partners.length; j += 1) {
      const partnerA = partners[i];
      const partnerB = partners[j];
      const scored = scoreBusinessRelationship(partnerA, partnerB);

      pairs.push({
        id: `${partnerA.id}_${partnerB.id}`,
        partnerA,
        partnerB,
        ...scored,
      });
    }
  }

  return pairs.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function scoreBundle(bundle, opportunity, partners) {
  const selectedPartners = bundle.partners
    .map((id) => getPartnerById(partners, id))
    .filter(Boolean);

  const allLanes = selectedPartners.flatMap((partner) => partner.serviceLanes || []);
  const covered = opportunity.neededLanes.filter((lane) => allLanes.includes(lane));
  const serviceCoverage = opportunity.neededLanes.length
    ? Math.round((covered.length / opportunity.neededLanes.length) * 100)
    : 50;

  const capacity = average(selectedPartners.map((partner) => partner.capacity));
  const response = average(selectedPartners.map((partner) => partner.responseSpeed));
  const completion = average(selectedPartners.map((partner) => partner.completionRate));
  const outcomes = average(selectedPartners.map((partner) => partner.verifiedOutcomeRate));
  const trust = average(selectedPartners.map((partner) => partner.trustScore));

  const ratio = bundle.estimatedPrice / opportunity.estimatedValue;
  const pricingCompetitiveness =
    ratio <= 0.75 ? 96 : ratio <= 0.9 ? 88 : ratio <= 1 ? 76 : ratio <= 1.15 ? 58 : 42;

  const deliveryReadiness = Math.round((capacity + response + completion) / 3);

  const fitScore = Math.round(
    serviceCoverage * 0.24 +
      capacity * 0.14 +
      response * 0.12 +
      completion * 0.14 +
      outcomes * 0.16 +
      trust * 0.1 +
      pricingCompetitiveness * 0.1
  );

  const riskScore = Math.round(
    (100 - serviceCoverage) * 0.3 +
      (100 - capacity) * 0.2 +
      (100 - response) * 0.18 +
      (100 - completion) * 0.18 +
      (100 - pricingCompetitiveness) * 0.14
  );

  return {
    fitScore,
    serviceCoverage,
    pricingCompetitiveness,
    deliveryReadiness,
    outcomeConfidence: Math.round(outcomes),
    successProbability: Math.round((fitScore + outcomes + pricingCompetitiveness) / 3),
    riskScore,
    riskLevel: riskScore > 70 ? "High" : riskScore > 45 ? "Moderate" : "Low",
  };
}

export function calculatePartnerFit(partner, opportunity) {
  const needed = opportunity.neededLanes || [];
  const lanes = partner.serviceLanes || [];
  const matches = needed.filter((lane) => lanes.includes(lane)).length;
  const serviceFit = needed.length ? Math.round((matches / needed.length) * 100) : 50;

  const geographyFit = (partner.geography || []).some((geo) =>
    geo.toLowerCase().includes(opportunity.geography.toLowerCase()) ||
    opportunity.geography.toLowerCase().includes(geo.toLowerCase())
  )
    ? 100
    : 62;

  const performance = average([
    partner.capacity,
    partner.responseSpeed,
    partner.completionRate,
    partner.verifiedOutcomeRate,
    partner.trustScore,
  ]);

  return Math.round(serviceFit * 0.44 + geographyFit * 0.16 + performance * 0.4);
}

export function getRecommendedPartners(partners, opportunity, minScore = 55, limit = 4) {
  return partners
    .map((partner) => ({
      ...partner,
      fitScore: calculatePartnerFit(partner, opportunity),
    }))
    .filter((partner) => partner.fitScore >= minScore)
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, limit);
}

export function getOpportunityScore(partners, opportunity) {
  const recommended = getRecommendedPartners(partners, opportunity);
  const coverage = opportunity.neededLanes.length
    ? Math.round(
        (opportunity.neededLanes.filter((lane) =>
          recommended.some((partner) => partner.serviceLanes.includes(lane))
        ).length /
          opportunity.neededLanes.length) *
          100
      )
    : 50;

  const urgencyBoost = opportunity.urgency === "High" ? 10 : opportunity.urgency === "Medium" ? 5 : 0;
  const valueBoost = Math.min(15, Math.round(opportunity.estimatedValue / 10000));
  const stagePenalty = opportunity.stage === "Closed / Lost" ? 35 : 0;

  return Math.max(0, Math.min(100, Math.round(coverage * 0.65 + urgencyBoost + valueBoost - stagePenalty)));
}

export function explainRelationship(match) {
  if (match.score >= 90) return "Strong relationship fit with high cross-sale and partnership potential.";
  if (match.score >= 75) return "Good relationship fit with useful partner alignment and low coordination friction.";
  if (match.score >= 60) return "Possible relationship fit. Review partner needs and capacity before introduction.";
  return "Weak match. Keep as a backup relationship.";
}

export function explainBundle(bundle, score) {
  const reasons = [];

  if (score.serviceCoverage >= 80) reasons.push("covers most required service lanes");
  if (score.pricingCompetitiveness >= 80) reasons.push("has a competitive estimated pricing position");
  if (score.deliveryReadiness >= 80) reasons.push("has strong delivery readiness");
  if (score.outcomeConfidence >= 80) reasons.push("has strong verified outcome potential");

  if (!reasons.length) {
    return `${bundle.name} needs operator review before it moves into proposal planning.`;
  }

  return `${bundle.name} is strong because it ${reasons.join(", ")} and includes the SHS reporting + verification layer.`;
}
