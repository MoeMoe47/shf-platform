import React, { useEffect, useMemo, useState } from "react";
import "./ops-production.css";
import {
  OPS_INTERNAL_NOTICE,
  opsDefaultPageBuildPacketDraft,
  opsLearningCategories,
  opsPageContent,
  opsPageTypes,
  opsPipeline,
  opsStageStatusOptions,
} from "./opsData";
import {
  buildPageId,
  buildProjectId,
  loadOpsState,
  resetOpsDemoData,
  saveOpsState,
} from "./opsStorage";

const packetSectionLabels = {
  brandProfile: "Brand Profile",
  pageIntent: "Page Intent",
  layoutBlueprint: "Layout Blueprint",
  visualTreatment: "Visual Treatment",
  assets: "Asset Rules",
  dataBinding: "Data Binding",
  mockReview: "Mock Review",
  qaChecklist: "Acceptance Checklist",
};

const editablePacketKeys = [
  "brandProfile",
  "pageIntent",
  "layoutBlueprint",
  "visualTreatment",
  "assets",
  "dataBinding",
  "mockReview",
];

const projectFormDefaults = {
  id: "",
  name: "",
  type: "Client demo",
  brandSystem: "SHS internal admin",
  owner: "",
  priority: "High",
  confidentiality: "Internal only",
  status: "Discovery",
  stage: "Sales discovery",
};

const pageFormDefaults = {
  pageName: "",
  route: "",
  pageType: "Workflow Page",
  audience: "",
  primaryGoal: "",
  status: "Discovery",
  notes: "",
};

function formatDate(value) {
  if (!value) return "Not saved yet";
  return new Date(value).toLocaleString();
}

function getPageNextRecommendedStep(activePage, pageWorkflowStatus) {
  if (!activePage) return "Create or select a page record.";
  const blockedStage = opsPipeline.find((stage) => pageWorkflowStatus[stage] === "Blocked");
  if (blockedStage) return `Resolve blocker in ${blockedStage} for ${activePage.pageName}.`;
  if (activePage.buildPacketStatus === "Ready for Review") return "Review and approve the page build packet.";
  if (activePage.qaStatus === "Blocked") return "Resolve screenshot QA drift before delivery.";
  const reviewStage = opsPipeline.find((stage) => pageWorkflowStatus[stage] === "Ready for Review");
  if (reviewStage) return `Review and approve ${reviewStage}.`;
  const currentIndex = opsPipeline.findIndex((stage) => stage === activePage.activeStage);
  return `Move ${opsPipeline[currentIndex + 1] || "Adaptive learning loop"} forward for this page.`;
}

