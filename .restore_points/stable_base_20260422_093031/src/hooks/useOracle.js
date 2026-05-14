import { useEffect, useState } from "react";

export default function useOracle(entityId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;

    setLoading(true);

    fetch(`http://localhost:8091/oracle/truth/${entityId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entityId]);

  return { data, loading };
}
