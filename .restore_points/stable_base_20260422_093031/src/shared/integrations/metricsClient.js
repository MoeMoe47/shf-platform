const KEY = "shf:metrics:v1";

function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"{}"); }catch{ return {} } }
function save(obj){ localStorage.setItem(KEY, JSON.stringify(obj)); }

function pushEvent(m, name, data={}){
  m._events = m._events || [];
  m._events.push({
    name,
    provider: (data.provider || "").toLowerCase(),
    ts: Date.now()
  });
  // keep last 2k events to be safe
  if (m._events.length > 2000) m._events.splice(0, m._events.length - 2000);
}

export function bump(name, data = {}) {
  const m = load();

  // global counters
  m[name] = (m[name] || 0) + 1;

  // provider splits
  const p = (data.provider || "").toLowerCase();
  if (name === "apply" && p){
    m.apply_by = m.apply_by || {};
    m.apply_by[p] = (m.apply_by[p] || 0) + 1;
  }
  if (name === "click" && p){
    m.click_by = m.click_by || {};
    m.click_by[p] = (m.click_by[p] || 0) + 1;
  }

  // event history
  pushEvent(m, name, data);

  m._last = { name, at: Date.now(), ...data };
  save(m);
  return m[name];
}

export function getAll(){ return load(); }
export function reset(){ localStorage.removeItem(KEY); }

/** Rollup last N days for applies/clicks per provider + daily buckets */
export function getWindowSummary(days = 7){
  const m = load();
  const events = (m._events || []).slice();
  const now = Date.now(), MS = 86400000;
  const cutoff = now - days*MS;

  const provs = ["indeed","linkedin","zip"];
  const by = Object.fromEntries(provs.map(k => [k, { applies:0, clicks:0 }]));
  let totalApplies = 0, totalClicks = 0;

  // per-day buckets oldest→newest
  const buckets = Array.from({length:days}, (_,i)=>({
    day: new Date(now - (days-1-i)*MS), applies:0, clicks:0
  }));

  for (const e of events){
    if (e.ts < cutoff) continue;
    const idx = Math.min(days-1, Math.max(0, Math.floor((e.ts - cutoff)/MS)));
    if (e.name === "apply"){
      totalApplies++;
      buckets[idx].applies++;
      if (by[e.provider]) by[e.provider].applies++;
    }
    if (e.name === "click"){
      totalClicks++;
      buckets[idx].clicks++;
      if (by[e.provider]) by[e.provider].clicks++;
    }
  }

  // compute conversions
  const byWithConv = {};
  for (const k of provs){
    const a = by[k].applies, c = by[k].clicks;
    byWithConv[k] = { applies:a, clicks:c, conv: c ? +(100*a/c).toFixed(1) : 0 };
  }

  const overallConv = totalClicks ? +(100*totalApplies/totalClicks).toFixed(1) : 0;
  return { by: byWithConv, buckets, totals:{ applies:totalApplies, clicks:totalClicks, conv:overallConv } };
}
