// src/pages/Vocabulary.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function Vocabulary({ items: initialItems }) {
  // credit/events rail is optional-safe
  const { emit } =
    typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };

  // URL-synced controls
  const [params, setParams] = useSearchParams();
  const qParam = params.get("q") ?? "";
  const unitParam = params.get("unit") ?? "All";

  // data
  const [items, setItems] = React.useState(
    Array.isArray(initialItems) ? initialItems : null
  );
  const [loading, setLoading] = React.useState(!initialItems);
  const [error, setError] = React.useState(null);

  // analytics
  React.useEffect(() => {
    try {
      emit?.("vocab:view", { app: currentApp() });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch (dev/prod safe). If you already have an endpoint, point it here.
  React.useEffect(() => {
    if (items) return; // prop-supplied
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Try API first
        const res = await fetch("/api/vocab", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const list = Array.isArray(data?.items) ? data.items : [];
        if (!cancelled) setItems(list);
      } catch {
        // Graceful fallback: empty list + message
        if (!cancelled) {
          setItems([]);
          setError(
            "No vocabulary source found. Provide items prop or serve /api/vocab."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const units = React.useMemo(() => {
    const u = new Set((items || []).map((i) => i.unit).filter(Boolean));
    return ["All", ...Array.from(u)];
  }, [items]);

  const filtered = React.useMemo(() => {
    const term = qParam.trim().toLowerCase();
    return (items || []).filter((i) => {
      const inText =
        !term ||
        (i.term || "").toLowerCase().includes(term) ||
        (i.def || "").toLowerCase().includes(term);
      const inUnit = unitParam === "All" || i.unit === unitParam;
      return inText && inUnit;
    });
  }, [items, qParam, unitParam]);

  const setQ = (val) => {
    const next = new URLSearchParams(params);
    if (val) next.set("q", val);
    else next.delete("q");
    setParams(next, { replace: true });
    try {
      emit?.("vocab:search", { q: val, app: currentApp() });
    } catch {}
  };

  const setUnit = (val) => {
    const next = new URLSearchParams(params);
    if (val && val !== "All") next.set("unit", val);
    else next.delete("unit");
    setParams(next, { replace: true });
    try {
      emit?.("vocab:filter_unit", { unit: val, app: currentApp() });
    } catch {}
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header className="card card--pad" role="group" aria-label="Filters">
        <h1 style={{ margin: 0, fontSize: 22 }}>Vocabulary</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 200px",
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
            value={unitParam}
            onChange={(e) => setUnit(e.target.value)}
            aria-label="Filter by unit"
            style={{
              padding: 10,
              border: "1px solid var(--ring)",
              borderRadius: 10,
              background: "#fff",
            }}
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="card card--pad" aria-busy="true">
          Loading vocabulary…
        </div>
      ) : error ? (
        <div className="card card--pad" role="alert">
          {error}
        </div>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <strong style={{ fontSize: 16 }}>{i.term}</strong>
                {i.unit && (
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {i.unit}
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

function currentApp() {
  const { pathname } = window.location;
  if (pathname.includes("/sales")) return "sales";
  if (pathname.includes("/arcade")) return "arcade";
  if (pathname.includes("/debt")) return "debt";
  if (pathname.includes("/curriculum")) return "curriculum";
  return "career";
}
