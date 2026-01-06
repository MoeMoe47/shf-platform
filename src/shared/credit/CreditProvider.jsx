import React from "react";
import { computeScoreFromEvents } from "@/utils/creditEngine.js";
import { Events, isEventKey, normalizeEvent } from "@/utils/eventSchema.js";

const LS_KEY = "shf:credit:events";

const CreditCtx = React.createContext({
  events: [],
  points: 0,
  score: 300,
  tier: { name: "Foundation", band: "D" },
  log: [],
  addEvent: (_ev) => {},
  completeTask: (_task) => {},
  clearLocal: () => {}
});

export function useCreditCtx() {
  return React.useContext(CreditCtx);
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveLocal(evts) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(evts.slice(-2000))); } catch {}
}

export default function CreditProvider({ children, userId=null }) {
  const [events, setEvents] = React.useState(loadLocal);
  const [derived, setDerived] = React.useState(() => computeScoreFromEvents(events));

  React.useEffect(() => {
    const d = computeScoreFromEvents(events);
    setDerived(d);
  }, [events]);

  React.useEffect(() => { saveLocal(events); }, [events]);

  async function postEvent(ev) {
    try {
      await fetch("/api/credit/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ev)
      }).catch(() => {});
    } catch {}
  }

  const addEvent = React.useCallback((ev) => {
    if (!ev || !isEventKey(ev.key)) return;
    const normalized = normalizeEvent({ ...ev, userId });
    setEvents((arr) => [...arr, normalized]);
    postEvent(normalized);
  }, [userId]);

  const completeTask = React.useCallback((task) => {
    const key = task?.event;
    if (!isEventKey(key)) return;
    const ts = Date.now();
    addEvent({ key, ts, meta: task?.params || {}, taskId: task?.id || null, source: "task" });
  }, [addEvent]);

  const clearLocal = React.useCallback(() => {
    setEvents([]);
    saveLocal([]);
  }, []);

  const value = React.useMemo(() => ({
    events,
    points: derived.points,
    score: derived.score,
    tier: derived.tier,
    log: derived.log,
    addEvent,
    completeTask,
    clearLocal,
    Events
  }), [events, derived, addEvent, completeTask, clearLocal]);

  // Legacy bridge: allow old code that calls window.shfCredit.earn(...)
  React.useEffect(() => {
    try {
      window.shfCredit = window.shfCredit || {};
      window.shfCredit.earn = (detail) => {
        try {
          // detail can include { action, rewards, scoreDelta, ... }
          // We pass everything through as meta; engine reads meta.scoreDelta
          addEvent({ key: "custom.earn", meta: detail || {} });
        } catch {}
      };
    } catch {}
  }, [addEvent]);

  return <CreditCtx.Provider value={value}>{children}</CreditCtx.Provider>;
}
