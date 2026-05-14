import { resolveTruth } from "./oracle.service";

export async function compareTruthPackages(entityIds: string[]) {
  if (!entityIds || entityIds.length === 0) {
    return {
      comparedEntityIds: [],
      ranked: [],
      strongest: null,
      weakest: null,
      summary: "No entities to compare",
    };
  }

  const packages = await Promise.all(entityIds.map((id) => resolveTruth(id)));

  const ranked = packages
    .map((p) => ({
      entityId: p.entityId,
      readinessStatus: (p as any).readinessStatus,
      confidenceScore: p.confidenceScore,
      confidenceBand: p.confidenceBand,
      contradictionStatus: p.contradictionStatus,
      latestOracleAction: (p as any).latestOracleAction || null,
    }))
    .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));

  const strongest = ranked[0] || null;
  const weakest = ranked[ranked.length - 1] || null;

  return {
    comparedEntityIds: entityIds,
    ranked,
    strongest,
    weakest,
    summary: strongest
      ? `Strongest case is ${strongest.entityId} with ${strongest.readinessStatus}, confidence ${strongest.confidenceScore}.`
      : "No comparison available",
  };
}

export async function compareEntities(entityIds: string[]) {
  return compareTruthPackages(entityIds);
}
