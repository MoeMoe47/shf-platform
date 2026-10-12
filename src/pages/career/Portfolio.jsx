// src/pages/career/Portfolio.jsx
//
// Student Portfolio presentation surface. Canonical artifacts, learning
// results, skill profile, credential display, and visibility controls remain
// evidence-backed; student-authored profile material stays clearly separate.
import React from "react";

import { useUser } from "@/context/UserContext.jsx";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";
import { markDarkScope } from "../../utils/careerTheme.js";
import { getPortfolio, updatePortfolioArtifact, updatePortfolioProfile } from "@/lib/portfolio/api.js";
import { listMyCredentials } from "@/lib/credentials/api.js";

import PortfolioHeader from "./portfolio-sections/PortfolioHeader.jsx";
import StudentProfileHero from "./portfolio-sections/StudentProfileHero.jsx";
import AvatarUploader from "./portfolio-sections/AvatarUploader.jsx";
import FeaturedProjects from "./portfolio-sections/FeaturedProjects.jsx";
import CredentialsBadges from "./portfolio-sections/CredentialsBadges.jsx";
import InterviewPractice from "./portfolio-sections/InterviewPractice.jsx";
import StudentAbout from "./portfolio-sections/StudentAbout.jsx";

import "@/styles/portfolio-durable.css";

const PREVIEW_PROJECTS = [
  {
    title: "Data Center Operations Plan",
    summary: "Created an operations plan for a regional data center with focus on uptime, safety, and sustainability.",
    tags: ["Teamwork", "Operations"],
    meta: ["Report", "Team Project"],
    image: "/assets/data_pic/ChatGPT Image Sep 25, 2026, 03_31_31 AM (1).png",
  },
  {
    title: "Network Infrastructure Lab",
    summary: "Designed and documented a small-scale network using industry best practices and safety protocols.",
    tags: ["Networking", "Safety"],
    meta: ["Lab Report", "Individual"],
    image: "/assets/data_pic/ChatGPT Image Sep 25, 2026, 03_31_32 AM (5).png",
  },
  {
    title: "Community Tech Showcase",
    summary: "Presented how data centers support local jobs and economic growth in the Silicon Heartland.",
    tags: ["Presentation", "Problem Solving"],
    meta: ["Presentation", "Team Project"],
    image: "/assets/data_pic/ChatGPT Image Sep 25, 2026, 03_31_33 AM (10).png",
  },
];

const PREVIEW_EVIDENCE = [
  ["Data Center Safety Assessment", "Report", "Curriculum", "Verified", "Oct 14, 2024"],
  ["Network Configuration Lab", "Lab Work", "Learning Arcade", "Verified", "Oct 3, 2024"],
  ["Community Impact Presentation", "Presentation", "Metaverse Experience", "In Review", "Sep 28, 2024"],
  ["Data Center Career Interview (Mock)", "Video", "Interview Practice", "Practice", "Sep 20, 2024"],
  ["Reflective Essay: My Career Goals", "Reflection", "Portfolio", "Submitted", "Sep 12, 2024"],
];

const PREVIEW_SKILLS = [
  ["Communication", 88],
  ["Reliability", 92],
  ["Safety Culture", 85],
  ["Teamwork", 90],
  ["Digital & AI Literacy", 80],
  ["Problem Solving", 86],
];

const PREVIEW_CREDENTIALS = [
  ["Data Center Foundations", "orange"],
  ["Safety First", "blue"],
  ["Networking Essentials", "green"],
  ["Community Impact", "purple"],
];

function isDesignPreviewMode() {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  const hashQuery = window.location.hash.includes("?") ? window.location.hash.slice(window.location.hash.indexOf("?") + 1) : "";
  const params = new URLSearchParams(hashQuery || window.location.search);
  return params.get("preview") === "design";
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "evidence", label: "Evidence" },
  { id: "skills", label: "Skills & Credentials" },
  { id: "readiness", label: "Portfolio Progress" },
  { id: "activity", label: "Activity" },
];

function statusLabel(status) {
  return status === "ACTIVE" ? "Verified Work" : status;
}

function verifiedCount(items) {
  return items.filter((item) => /verified|accepted|issued/i.test(String(item.verificationStatus || item.status || item.lifecycle || ""))).length;
}

