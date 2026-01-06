import React from "react";
import { useSearchParams } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";

/**
 * Career Vocabulary / Glossary
 * Route: /vocab (under Career app)
 *
 * - URL-synced filters (?q=...&category=...)
 * - Fetches from /api/career/vocab if no items prop is given
 * - Emits events to the shared credit/rewards rail
 * - Items: { term, def, category? }
 */
export default function CareerVocabulary({ items: initialItems }) {
  const { emit } =
    typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };

  const [params, setParams] = useSearchParams();
  const qParam = params.get("q") ?? "";
  const catParam = params.get("category") ?? "All";

  const [items, setItems] = React.useState(
    Array.isArray(initialItems) ? initialItems : null
  );
  const [loading, setLoading] = React.useState(!initialItems);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    try { emit?.("career:vocab:view", { app: "career" }); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (items) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/career/vocab", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const list = Array.isArray(data?.items) ? data.items : [];
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) {
          setItems([]);
          setError(
            "No career vocabulary source found. Provide items prop or serve /api/career/vocab."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = React.useMemo(() => {
    const s = new Set((items || []).map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [items]);

  const filtered = React.useMemo(() => {
    const term = qParam.trim().toLowerCase();
    return (items || []).filter((i) => {
      const inText =
        !term ||
        (i.term || "").toLowerCase().includes(term) ||
        (i.def || "").toLowerCase().includes(term);
      const inCat = catParam === "All" || i.category === catParam;
      return inText && inCat;
    });
  }, [items, qParam, catParam]);

  const setQ = (val) => {
    const next = new URLSearchParams(params);
    if (val) next.set("q", val); else next.delete("q");
    setParams(next, { replace: true });
    try { emit?.("career:vocab:search", { q: val, app: "career" }); } catch {}
  };

  const setCategory = (val) => {
    const next = new URLSearchParams(params);
    if (val && val !== "All") next.set("category", val); else next.delete("category");
    setParams(next, { replace: true });
    try { emit?.("career:vocab:filter_category", { category: val, app: "career" }); } catch {}
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header className="card card--pad" role="group" aria-label="Filters">
        <h1 style={{ margin: 0, fontSize: 22 }}>Career Vocabulary</h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px",
            gap: 10,
            marginTop: 12,
          }}
        >
          <input
            type="search"
            inputMode="search"
            className="sh-input"
            placeholder="Search term or definition…"
            value={qParam}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search vocabulary"
            style={{
              padding: 10,
              border: "1px solid var(--ring)",
              borderRadius: 10,
              background: "#fff",
            }}
          />
          <select
            className="sh-select"
            value={catParam}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            style={{
              padding: 10,
              border: "1px solid var(--ring)",
              borderRadius: 10,
              background: "#fff",
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="card card--pad" aria-busy="true">Loading vocabulary…</div>
      ) : error ? (
        <div className="card card--pad" role="alert">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="card card--pad">No matches.</div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 10,
          }}
        >
          {filtered.map((i, idx) => (
            <li key={idx} className="card card--pad">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong style={{ fontSize: 16 }}>{i.term}</strong>
                {i.category && (
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {i.category}
                  </span>
                )}
              </div>
              {i.def && <div style={{ marginTop: 6 }}>{i.def}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
