import React, { useEffect, useRef, useState } from "react";
import "./hub-workspace-dashboard.css";
import HubBusinessTourProvider from "./shared/HubBusinessTourProvider.jsx";
import { canAccessHubRoute, filterHubGoalsByRole, getHubRoleLabel, normalizeHubRole } from "@/system/identity/hubAccessControl";
import { clearIdentitySession, getCurrentIdentity } from "@/system/identity/identityRouting";
import { useAdaptiveExperience } from "@/system/adaptive-experience/useAdaptiveExperience";
import {
  ADAPTIVE_EVENT_TYPES,
  ADAPTIVE_ROLES,
  ADAPTIVE_SURFACES,
} from "@/system/adaptive-experience/adaptiveEvent.types";


const SHS_HOME_URL = "/capital.html#/";
const HUB_LOGO_FILE_NAME = "shs-hub-logo.png";
const HUB_LOGO_PATH = `/assets/branding/${HUB_LOGO_FILE_NAME}`;
const HUB_LOGO_ALT = "Silicon Heartland Solutions logo";
const DEFAULT_HUB_FLYWHEEL = "/assets/hub/hub-flywheel.png";
const kpis = [
  { icon: "👥", label: "Active Partners", value: "24", delta: "▲ 20%", note: "vs last 30 days", tone: "green" },
  { icon: "↔", label: "Open Referrals", value: "58", delta: "▲ 14%", note: "vs last 30 days", tone: "violet" },
  { icon: "🗂️", label: "Coordinated Cases", value: "142", delta: "▲ 18%", note: "vs last 30 days", tone: "gold" },
  { icon: "♡", label: "Unmet Needs", value: "11", delta: "▲ 2", note: "vs last 30 days", tone: "teal" },
  { icon: "🛡️", label: "Consent Coverage", value: "97%", delta: "▲ 5%", note: "vs last 30 days", tone: "violet" },
  { icon: "◇", label: "Network Health", value: "94%", delta: "Healthy", note: "All systems operational", tone: "green" },
];

const navItems = [
  ["Overview", "⌂", "/hub"],
  ["Partners", "▦", "/hub/network"],
  ["Referrals", "↔", "/hub/lifecycle"],
  ["Intake", "▤", "/hub/intake"],
  ["Action Queue", "☑", "/hub/queue", "12"],
  ["Unmet Needs", "♡", "/hub/unmet-needs"],
  ["Outcomes", "◎", "/hub/outcomes"],
  ["Reports", "▥", "/hub/reports"],
  ["Files", "▣", "/hub/imports"],
  ["Calendar", "▦", "/hub/calendar"],
  ["Conference", "▰", "/hub/conference"],
];

const workspaceTiles = [
  ["Partner Registry", "👥", "/hub/network"],
  ["Referral Exchange", "↔", "/hub/lifecycle"],
  ["Intake Flow", "📋", "/hub/intake"],
  ["Action Queue", "✅", "/hub/queue", "12"],
  ["Service Capacity", "🎯", "/hub/capacity"],
  ["Unmet Needs", "💙", "/hub/unmet-needs"],
  ["Shared Outcomes", "📈", "/hub/outcomes"],
  ["Verification Status", "🛡️", "/hub/verification"],
  ["Reporting", "📊", "/hub/reports"],
  ["Audit Trail", "📑", "/hub/audit", null, "advanced"],
  ["Files & Data", "🗂️", "/hub/imports"],
  ["Integrations", "🧩", "/hub/integrations"],
  ["Conference", "🎥", "/hub/conference"],
  ["Calendar", "📅", "/hub/calendar"],
  ["Journal", "📖", "/hub/journal"],
];

const activityRows = [
  ["✓", "closed: Community support", "org_shf_001", "2026-04-16T12:50:35...", "closed"],
  ["●", "on hold: workforce_training", "org_partner_001", "2026-04-16T12:50:25...", "on_hold"],
  ["△", "closed: Community support", "org_shf_001", "2026-04-16T01:38:08...", "closed"],
];