function ArtifactControls({ artifact, role, onSaved }) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [draft, setDraft] = React.useState(() => artifact.presentation || {});

  React.useEffect(() => {
    setDraft(artifact.presentation || {});
  }, [artifact.presentation]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updatePortfolioArtifact(role, artifact.artifactId, draft);
      setEditing(false);
      onSaved(updated);
    } catch {
      setError("We could not save this presentation. Your verified source is unchanged.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status) {
    setSaving(true);
    setError("");
    try {
      onSaved(await updatePortfolioArtifact(role, artifact.artifactId, { status }));
    } catch {
      setError("We could not update this Portfolio item. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="portfolio-v1-artifactControls">
      <p className="portfolio-v1-provenance">
        Connected to finalized Studio work. Portfolio presentation does not change Evidence, completion, deployment, or credentials.
      </p>
      {artifact.presentation?.reflection && <p className="portfolio-v1-reflection">{artifact.presentation.reflection}</p>}
      {editing ? (
        <form className="portfolio-v1-edit" onSubmit={save}>
          <label>
            Project title
            <input value={draft.title || ""} maxLength={200} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <label>
            Summary
            <textarea value={draft.summary || ""} maxLength={1000} rows="3" onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
          </label>
          <label>
            Reflection
            <textarea value={draft.reflection || ""} maxLength={4000} rows="4" onChange={(event) => setDraft({ ...draft, reflection: event.target.value })} />
          </label>
          <label>
            Visibility
            <select value={draft.visibility || "PRIVATE"} onChange={(event) => setDraft({ ...draft, visibility: event.target.value })}>
              <option value="PRIVATE">Private</option>
              <option value="ORGANIZATION">Visible to My Organization</option>
            </select>
          </label>
          {error && <p className="portfolio-v1-error" role="alert">{error}</p>}
          <div className="portfolio-v1-actions">
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Presentation"}</button>
            <button type="button" className="portfolio-v1-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="portfolio-v1-actions">
          <button type="button" onClick={() => setEditing(true)}>Edit Presentation</button>
          <button type="button" className="portfolio-v1-secondary" disabled={saving} onClick={() => changeStatus(artifact.status === "HIDDEN" ? "ACTIVE" : "HIDDEN")}>
            {artifact.status === "HIDDEN" ? "Show" : "Hide"}
          </button>
          <button type="button" className="portfolio-v1-secondary" disabled={saving} onClick={() => changeStatus("ARCHIVED")}>Archive</button>
          <button type="button" className="portfolio-v1-linkButton" disabled={saving} onClick={() => changeStatus("REMOVED")}>Remove from Portfolio</button>
        </div>
      )}
      {!editing && error && <p className="portfolio-v1-error" role="alert">{error}</p>}
    </div>
  );
}

function PortfolioTabs({ activeTab, onChange }) {
  const tabRefs = React.useRef([]);

  function onKeyDown(event, index) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;
    onChange(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="sp-tabs" role="tablist" aria-label="Portfolio sections">
      {TABS.map((tab, index) => (
        <button
          key={tab.id}
          ref={(node) => { tabRefs.current[index] = node; }}
          type="button"
          id={`sp-tab-${tab.id}`}
          className="sp-tab"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`sp-panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TabPanel({ id, activeTab, children }) {
  const active = activeTab === id;
  return (
    <section
      id={`sp-panel-${id}`}
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={`sp-tab-${id}`}
      hidden={!active}
      className="sp-tabPanel"
    >
      {active ? children : null}
    </section>
  );
}

function LearningResults({ items }) {
  if (!items.length) {
    return (
      <section className="sp-card sp-section" aria-labelledby="portfolio-v1-learning-heading">
        <h2 id="portfolio-v1-learning-heading" className="sp-cardTitle">Learning Results</h2>
        <p className="sp-cardEmpty">No canonical Curriculum outcomes are available for this Portfolio yet.</p>
      </section>
    );
  }
  return (
    <section className="sp-card sp-section" aria-labelledby="portfolio-v1-learning-heading">
      <div className="sp-cardHeadRow">
        <div>
          <p className="sp-eyebrow">Canonical Curriculum outcomes</p>
          <h2 id="portfolio-v1-learning-heading" className="sp-cardTitle">Learning Results</h2>
        </div>
      </div>
      <p className="portfolio-v1-meta">Verification status is shown separately from academic mastery.</p>
      <div className="portfolio-v1-grid">
        {items.map((item) => (
          <article className="portfolio-v1-card" key={item.entryId}>
            <div className="portfolio-v1-cardHeader">
              <div>
                <p className="portfolio-v1-kicker">Curriculum result</p>
                <h3>{item.competencyId || item.lessonStableKey || "Learning result"}</h3>
              </div>
              <span className="portfolio-v1-status">{item.verificationStatus}</span>
            </div>
            <p className="portfolio-v1-meta">Mastery: {item.masteryStatus} · Outcome: {item.outcomeType}</p>
            <p className="portfolio-v1-provenance">Source outcome {item.outcomeId}. This projection does not issue credentials or create institutional Truth.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceTable({ artifacts, learnerResults }) {
  const rows = [
    ...artifacts.filter((artifact) => artifact.status !== "REMOVED").map((artifact) => ({
      id: artifact.artifactId,
      title: artifact.presentation?.title || "Portfolio artifact",
      source: artifact.provenance?.sourceType || "Portfolio",
      type: artifact.provenance?.projectType || "Artifact",
      status: statusLabel(artifact.status),
      date: artifact.updatedAt || artifact.createdAt,
    })),
    ...learnerResults.map((item) => ({
      id: item.entryId,
      title: item.competencyId || item.lessonStableKey || "Learning result",
      source: "Curriculum",
      type: item.outcomeType || "Outcome",
      status: item.verificationStatus || item.masteryStatus || "Recorded",
      date: item.updatedAt || item.createdAt,
    })),
  ];

  return (
    <section className="sp-card sp-section" aria-labelledby="sp-evidence-h">
      <div className="sp-cardHeadRow">
        <div>
          <p className="sp-eyebrow">Verified work</p>
          <h2 id="sp-evidence-h" className="sp-cardTitle">Evidence &amp; Verified Work</h2>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="sp-cardEmpty">No submitted, reviewed, or verified Portfolio evidence is available yet.</p>
      ) : (
        <div className="sp-tableWrap">
          <table className="sp-recordTable">
            <thead>
              <tr>
                <th scope="col">Record</th>
                <th scope="col">Source</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.source}</td>
                  <td>{row.type}</td>
                  <td><span className="sp-statusPill is-complete">{row.status}</span></td>
                  <td>{row.date ? new Date(row.date).toLocaleDateString() : "Unavailable"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SkillProfile({ skills }) {
  function percentFor(skill) {
    const value = Number(skill.masteryPercent ?? skill.percent ?? skill.scorePercent);
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
  }

  return (
    <section className="sp-card sp-section" aria-labelledby="portfolio-v1-skills-heading">
      <div className="sp-cardHeadRow">
        <div>
          <p className="sp-eyebrow">Competency Registry projection</p>
          <h2 id="portfolio-v1-skills-heading" className="sp-cardTitle">Skill Profile</h2>
        </div>
      </div>
      {skills.length === 0 ? (
        <p className="sp-cardEmpty">No verified competency signals are available yet.</p>
      ) : (
        <div className="sp-skillList">
          {skills.map((skill) => (
            <article className="sp-skillRow" key={skill.competencyId}>
              <div>
                <h3>{skill.competencyTitle || skill.competencyId}</h3>
                <p>Mastery: {skill.masteryStatus} · Verification: {skill.verificationStatus}</p>
                {percentFor(skill) != null && (
                  <span className="sp-skillBar" aria-label={`${skill.competencyTitle || skill.competencyId} mastery ${percentFor(skill)} percent`}>
                    <span style={{ width: `${percentFor(skill)}%` }} />
                  </span>
                )}
              </div>
              <span className="sp-statusPill is-review">{percentFor(skill) == null ? "Evidence-linked" : `${percentFor(skill)}%`}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PortfolioProgress({ learnerResults, artifacts, learningProgress }) {
  const curriculumCount = learnerResults.length;
  const evidenceCount = artifacts.filter((artifact) => artifact.status !== "REMOVED").length;
  const verifiedResults = verifiedCount(learnerResults);
  const hasCurriculumProgress = learningProgress && Number.isFinite(Number(learningProgress.totalLessons));
  const curriculumSummary = hasCurriculumProgress
    ? `${learningProgress.completedLessons || 0}/${learningProgress.totalLessons || 0} assigned lessons complete${learningProgress.courseCount ? ` across ${learningProgress.courseCount} course${learningProgress.courseCount === 1 ? "" : "s"}` : ""}`
    : (curriculumCount ? `${curriculumCount} recorded result${curriculumCount === 1 ? "" : "s"}` : "No recorded Curriculum result yet");
  const rows = [
    ["Curriculum", curriculumSummary, true, (hasCurriculumProgress ? Number(learningProgress.completedLessons || 0) > 0 : curriculumCount > 0) ? "complete" : "pending"],
    ["Learning Arcade", "Optional experience. No authoritative progress source is connected here.", false, "optional"],
    ["Metaverse", "Optional experience. No authoritative progress source is connected here.", false, "optional"],
    ["Evidence", evidenceCount ? `${evidenceCount} Portfolio artifact${evidenceCount === 1 ? "" : "s"}` : "No evidence-backed artifact yet", true, evidenceCount > 0 ? "complete" : "pending"],
    ["Verification", verifiedResults ? `${verifiedResults} verified signal${verifiedResults === 1 ? "" : "s"}` : "No verified signal yet", true, verifiedResults > 0 ? "complete" : "pending"],
    ["Career Connection", "Career Registry connection is unavailable in this Portfolio contract.", false, "pending"],
  ];

  return (
    <section className="sp-card sp-section" aria-labelledby="sp-readiness-h">
      <div className="sp-cardHeadRow">
        <div>
          <p className="sp-eyebrow">Progress without overclaiming</p>
          <h2 id="sp-readiness-h" className="sp-cardTitle">Portfolio Progress</h2>
        </div>
      </div>
      <p className="sp-note">This is a presentation checklist, not a career-readiness score or credential-readiness decision.</p>
      <div className="sp-readinessJourney">
        {rows.map(([label, value, supported, state], index) => (
          <article key={label} className={`sp-readinessStep is-${state}`}>
            <div className="sp-readinessMarker" aria-hidden="true">{state === "complete" ? "✓" : index + 1}</div>
            <span>{label}</span>
            <strong>{supported ? "Supported" : "Unavailable"}</strong>
            <p>{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function VisibilityPanel({ artifacts }) {
  const orgVisible = artifacts.filter((artifact) => artifact.presentation?.visibility === "ORGANIZATION" && artifact.status !== "REMOVED").length;
  return (
    <section className="sp-card sp-section" aria-labelledby="sp-visibility-h">
      <h2 id="sp-visibility-h" className="sp-cardTitle">Portfolio Visibility</h2>
      <div className="sp-policyList">
        <p><strong>Student/private:</strong> Default visibility. The student controls presentation fields.</p>
        <p><strong>Authorized instructor access:</strong> {orgVisible ? `${orgVisible} artifact${orgVisible === 1 ? "" : "s"} visible to the organization.` : "No artifacts are currently marked organization-visible."}</p>
        <p><strong>Employer access:</strong> Not enabled here. Employer sharing requires explicit approval and consent.</p>
      </div>
    </section>
  );
}

function AccessibilitySupports() {
  return (
    <section className="sp-card sp-section" aria-labelledby="sp-supports-h">
      <h2 id="sp-supports-h" className="sp-cardTitle">Accessibility &amp; Supports</h2>
      <p className="sp-cardEmpty">
        Accessibility preferences are private. Sensitive accommodations are not displayed on public or employer-shared profiles.
      </p>
      <a className="sp-viewLink" href="/curriculum.html#/curriculum/accessibility">Open private accessibility settings</a>
    </section>
  );
}

function NextBestActions({ artifacts, learnerResults }) {
  const actions = [];
  if (!artifacts.length) actions.push(["Add eligible artifact", "/curriculum.html#/studio/projects"]);
  if (artifacts.some((artifact) => !artifact.presentation?.reflection)) actions.push(["Complete pending reflection", "#sp-panel-projects"]);
  if (learnerResults.some((item) => !/verified/i.test(String(item.verificationStatus || "")))) actions.push(["Request authorized verification", "/curriculum.html#/curriculum/asl/portfolio"]);
  actions.push(["Explore career opportunities", "/career.html#/opportunities"]);

  return (
    <section className="sp-card sp-section" aria-labelledby="sp-next-h">
      <h2 id="sp-next-h" className="sp-cardTitle">Next Best Actions</h2>
      <div className="sp-actionList">
        {actions.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
      </div>
    </section>
  );
}

function ActivityPanel({ artifacts, learnerResults }) {
  const activity = [
    ...artifacts.filter((artifact) => artifact.status !== "REMOVED").map((artifact) => ({
      id: artifact.artifactId,
      label: artifact.presentation?.title || "Portfolio artifact",
      meta: `${statusLabel(artifact.status)} · ${artifact.updatedAt ? new Date(artifact.updatedAt).toLocaleDateString() : "Date unavailable"}`,
    })),
    ...learnerResults.map((item) => ({
      id: item.entryId,
      label: item.competencyId || item.lessonStableKey || "Learning result",
      meta: `${item.masteryStatus || "Recorded"} · ${item.verificationStatus || "Verification unavailable"}`,
    })),
  ];

  return (
    <section className="sp-card sp-section" aria-labelledby="sp-activity-h">
      <h2 id="sp-activity-h" className="sp-cardTitle">Activity</h2>
      {activity.length === 0 ? (
        <p className="sp-cardEmpty">No Portfolio activity is available yet.</p>
      ) : (
        <ol className="sp-activityList">
          {activity.map((item) => (
            <li key={item.id}>
              <strong>{item.label}</strong>
              <span>{item.meta}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function Portfolio() {
  if (isDesignPreviewMode()) return <PortfolioDesignPreview />;
  return <PortfolioLive />;
}

function PreviewHeader({ onShare, onExport, shareStatus }) {
  return (
    <header className="sp-header sp-previewHeader">
      <div className="sp-headerCopy">
        <nav className="sp-breadcrumb" aria-label="Breadcrumb">
          <a href="/career.html#/portfolio?preview=design">Portfolio</a>
          <span aria-hidden="true">›</span>
          <span>Jordan Ellis</span>
        </nav>
        <div className="sp-titleRow">
          <span className="sp-titleIcon" aria-hidden="true">✣</span>
          <h1 id="portfolio-v1-heading" className="sp-h1">Student Portfolio</h1>
        </div>
        <p className="sp-subtitle">Evidence-backed learner profile across curriculum, projects, skills, credentials, and verified achievements.</p>
      </div>
      <div className="sp-previewMotto" aria-hidden="true">
        <span>Skilled people</span>
        <span>Thriving communities</span>
        <span>A stronger America.</span>
      </div>
      <div className="sp-headerControls">
        <span className="sp-previewBadge">Design Preview — Sample Data</span>
        <button type="button" className="sp-btn sp-btnPrimary" onClick={onShare}>Share Portfolio</button>
        <button type="button" className="sp-btn sp-btnSecondary" onClick={onExport}>Export PDF</button>
        <span className="sp-shareStatus" role="status" aria-live="polite">{shareStatus}</span>
      </div>
    </header>
  );
}

function PreviewHero({ editOpen, onToggleEdit }) {
  return (
    <section className="sp-card sp-hero sp-previewHero" aria-labelledby="sp-hero-name">
      <div className="sp-previewPhotoStack">
        <div className="sp-previewPortrait" role="img" aria-label="Sample student portrait for design preview">
          <span aria-hidden="true">JE</span>
        </div>
        <button type="button" className="sp-previewPhotoButton" aria-expanded={editOpen} aria-controls="sp-edit-panel" onClick={onToggleEdit}>
          Change Photo
        </button>
      </div>
      <div className="sp-heroText sp-previewHeroText">
        <h2 id="sp-hero-name" className="sp-heroName">Jordan Ellis <span className="sp-previewVerified" aria-label="Sample verified indicator">●</span></h2>
        <p className="sp-heroRole">Data Center Readiness Pathway</p>
        <div className="sp-previewFacts" aria-label="Sample profile details">
          <span>Springfield, IL</span>
          <span>11th Grade</span>
          <span>Riverton High School</span>
        </div>
        <p className="sp-heroIntro">“I'm excited to build a career in data centers and contribute to the infrastructure that keeps communities connected.”</p>
      </div>
      <div className="sp-heroStats">
        {[
          ["86%", "Portfolio Strength", "▥"],
          ["12", "Verified Artifacts", "▤"],
          ["18", "Skills Verified", "▧"],
          ["4", "Credentials", "◉"],
        ].map(([value, label, icon]) => (
          <div className="sp-heroStat" key={label}>
            <span className="sp-heroStatIcon" aria-hidden="true">{icon}</span>
            <span className="sp-heroStatValue">{value}</span>
            <span className="sp-heroStatLabel">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PreviewProjectCards() {
  return (
    <section className="sp-card sp-previewCompact" aria-labelledby="sp-projects-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-projects-h" className="sp-cardTitle">Featured Projects</h2>
        <span className="sp-cardMeta">View All</span>
      </div>
      <ul className="sp-projectList sp-previewProjectList">
        {PREVIEW_PROJECTS.map((project) => (
          <li className="sp-projectRow sp-previewProject" key={project.title}>
            <img className="sp-projectThumb" src={project.image} alt="" />
            <div className="sp-techTags">
              {project.tags.map((tag) => <span key={tag} className="sp-techTag">{tag}</span>)}
            </div>
            <h3 className="sp-projectTitle">{project.title}</h3>
            <p className="sp-projectDesc">{project.summary}</p>
            <div className="sp-previewProjectMeta">
              {project.meta.map((item) => <span key={item}>{item}</span>)}
              <span className="sp-projectNav is-disabled" aria-disabled="true">›</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PreviewEvidenceTable() {
  return (
    <section className="sp-card sp-previewCompact" aria-labelledby="sp-evidence-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-evidence-h" className="sp-cardTitle">Evidence &amp; Verified Work</h2>
        <span className="sp-cardMeta">View All</span>
      </div>
      <div className="sp-tableWrap">
        <table className="sp-recordTable sp-previewTable">
          <thead><tr><th>Title</th><th>Type</th><th>Source</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {PREVIEW_EVIDENCE.map(([title, type, source, status, date]) => (
              <tr key={title}>
                <td>{title}</td><td>{type}</td><td>{source}</td>
                <td><span className={`sp-statusPill ${status === "Verified" ? "is-complete" : "is-review"}`}>{status}</span></td>
                <td>{date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PreviewSkills() {
  return (
    <section className="sp-card sp-previewCompact" aria-labelledby="preview-skills">
      <div className="sp-cardHeadRow">
        <h2 id="preview-skills" className="sp-cardTitle">Skill Profile</h2>
        <span className="sp-cardMeta">View All</span>
      </div>
      <div className="sp-previewSkillList">
        {PREVIEW_SKILLS.map(([label, value]) => (
          <div className="sp-previewSkill" key={label}>
            <span>{label}</span>
            <span className="sp-skillBar" aria-label={`${label} sample score ${value} percent`}><span style={{ width: `${value}%` }} /></span>
            <strong>{value}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function PreviewCredentials() {
  return (
    <section className="sp-card sp-previewCompact" aria-labelledby="preview-credentials">
      <div className="sp-cardHeadRow">
        <h2 id="preview-credentials" className="sp-cardTitle">Credentials &amp; Badges</h2>
        <span className="sp-cardMeta">View All</span>
      </div>
      <div className="sp-previewBadgeGrid">
        {PREVIEW_CREDENTIALS.map(([label, tone]) => (
          <div className={`sp-previewCred is-${tone}`} key={label}>
            <span aria-hidden="true">◆</span>
            <strong>{label}</strong>
            <small>SHU</small>
          </div>
        ))}
      </div>
      <p className="sp-previewDisclaimer">Sample credentials for design preview only. Not issued or verified.</p>
    </section>
  );
}

function PreviewSupports() {
  return (
    <section className="sp-card sp-previewCompact" aria-labelledby="preview-supports">
      <div className="sp-cardHeadRow">
        <h2 id="preview-supports" className="sp-cardTitle">Accessibility &amp; Supports</h2>
        <button type="button" className="sp-previewMiniButton">Edit</button>
      </div>
      <ul className="sp-previewCheckList">
        <li>No formal accommodations at this time</li>
        <li>Has access to extended time for assessments as needed</li>
        <li>Connected with school counselor and SHU support team</li>
      </ul>
    </section>
  );
}

function PreviewVisibility() {
  return (
    <section className="sp-card sp-previewCompact" aria-labelledby="preview-visibility">
      <div className="sp-cardHeadRow">
        <h2 id="preview-visibility" className="sp-cardTitle">Portfolio Visibility</h2>
        <button type="button" className="sp-previewMiniButton">Manage</button>
      </div>
      <div className="sp-previewVisibilityGrid">
        <span><strong>Student</strong><small>Full Access</small></span>
        <span><strong>Instructor</strong><small>View &amp; Verify</small></span>
        <span><strong>Employer</strong><small>View Approved</small></span>
      </div>
      <p className="sp-cardEmpty">Sample visibility states for preview only.</p>
    </section>
  );
}

function PreviewNextActions() {
  return (
    <section className="sp-card sp-previewCompact" aria-labelledby="preview-actions">
      <div className="sp-cardHeadRow">
        <h2 id="preview-actions" className="sp-cardTitle">Next Best Actions</h2>
        <span className="sp-cardMeta">View All</span>
      </div>
      <div className="sp-actionList">
        <button type="button">Upload profile picture <span>Recommended</span></button>
        <button type="button">Complete reflection for Network Infrastructure Lab</button>
        <button type="button">Add capstone project artifact</button>
        <button type="button">Request instructor verification</button>
      </div>
    </section>
  );
}

function PreviewReadiness() {
  const steps = [
    ["Curriculum", "Complete", "6/6 Units", "complete"],
    ["Learning Arcade", "Complete", "12/12 Challenges", "complete"],
    ["Metaverse Experience", "Complete", "3/3 Experiences", "complete"],
    ["Evidence", "In Progress", "12/15 artifacts", "optional"],
    ["Verification", "Pending", "Instructor Review", "pending"],
    ["Career Connection", "Upcoming", "Explore Opportunities", "pending"],
  ];
  return (
    <section className="sp-card sp-previewCompact" aria-labelledby="preview-readiness">
      <div className="sp-cardHeadRow">
        <h2 id="preview-readiness" className="sp-cardTitle">Portfolio Progress</h2>
        <span className="sp-cardMeta">View Details</span>
      </div>
      <div className="sp-readinessJourney">
        {steps.map(([label, status, meta, state], index) => (
          <article key={label} className={`sp-readinessStep is-${state}`}>
            <div className="sp-readinessMarker" aria-hidden="true">{state === "complete" ? "✓" : index + 1}</div>
            <span>{label}</span>
            <strong>{status}</strong>
            <p>{meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PreviewInterview() {
  return (
    <section className="sp-card sp-previewCompact sp-previewInterview" aria-labelledby="preview-interview">
      <div className="sp-cardHeadRow">
        <h2 id="preview-interview" className="sp-cardTitle">Interview Practice</h2>
        <span className="sp-cardMeta">View All</span>
      </div>
      <div className="sp-previewInterviewGrid">
        <div className="sp-previewScore"><span>84%</span><small>Latest Mock Interview Score</small></div>
        <div><strong>Key Strengths</strong><p>Clear and confident communication<br />Strong real-world examples<br />Positive and professional attitude</p></div>
        <div><strong>Areas for Improvement</strong><p>Provide more specific technical details<br />Practice shorter, more focused answers</p></div>
      </div>
      <p className="sp-previewDisclaimer">Sample interview practice only. Not an institutional assessment.</p>
    </section>
  );
}

function PortfolioDesignPreview() {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [editOpen, setEditOpen] = React.useState(false);
  const [about, setAbout] = React.useState("I'm a curious and hard-working student who enjoys solving real-world problems through technology. I'm most interested in data centers, networking, and how infrastructure keeps our communities connected. I work well in teams, take pride in doing things the right way, and I'm excited to keep building my skills through SHU.");
  const [editingAbout, setEditingAbout] = React.useState(false);
  const [shareStatus, setShareStatus] = React.useState("");

  React.useEffect(() => {
    markDarkScope("student-portfolio", true);
    markDarkScope("resume-builder", true);
    return () => {
      markDarkScope("student-portfolio", false);
      markDarkScope("resume-builder", false);
    };
  }, []);

  function handleShare() {
    setShareStatus("Preview link ready. Sample data is not shareable as verified student evidence.");
  }

  function handleExport() {
    setShareStatus("Preview export uses browser print only and does not create a student record.");
    window.print();
  }

  return (
    <main className="sp-page sp-previewPage" aria-labelledby="portfolio-v1-heading">
      <PreviewHeader onShare={handleShare} onExport={handleExport} shareStatus={shareStatus} />
      <PreviewHero editOpen={editOpen} onToggleEdit={() => setEditOpen((value) => !value)} />
      {editOpen && (
        <div id="sp-edit-panel" className="sp-card sp-previewNotice" style={{ marginTop: 16 }}>
          Photo changes are browser-only in design preview and never write to profile storage.
        </div>
      )}
      <PortfolioTabs activeTab={activeTab} onChange={setActiveTab} />

      <TabPanel id="overview" activeTab={activeTab}>
        <div className="sp-dashboardGrid">
          <div className="sp-mainColumn">
            <section className="sp-card sp-previewCompact" aria-labelledby="preview-about">
              <div className="sp-cardHeadRow">
                <h2 id="preview-about" className="sp-cardTitle">About Me</h2>
                <button type="button" className="sp-previewMiniButton" onClick={() => setEditingAbout((value) => !value)}>{editingAbout ? "Done" : "Edit"}</button>
              </div>
              {editingAbout ? (
                <textarea className="sp-notesInput" value={about} onChange={(event) => setAbout(event.target.value)} aria-label="Sample about me text" />
              ) : (
                <p className="sp-aboutText">{about}</p>
              )}
            </section>
            <PreviewProjectCards />
            <PreviewEvidenceTable />
            <PreviewReadiness />
            <PreviewInterview />
          </div>
          <aside className="sp-sideColumn" aria-label="Portfolio intelligence">
            <PreviewSkills />
            <PreviewCredentials />
            <PreviewSupports />
            <PreviewVisibility />
            <PreviewNextActions />
          </aside>
        </div>
      </TabPanel>
      <TabPanel id="projects" activeTab={activeTab}><PreviewProjectCards /></TabPanel>
      <TabPanel id="evidence" activeTab={activeTab}><PreviewEvidenceTable /></TabPanel>
      <TabPanel id="skills" activeTab={activeTab}><PreviewSkills /><PreviewCredentials /></TabPanel>
      <TabPanel id="readiness" activeTab={activeTab}><PreviewReadiness /></TabPanel>
      <TabPanel id="activity" activeTab={activeTab}><PreviewInterview /></TabPanel>
    </main>
  );
}

function PortfolioLive() {
  const { role } = useUser();
  const { user } = useEntitlements();
  const [activeTab, setActiveTab] = React.useState("overview");
  const [editOpen, setEditOpen] = React.useState(false);
  const [shareStatus, setShareStatus] = React.useState("");
  const [credentialCount, setCredentialCount] = React.useState(null);
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    portfolio: null,
    artifacts: [],
    learnerResultItems: [],
    skillProfile: [],
    studentProfile: null,
    pathway: null,
    learningProgress: null,
    sourceAvailability: [],
  });

  const load = React.useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    getPortfolio(role)
      .then((data) => active && setState({
        loading: false,
        error: null,
        portfolio: data.portfolio,
        artifacts: data.artifacts || [],
        learnerResultItems: data.learnerResultItems || [],
        skillProfile: data.skillProfile || [],
        studentProfile: data.studentProfile || null,
        pathway: data.pathway || null,
        learningProgress: data.learningProgress || null,
        sourceAvailability: data.sourceAvailability || [],
      }))
      .catch((error) => active && setState({
        loading: false,
        error,
        portfolio: null,
        artifacts: [],
        learnerResultItems: [],
        skillProfile: [],
        studentProfile: null,
        pathway: null,
        learningProgress: null,
        sourceAvailability: [],
      }));
    return () => {
      active = false;
    };
  }, [role]);

  React.useEffect(load, [load]);

  React.useEffect(() => {
    let active = true;
    listMyCredentials(role)
      .then((data) => {
        if (!active) return;
        setCredentialCount((data?.items || []).filter((item) => item.lifecycle !== "REVOKED").length);
      })
      .catch(() => active && setCredentialCount(null));
    return () => {
      active = false;
    };
  }, [role]);

  React.useEffect(() => {
    const refresh = () => load();
    window.addEventListener("portfolio:updated", refresh);
    return () => window.removeEventListener("portfolio:updated", refresh);
  }, [load]);

  React.useEffect(() => {
    markDarkScope("student-portfolio", true);
    markDarkScope("resume-builder", true);
    return () => {
      markDarkScope("student-portfolio", false);
      markDarkScope("resume-builder", false);
    };
  }, []);

  function replaceArtifact(updated) {
    setState((current) => ({
      ...current,
      artifacts: current.artifacts.map((item) => item.artifactId === updated.artifactId ? updated : item),
    }));
  }

  async function handleProfileUpdate(changes) {
    const updated = await updatePortfolioProfile(role, changes);
    setState((current) => ({
      ...current,
      portfolio: updated,
    }));
    return updated;
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Portfolio link copied to clipboard.");
    } catch {
      setShareStatus("Unable to copy automatically. Copy the page URL to share your portfolio.");
    }
  }

  function handleExport() {
    window.print();
  }

  const activeArtifacts = state.artifacts.filter((artifact) => artifact.status !== "REMOVED");
  const organizationName = state.studentProfile?.organizationName || user?.organizationName || user?.organization?.name || "";
  const pathwayName = user?.pathwayName || user?.pathway?.name || (state.pathway?.careerIds?.length ? `Career pathway: ${state.pathway.careerIds.join(", ")}` : "");
  const denied = state.error && (state.error.status === 401 || state.error.status === 403);

  return (
    <main className="sp-page" aria-labelledby="portfolio-v1-heading">
      <PortfolioHeader onShare={handleShare} onExport={handleExport} shareStatus={shareStatus} />

      <StudentProfileHero
        editOpen={editOpen}
        onToggleEdit={() => setEditOpen((value) => !value)}
        artifactCount={activeArtifacts.length}
        learnerResultCount={state.learnerResultItems.length}
        skillCount={state.skillProfile.length}
        credentialCount={credentialCount}
        organizationName={organizationName}
        pathwayName={pathwayName}
        studentName={state.studentProfile?.displayName}
        aboutText={state.portfolio?.aboutText || ""}
        avatarReference={state.portfolio?.avatarReference || null}
      />

      {editOpen && (
        <div id="sp-edit-panel" className="sp-card" style={{ marginTop: 16 }}>
          <AvatarUploader avatarReference={state.portfolio?.avatarReference || null} onSave={handleProfileUpdate} />
        </div>
      )}

      {state.loading ? (
        <p className="portfolio-v1-statusText" role="status">Loading your Portfolio...</p>
      ) : state.error ? (
        <section className="portfolio-v1-empty" role="alert">
          <h2>{denied ? "Portfolio access is denied" : "Portfolio is unavailable"}</h2>
          <p>
            {denied
              ? "Your account does not currently have authorized access to this Portfolio. No sample data is shown in this state."
              : "Your saved work is safe. Try again when the connection is restored."}
          </p>
          <button type="button" onClick={load}>Try again</button>
        </section>
      ) : (
        <>
          <PortfolioTabs activeTab={activeTab} onChange={setActiveTab} />

          <TabPanel id="overview" activeTab={activeTab}>
            <div className="sp-dashboardGrid">
              <div className="sp-mainColumn">
                <StudentAbout aboutText={state.portfolio?.aboutText || ""} onSave={handleProfileUpdate} />
                <FeaturedProjects
                  artifacts={state.artifacts}
                  renderControls={(artifact) => (
                    <ArtifactControls artifact={artifact} role={role} onSaved={replaceArtifact} />
                  )}
                />
                {activeArtifacts.length === 0 && (
                  <section className="portfolio-v1-empty">
                    <h2>What You Proved</h2>
                    <p>Your Portfolio is where you collect work completed and supported by canonical Evidence.</p>
                    <p>When eligible Studio work is ready, you can add it here without changing the underlying proof.</p>
                    <a className="portfolio-v1-button" href="/curriculum.html#/studio/projects">Go to My Studio Projects</a>
                  </section>
                )}
                <EvidenceTable artifacts={state.artifacts} learnerResults={state.learnerResultItems} />
                <PortfolioProgress learnerResults={state.learnerResultItems} artifacts={state.artifacts} learningProgress={state.learningProgress} />
                <InterviewPractice />
              </div>
              <aside className="sp-sideColumn" aria-label="Portfolio intelligence">
                <SkillProfile skills={state.skillProfile} />
                <CredentialsBadges role={role} />
                <AccessibilitySupports />
                <VisibilityPanel artifacts={state.artifacts} />
                <NextBestActions artifacts={activeArtifacts} learnerResults={state.learnerResultItems} />
              </aside>
            </div>
          </TabPanel>

          <TabPanel id="projects" activeTab={activeTab}>
            <FeaturedProjects
              artifacts={state.artifacts}
              renderControls={(artifact) => (
                <ArtifactControls artifact={artifact} role={role} onSaved={replaceArtifact} />
              )}
            />
          </TabPanel>

          <TabPanel id="evidence" activeTab={activeTab}>
            <EvidenceTable artifacts={state.artifacts} learnerResults={state.learnerResultItems} />
            <LearningResults items={state.learnerResultItems} />
          </TabPanel>

          <TabPanel id="skills" activeTab={activeTab}>
            <div className="sp-dashboardGrid">
              <SkillProfile skills={state.skillProfile} />
              <CredentialsBadges role={role} />
            </div>
          </TabPanel>

          <TabPanel id="readiness" activeTab={activeTab}>
            <PortfolioProgress learnerResults={state.learnerResultItems} artifacts={state.artifacts} learningProgress={state.learningProgress} />
          </TabPanel>

          <TabPanel id="activity" activeTab={activeTab}>
            <ActivityPanel artifacts={state.artifacts} learnerResults={state.learnerResultItems} />
          </TabPanel>

          <section className="portfolio-v1-summary" style={{ marginTop: 20 }}>
            <h2>My Work</h2>
            <p>
              {activeArtifacts.length} saved {activeArtifacts.length === 1 ? "artifact" : "artifacts"}.
              Your source proof remains separate and protected.
            </p>
            <p className="portfolio-v1-meta">
              Featured items are authorized Portfolio artifacts only. Unsupported legacy widgets are not shown as student facts.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
