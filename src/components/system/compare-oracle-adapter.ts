import { fetchOracleCompare } from "@/pages/admin/reporting/oracle-compare-adapter";

export async function loadCompareOracleData(entityIds = []) {
  const ids = Array.isArray(entityIds) ? entityIds.filter(Boolean) : [];
  if (!ids.length) return null;
  return fetchOracleCompare(ids);
}

export function getCompareItems(compareData) {
  if (!compareData) return [];
  return (
    compareData?.items ||
    compareData?.results ||
    compareData?.comparisons ||
    compareData?.data ||
    []
  );
}
