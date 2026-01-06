import React from "react";
export default function KpiStrip({ k }) {
  return (
    <div className="db-grid db-grid--kpis">
      {[
        { ic:"🎯", lbl:"On-track", val:`${k.onTrackPct}%`, hint:"vs. weekly target" },
        { ic:"🧩", lbl:"Skills to verify", val:k.skillsLeft, hint:"to hit Hire-Ready" },
        { ic:"📅", lbl:"Interviews this week", val:k.interviewsThisWeek, hint:"check calendar" },
        { ic:"⏱️", lbl:"Est. offer in", val:`${k.etaDays} days`, hint:"based on your pace" },
      ].map((x,i)=>(
        <div key={i} className="card card--pad">
          <div className="sh-kpiItem">
            <div className="sh-kpiIcon">{x.ic}</div>
            <div>
              <div className="sh-kpiLabel">{x.lbl}</div>
              <div className="sh-kpiValue">{x.val}</div>
              <div className="sh-kpiHint">{x.hint}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