const notifications = [
  ["⚠", "Referral review needed", "Referral #R-26471 requires your review.", "10:24 AM", "warn"],
  ["▤", "Consent form missing", "Client consent form is missing for intake #I-1983.", "9:15 AM", "red"],
  ["👥", "Partner update received", "Franklin County Workforce Partner updated service capacity.", "8:01 AM", "blue"],
  ["★", "Monthly hub summary ready", "Your monthly summary report is ready.", "7:30 AM", "violet"],
];

const agenda = [
  ["10:00 AM", "Partner Coordination Huddle", "30 min · Virtual"],
  ["1:00 PM", "Intake Review & Triage", "45 min · Hub Office"],
  ["3:30 PM", "Community Services Roundtable", "60 min · Community Center"],
];


const guidedWorkflowGoals = [
  {
    id: "setup-data",
    roleTier: "client",
    icon: "▰",
    title: "Set up my data",
    route: "/hub/imports",
    page: "Files & Imports",
    why:
      "Use this first when a client needs to upload spreadsheets, use SHS templates, import evidence, or connect existing software.",
    next:
      "After the data is clean, review Partner Network or create referrals in Intake.",
    bestFor:
      "New client setup, software integration, file uploads, mapping, validation, and import readiness.",
  },
  {
    id: "review-network",
    roleTier: "client",
    icon: "👥",
    title: "Review my partner network",
    route: "/hub/network",
    page: "Partner Network",
    why:
      "Use this when the client needs to understand who is in the network, what services are covered, and where capacity is strained.",
    next:
      "After reviewing partners, create referrals in Intake or work partner issues in Action Queue.",
    bestFor:
      "Partner directory, service coverage, capacity strain, partner attention, and network health.",
  },
  {
    id: "create-referral",
    roleTier: "client",
    icon: "▤",
    title: "Create a referral",
    route: "/hub/intake",
    page: "Intake Navigator",
    why:
      "Use this when someone needs to route a need from one organization to another.",
    next:
      "After creating the referral, go to Action Queue to assign, review, hold, resolve, or close it.",
    bestFor:
      "Sender, receiver, need category, urgency, notes, consent, and referral creation.",
  },
  {
    id: "work-referrals",
    roleTier: "client",
    icon: "☑",
    title: "Work today’s referrals",
    route: "/hub/queue",
    page: "Action Queue",
    why:
      "Use this when the client needs to process live work and decide what should move next.",
    next:
      "After actions are taken, go to Referral Lifecycle to confirm movement.",
    bestFor:
      "High priority items, unassigned referrals, review, hold, resolve, close, and logged queue actions.",
  },
  {
    id: "track-progress",
    roleTier: "client",
    icon: "↗",
    title: "Track referral progress",
    route: "/hub/lifecycle",
    page: "Referral Lifecycle",
    why:
      "Use this when the client needs to see whether referrals are moving, stuck, resolved, or closed.",
    next:
      "If work is stuck, return to Action Queue. If movement is strong, go to Reports.",
    bestFor:
      "Open, assigned, in review, on hold, resolved, closed, completion rate, and flow pressure.",
  },
  {
    id: "generate-report",
    roleTier: "client",
    icon: "▥",
    title: "Generate a report",
    route: "/hub/reports",
    page: "Hub Reports",
    why:
      "Use this when the client needs to turn Hub activity into leadership-ready proof.",
    next:
      "If deeper proof is needed, open Institutional Reporting or the SHS Command Surface.",
    bestFor:
      "Monthly summary, referral activity, partner network report, unmet needs report, import quality, and outcome snapshot.",
  },
  {
    id: "review-proof",
    roleTier: "client_admin",
    icon: "🛡",
    title: "Review proof or audit readiness",
    route: "/reporting",
    page: "Institutional Reporting",
    why:
      "Use this when the client needs Oracle truth packages, trust envelopes, audit packs, analyst memos, or publication controls.",
    next:
      "After proof is verified, return to Reports for distribution or Command Surface for executive decision review.",
    bestFor:
      "Audit-grade reports, verification-weighted proof, trust envelopes, and institutional review.",
  },
  {
    id: "find-growth",
    roleTier: "client_admin",
    icon: "◇",
    title: "Find growth opportunities",
    route: "/growth",
    page: "Growth Engine",
    why:
      "Use this when repeated needs, partner demand, or service-lane signals should become business or funding opportunities.",
    next:
      "After reviewing growth signals, use Hub Intelligence, Bundles, Opportunities, or Sales Pipeline.",
    bestFor:
      "Partner opportunities, service-lane expansion, bundles, pilots, funding, and business network growth.",
  },
  {
    id: "open-command-surface",
    roleTier: "shs_admin",
    icon: "◎",
    title: "Open command surface",
    route: "/reporting",
    page: "Institutional Command",
    why:
      "Use this when an SHS admin needs deeper system-control review, reporting command operations, audit-grade evidence, or institutional decision support.",
    next:
      "After reviewing institutional reporting, move to Oracle, verification, audit, or the SHS Command Surface when needed.",
    bestFor:
      "SHS admin review, command operations, audit readiness, verification, reporting controls, and system oversight.",
  },
];