function createBuildPacket({ activeProject, activePage, pageWorkflowStatus, activePageDraft, activePageQaNotes }) {
  const project = activeProject || {};
  const page = activePage || {};
  const lines = [
    "SHS INTERNAL PAGE BUILD PACKET",
    "",
    "Do not redesign. Build from this packet.",
    "",
    "PROJECT",
    `Project name: ${project.name || "Unassigned"}`,
    `Project owner: ${project.owner || "Not set"}`,
    `Project priority: ${project.priority || "Not set"}`,
    `Project confidentiality: ${project.confidentiality || "Internal only"}`,
    "",
    "PAGE",
    `Active page name: ${page.pageName || "No page selected"}`,
    `Active page route: ${page.route || "Not set"}`,
    `Page type: ${page.pageType || "Not set"}`,
    `Audience: ${page.audience || "Not set"}`,
    `Page goal: ${page.primaryGoal || "Not set"}`,
    `Page status: ${page.status || "Not set"}`,
    `Mock review status: ${page.mockStatus || "Not Started"}`,
    `Screenshot QA status: ${page.qaStatus || "Not Started"}`,
    "",
    "PAGE WORKFLOW STATUS",
    ...opsPipeline.map((stage) => `- ${stage}: ${pageWorkflowStatus[stage] || "Not Started"}`),
    "",
    "SPECIFICATION",
    `Brand profile:\n${activePageDraft.brandProfile || "Not documented yet."}`,
    "",
    `Page intent:\n${activePageDraft.pageIntent || "Not documented yet."}`,
    "",
    `Layout blueprint:\n${activePageDraft.layoutBlueprint || "Not documented yet."}`,
    "",
    `Visual treatment:\n${activePageDraft.visualTreatment || "Not documented yet."}`,
    "",
    `Asset rules:\n${activePageDraft.assets || "Not documented yet."}`,
    "",
    `Data binding:\n${activePageDraft.dataBinding || "Not documented yet."}`,
    "",
    `Mock review status:\n${activePageDraft.mockReview || page.mockStatus || "Not documented yet."}`,
    "",
    "SCREENSHOT QA",
    `QA status: ${page.qaStatus || "Not Started"}`,
    `Mock screenshot notes: ${activePageQaNotes.mockNotes || "Not documented yet."}`,
    `Built screenshot notes: ${activePageQaNotes.builtNotes || "Not documented yet."}`,
    `Match score: ${activePageQaNotes.matchScore || page.screenshotMatchScore || "Not scored"}%`,
    `Drift category: ${activePageQaNotes.driftCategory || "Not categorized"}`,
    "",
    "ACCEPTANCE CHECKLIST",
    activePageDraft.qaChecklist || "Route loads, copy fits, screenshots match, localStorage persists, and no public app surfaces change.",
    "",
    "NON-GOALS",
    "- Do not change public Foundation, Solutions, Sales, Hub, or Exchange pages.",
    "- Do not expose internal build packets, prompts, QA machinery, or adaptive learning to clients.",
  ];

  return `${lines.join("\n")}\n`;
}

function calculateMetrics({ projects, pages }) {
  const scores = pages
    .map((page) => Number(page.screenshotMatchScore))
    .filter((score) => Number.isFinite(score) && score > 0);
  const average = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;

  return {
    totalProjects: projects.length,
    totalPages: pages.length,
    readyForPacket: pages.filter((page) => ["Ready for Review", "Approved"].includes(page.specStatus)).length,
    blockedPages: pages.filter((page) => [page.status, page.mockStatus, page.specStatus, page.buildPacketStatus, page.qaStatus].includes("Blocked")).length,
    averageScreenshotMatch: average,
  };
}

