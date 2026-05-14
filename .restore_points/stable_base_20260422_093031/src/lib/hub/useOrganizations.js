import { useEffect, useState } from "react";
import { fetchOrganizations } from "./api";

export default function useOrganizations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchOrganizations();
        if (!active) return;
        setItems(data?.items || []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load organizations.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { items, loading, error };
}
