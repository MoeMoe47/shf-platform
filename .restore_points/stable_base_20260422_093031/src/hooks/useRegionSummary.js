import { useEffect, useState } from "react";
import { fetchRegionSummary } from "@/utils/lordOutcomes/outcomesApi.js";

export function useRegionSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchRegionSummary();
        if (!cancelled) {
          setSummary(data);
        }
      } catch (err) {
        console.error("[useRegionSummary] error", err);
        if (!cancelled) setError("Failed to load region summary.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { summary, loading, error };
}