function useOpsState() {
  const [state, setState] = useState(() => loadOpsState());

  useEffect(() => {
    saveOpsState(state);
  }, [state]);

  const activeProject = useMemo(
    () => state.projects.find((project) => project.id === state.activeProjectId) || state.projects[0] || null,
    [state.activeProjectId, state.projects]
  );

  const projectPages = useMemo(
    () => state.pages.filter((page) => page.projectId === activeProject?.id),
    [activeProject?.id, state.pages]
  );

  const activePage = useMemo(
    () => state.pages.find((page) => page.id === state.activePageId && page.projectId === activeProject?.id) || projectPages[0] || null,
    [activeProject?.id, projectPages, state.activePageId, state.pages]
  );

  const pageWorkflowStatus = state.pageWorkflowStatus[activePage?.id] || {};
  const activePageDraft = {
    ...opsDefaultPageBuildPacketDraft,
    ...(state.pageBuildPacketDraft[activePage?.id] || {}),
  };
  const activePageQaNotes = state.pageQaNotes[activePage?.id] || {};
  const metrics = calculateMetrics(state);

  function setActiveProject(projectId) {
    setState((previous) => {
      const nextPage = previous.pages.find((page) => page.projectId === projectId);
      return {
        ...previous,
        activeProjectId: projectId,
        activePageId: nextPage?.id || "",
      };
    });
  }

  function setActivePage(pageId) {
    setState((previous) => ({ ...previous, activePageId: pageId }));
  }

  function upsertProject(project) {
    setState((previous) => {
      const exists = previous.projects.some((item) => item.id === project.id);
      const projects = exists
        ? previous.projects.map((item) => (item.id === project.id ? project : item))
        : [...previous.projects, project];
      const existingPage = previous.pages.find((page) => page.projectId === project.id);

      return {
        ...previous,
        projects,
        activeProjectId: project.id,
        activePageId: existingPage?.id || previous.activePageId,
      };
    });
  }

  function upsertPage(page) {
    setState((previous) => {
      const timestamp = new Date().toISOString();
      const normalizedPage = {
        mockStatus: "Not Started",
        specStatus: "Not Started",
        buildPacketStatus: "Not Started",
        qaStatus: "Not Started",
        screenshotMatchScore: "",
        activeStage: "Sales discovery",
        createdAt: timestamp,
        ...page,
        updatedAt: timestamp,
      };
      const exists = previous.pages.some((item) => item.id === normalizedPage.id);
      const pages = exists
        ? previous.pages.map((item) => (item.id === normalizedPage.id ? { ...item, ...normalizedPage } : item))
        : [...previous.pages, normalizedPage];

      return {
        ...previous,
        pages,
        activeProjectId: normalizedPage.projectId,
        activePageId: normalizedPage.id,
        pageWorkflowStatus: {
          ...previous.pageWorkflowStatus,
          [normalizedPage.id]: previous.pageWorkflowStatus[normalizedPage.id] || { ...previous.stageStatus },
        },
        pageBuildPacketDraft: {
          ...previous.pageBuildPacketDraft,
          [normalizedPage.id]: previous.pageBuildPacketDraft[normalizedPage.id] || { ...opsDefaultPageBuildPacketDraft },
        },
        pageQaNotes: {
          ...previous.pageQaNotes,
          [normalizedPage.id]: previous.pageQaNotes[normalizedPage.id] || {},
        },
      };
    });
  }

  function updatePageWorkflowStatus(stage, status) {
    if (!activePage) return;
    setState((previous) => ({
      ...previous,
      pageWorkflowStatus: {
        ...previous.pageWorkflowStatus,
        [activePage.id]: {
          ...(previous.pageWorkflowStatus[activePage.id] || {}),
          [stage]: status,
        },
      },
      pages: previous.pages.map((page) =>
        page.id === activePage.id ? { ...page, activeStage: stage, updatedAt: new Date().toISOString() } : page
      ),
    }));
  }

  function updatePageDraft(key, value) {
    if (!activePage) return;
    setState((previous) => ({
      ...previous,
      pageBuildPacketDraft: {
        ...previous.pageBuildPacketDraft,
        [activePage.id]: {
          ...opsDefaultPageBuildPacketDraft,
          ...(previous.pageBuildPacketDraft[activePage.id] || {}),
          [key]: value,
        },
      },
      pages: previous.pages.map((page) =>
        page.id === activePage.id ? { ...page, specStatus: "In Progress", updatedAt: new Date().toISOString() } : page
      ),
    }));
  }

  function updatePageQaNotes(notes) {
    if (!activePage) return;
    const updatedAt = new Date().toISOString();
    setState((previous) => ({
      ...previous,
      pageQaNotes: {
        ...previous.pageQaNotes,
        [activePage.id]: {
          ...notes,
          updatedAt,
        },
      },
      pages: previous.pages.map((page) =>
        page.id === activePage.id
          ? {
              ...page,
              qaStatus: notes.qaStatus || page.qaStatus || "In Progress",
              screenshotMatchScore: notes.matchScore || page.screenshotMatchScore,
              updatedAt,
            }
          : page
      ),
    }));
  }

  function updatePageStatus(field, value) {
    if (!activePage) return;
    setState((previous) => ({
      ...previous,
      pages: previous.pages.map((page) =>
        page.id === activePage.id ? { ...page, [field]: value, updatedAt: new Date().toISOString() } : page
      ),
    }));
  }

  function addLearningEvent(event) {
    setState((previous) => ({
      ...previous,
      pageLearningEvents: [
        {
          ...event,
          id: `ops_learning_${Date.now()}`,
          projectId: activeProject?.id || "",
          pageId: activePage?.id || "",
          createdAt: new Date().toISOString(),
        },
        ...previous.pageLearningEvents,
      ],
    }));
  }

  function resetDemoData() {
    setState(resetOpsDemoData());
  }

  return {
    ...state,
    activeProject,
    projectPages,
    activePage,
    pageWorkflowStatus,
    activePageDraft,
    activePageQaNotes,
    metrics,
    setActiveProject,
    setActivePage,
    upsertProject,
    upsertPage,
    updatePageWorkflowStatus,
    updatePageDraft,
    updatePageQaNotes,
    updatePageStatus,
    addLearningEvent,
    resetDemoData,
  };
}

