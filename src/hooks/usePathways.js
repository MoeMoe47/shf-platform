// src/hooks/usePathways.js
import { useEffect, useState } from "react";
import * as schema from "../utils/pathwaySchema.js"; // named + default supported
import raw from "../data/pathways.json";

export default function usePathways() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Accept [] | {pathways:[]} | {data:[]}
      const arr = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.pathways)
        ? raw.pathways
        : Array.isArray(raw?.data)
        ? raw.data
        : [];

      // ---- normalize both old & new shapes before any validation ----
      const normalized = arr.map(toStandardShape);

      let parsed = normalized;

      // Prefer helper if present
      if (typeof schema.validatePathways === "function") {
        parsed = schema.validatePathways(normalized);
      }
      // Or use the array schema
      else if (
        schema.pathwayArraySchema &&
        (typeof schema.pathwayArraySchema.parse === "function" ||
          typeof schema.pathwayArraySchema.safeParse === "function")
      ) {
        // Use safeParse when available to avoid nuking the whole list on one bad item
        const s = schema.pathwayArraySchema;
        if (typeof s.safeParse === "function") {
          const r = s.safeParse(normalized);
          parsed = r.success ? r.data : normalized; // fall back to normalized if schema fails
        } else {
          parsed = s.parse(normalized);
        }
      }
      // Or fall back to default export schema (parse one-by-one)
      else if (schema.default && (typeof schema.default.parse === "function" || typeof schema.default.safeParse === "function")) {
        parsed = normalized.map((p) => {
          const s = schema.default;
          if (typeof s.safeParse === "function") {
            const r = s.safeParse(p);
            return r.success ? r.data : p;
          }
          return s.parse(p);
        });
      }

      setData(parsed);
      setError(null);
    } catch (e) {
      console.error("usePathways parse error:", e);
      setError(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, clusters: groupClusters(data) };
}

/* ---------- helpers ---------- */

// Map legacy/new fields into a single, stable shape your UI expects
function toStandardShape(row = {}) {
  const out = { ...row };

  // sector → cluster (fallback)
  out.cluster = out.cluster || out.sector || "General";

  // durationWeeks → estWeeks
  if (out.estWeeks == null && out.durationWeeks != null) {
    const n = Number(out.durationWeeks);
    out.estWeeks = Number.isFinite(n) ? n : 0;
  }

  // tuitionUSD → estCost
  if (out.estCost == null && out.tuitionUSD != null) {
    const n = Number(out.tuitionUSD);
    out.estCost = Number.isFinite(n) ? n : 0;
  }

  // slug (from title/id) if missing
  if (!out.slug && (out.title || out.id)) {
    const base = String(out.title || out.id).toLowerCase().trim();
    out.slug = base.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // ensure jobsMeta exists to avoid undefined checks downstream
  if (!out.jobsMeta) out.jobsMeta = {};

  // ensure id exists (derive from slug when necessary)
  if (!out.id && out.slug) out.id = out.slug;

  return out;
}

function groupClusters(rows = []) {
  const map = new Map();
  for (const p of rows) {
    const key = p?.cluster || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return Array.from(map.entries()).map(([cluster, items]) => ({ cluster, items }));
}