function GuidedWorkflowLauncher({ adaptive }) {
  const demoRole =
    localStorage.getItem("shsHubDemoRole") ||
    localStorage.getItem("shsUserRole") ||
    localStorage.getItem("shsRole") ||
    "client";

  const activeRole = normalizeHubRole(demoRole);
  const roleLabel = getHubRoleLabel(activeRole);
  const isDevMode =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.DEV;

  const visibleGoals = filterHubGoalsByRole(guidedWorkflowGoals, activeRole);
  const safeGoals = visibleGoals.length ? visibleGoals : filterHubGoalsByRole(guidedWorkflowGoals, "client");

  const [selectedGoalId, setSelectedGoalId] = useState(safeGoals[0]?.id || guidedWorkflowGoals[0].id);
  const selectedGoal = safeGoals.find((goal) => goal.id === selectedGoalId) || safeGoals[0] || guidedWorkflowGoals[0];

  function openGoal(goal) {
    setSelectedGoalId(goal.id);

    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED,
      target: `guided_workflow_goal_${goal.id}`,
      metadata: {
        goal: goal.title,
        route: goal.route,
        page: goal.page,
      },
    });
  }

  function goToSelectedGoal() {
    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED,
      target: `guided_workflow_go_${selectedGoal.id}`,
      metadata: {
        goal: selectedGoal.title,
        route: selectedGoal.route,
        page: selectedGoal.page,
      },
    });

    go(selectedGoal.route);
  }

  return (
    <section className="hubV1-guidedWorkflow" data-tour="hub-workspace-guided-workflow">
      <div className="hubV1-guidedIntro">
        <span className="hubV1-guidedEyebrow">Guided Workflow Launcher</span>
        <h2>What are you trying to do today?</h2>
        <p>
          Choose a goal and SHS will send you to the right page, explain why that page matters,
          and show what page usually comes next.
        </p>
        <div className="hubV1-roleBadge" data-tour="hub-workspace-identity-role">
          <span>Identity Layer View</span>
          <strong>{roleLabel}</strong>
          <small>Showing {safeGoals.length} guided options allowed for this role.</small>

          {isDevMode ? (
            <div className="hubV1-roleSwitch" aria-label="Development role switcher">
              <button
                type="button"
                className={activeRole === "client" ? "is-active" : ""}
                onClick={() => {
                  localStorage.setItem("shsHubDemoRole", "client");
                  window.location.reload();
                }}
              >
                Client
              </button>
              <button
                type="button"
                className={activeRole === "client_admin" ? "is-active" : ""}
                onClick={() => {
                  localStorage.setItem("shsHubDemoRole", "client_admin");
                  window.location.reload();
                }}
              >
                Client Admin
              </button>
              <button
                type="button"
                className={activeRole === "shs_admin" ? "is-active" : ""}
                onClick={() => {
                  localStorage.setItem("shsHubDemoRole", "shs_admin");
                  window.location.reload();
                }}
              >
                SHS Admin
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hubV1-guidedBody">
        <div className="hubV1-goalGrid" data-tour="hub-workspace-guided-goals">
          {safeGoals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              className={`hubV1-goalCard ${selectedGoal.id === goal.id ? "is-selected" : ""}`}
              onClick={() => openGoal(goal)}
            >
              <span>{goal.icon}</span>
              <strong>{goal.title}</strong>
              <small>{goal.page}</small>
            </button>
          ))}
        </div>

        <article className="hubV1-guidedDecision" data-tour="hub-workspace-guided-decision">
          <div className="hubV1-guidedDecisionTop">
            <span>{selectedGoal.icon}</span>
            <div>
              <small>Recommended page</small>
              <h3>{selectedGoal.page}</h3>
            </div>
          </div>

          <div className="hubV1-guidedExplain">
            <div>
              <b>Why go here?</b>
              <p>{selectedGoal.why}</p>
            </div>
            <div>
              <b>Best for</b>
              <p>{selectedGoal.bestFor}</p>
            </div>
            <div>
              <b>What comes next?</b>
              <p>{selectedGoal.next}</p>
            </div>
          </div>

          <button type="button" className="hubV1-guidedLaunchBtn" onClick={goToSelectedGoal}>
            Go to {selectedGoal.page} →
          </button>
        </article>
      </div>

      <div className="hubV1-guidedPath" data-tour="hub-workspace-guided-path">
        <span>Recommended client path:</span>
        <strong>Files & Imports</strong>
        <i>→</i>
        <strong>Partner Network</strong>
        <i>→</i>
        <strong>Intake</strong>
        <i>→</i>
        <strong>Action Queue</strong>
        <i>→</i>
        <strong>Lifecycle</strong>
        <i>→</i>
        <strong>Reports</strong>
        <i>→</i>
        <strong>Proof / Growth</strong>
      </div>
    </section>
  );
}


