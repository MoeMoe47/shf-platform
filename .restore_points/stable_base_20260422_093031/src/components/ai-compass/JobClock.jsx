import React from "react";

export default function JobClock(){
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/mock/job-clock");
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        // Normalize to expected shape
        const norm = {
          baselineTs: j.baselineTs ?? Date.now(),
          displaced:  Number(j.displaced ?? 0),
          created:    Number(j.created ?? 0),
          rDay: {
            displaced: Number(j?.rDay?.displaced ?? 0),
            created:   Number(j?.rDay?.created   ?? 0),
          },
          adjust: {
            displaced: Number(j?.adjust?.displaced ?? 1),
            created:   Number(j?.adjust?.created   ?? 1),
          },
        };
        setData(norm);
      } catch {
        // Fallback so UI never crashes
        setData({
          baselineTs: Date.now(),
          displaced:  0,
          created:    0,
          rDay: { displaced: 0, created: 0 },
          adjust: { displaced: 1, created: 1 },
        });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!data) return null;

  // Live counters based on per-day rates
  const now = Date.now();
  const elapsedSec = Math.max(0, (now - data.baselineTs) / 1000);
  const rDsec = (data.rDay.displaced * data.adjust.displaced) / 86400;
  const rCsec = (data.rDay.created   * data.adjust.created)   / 86400;

  const displaced = Math.floor(data.displaced + rDsec * elapsedSec);
  const created   = Math.floor(data.created   + rCsec * elapsedSec);
  const net = created - displaced;
  const fmt = (n)=> new Intl.NumberFormat("en-US").format(n);

  return (
    <section className="ai-clock" aria-label="AI job clock">
      <div className="ai-clockItem red">
        <div className="lbl">Jobs Displaced (est.)</div>
        <div className="val">{fmt(displaced)}</div>
      </div>
      <div className="ai-clockItem green">
        <div className="lbl">Jobs Created (est.)</div>
        <div className="val">{fmt(created)}</div>
      </div>
      <div className={`ai-clockItem ${net>=0?"green":"red"}`}>
        <div className="lbl">Net</div>
        <div className="val">{fmt(net)}</div>
      </div>
    </section>
  );
}
