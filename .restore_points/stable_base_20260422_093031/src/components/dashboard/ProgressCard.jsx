import React from "react";

export default function ProgressCard({
  loading = false,
  overallPct = 0,
  lessonsDone = 0,
  lessonsTotal = 0,
  dueThisWeekPct = 0,
  streakDays = 0,
}) {
  const pct = Math.max(0, Math.min(100, overallPct));
  const dashArray = 2 * Math.PI * 22; // r=22
  const dashOffset = dashArray * (1 - pct / 100);

  return (
    <section className="sh-card db-card" role="group" aria-labelledby="dash-progress">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h2 id="dash-progress" className="sh-cardTitle">Progress</h2>

        {loading ? (
          <div className="prg-wrap">
            <div style={{ width:56, height:56, borderRadius:'50%', overflow:'hidden' }}>
              <div className="skel" style={{ width:'100%', height:'100%' }} />
            </div>
            <div className="prg-grid">
              <div className="prg-row">
                <span className="skel skel--text-1" style={{ width:'40%' }} />
                <span className="skel" style={{ width:48, height:14, borderRadius:6 }} />
              </div>
              <div className="prg-meter"><div className="skel" style={{ height:'100%' }} /></div>
              <div className="prg-row">
                <span className="skel skel--text-1" style={{ width:'50%' }} />
                <span className="skel" style={{ width:36, height:14, borderRadius:6 }} />
              </div>
              <div className="prg-meter"><div className="skel" style={{ height:'100%' }} /></div>
            </div>
          </div>
        ) : (
          <div className="prg-wrap">
            {/* Ring */}
            <div className="hdr-progress" aria-label={`Overall progress ${pct}%`}>
              <svg className="hdr-ringSvg" width="56" height="56" viewBox="0 0 56 56" role="img" aria-hidden>
                <circle className="hdr-ringBg" cx="28" cy="28" r="22" />
                <circle
                  className="hdr-ringFg"
                  cx="28"
                  cy="28"
                  r="22"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="hdr-pct">{pct}%</div>
            </div>

            {/* Bars */}
            <div className="prg-grid">
              <div className="prg-row">
                <div>Lessons</div>
                <div><strong>{lessonsDone}</strong> / {lessonsTotal}</div>
              </div>
              <div className="prg-meter">
                <div className="prg-meterFill" style={{ width: `${(lessonsDone/Math.max(1,lessonsTotal))*100}%` }} />
              </div>

              <div className="prg-row">
                <div>Due this week</div>
                <div><strong>{dueThisWeekPct}%</strong></div>
              </div>
              <div className="prg-meter">
                <div className="prg-meterFill" style={{ width: `${dueThisWeekPct}%` }} />
              </div>

              <div className="prg-row">
                <div className="prg-streak">🔥 <span>{streakDays}d</span> streak</div>
                <div className="badge">Keep it going</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
