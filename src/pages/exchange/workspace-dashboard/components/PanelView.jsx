import React from "react";
import { apps } from "../data/dashboardData";
import { goToExchangeRoute, handleWorkspaceTile, openDashboardPanel } from "../dashboardUtils";
import ProfileUploadCard from "./ProfileUploadCard";
import WorkspaceLauncher from "./WorkspaceLauncher";
import RightStack from "./RightStack";
import JournalPanel from "./JournalPanel";
import CalendarPanel from "./CalendarPanel";

function PanelPlaceholder({ title, subtitle, cards = [] }) {
  return (
    <section className="shsDash-card shsDash-panelView">
      <div className="shsDash-workspaceHead">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="shsDash-panelGrid">
        {cards.map((card) => (
          <article className={`shsDash-panelCard shsDash-glow--${card.tone || "blue"}`} key={card.title}>
            <span>{card.icon}</span>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
            {card.action && <button type="button" onClick={card.onClick}>{card.action}</button>}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPanel({ activePanel, profile, setProfile }) {
  if (activePanel === "Overview") {
    return (
      <section className="shsDash-mainGrid">
        <ProfileUploadCard profile={profile} setProfile={setProfile} />
        <WorkspaceLauncher />
        <RightStack />
      </section>
    );
  }

  if (activePanel === "Profile") {
    return (
      <section className="shsDash-mainGrid shsDash-mainGrid--profile">
        <ProfileUploadCard profile={profile} setProfile={setProfile} />
        <PanelPlaceholder
          title="Profile & Identity"
          subtitle="Manage your verified identity, display information, and profile completeness."
          cards={[
            { icon: "👤", title: "Edit Profile", body: "Update name, role, contact information, and visible profile details.", tone: "blue" },
            { icon: "🛡", title: "Identity Verification", body: "Review clearance status, last verification, and identity confidence.", tone: "green" },
            { icon: "📷", title: "Profile Photo", body: "Upload a profile image that syncs to the Command Surface operator badge.", tone: "teal" },
          ]}
        />
      </section>
    );
  }

  if (activePanel === "Workspace") {
    return (
      <PanelPlaceholder
        title="Workspace"
        subtitle="Manage active workspaces, pinned tools, recently opened dashboards, and workspace preferences."
        cards={[
          { icon: "🌐", title: "Open Command Surface", body: "Launch the live SHS operational truth surface.", tone: "blue", action: "Open Command Surface", onClick: () => goToExchangeRoute("/exchange/command") },
          { icon: "📌", title: "Pinned Tools", body: "Choose tools that should appear on your dashboard home.", tone: "violet" },
          { icon: "⚙", title: "Workspace Preferences", body: "Set default workspace, layout, and landing view.", tone: "teal" },
        ]}
      />
    );
  }

  if (activePanel === "Calendar") {
    return <CalendarPanel />;
  }

  if (activePanel === "Journal") {
    return <JournalPanel />;
  }

  if (activePanel === "Apps") {
    return (
      <section className="shsDash-card shsDash-panelView">
        <div className="shsDash-workspaceHead">
          <div>
            <h2>Apps</h2>
            <p>Launch available SHS modules based on your access level.</p>
          </div>
        </div>

        <div className="shsDash-appGrid shsDash-appGrid--panel">
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
      </section>
    );
  }

  const panelMap = {
    Reports: {
      title: "Reports",
      subtitle: "Saved reports, draft reports, generated reports, report templates, and export history.",
      cards: [
        { icon: "▤", title: "Saved Reports", body: "View reports saved to your workspace.", tone: "blue" },
        { icon: "✍", title: "Draft Reports", body: "Continue reports that are not ready for release.", tone: "violet" },
        { icon: "⬇", title: "Export History", body: "Review previous PDF, CSV, and JSON exports.", tone: "green" },
      ],
    },
    Files: {
      title: "Files",
      subtitle: "Manage evidence packages, datasets, county files, provider files, and imports.",
      cards: [
        { icon: "📁", title: "Evidence Library", body: "Browse uploaded evidence and supporting files.", tone: "blue" },
        { icon: "☁", title: "Upload Files", body: "Upload documents, packages, and data files.", tone: "green" },
        { icon: "↻", title: "Import Status", body: "Track import jobs and file processing state.", tone: "teal" },
      ],
    },
    Notifications: {
      title: "Notifications",
      subtitle: "Contradiction alerts, verification reminders, report-ready alerts, and assignments.",
      cards: [
        { icon: "⚠", title: "Contradiction Alerts", body: "Review open contradictions that may require command action.", tone: "orange", action: "Open Command Context", onClick: () => goToExchangeRoute("/exchange/command") },
        { icon: "🛡", title: "Verification Reminders", body: "See records waiting for verification follow-up.", tone: "green" },
        { icon: "▤", title: "Report Ready Alerts", body: "View reports ready for download or review.", tone: "blue" },
      ],
    },
    Conference: {
      title: "Conference",
      subtitle: "Start, join, schedule, and attach meeting notes to SHS workspace activity.",
      cards: [
        { icon: "🎥", title: "Start Conference", body: "Launch a workspace meeting for operators, partners, or providers.", tone: "teal" },
        { icon: "📅", title: "Schedule Meeting", body: "Create a meeting tied to a workspace, task, report, or review.", tone: "green", action: "Open Calendar", onClick: () => openDashboardPanel("Calendar") },
        { icon: "✍", title: "Attach Notes", body: "Capture meeting notes and decide if they should become certified context.", tone: "violet", action: "Open Journal", onClick: () => openDashboardPanel("Journal") },
      ],
    },
    Calendar: {
      title: "Calendar",
      subtitle: "Meetings, deadlines, verification appointments, report release dates, and follow-up reviews.",
      cards: [
        { icon: "🎥", title: "Conference", body: "Start, join, or schedule Zoom-style workspace meetings.", tone: "teal", action: "Open Conference", onClick: () => openDashboardPanel("Conference") },
        { icon: "📅", title: "Agenda", body: "Review today’s meetings, due dates, and command handoffs.", tone: "green" },
        { icon: "🔁", title: "Follow-up Reviews", body: "Track verification follow-ups and report deadlines.", tone: "orange" },
      ],
    },
    Journal: {
      title: "Journal",
      subtitle: "Private workspace notes, meeting notes, reflections, operator logs, and decision context drafts.",
      cards: [
        { icon: "✍", title: "New Journal Entry", body: "Capture private workspace notes before they become certified context.", tone: "violet" },
        { icon: "▤", title: "Meeting Notes", body: "Store notes from conferences, reviews, and partner meetings.", tone: "blue" },
        { icon: "⚑", title: "Promote to Context", body: "Promote selected notes into evidence, analyst memo, action log, or audit context.", tone: "gold" },
      ],
    },
    Security: {
      title: "Security",
      subtitle: "Session status, MFA, device history, access logs, and clearance level.",
      cards: [
        { icon: "🔒", title: "Secure Session", body: "Current session is active and protected.", tone: "green" },
        { icon: "🛡", title: "Clearance Level", body: "Tier 3 High access is currently active.", tone: "gold" },
        { icon: "▤", title: "Access Logs", body: "Review sign-ins, devices, and permission events.", tone: "blue" },
      ],
    },
    Organization: {
      title: "Organization",
      subtitle: "Users, roles, departments, workspaces, invites, and partner access.",
      cards: [
        { icon: "👥", title: "Users", body: "Manage organization users and account access.", tone: "gold" },
        { icon: "▦", title: "Workspaces", body: "Review active workspaces and departments.", tone: "blue" },
        { icon: "✉", title: "Invites", body: "Track pending invites and partner access.", tone: "green" },
      ],
    },
    Billing: {
      title: "Billing",
      subtitle: "Plan, status, invoices, next billing, and subscription management.",
      cards: [
        { icon: "♛", title: "Enterprise Plus", body: "Current plan is active.", tone: "gold" },
        { icon: "▤", title: "Invoices", body: "View billing records and payment history.", tone: "blue" },
        { icon: "⚙", title: "Subscription", body: "Manage plan and billing preferences.", tone: "orange" },
      ],
    },
    Settings: {
      title: "Settings",
      subtitle: "Theme, notification preferences, default workspace, layout, and profile visibility.",
      cards: [
        { icon: "🎨", title: "Theme", body: "Adjust display preferences and dashboard visual mode.", tone: "violet" },
        { icon: "🔔", title: "Notification Preferences", body: "Choose what alerts you receive.", tone: "orange" },
        { icon: "▦", title: "Dashboard Layout", body: "Customize cards, panels, and pinned modules.", tone: "blue" },
      ],
    },
    "Help Center": {
      title: "Help Center",
      subtitle: "Knowledge base, tutorials, support, system status, and documentation.",
      cards: [
        { icon: "?", title: "User Guides", body: "Learn how to use SHS workspace tools.", tone: "blue" },
        { icon: "▤", title: "Knowledge Base", body: "Search help articles and platform documentation.", tone: "teal" },
        { icon: "✉", title: "Contact Support", body: "Get support from the SHS team.", tone: "green" },
      ],
    },
  };

  return <PanelPlaceholder {...(panelMap[activePanel] || panelMap.Workspace)} />;
}
