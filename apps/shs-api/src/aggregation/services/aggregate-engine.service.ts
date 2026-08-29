import { resolveEntity } from "./entity-resolution.service.js";
import { runVerification } from "./verification.service.js";
import { runReconciliation } from "./reconciliation.service.js";
import { getAggregationOverview } from "./aggregation-overview.service.js";

export async function computeAggregateSnapshot(entityId: string) {
  const entity = await resolveEntity(entityId);
  const verification = await runVerification(entity);
  const reconciliation = await runReconciliation(entity);
  const aggregation = await getAggregationOverview(entity);

  return {
    entity,
    verification,
    reconciliation,
    aggregation,
  };
}

export async function runAggregateEngine(entityId: string) {
  return computeAggregateSnapshot(entityId);
}

export async function getAggregateSnapshot(entityId: string) {
  return computeAggregateSnapshot(entityId);
}
