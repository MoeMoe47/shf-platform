import { resolveTruth } from "./oracle.service";

function computePriorityScore(item: any) {
  let base = item.confidenceScore || 0;

  if (item.readinessStatus === "internally_ready") {
    base += 10;
  }

  if (item.readinessStatus === "leadership_ready") {
    base += 25;
  }

  if (item.latestOracleAction === "promote_case") {
    base += 25;
  }

  if (item.latestOracleAction === "hold_for_verification") {
    base -= 15;
  }

  return base;
}

export async function buildPriorityQueue(entityIds: string[]) {
  if (!entityIds || entityIds.length === 0) {
    return {
      total: 0,
      ranked: [],
      summary: "No priority data",
    };
  }

  const packages = await Promise.all(entityIds.map((id) => resolveTruth(id)));

  const ranked = packages
    .map((p) => ({
      entityId: p.entityId,
      readinessStatus: (p as any).readinessStatus,
      confidenceScore: p.confidenceScore,
      latestOracleAction: (p as any).latestOracleAction || null,
      priorityScore: computePriorityScore(p),
    }))
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

  const top = ranked[0];

  return {
    total: ranked.length,
    ranked,
    summary: top
      ? `Highest-priority case is ${top.entityId} with ${top.readinessStatus}, confidence ${top.confidenceScore}, and priority score ${top.priorityScore}.`
      : "No priority data",
  };
}

export async function getPriorityQueue(entityIds: string[]) {
  return buildPriorityQueue(entityIds);
}
