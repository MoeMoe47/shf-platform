import React from "react";
import { getActivityLeaderboard, listLeaderboardActivities } from "./arcadeLeaderboardClient.js";

export function useArcadeLeaderboard({ limit = 50 } = {}) {
  const [activities, setActivities] = React.useState([]);
  const [activityId, setActivityId] = React.useState("");
  const [page, setPage] = React.useState({ items: [], hasMore: false, offset: 0, nextOffset: null });
  const [loadingActivities, setLoadingActivities] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const requestVersion = React.useRef(0);

  React.useEffect(() => {
    let current = true;
    listLeaderboardActivities().then((items) => {
      if (!current) return;
      setActivities(items);
      setActivityId((selected) => selected || items[0]?.id || "");
    }).catch((cause) => {
      if (current) setError(cause);
    }).finally(() => {
      if (current) setLoadingActivities(false);
    });
    return () => { current = false; };
  }, []);

  const load = React.useCallback(async (offset = 0) => {
    const version = ++requestVersion.current;
    if (!activityId) {
      setPage({ items: [], hasMore: false, offset: 0, nextOffset: null });
      return;
    }
    setLoading(true);
    setError(null);
    setPage({ items: [], hasMore: false, offset, nextOffset: null });
    try {
      const data = await getActivityLeaderboard(activityId, { limit, offset });
      if (version === requestVersion.current) setPage({ ...data, offset });
    } catch (cause) {
      if (version === requestVersion.current) {
        setError(cause);
        setPage({ items: [], hasMore: false, offset, nextOffset: null });
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [activityId, limit]);

  React.useEffect(() => { load(0); }, [load]);
  return { activities, activityId, setActivityId, ...page, loadingActivities, loading, error, load };
}
