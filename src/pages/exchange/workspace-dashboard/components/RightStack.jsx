import React from "react";
import { agendaItems } from "../data/dashboardData";
import { openDashboardPanel } from "../dashboardUtils";

export default function RightStack() {
  return (
    <aside className="shsDash-rightStack">
      <section className="shsDash-card shsDash-sideCard">
        <div className="shsDash-sectionHead">
          <h2>🔔 Notifications</h2>
          <button type="button">View All →</button>
        </div>

        <article className="shsDash-notice is-orange">
          <span>⚠</span>
          <div>
            <strong>Contradiction Review Needed</strong>
            <p>3 new contradictions require review in Franklin County dataset.</p>
          </div>
          <small>10:24 AM</small>
        </article>

        <article className="shsDash-notice is-violet">
          <span>✦</span>
          <div>
            <strong>Report Ready</strong>
            <p>Monthly Operational Summary Report is ready for download.</p>
          </div>
          <small>8:07 AM</small>
        </article>
      </section>

      <section className="shsDash-card shsDash-sideCard shsDash-agendaCard">
        <div className="shsDash-sectionHead">
          <h2>📅 Today’s Agenda</h2>
          <button type="button" onClick={() => openDashboardPanel("Calendar")}>Open Calendar →</button>
        </div>

        {agendaItems.map(([icon, title, time, status, tone]) => (
          <article className="shsDash-agendaRow" key={title}>
            <span className={`shsDash-glow--${tone}`}>{icon}</span>
            <div>
              <strong>{title}</strong>
              <small>{time}</small>
            </div>
            <b>{status}</b>
          </article>
        ))}

        <button className="shsDash-addTask" type="button">+ Schedule Meeting</button>
      </section>

      <section className="shsDash-card shsDash-sideCard">
        <div className="shsDash-sectionHead">
          <h2>Upcoming Tasks</h2>
          <button type="button">View All →</button>
        </div>

        {["Review pending contradictions", "Verify new provider submissions", "Upload Q2 evidence packages"].map((task, index) => (
          <article className="shsDash-task" key={task}>
            <span />
            <strong>{task}</strong>
            <small>{index === 0 ? "Due Today" : index === 1 ? "May 19" : "May 22"}</small>
            <b>{index === 0 ? "High" : "Medium"}</b>
          </article>
        ))}

        <button className="shsDash-addTask" type="button">+ Add New Task</button>
      </section>

      <section className="shsDash-card shsDash-sideCard">
        <div className="shsDash-sectionHead">
          <h2>Recent Reports</h2>
          <button type="button">View All →</button>
        </div>

        {["Operational Summary – May 2025", "Provider Verification Trend Report", "Contradictions Analysis – Q2"].map((report, index) => (
          <article className="shsDash-reportRow" key={report}>
            <span>▤</span>
            <strong>{report}</strong>
            <small>{index === 2 ? "XLSX" : "PDF"}</small>
            <button type="button">↓</button>
          </article>
        ))}
      </section>
    </aside>
  );
}
