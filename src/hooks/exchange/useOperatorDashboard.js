import { useCallback, useEffect, useState } from "react";

export default function useOperatorDashboard(loader) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(typeof loader === "function");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (typeof loader !== "function") return;
    setLoading(true);
    setError("");
    try {
      const res = await loader();
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load operator dashboard.");
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    if (typeof loader === "function") {
      refresh();
    }
  }, [refresh, loader]);

  return { data, loading, error, refresh };
}
