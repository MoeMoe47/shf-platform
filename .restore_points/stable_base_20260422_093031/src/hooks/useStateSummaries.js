import { useEffect, useState } from "react";
import { fetchStateSummaries } from "@/utils/lordOutcomes/outcomesApi.js";

export function useStateSummaries() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const rows = await fetchStateSummaries();
        if (!cancelled) {
          setStates(rows);
        }
      } catch (err) {
        console.error("[useStateSummaries] error", err);
        if (!cancelled) setError("Failed to load state outcomes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { states, loading, error };
}