function ActiveSummary({ ops }) {
  return (
    <div className="ops-production__grid ops-production__grid--two">
      <article className="ops-production__card ops-production__card--wide">
        <h3>Active project</h3>
        <div className="ops-production__metric">{ops.activeProject?.name || "No project selected"}</div>
        <p className="ops-production__detail">
          {ops.activeProject?.type || "No type"} · {ops.activeProject?.brandSystem || "No brand system"}
        </p>
        <div className="ops-production__chips">
          <span>{ops.activeProject?.owner || "No owner"}</span>
          <span>{ops.activeProject?.priority || "No priority"}</span>
          <span>{ops.activeProject?.confidentiality || "Internal only"}</span>
        </div>
      </article>

      <article className="ops-production__card">
        <h3>Active page</h3>
        <div className="ops-production__metric">{ops.activePage?.pageName || "No page selected"}</div>
        <p className="ops-production__detail">{ops.activePage?.route || "Create a page record to continue."}</p>
        <div className="ops-production__chips">
          <span>{ops.activePage?.pageType || "No type"}</span>
          <span>{ops.activePage?.status || "No status"}</span>
          <span>{ops.activePage?.qaStatus || "QA not started"}</span>
        </div>
      </article>
    </div>
  );
}

function StageStatusBoard({ ops }) {
  return (
    <section className="ops-production__table" aria-label="Page workflow status">
      <p className="ops-production__eyebrow">Page-level workflow status</p>
      <div className="ops-production__stageGrid">
        {opsPipeline.map((stage) => (
          <label className="ops-production__field" key={stage}>
            <span>{stage}</span>
            <select
              value={ops.pageWorkflowStatus[stage] || "Not Started"}
              onChange={(event) => ops.updatePageWorkflowStatus(stage, event.target.value)}
              disabled={!ops.activePage}
            >
              {opsStageStatusOptions.map((status) => (
                <option value={status} key={status}>{status}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}

function PageSelector({ ops }) {
  return (
    <div className="ops-production__toolbar">
      <label className="ops-production__field">
        <span>Active project</span>
        <select value={ops.activeProject?.id || ""} onChange={(event) => ops.setActiveProject(event.target.value)}>
          {ops.projects.map((project) => (
            <option value={project.id} key={project.id}>{project.name}</option>
          ))}
        </select>
      </label>
      <label className="ops-production__field">
        <span>Active page</span>
        <select value={ops.activePage?.id || ""} onChange={(event) => ops.setActivePage(event.target.value)}>
          {ops.projectPages.map((page) => (
            <option value={page.id} key={page.id}>{page.pageName}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function MetricsGrid({ metrics }) {
  const cards = [
    { label: "Total projects", value: metrics.totalProjects, detail: "Production Ops project records" },
    { label: "Total pages", value: metrics.totalPages, detail: "Page-level build records" },
    { label: "Ready for packet", value: metrics.readyForPacket, detail: "Pages with reviewed or approved specs" },
    { label: "Blocked pages", value: metrics.blockedPages, detail: "Any page status marked blocked" },
    { label: "Avg screenshot match", value: `${metrics.averageScreenshotMatch}%`, detail: "Across scored page QA records" },
  ];

  return (
    <div className="ops-production__grid">
      {cards.map((card) => (
        <article className="ops-production__card" key={card.label}>
          <h3>{card.label}</h3>
          <div className="ops-production__metric">{card.value}</div>
          <p className="ops-production__detail">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

function PageList({ ops }) {
  return (
    <section className="ops-production__table" aria-label="Project pages">
      <p className="ops-production__eyebrow">Project pages</p>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Route</th>
            <th>Type</th>
            <th>Status</th>
            <th>Packet</th>
            <th>QA</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {ops.projectPages.map((page) => (
            <tr key={page.id}>
              <td>{page.pageName}</td>
              <td>{page.route}</td>
              <td>{page.pageType}</td>
              <td>{page.status}</td>
              <td>{page.buildPacketStatus}</td>
              <td>{page.qaStatus}</td>
              <td>
                <button className="ops-production__button ops-production__button--compact" type="button" onClick={() => ops.setActivePage(page.id)}>
                  Select Page
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ProductionPanel({ ops }) {
  return (
    <>
      <PageSelector ops={ops} />
      <MetricsGrid metrics={ops.metrics} />
      <ActiveSummary ops={ops} />
      <article className="ops-production__card ops-production__card--wide">
        <h3>Next recommended step</h3>
        <div className="ops-production__metric">Next</div>
        <p className="ops-production__detail">{getPageNextRecommendedStep(ops.activePage, ops.pageWorkflowStatus)}</p>
      </article>
      <PageList ops={ops} />
      <div className="ops-production__toolbar">
        <button
          className="ops-production__button ops-production__button--danger"
          type="button"
          onClick={() => {
            if (window.confirm("Reset SHS Production Ops demo data?")) ops.resetDemoData();
          }}
        >
          Reset Demo Ops Data
        </button>
      </div>
      <StageStatusBoard ops={ops} />
    </>
  );
}

function ProjectSetupPanel({ ops }) {
  const [projectForm, setProjectForm] = useState(projectFormDefaults);
  const [pageForm, setPageForm] = useState(pageFormDefaults);

  function submitProject(event) {
    event.preventDefault();
    const name = projectForm.name.trim();
    if (!name) return;
    ops.upsertProject({
      ...projectForm,
      id: projectForm.id || buildProjectId(name),
      name,
      next: `Create or update page specs for ${name}.`,
    });
    setProjectForm(projectFormDefaults);
  }

  function submitPage(event) {
    event.preventDefault();
    const pageName = pageForm.pageName.trim();
    if (!pageName || !ops.activeProject) return;
    ops.upsertPage({
      ...pageForm,
      id: buildPageId(pageName),
      projectId: ops.activeProject.id,
      pageName,
    });
    setPageForm(pageFormDefaults);
  }

  return (
    <>
      <PageSelector ops={ops} />
      <ActiveSummary ops={ops} />

      <div className="ops-production__toolbar">
        <button
          className="ops-production__button"
          type="button"
          onClick={() => setProjectForm({ ...projectFormDefaults, ...(ops.activeProject || {}) })}
          disabled={!ops.activeProject}
        >
          Load Active Project for Update
        </button>
        {projectForm.id && <span className="ops-production__muted">Updating: {projectForm.name}</span>}
      </div>

      <form className="ops-production__form" onSubmit={submitProject}>
        {[
          ["name", "Project name"],
          ["brandSystem", "Brand system"],
          ["owner", "Owner"],
          ["status", "Status"],
        ].map(([field, label]) => (
          <label className="ops-production__field" key={field}>
            <span>{label}</span>
            <input value={projectForm[field]} onChange={(event) => setProjectForm((previous) => ({ ...previous, [field]: event.target.value }))} />
          </label>
        ))}
        <label className="ops-production__field">
          <span>Client/internal type</span>
          <select value={projectForm.type} onChange={(event) => setProjectForm((previous) => ({ ...previous, type: event.target.value }))}>
            <option>Client demo</option>
            <option>Client pilot</option>
            <option>Internal product</option>
            <option>Internal sales asset</option>
          </select>
        </label>
        <label className="ops-production__field">
          <span>Priority</span>
          <select value={projectForm.priority} onChange={(event) => setProjectForm((previous) => ({ ...previous, priority: event.target.value }))}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label className="ops-production__field">
          <span>Confidentiality</span>
          <select value={projectForm.confidentiality} onChange={(event) => setProjectForm((previous) => ({ ...previous, confidentiality: event.target.value }))}>
            <option>Internal only</option>
            <option>Pre-approval</option>
            <option>Client approved demo</option>
            <option>SHS internal</option>
          </select>
        </label>
        <label className="ops-production__field">
          <span>Current stage</span>
          <select value={projectForm.stage} onChange={(event) => setProjectForm((previous) => ({ ...previous, stage: event.target.value }))}>
            {opsPipeline.map((stage) => <option value={stage} key={stage}>{stage}</option>)}
          </select>
        </label>
        <button className="ops-production__button" type="submit">{projectForm.id ? "Update and Select Project" : "Create and Select Project"}</button>
      </form>

      <section className="ops-production__table" aria-label="Project Pages">
        <p className="ops-production__eyebrow">Project Pages</p>
        <form className="ops-production__form" onSubmit={submitPage}>
          <label className="ops-production__field">
            <span>Page name</span>
            <input value={pageForm.pageName} onChange={(event) => setPageForm((previous) => ({ ...previous, pageName: event.target.value }))} />
          </label>
          <label className="ops-production__field">
            <span>Route</span>
            <input value={pageForm.route} onChange={(event) => setPageForm((previous) => ({ ...previous, route: event.target.value }))} />
          </label>
          <label className="ops-production__field">
            <span>Page type</span>
            <select value={pageForm.pageType} onChange={(event) => setPageForm((previous) => ({ ...previous, pageType: event.target.value }))}>
              {opsPageTypes.map((type) => <option value={type} key={type}>{type}</option>)}
            </select>
          </label>
          <label className="ops-production__field">
            <span>Audience</span>
            <input value={pageForm.audience} onChange={(event) => setPageForm((previous) => ({ ...previous, audience: event.target.value }))} />
          </label>
          <label className="ops-production__field">
            <span>Primary goal</span>
            <input value={pageForm.primaryGoal} onChange={(event) => setPageForm((previous) => ({ ...previous, primaryGoal: event.target.value }))} />
          </label>
          <label className="ops-production__field">
            <span>Status</span>
            <input value={pageForm.status} onChange={(event) => setPageForm((previous) => ({ ...previous, status: event.target.value }))} />
          </label>
          <label className="ops-production__field ops-production__field--full">
            <span>Notes</span>
            <textarea value={pageForm.notes} onChange={(event) => setPageForm((previous) => ({ ...previous, notes: event.target.value }))} rows={4} />
          </label>
          <button className="ops-production__button" type="submit">Create Page and Select</button>
        </form>
      </section>

      <PageList ops={ops} />
    </>
  );
}

function DraftSectionPanel({ pageKey, ops }) {
  const packetKey = pageKey === "screenshotQa" ? "qaChecklist" : pageKey;

  if (!editablePacketKeys.includes(packetKey)) {
    return <StageStatusBoard ops={ops} />;
  }

  return (
    <>
      <PageSelector ops={ops} />
      <ActiveSummary ops={ops} />
      <section className="ops-production__table" aria-label={`${packetSectionLabels[packetKey]} draft`}>
        <p className="ops-production__eyebrow">Active page spec</p>
        <label className="ops-production__field">
          <span>{packetSectionLabels[packetKey]}</span>
          <textarea
            value={ops.activePageDraft[packetKey] || ""}
            onChange={(event) => ops.updatePageDraft(packetKey, event.target.value)}
            rows={7}
            disabled={!ops.activePage}
          />
        </label>
        {packetKey === "mockReview" && (
          <div className="ops-production__toolbar">
            <label className="ops-production__field">
              <span>Mock status</span>
              <select value={ops.activePage?.mockStatus || "Not Started"} onChange={(event) => ops.updatePageStatus("mockStatus", event.target.value)}>
                {opsStageStatusOptions.map((status) => <option value={status} key={status}>{status}</option>)}
              </select>
            </label>
          </div>
        )}
      </section>
      <StageStatusBoard ops={ops} />
    </>
  );
}

function BuildPacketPanel({ ops }) {
  const packetText = createBuildPacket(ops);
  const [copyStatus, setCopyStatus] = useState("");

  async function copyPacket() {
    try {
      await navigator.clipboard.writeText(packetText);
      setCopyStatus("Copied page build packet.");
    } catch {
      setCopyStatus("Copy failed. Select the packet text manually.");
    }
  }

  function downloadPacket() {
    const blob = new Blob([packetText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(ops.activePage?.pageName || "shs-page-build-packet").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageSelector ops={ops} />
      <ActiveSummary ops={ops} />
      <div className="ops-production__toolbar">
        <label className="ops-production__field">
          <span>Build packet status</span>
          <select value={ops.activePage?.buildPacketStatus || "Not Started"} onChange={(event) => ops.updatePageStatus("buildPacketStatus", event.target.value)}>
            {opsStageStatusOptions.map((status) => <option value={status} key={status}>{status}</option>)}
          </select>
        </label>
        <button className="ops-production__button" type="button" onClick={copyPacket}>Copy Build Packet</button>
        <button className="ops-production__button" type="button" onClick={downloadPacket}>Download Build Packet .txt</button>
        {copyStatus && <span className="ops-production__muted">{copyStatus}</span>}
      </div>
      <textarea className="ops-production__packet" value={packetText} readOnly rows={28} />
      <StageStatusBoard ops={ops} />
    </>
  );
}

function ScreenshotQaPanel({ ops }) {
  const [notes, setNotes] = useState(ops.activePageQaNotes);

  useEffect(() => {
    setNotes({
      mockNotes: "",
      builtNotes: "",
      matchScore: ops.activePage?.screenshotMatchScore || "",
      driftCategory: "Visual Drift",
      qaStatus: ops.activePage?.qaStatus || "In Progress",
      ...ops.activePageQaNotes,
    });
  }, [ops.activePage?.id, ops.activePage?.qaStatus, ops.activePage?.screenshotMatchScore, ops.activePageQaNotes]);

  function updateField(field, value) {
    setNotes((previous) => ({ ...previous, [field]: value }));
  }

  return (
    <>
      <PageSelector ops={ops} />
      <ActiveSummary ops={ops} />
      <section className="ops-production__form" aria-label="Screenshot QA notes">
        <label className="ops-production__field ops-production__field--full">
          <span>Mock screenshot notes</span>
          <textarea value={notes.mockNotes || ""} onChange={(event) => updateField("mockNotes", event.target.value)} rows={5} />
        </label>
        <label className="ops-production__field ops-production__field--full">
          <span>Built screenshot notes</span>
          <textarea value={notes.builtNotes || ""} onChange={(event) => updateField("builtNotes", event.target.value)} rows={5} />
        </label>
        <label className="ops-production__field">
          <span>Match score</span>
          <input type="number" min="0" max="100" value={notes.matchScore || ""} onChange={(event) => updateField("matchScore", event.target.value)} />
        </label>
        <label className="ops-production__field">
          <span>QA status</span>
          <select value={notes.qaStatus || "In Progress"} onChange={(event) => updateField("qaStatus", event.target.value)}>
            {opsStageStatusOptions.map((status) => <option value={status} key={status}>{status}</option>)}
          </select>
        </label>
        <label className="ops-production__field">
          <span>Drift category</span>
          <select value={notes.driftCategory || "Visual Drift"} onChange={(event) => updateField("driftCategory", event.target.value)}>
            {opsLearningCategories.map((category) => <option value={category} key={category}>{category}</option>)}
          </select>
        </label>
        <button className="ops-production__button" type="button" onClick={() => ops.updatePageQaNotes(notes)}>Save Screenshot QA Notes</button>
        <p className="ops-production__muted">Last saved: {formatDate(ops.activePageQaNotes.updatedAt)}</p>
      </section>
      <StageStatusBoard ops={ops} />
    </>
  );
}

function LearningPanel({ ops }) {
  const [category, setCategory] = useState("Visual Drift");
  const [stage, setStage] = useState(ops.activePage?.activeStage || "Sales discovery");
  const [note, setNote] = useState("");

  function submitLearningEvent(event) {
    event.preventDefault();
    const cleanNote = note.trim();
    if (!cleanNote) return;
    ops.addLearningEvent({ category, stage, note });
    setNote("");
  }

  return (
    <>
      <PageSelector ops={ops} />
      <form className="ops-production__form" onSubmit={submitLearningEvent}>
        <label className="ops-production__field">
          <span>Project</span>
          <input value={ops.activeProject?.name || ""} readOnly />
        </label>
        <label className="ops-production__field">
          <span>Active page</span>
          <input value={ops.activePage?.pageName || ""} readOnly />
        </label>
        <label className="ops-production__field">
          <span>Workflow stage</span>
          <select value={stage} onChange={(event) => setStage(event.target.value)}>
            {opsPipeline.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label className="ops-production__field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {opsLearningCategories.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label className="ops-production__field ops-production__field--full">
          <span>Learning note</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
        </label>
        <button className="ops-production__button" type="submit">Add Learning Event</button>
      </form>

      <section className="ops-production__table" aria-label="Adaptive learning events">
        <p className="ops-production__eyebrow">Recorded events</p>
        <ul className="ops-production__list">
          {ops.pageLearningEvents.map((event) => {
            const project = ops.projects.find((item) => item.id === event.projectId);
            const page = ops.pages.find((item) => item.id === event.pageId);
            return (
              <li key={event.id}>
                <strong>{event.category} · {event.stage || "Workflow"}</strong>
                <p>{event.note}</p>
                <small>{project?.name || "No project"} / {page?.pageName || "No page"} / {formatDate(event.createdAt)}</small>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function renderWorkflowPanel(pageKey, ops) {
  if (pageKey === "production") return <ProductionPanel ops={ops} />;
  if (pageKey === "projects") return <ProjectSetupPanel ops={ops} />;
  if (pageKey === "buildPacket") return <BuildPacketPanel ops={ops} />;
  if (pageKey === "screenshotQa") return <ScreenshotQaPanel ops={ops} />;
  if (pageKey === "learning") return <LearningPanel ops={ops} />;
  return <DraftSectionPanel pageKey={pageKey} ops={ops} />;
}

export function OpsWorkflowPage({ pageKey }) {
  const ops = useOpsState();
  const page = opsPageContent[pageKey] || opsPageContent.production;

  return (
    <section className="ops-production" aria-labelledby="ops-production-title">
      <p className="ops-production__notice">{OPS_INTERNAL_NOTICE}</p>

      <div className="ops-production__hero">
        <article className="ops-production__panel">
          <p className="ops-production__eyebrow">{page.eyebrow}</p>
          <h1 id="ops-production-title">{page.title}</h1>
          <p className="ops-production__summary">{page.summary}</p>
          <span className="ops-production__status">V1.2 page-level workflow</span>
          {page.callout && <div className="ops-production__callout">{page.callout}</div>}
        </article>

        <aside className="ops-production__side">
          <p className="ops-production__eyebrow">Active page workflow</p>
          <h2>{ops.activePage?.pageName || "No page selected"}</h2>
          <ul className="ops-production__list">
            <li>Route: {ops.activePage?.route || "Not selected"}</li>
            <li>Stage: {ops.activePage?.activeStage || "Not selected"}</li>
            <li>Next: {getPageNextRecommendedStep(ops.activePage, ops.pageWorkflowStatus)}</li>
          </ul>
        </aside>
      </div>

      {renderWorkflowPanel(pageKey, ops)}
    </section>
  );
}

export default function OpsProductionDashboard() {
  return <OpsWorkflowPage pageKey="production" />;
}
