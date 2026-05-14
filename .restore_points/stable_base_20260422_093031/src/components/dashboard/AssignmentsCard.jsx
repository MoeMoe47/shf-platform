import React from "react";

export default function AssignmentsCard({ loading = false, items = [] }) {
  return (
    <section className="sh-card db-card" role="group" aria-labelledby="dash-assignments">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h2 id="dash-assignments" className="sh-cardTitle">Assignments</h2>

        {loading ? (
          <ul className="asg-list">
            {[0,1,2].map(i => (
              <li key={i} className="asg-item">
                <span className="asg-dot asg-dot--pending" />
                <div style={{minWidth:0}}>
                  <div className="skel skel--text-2" />
                  <div className="skel skel--text-3" />
                </div>
                <span className="asg-badge asg-badge--ok">
                  <span className="skel" style={{ display:'inline-block', width:64, height:16, borderRadius:999 }} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="asg-list">
            {items.map((a) => {
              const badgeClass =
                a.state === "overdue" ? "asg-badge asg-badge--overdue" :
                a.state === "soon"    ? "asg-badge asg-badge--soon"    :
                                        "asg-badge asg-badge--ok";
              return (
                <li key={a.id} className="asg-item">
                  <span className={a.done ? "asg-dot asg-dot--done":"asg-dot asg-dot--pending"} />
                  <div className="asg-main" style={{minWidth:0}}>
                    <div className="asg-title">{a.title}</div>
                    <div className="asg-meta">{a.course} · due {a.due}</div>
                  </div>
                  <span className={badgeClass}>{a.stateLabel}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
