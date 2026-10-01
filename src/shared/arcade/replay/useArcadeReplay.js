import React from "react";
import { fetchArcadeResultReplay } from "./arcadeReplayClient.js";

export function useArcadeReplay(resultId) {
  const [replay, setReplay] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchArcadeResultReplay(resultId)
      .then((data) => { if (active) setReplay(data); })
      .catch((reason) => { if (active) setError(reason); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resultId]);

  return { replay, loading, error };
}