const community = [
  ["👥", "New Partner Onboarding", "Completed onboarding for Bright Futures", "100%", "green"],
  ["📈", "Referrals Closed This Month", "Target: 50 · Current: 46", "92%", "blue"],
  ["💙", "Unmet Needs Resolved", "Resolved 18 of 24 unmet needs", "75%", "violet"],
  ["⚠", "Capacity Alerts", "2 partners reporting capacity strain", "2", "gold"],
];


function getActiveHubRole() {
  if (typeof window === "undefined") return "client";

  return normalizeHubRole(
    localStorage.getItem("shsHubDemoRole") ||
      localStorage.getItem("shsUserRole") ||
      localStorage.getItem("shsRole") ||
      "client"
  );
}

function isHubItemVisibleForRole(path, role) {
  if (!path) return true;

  // These are client workspace utilities and can stay visible unless later restricted.
  if (["/hub/calendar", "/hub/conference", "/hub/journal"].includes(path)) return true;

  return canAccessHubRoute(role, path);
}



function signOutOfHub() {
  clearIdentitySession();

  if (typeof window !== "undefined") {
    window.location.href = "/admin.html#/login";
  }
}


function go(path) {
  if (!path) return;
  window.location.hash = path;
}

function Spark({ tone = "blue" }) {
  return (
    <svg className={`hubV1-spark hubV1-spark--${tone}`} viewBox="0 0 100 38" aria-hidden="true">
      <polyline points="3,31 15,29 25,30 36,24 47,26 58,19 69,21 80,14 91,17 98,9" />
    </svg>
  );
}

function KpiCard({ item }) {
  return (
    <section className="hubV1-kpi">
      <div className="hubV1-kpiTop">
        <span className="hubV1-icon">{item.icon}</span>
        <h3>{item.label}</h3>
      </div>
      <div className="hubV1-kpiMain">
        <strong>{item.value}</strong>
        <b className={`hubV1-chip hubV1-chip--${item.tone}`}>{item.delta}</b>
      </div>
      <p>{item.note}</p>
      <Spark tone={item.tone} />
    </section>
  );
}

