import { useEffect, useState } from "react";

const ORACLE_BASE = "http://127.0.0.1:8091";

export function useSHFOracle(entityId) {
  const [truth, setTruth] = useState(null);
  const [priority, setPriority] = useState(null);
  const [compare, setCompare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!entityId) return;

    let cancelled = false;

    async function loadOracle() {
      try {
        setLoading(true);

        const [truthRes, priorityRes, compareRes] = await Promise.allSettled([
          fetch(`${ORACLE_BASE}/oracle/truth/${entityId}`),
          fetch(`${ORACLE_BASE}/oracle/priority?ids=${entityId}`),
          fetch(`${ORACLE_BASE}/oracle/compare?ids=${entityId}`)
        ]);

        async function read(res) {
          if (res.status !== "fulfilled") return null;
          if (!res.value.ok) return null;
          try {
            return await res.value.json();
          } catch {
            return null;
          }
        }

        const nextTruth = await read(truthRes);
        const nextPriority = await read(priorityRes);
        const nextCompare = await read(compareRes);

        if (!cancelled) {
          setTruth(nextTruth);
          setPriority(nextPriority);
          setCompare(nextCompare);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Oracle load failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOracle();

    return () => {
      cancelled = true;
    };
  }, [entityId]);

  return {
    truth,
    priority,
    compare,
    loading,
    error
  };
}
