/**
 * Estimation knobs used by investor dashboards.
 * Replace with real spend later (e.g., from Stripe/QuickBooks).
 */
export const CPC = { indeed: 1.30, linkedin: 2.10, zip: 1.00 };       // cost per click ($)
export const CPA = { indeed: 18.0, linkedin: 28.0, zip: 15.0 };       // cost per apply ($)

/** Roll up 7d window buckets to provider totals */
export function providerRollup(win){
  const out = {};
  for(const k of Object.keys(win.by||{})){
    const v = win.by[k] || { clicks:0, applies:0, conv:0 };
    const spend = (v.clicks*(CPC[k]||0)) + (v.applies*(CPA[k]||0));
    out[k] = { ...v, spend, cpc:CPC[k]||0, cpa:CPA[k]||0 };
  }
  return out;
}

/** High-level metrics for “Northstar” card row */
export function northstar(win){
  const t = win.totals || { clicks:0, applies:0, conv:0 };
  const by = providerRollup(win);
  const spend = Object.values(by).reduce((s,v)=>s+v.spend,0);
  const cpaEff = t.applies ? (spend / t.applies) : 0;
  const ctr = t.clicks ? ((t.applies / t.clicks) * 100) : 0;
  return { spend, applies:t.applies, clicks:t.clicks, conv:t.conv, cpaEff, ctr };
}