function Rail() {
  const active = window.location.hash.replace("#", "") || "/hub";
  const activeRole = getActiveHubRole();
  const visibleNavItems = navItems.filter(([, , path]) => isHubItemVisibleForRole(path, activeRole));

  return (
    <aside className="hubV1-rail" data-tour="hub-workspace-rail">
      <button className="hubV1-logo" data-tour="hub-workspace-logo" type="button" onClick={() => (window.location.href = SHS_HOME_URL)} title="Go to Silicon Heartland Solutions">
        <img
          src={HUB_LOGO_PATH}
          alt={HUB_LOGO_ALT}
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallback = event.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "grid";
          }}
        />
        <span>SHH</span>
      </button>

      <nav className="hubV1-nav" data-tour="hub-workspace-nav">
        {visibleNavItems.map(([label, icon, path, count]) => (
          <button
            key={label}
            type="button"
            className={`hubV1-navItem ${active === path ? "is-active" : ""}`}
            onClick={() => go(path)}
          >
            <span>{icon}</span>
            <small>{label}</small>
            {count ? <b>{count}</b> : null}
          </button>
        ))}
      </nav>

      <div className="hubV1-readiness" data-tour="hub-workspace-readiness">
        <strong>REPORTING READINESS</strong>
        <div className="hubV1-ring"><span>87%</span></div>
        <b>On track</b>
        <p>FY24 Q2 Report<br />Due in 18 days</p>
      </div>
    </aside>
  );
}

function Header() {
  const fileInputRef = useRef(null);
  const flywheelInputRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profileName, setProfileName] = useState("Jordan Ellis");
  const [profileRole, setProfileRole] = useState("Hub Coordinator");

  useEffect(() => {
    const savedPhoto = localStorage.getItem("shsHubProfilePhoto");
    const savedName = localStorage.getItem("shsHubProfileName");
    const savedRole = localStorage.getItem("shsHubProfileRole");

    if (savedPhoto) setProfilePhoto(savedPhoto);
    if (savedName) setProfileName(savedName);
    if (savedRole) setProfileRole(savedRole);
  }, []);

  function initialsFromName(name) {
    return String(name || "Jordan Ellis")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "JE";
  }

  function readImageToStorage(file, key, callback) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = String(reader.result || "");
      localStorage.setItem(key, imageData);
      if (callback) callback(imageData);
      window.dispatchEvent(new Event("storage"));
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoSelect(event) {
    readImageToStorage(event.target.files?.[0], "shsHubProfilePhoto", setProfilePhoto);
  }

  function handleFlywheelSelect(event) {
    readImageToStorage(event.target.files?.[0], "shsHubFlywheelImage", () => {
      alert("Flywheel saved. Refresh the page to see it in the Hub Network Snapshot.");
    });
  }

  function saveIdentity() {
    localStorage.setItem("shsHubProfileName", profileName.trim() || "Jordan Ellis");
    localStorage.setItem("shsHubProfileRole", profileRole.trim() || "Hub Coordinator");
    setProfileOpen(false);
  }

  function removePhoto() {
    localStorage.removeItem("shsHubProfilePhoto");
    setProfilePhoto("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <header className="hubV1-header" data-tour="hub-workspace-header">
      <div>
        <h1>Silicon Heartland Hub</h1>
        <p>Hub Workspace Dashboard</p>
      </div>

      <div className="hubV1-headerActions" data-tour="hub-workspace-header-actions">
        <button>🛡️ Identity</button>
        <button>👥 Workspace</button>
        <button>🔔 Notifications <b>7</b></button>
        <button>📄 Reports</button>
        <button>🔒 Secure Network</button>
        <button>Export</button>
        <button type="button" className="hubV1-signOutBtn" onClick={signOutOfHub}>
          Sign Out
        </button>
      </div>

      <div className="hubV1-profileWrap" data-tour="hub-workspace-profile">
        <button className="hubV1-user" type="button" onClick={() => setProfileOpen(true)}>
          <span>
            <strong>{profileName}</strong>
            <small>{profileRole}</small>
          </span>
          <i className={profilePhoto ? "has-photo" : ""}>
            {profilePhoto ? <img src={profilePhoto} alt={`${profileName} profile`} /> : initialsFromName(profileName)}
          </i>
        </button>

        {profileOpen ? (
          <div className="hubV1-profileMenu">
            <div className="hubV1-profilePreview">
              <i className={profilePhoto ? "has-photo" : ""}>
                {profilePhoto ? <img src={profilePhoto} alt="Profile preview" /> : initialsFromName(profileName)}
              </i>
              <div>
                <strong>{profileName}</strong>
                <span>{profileRole}</span>
              </div>
            </div>

            <label className="hubV1-profileLabel">Display Name</label>
            <input
              className="hubV1-profileInput"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Enter name"
            />

            <label className="hubV1-profileLabel">Role / Title</label>
            <input
              className="hubV1-profileInput"
              value={profileRole}
              onChange={(event) => setProfileRole(event.target.value)}
              placeholder="Enter role"
            />

            <button type="button" onClick={() => fileInputRef.current?.click()}>
              Upload Profile Photo
            </button>

            <button type="button" onClick={removePhoto} disabled={!profilePhoto}>
              Remove Profile Photo
            </button>

            <button type="button" onClick={() => flywheelInputRef.current?.click()}>
              Upload Flywheel Image
            </button>

            <button type="button" className="hubV1-saveProfile" onClick={saveIdentity}>
              Save Name / Role
            </button>

            <button type="button" onClick={() => setProfileOpen(false)}>
              Close
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} hidden />
            <input ref={flywheelInputRef} type="file" accept="image/*" onChange={handleFlywheelSelect} hidden />
          </div>
        ) : null}
      </div>
    </header>
  );
}


