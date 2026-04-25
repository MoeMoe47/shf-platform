import React from "react";
import { apps, recentActivity } from "../data/dashboardData";
import { handleWorkspaceTile } from "../dashboardUtils";

export default function WorkspaceLauncher() {
  return (
    <main className="shsDash-card shsDash-workspace">
      <div className="shsDash-workspaceHead">
        <div>
          <h2>My SHS Workspace</h2>
          <p>Quick launch your essential SHS surfaces and tools.</p>
        </div>
        <button type="button">⚙ Customize</button>
      </div>

      <div className="shsDash-appGrid">
        {apps.map(([icon, title, body, tone]) => (
          <button
            className={`shsDash-appTile shsDash-glow--${tone}`}
            key={title}
            type="button"
            onClick={() => handleWorkspaceTile(title)}
          >
            <span>{icon}</span>
            <strong>{title}</strong>
            <p>{body}</p>
          </button>
        ))}
      </div>

      <section className="shsDash-activity">
        <div className="shsDash-sectionHead">
          <h2>Recent Activity</h2>
          <button type="button">View All Activity →</button>
        </div>

        {recentActivity.map(([icon, title, source, time, status, tone]) => (
          <article className="shsDash-activityRow" key={title}>
            <span className={`shsDash-glow--${tone}`}>{icon}</span>
            <strong>{title}</strong>
            <small>{source}</small>
            <small>{time}</small>
            <b className={`shsDash-statusText--${tone}`}>{status}</b>
          </article>
        ))}
      </section>
    </main>
  );
}
