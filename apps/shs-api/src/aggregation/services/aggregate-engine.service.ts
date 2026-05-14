import { resolveEntity } from "./entity-resolution.service";
import { runVerification } from "./verification.service";
import { runReconciliation } from "./reconciliation.service";
import { getAggregationOverview } from "./aggregation-overview.service";

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
