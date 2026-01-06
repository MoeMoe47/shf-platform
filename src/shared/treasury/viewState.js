// src/shared/treasury/viewState.js
import React from "react";
import { useSearchParams } from "react-router-dom";

/* ---------- helpers ---------- */
const parseNum = (v, fb = "") => {
  if (v === null || v === undefined || v === "") return fb;
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const clampDateOrder = (from, to) => {
  if (!from || !to) return { from, to };
  return from <= to ? { from, to } : { from: to, to: from };
};

function readFromParams(sp) {
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const preset = sp.get("preset") || "";
  const view = sp.get("view") || "";
  const text = sp.get("text") || "";
  const minAmt = parseNum(sp.get("minAmt"), "");
  const maxAmt = parseNum(sp.get("maxAmt"), "");
  const program = sp.get("program") || "";

  const ordered = clampDateOrder(from, to);
  return {
    period: { from: ordered.from, to: ordered.to, preset, view },
    filters: { text, minAmt, maxAmt, program },
  };
}

function writeToParams(sp, { period = {}, filters = {} }) {
  ["from","to","preset","view","text","minAmt","maxAmt","program"].forEach(k => sp.delete(k));
  if (period.from) sp.set("from", period.from);
  if (period.to) sp.set("to", period.to);
  if (period.preset) sp.set("preset", period.preset);
  if (period.view) sp.set("view", period.view);

  if (filters.text) sp.set("text", String(filters.text));
  if (filters.minAmt !== "" && filters.minAmt != null) sp.set("minAmt", String(filters.minAmt));
  if (filters.maxAmt !== "" && filters.maxAmt != null) sp.set("maxAmt", String(filters.maxAmt));
  if (filters.program) sp.set("program", String(filters.program));
  return sp;
}

/* ---------- context ---------- */
const Ctx = React.createContext(null);

export function TreasuryViewStateProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // decode once on mount
  const initial = React.useMemo(() => readFromParams(searchParams), []); // eslint-disable-line
  const [period, setPeriod]   = React.useState(initial.period);
  const [filters, setFilters] = React.useState(initial.filters);

  // validate & normalize (dates order, min/max amounts)
  React.useEffect(() => {
    const { from, to } = clampDateOrder(period.from, period.to);
    if (from !== period.from || to !== period.to) {
      setPeriod(p => ({ ...p, from, to }));
    }
    if (filters.minAmt !== "" && filters.maxAmt !== "" && Number(filters.minAmt) > Number(filters.maxAmt)) {
      setFilters(f => ({ ...f, minAmt: f.maxAmt, maxAmt: f.minAmt }));
    }
  }, [period.from, period.to, filters.minAmt, filters.maxAmt]); // eslint-disable-line

  // encode to URL (shareable) without pushing history
  React.useEffect(() => {
    const next = writeToParams(new URLSearchParams(searchParams), { period, filters });
    setSearchParams(next, { replace: true });
  }, [period, filters]); // eslint-disable-line

  // allow external apply (e.g., Saved Views)
  const getViewState   = React.useCallback(() => ({ period, filters }), [period, filters]);
  const applyViewState = React.useCallback((st) => {
    if (!st) return;
    if (st.period)  setPeriod(p => ({ ...p, ...st.period }));
    if (st.filters) setFilters(f => ({ ...f, ...st.filters }));
  }, []);

  const value = React.useMemo(() => ({
    period, setPeriod,
    filters, setFilters,
    getViewState, applyViewState,
  }), [period, filters, getViewState, applyViewState]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTreasuryViewState() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useTreasuryViewState must be used within TreasuryViewStateProvider");
  return ctx;
}
