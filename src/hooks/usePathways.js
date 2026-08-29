// src/hooks/usePathways.js
import { useEffect, useState } from "react";
import * as schema from "../utils/pathwaySchema.js"; // named + default supported
import { listCareers } from "../lib/career/api.js";
import { careerToPathway } from "../shared/career/careerAdapter.js";

export default function usePathways() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    listCareers()
      .then((careers) => {
        if (!alive) return;
        const normalized = careers.map((career) => toStandardShape(careerToPathway(career)));
        let parsed = normalized;

        if (typeof schema.validatePathways === "function") {
          parsed = schema.validatePathways(normalized);
        } else if (schema.pathwayArraySchema && typeof schema.pathwayArraySchema.safeParse === "function") {
          const result = schema.pathwayArraySchema.safeParse(normalized);
          parsed = result.success ? result.data : normalized;
        }

        setData(parsed);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        console.error("usePathways career API error:", e);
        setError(e);
        setData([]);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
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