function AccessRedirectNotice() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("shsAccessRedirectNotice");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setNotice(parsed);
    } catch {
      localStorage.removeItem("shsAccessRedirectNotice");
    }
  }, []);

  if (!notice) return null;

  function dismissNotice() {
    localStorage.removeItem("shsAccessRedirectNotice");
    setNotice(null);
  }

  return (
    <section className="hubV1-accessNotice" data-tour="hub-workspace-access-notice">
      <div className="hubV1-accessNoticeIcon">🛡</div>
      <div>
        <span>Identity Access Layer</span>
        <h2>Access redirected to Hub</h2>
        <p>
          {notice.reason} You were redirected from <strong>{notice.blockedRoute}</strong> back to the Hub.
        </p>
        <small>
          Active role: <b>{notice.role}</b>. Use the Guided Workflow Launcher to choose a page available to this role.
        </small>
      </div>
      <button type="button" onClick={dismissNotice}>
        Dismiss
      </button>
    </section>
  );
}


function NetworkSnapshot() {
  const [flywheelSrc, setFlywheelSrc] = useState(DEFAULT_HUB_FLYWHEEL);

  useEffect(() => {
    const savedFlywheel = localStorage.getItem("shsHubFlywheelImage");
    if (savedFlywheel) setFlywheelSrc(savedFlywheel);
  }, []);

  return (
    <section className="hubV1-card hubV1-network" data-tour="hub-workspace-network">
      <div className="hubV1-cardTitle">👥 Hub Network Snapshot</div>

      <div className="hubV1-flywheelWrap">
        <img
          src={flywheelSrc}
          alt="Silicon Heartland Hub collaboration operating layer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallback = event.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "grid";
          }}
        />
        <div className="hubV1-flywheelFallback">
          <strong>Silicon<br />Heartland Hub</strong>
          <span>Collaboration Operating Layer</span>
        </div>
      </div>

      <p className="hubV1-networkCopy">
        Connecting partners. Coordinating care. Strengthening communities across the Heartland.
      </p>

      <div className="hubV1-profileRows">
        <div><span>Region</span><strong>Silicon Heartland (5 Counties)</strong></div>
        <div><span>Active Organizations</span><strong>2</strong></div>
        <div><span>Lead Coordinator</span><strong>Jordan Ellis</strong></div>
        <div><span>Clearance Level</span><strong className="hubV1-gold">Tier 2 – Coordinator</strong></div>
        <div><span>Hub Status</span><strong className="hubV1-green">● Active</strong></div>
        <div><span>Next Review</span><strong>May 14, 2025</strong></div>
      </div>

      <button className="hubV1-wideBtn">View Hub Profile</button>
    </section>
  );
}

