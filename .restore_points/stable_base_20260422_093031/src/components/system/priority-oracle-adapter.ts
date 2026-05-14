import { fetchOraclePriority } from "@/pages/admin/reporting/oracle-priority-adapter";

export async function loadPriorityOracleMap(entityIds = []) {
  const ids = Array.isArray(entityIds) ? entityIds.filter(Boolean) : [];
  if (!ids.length) return {};

  const data = await fetchOraclePriority(ids);

  const items =
    data?.items ||
    data?.queue ||
    data?.results ||
    [];

  const map = {};
  for (const item of items) {
    const entityId = item?.entityId || item?.entity_id;
    if (!entityId) continue;
    map[entityId] = item;
  }

  return map;
}

export function getOracleRecommendedAction(item, oraclePriorityMap = {}) {
  const oracleItem =
    oraclePriorityMap[item?.entityId] ||
    oraclePriorityMap[item?.entity_id] ||
    null;

  return (
    oracleItem?.recommended_action ||
    oracleItem?.recommendedNextAction ||
    null
  );
}
