// src/components/sales/DemoControls.jsx
import React from "react";

const LS = {
  mode: "demo:mode",                  // "school" | "fitness" | "reentry" | "dd" | "after" | "career"
  sponsor: "demo:sponsorView",        // "0" | "1"
  lang: "demo:lang",                  // "en" | "es"
  dys: "demo:dys",                    // "0" | "1"
};

const safeGet = (k, d) => {
  try { const v = localStorage.getItem(k); return v ?? d; } catch { return d; }
};
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export function useDemoPrefs() {
  const [mode, setMode] = React.useState(() => safeGet(LS.mode, "school"));
  const [sponsorView, setSponsorView] = React.useState(() => safeGet(LS.sponsor, "0") === "1");
  const [lang, setLang] = React.useState(() => safeGet(LS.lang, "en"));
  const [dys, setDys] = React.useState(() => safeGet(LS.dys, "0") === "1");

  React.useEffect(() => {
    safeSet(LS.mode, mode);
    document.documentElement.dataset.program = mode;
  }, [mode]);

  React.useEffect(() => {
    safeSet(LS.sponsor, sponsorView ? "1" : "0");
    document.documentElement.dataset.sponsor = sponsorView ? "1" : "0";
  }, [sponsorView]);

  React.useEffect(() => {
    safeSet(LS.lang, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  React.useEffect(() => {
    safeSet(LS.dys, dys ? "1" : "0");
    document.documentElement.dataset.dyslexia = dys ? "1" : "0";
  }, [dys]);

  return { mode, setMode, sponsorView, setSponsorView, lang, setLang, dys, setDys };
}

export default function DemoControls() {
  const { mode, setMode, sponsorView, setSponsorView, lang, setLang, dys, setDys } = useDemoPrefs();
  return (
    <section className="card card--pad" style={{ display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Demo Controls</h3>

      <label className="sh-label">Program Type</label>
      <div className="seg" role="group" aria-label="Program type">
        {[
          ["school","School/CTE"],
          ["fitness","After-School/Fitness"],
          ["after","Community OST"],
          ["reentry","Re-entry/Workforce"],
          ["dd","DD Community"],
          ["career","Career Center"],
        ].map(([val,label])=>(
          <button key={val}
            className={"seg-btn " + (mode===val?"is-active":"")}
            onClick={()=>setMode(val)} type="button">{label}</button>
        ))}
      </div>

      <div style={{ display:"grid", gap:8, gridTemplateColumns:"repeat(2, minmax(0,1fr))" }}>
        <label className="sh-label">View</label>
        <div>
          <label style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input type="checkbox" checked={sponsorView} onChange={e=>setSponsorView(e.target.checked)} />
            Sponsor View (anonymized KPIs)
          </label>
        </div>

        <label className="sh-label">Language</label>
        <div>
          <select className="sh-input" value={lang} onChange={e=>setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        <label className="sh-label">Accessibility</label>
        <div>
          <label style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input type="checkbox" checked={dys} onChange={e=>setDys(e.target.checked)} />
            Dyslexia-friendly font
          </label>
        </div>
      </div>
    </section>
  );
}
