import React, { useEffect, useMemo, useState } from "react";
import { files, journalItems } from "../data/dashboardData";
import { readJournalEntries, readWorkspaceFiles } from "../dashboardUtils";

export default function BottomDock() {
  const [liveFiles, setLiveFiles] = useState(() => readWorkspaceFiles());
  const [liveJournalEntries, setLiveJournalEntries] = useState(() => readJournalEntries());

  useEffect(() => {
    function handleJournalUpdate(event) {
      if (Array.isArray(event.detail)) setLiveJournalEntries(event.detail);
    }

    function handleFilesUpdate(event) {
      if (Array.isArray(event.detail)) setLiveFiles(event.detail);
    }

    window.addEventListener("shsDash:journalUpdated", handleJournalUpdate);
    window.addEventListener("shsDash:filesUpdated", handleFilesUpdate);

    return () => {
      window.removeEventListener("shsDash:journalUpdated", handleJournalUpdate);
      window.removeEventListener("shsDash:filesUpdated", handleFilesUpdate);
    };
  }, []);

  const fileRows = useMemo(() => {
    const source = liveFiles.length ? liveFiles : files.map(([icon, name, meta]) => ({
      icon,
      name,
      meta,
    }));

    return source.slice(0, 3).map((file) => [
      file.icon || "📁",
      file.name || "Workspace File",
      file.size || file.meta || file.status || "Uploaded",
    ]);
  }, [liveFiles]);

  const journalRows = useMemo(() => {
    const source = liveJournalEntries.length ? liveJournalEntries : journalItems.map(([icon, name, meta, status]) => ({
      icon,
      title: name,
      body: meta,
      status,
    }));

    return source.slice(0, 3).map((entry) => [
      entry.icon || "✍",
      entry.title || "Journal Entry",
      entry.body || entry.status || "Private",
    ]);
  }, [liveJournalEntries]);

  const dockCards = [
    ["📁", "Recent Files", fileRows],
    ["📌", "Pinned Tools", [["🔮", "Oracle Truth Package", "AI contradiction detection"], ["🛡", "Verification Dashboard", "Provider overview"], ["▤", "Audit Ledger Search", "Search audit logs"]]],
    ["✍", "Journal / Operator Notes", journalRows],
    ["▥", "My Dashboards", [["▧", "Executive Overview", "Last viewed May 16"], ["▧", "Verification Performance", "Last viewed May 15"], ["▧", "Funding & Impact Analysis", "Last viewed May 13"]]],
  ];

  return (
    <section className="shsDash-bottomDock">
      {dockCards.map(([icon, title, rows]) => (
        <article className="shsDash-card shsDash-dockCard" key={title}>
          <div className="shsDash-sectionHead">
            <h2>{icon} {title}</h2>
            <button type="button">View All →</button>
          </div>

          {rows.map(([rowIcon, name, meta]) => (
            <div className="shsDash-miniRow" key={name}>
              <span>{rowIcon}</span>
              <strong>{name}</strong>
              <small>{meta}</small>
            </div>
          ))}
        </article>
      ))}

      <article className="shsDash-card shsDash-orgCard">
        <div className="shsDash-sectionHead">
          <h2>Organization Access</h2>
          <button type="button">Manage →</button>
        </div>
        <div className="shsDash-orgMetrics">
          <strong>48<span>Active Users</span></strong>
          <strong>5<span>Workspaces</span></strong>
          <strong>3<span>Pending Invites</span></strong>
        </div>
        <p>Your Role <b>Senior Analyst</b> <em>Tier 3 – High</em></p>
        <p>Department <b>Operations & Analysis</b></p>
      </article>

      <article className="shsDash-card shsDash-helpCard">
        <div className="shsDash-sectionHead">
          <h2>Help & Resources</h2>
          <button type="button">View All →</button>
        </div>
        <p>User Guides & Tutorials</p>
        <p>Knowledge Base</p>
        <p>Contact Support</p>
      </article>

      <article className="shsDash-card shsDash-billingCard">
        <div className="shsDash-sectionHead">
          <h2>Subscription & Billing</h2>
          <button type="button">View Details →</button>
        </div>
        <p>Plan <b>Enterprise Plus</b></p>
        <p>Status <b className="is-green">Active</b></p>
        <p>Next Billing <b>Jun 12, 2025</b></p>
        <button type="button">♛ Manage Subscription</button>
      </article>
    </section>
  );
}