function OperationsWorkspace() {
  const activeRole = getActiveHubRole();
  const visibleWorkspaceTiles = workspaceTiles.filter(([, , path]) => isHubItemVisibleForRole(path, activeRole));

  return (
    <section className="hubV1-card hubV1-operations" data-tour="hub-workspace-operations">
      <div className="hubV1-sectionHead">
        <div>
          <h2>▦ Hub Operations Workspace</h2>
          <p>Coordinate partners, manage referrals, and close gaps across the network.</p>
        </div>
        <button>⚙ Customize</button>
      </div>

      <div className="hubV1-tileGrid" data-tour="hub-workspace-tiles">
        {visibleWorkspaceTiles.map(([label, icon, path, count, state]) => (
          <button
            key={label}
            type="button"
            className={`hubV1-tile ${state === "advanced" ? "is-advanced" : ""}`}
            onClick={() => go(path)}
          >
            <span>{icon}</span>
            <strong>{label}</strong>
            {count ? <b>{count}</b> : null}
            {state === "advanced" ? <em>ADVANCED</em> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function RecentActivity() {
  return (
    <section className="hubV1-card hubV1-activity" data-tour="hub-workspace-activity">
      <div className="hubV1-sectionHead">
        <div>
          <h2>▤ Recent Hub Activity</h2>
        </div>
        <button>View All Activity →</button>
      </div>

      <table className="hubV1-table">
        <thead>
          <tr>
            <th></th>
            <th>Activity</th>
            <th>Partner / Source</th>
            <th>Date & Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {activityRows.map((row) => (
            <tr key={`${row[1]}-${row[3]}`}>
              <td><span className={`hubV1-rowIcon ${row[4]}`}>{row[0]}</span></td>
              <td><strong>{row[1]}</strong></td>
              <td>{row[2]}</td>
              <td>{row[3]}</td>
              <td><b className={`hubV1-status ${row[4]}`}>{row[4]}</b></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="hubV1-foot">Showing 1 to 3 of 28 activities <span>View All Activity →</span></div>
    </section>
  );
}

function DonutCards() {
  return (
    <div className="hubV1-miniGrid" data-tour="hub-workspace-mini-metrics">
      <section className="hubV1-card hubV1-mini">
        <div className="hubV1-sectionHead mini">
          <h2>◔ Referral Aging</h2>
          <button>View Details →</button>
        </div>
        <div className="hubV1-miniBody">
          <div className="hubV1-donut"><span><strong>3</strong><small>Total Open</small></span></div>
          <div className="hubV1-legend">
            <div><i className="green"></i><span>0–7 days</span><b>28</b><em>48%</em></div>
            <div><i className="gold"></i><span>8–14 days</span><b>17</b><em>29%</em></div>
            <div><i className="orange"></i><span>15–30 days</span><b>9</b><em>16%</em></div>
            <div><i className="red"></i><span>30+ days</span><b>4</b><em>7%</em></div>
          </div>
        </div>
      </section>

      <section className="hubV1-card hubV1-mini">
        <div className="hubV1-sectionHead mini">
          <h2>⊖ Capacity Strain</h2>
          <button>View Details →</button>
        </div>
        <div className="hubV1-miniBody">
          <div className="hubV1-gauge"><span><strong>2</strong><small>Partners High Strain</small></span></div>
          <div className="hubV1-legend compact">
            <div><i className="red"></i><span>High Strain</span><b>2</b></div>
            <div><i className="orange"></i><span>Moderate Strain</span><b>4</b></div>
            <div><i className="green"></i><span>Stable</span><b>18</b></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Notifications() {
  return (
    <section className="hubV1-card hubV1-rightCard" data-tour="hub-workspace-notifications">
      <div className="hubV1-sectionHead">
        <h2>🔔 Notifications</h2>
        <button>View All →</button>
      </div>
      {notifications.map(([icon, title, body, time, tone]) => (
        <div className="hubV1-note" key={title}>
          <span className={`hubV1-noteIcon ${tone}`}>{icon}</span>
          <div>
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
          <time>{time}</time>
        </div>
      ))}
    </section>
  );
}

function Agenda() {
  return (
    <section className="hubV1-card hubV1-rightCard">
      <div className="hubV1-sectionHead">
        <h2 data-tour="hub-workspace-agenda">📅 Today's Agenda</h2>
        <button>Open Calendar →</button>
      </div>
      {agenda.map(([time, title, meta]) => (
        <div className="hubV1-agenda" key={title}>
          <strong>{time}</strong>
          <div>
            <b>{title}</b>
            <p>{meta}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function Community() {
  return (
    <section className="hubV1-card hubV1-rightCard">
      <div className="hubV1-sectionHead">
        <h2 data-tour="hub-workspace-community">👥 Recent Community Activity</h2>
        <button>View All →</button>
      </div>
      {community.map(([icon, title, body, value, tone]) => (
        <div className="hubV1-community" key={title}>
          <span>{icon}</span>
          <div>
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
          <b className={`hubV1-chip hubV1-chip--${tone}`}>{value}</b>
        </div>
      ))}
    </section>
  );
}


function AdaptiveExperienceCard({ adaptive }) {
  const score = adaptive.experienceScore || {};
  const topFeature = adaptive.featureUsageMap?.[0];
  const frictionCount = adaptive.frictionSignals?.length || 0;
  const nextRecommendation = adaptive.recommendations?.[0];

  return (
    <section className="hubV1-card hubV1-rightCard hubV1-adaptiveCard" data-tour="hub-workspace-adaptive">
      <div className="hubV1-sectionHead">
        <div>
          <h2>◇ Adaptive Experience</h2>
          <p>Learning how operators use this dashboard.</p>
        </div>
      </div>

      <div className="hubV1-adaptiveScore">
        <span>Experience Score</span>
        <strong>{score.score || 0}</strong>
        <b>{score.grade || "No Data"}</b>
      </div>

      <div className="hubV1-adaptiveRows">
        <div>
          <span>Events Captured</span>
          <strong>{adaptive.summary?.totalEvents || 0}</strong>
        </div>
        <div>
          <span>Top Used Feature</span>
          <strong>{topFeature?.target || "Collecting data"}</strong>
        </div>
        <div>
          <span>Friction Signals</span>
          <strong>{frictionCount}</strong>
        </div>
      </div>

      <div className="hubV1-adaptiveMemo">
        <span>Next-Version Recommendation</span>
        <p>{nextRecommendation?.recommendation || "Continue collecting usage data before changing the dashboard."}</p>
      </div>
    </section>
  );
}

export default function HubWorkspaceDashboard() {
  const adaptive = useAdaptiveExperience({
    surface: ADAPTIVE_SURFACES.HUB_WORKSPACE_DASHBOARD,
    role: ADAPTIVE_ROLES.HUB_OPERATOR,
    dashboardVersion: "hub_workspace_v1",
  });

  useEffect(() => {
    adaptive.track({
      eventType: ADAPTIVE_EVENT_TYPES.PAGE_VIEWED,
      target: "hub_workspace_dashboard",
    });
  }, []);

  function handleAdaptiveClickCapture(event) {
    const tile = event.target.closest?.(".hubV1-tile");
    const navItem = event.target.closest?.(".hubV1-navItem");
    const card = event.target.closest?.(".hubV1-card");
    const button = event.target.closest?.("button");

    if (tile) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.CARD_CLICKED,
        target: tile.innerText?.trim()?.slice(0, 80) || "hub_workspace_tile",
      });
      return;
    }

    if (navItem) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED,
        target: navItem.innerText?.trim()?.slice(0, 80) || "hub_nav_item",
      });
      return;
    }

    if (button) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.BUTTON_CLICKED,
        target: button.innerText?.trim()?.slice(0, 80) || "hub_button",
      });
      return;
    }

    if (card) {
      adaptive.track({
        eventType: ADAPTIVE_EVENT_TYPES.CARD_CLICKED,
        target:
          card.querySelector("h2, .hubV1-cardTitle")?.innerText?.trim()?.slice(0, 80) ||
          "hub_dashboard_card",
      });
    }
  }

  return (
    <HubBusinessTourProvider pageKey="workspace">
      <main className="hubV1-shell" onClickCapture={handleAdaptiveClickCapture}>
      <Rail />

      <section className="hubV1-page">
        <Header />

        <AccessRedirectNotice />

        <section className="hubV1-kpiRow" data-tour="hub-workspace-kpis">
          {kpis.map((item) => <KpiCard key={item.label} item={item} />)}
        </section>

        <GuidedWorkflowLauncher adaptive={adaptive} />

        <section className="hubV1-dashboardGrid">
          <NetworkSnapshot />

          <div className="hubV1-centerStack">
            <OperationsWorkspace />
            <RecentActivity />
            <DonutCards />
          </div>

          <div className="hubV1-rightStack">
            <Notifications />
            <Agenda />
            <Community />
          </div>
        </section>
      </section>
      </main>
    </HubBusinessTourProvider>
  );
}
