import React from "react";
import { fetchCanonicalArcadeHistory } from "./canonicalArcadeHistoryClient.js";

export function useCanonicalArcadeHistory({ limit = 50 } = {}) {
  const [page, setPage] = React.useState({ items: [], hasMore: false, offset: 0, nextOffset: null });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const nextPage = await fetchCanonicalArcadeHistory({ limit, offset });
      setPage({ ...nextPage, offset });
    } catch {
      setError("Canonical Arcade history is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => { load(0); }, [load]);
  return { ...page, loading, error, load };
}
