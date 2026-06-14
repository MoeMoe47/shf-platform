import {
  opsDefaultBuildPacketDraft,
  opsDefaultLearningEvents,
  opsDefaultPageBuildPacketDraft,
  opsDefaultPages,
  opsDefaultScreenshotNotes,
  opsDefaultStageStatus,
  opsProjects,
} from "./opsData";

const STORAGE_KEYS = {
  projects: "shs.ops.projects",
  activeProjectId: "shs.ops.activeProjectId",
  stageStatus: "shs.ops.stageStatus",
  buildPacketDraft: "shs.ops.buildPacketDraft",
  screenshotQaNotes: "shs.ops.screenshotQaNotes",
  learningEvents: "shs.ops.learningEvents",
  pages: "shs.ops.pages",
  activePageId: "shs.ops.activePageId",
  pageWorkflowStatus: "shs.ops.pageWorkflowStatus",
  pageBuildPacketDraft: "shs.ops.pageBuildPacketDraft",
  pageQaNotes: "shs.ops.pageQaNotes",
  pageLearningEvents: "shs.ops.pageLearningEvents",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getStoredString(key, fallback = "") {
  if (!canUseStorage()) return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeProject(project, index = 0) {
  const name = String(project?.name || `Production Project ${index + 1}`);
  const id = project?.id || buildProjectId(name);

  return {
    id,
    name,
    type: project?.type || "Client demo",
    brandSystem: project?.brandSystem || "SHS internal admin",
    owner: project?.owner || "SHS",
    priority: project?.priority || "High",
    confidentiality: project?.confidentiality || "Internal only",
    status: project?.status || "Discovery",
    stage: project?.stage || "Sales discovery",
    next: project?.next || "Create page-level specs and build packet.",
  };
}

function normalizePage(page, projectId, index = 0) {
  const pageName = String(page?.pageName || page?.name || `Page ${index + 1}`);
  const createdAt = page?.createdAt || nowIso();

  return {
    id: page?.id || buildPageId(pageName),
    projectId: page?.projectId || projectId,
    pageName,
    route: page?.route || "/",
    pageType: page?.pageType || "Workflow Page",
    audience: page?.audience || "Internal SHS user",
    primaryGoal: page?.primaryGoal || "Define the page goal before build.",
    status: page?.status || "Discovery",
    mockStatus: page?.mockStatus || "Not Started",
    specStatus: page?.specStatus || "Not Started",
    buildPacketStatus: page?.buildPacketStatus || "Not Started",
    qaStatus: page?.qaStatus || "Not Started",
    screenshotMatchScore: page?.screenshotMatchScore || "",
    activeStage: page?.activeStage || "Sales discovery",
    notes: page?.notes || "",
    createdAt,
    updatedAt: page?.updatedAt || createdAt,
  };
}

function createFallbackPages(projects, existingPages = []) {
  const normalizedExisting = existingPages
    .filter(Boolean)
    .map((page, index) => normalizePage(page, page.projectId || projects[0]?.id || "", index));

  const pages = [...normalizedExisting];

  projects.forEach((project) => {
    const hasPage = pages.some((page) => page.projectId === project.id);
    if (!hasPage) {
      const matchingDefault = opsDefaultPages.find((page) => page.projectId === project.id);
      pages.push(
        normalizePage(
          matchingDefault || {
            pageName: `${project.name} Primary Page`,
            route: "/",
            pageType: "Workflow Page",
            audience: "Internal SHS team",
            primaryGoal: "Create specs and QA notes for this page.",
            status: project.status,
            activeStage: project.stage,
          },
          project.id,
          pages.length
        )
      );
    }
  });

  return pages;
}

function createRecordMap(pages, fallback) {
  return pages.reduce((acc, page) => {
    acc[page.id] = { ...fallback };
    return acc;
  }, {});
}

export function createDefaultOpsState() {
  const projects = opsProjects.map(normalizeProject);
  const pages = createFallbackPages(projects, opsDefaultPages);
  const activeProjectId = projects[0]?.id || "";
  const activePageId = pages.find((page) => page.projectId === activeProjectId)?.id || pages[0]?.id || "";

  return {
    projects,
    activeProjectId,
    stageStatus: opsDefaultStageStatus,
    buildPacketDraft: opsDefaultBuildPacketDraft,
    screenshotQaNotes: opsDefaultScreenshotNotes,
    learningEvents: opsDefaultLearningEvents,
    pages,
    activePageId,
    pageWorkflowStatus: createRecordMap(pages, opsDefaultStageStatus),
    pageBuildPacketDraft: createRecordMap(pages, opsDefaultPageBuildPacketDraft),
    pageQaNotes: createRecordMap(pages, opsDefaultScreenshotNotes),
    pageLearningEvents: opsDefaultLearningEvents.map((event) => ({
      ...event,
      projectId: activeProjectId,
      pageId: activePageId,
      stage: "Adaptive learning loop",
    })),
  };
}

export function loadOpsState() {
  const defaults = createDefaultOpsState();
  const projects = readJson(STORAGE_KEYS.projects, defaults.projects).map(normalizeProject);
  const pages = createFallbackPages(projects, readJson(STORAGE_KEYS.pages, defaults.pages));
  const storedActiveProjectId = getStoredString(STORAGE_KEYS.activeProjectId, defaults.activeProjectId);
  const activeProjectId = projects.some((project) => project.id === storedActiveProjectId)
    ? storedActiveProjectId
    : projects[0]?.id || "";
  const storedActivePageId = getStoredString(STORAGE_KEYS.activePageId, defaults.activePageId);
  const projectPages = pages.filter((page) => page.projectId === activeProjectId);
  const activePageId = pages.some((page) => page.id === storedActivePageId && page.projectId === activeProjectId)
    ? storedActivePageId
    : projectPages[0]?.id || pages[0]?.id || "";
  const legacyBuildPacketDraft = readJson(STORAGE_KEYS.buildPacketDraft, defaults.buildPacketDraft);
  const legacyScreenshotQaNotes = readJson(STORAGE_KEYS.screenshotQaNotes, defaults.screenshotQaNotes);
  const legacyLearningEvents = readJson(STORAGE_KEYS.learningEvents, defaults.learningEvents);
  const pageBuildPacketDraft = readJson(
    STORAGE_KEYS.pageBuildPacketDraft,
    createRecordMap(pages, legacyBuildPacketDraft)
  );
  const pageQaNotes = readJson(
    STORAGE_KEYS.pageQaNotes,
    createRecordMap(pages, legacyScreenshotQaNotes)
  );

  pages.forEach((page) => {
    pageBuildPacketDraft[page.id] = {
      ...opsDefaultPageBuildPacketDraft,
      ...legacyBuildPacketDraft,
      ...(pageBuildPacketDraft[page.id] || {}),
    };
    pageQaNotes[page.id] = {
      ...opsDefaultScreenshotNotes,
      ...legacyScreenshotQaNotes,
      ...(pageQaNotes[page.id] || {}),
    };
  });

  return {
    projects,
    activeProjectId,
    stageStatus: readJson(STORAGE_KEYS.stageStatus, defaults.stageStatus),
    buildPacketDraft: legacyBuildPacketDraft,
    screenshotQaNotes: legacyScreenshotQaNotes,
    learningEvents: legacyLearningEvents,
    pages,
    activePageId,
    pageWorkflowStatus: readJson(STORAGE_KEYS.pageWorkflowStatus, createRecordMap(pages, defaults.stageStatus)),
    pageBuildPacketDraft,
    pageQaNotes,
    pageLearningEvents: readJson(STORAGE_KEYS.pageLearningEvents, legacyLearningEvents),
  };
}

export function saveOpsState(state) {
  writeJson(STORAGE_KEYS.projects, state.projects || []);
  writeJson(STORAGE_KEYS.stageStatus, state.stageStatus || {});
  writeJson(STORAGE_KEYS.buildPacketDraft, state.buildPacketDraft || {});
  writeJson(STORAGE_KEYS.screenshotQaNotes, state.screenshotQaNotes || {});
  writeJson(STORAGE_KEYS.learningEvents, state.learningEvents || []);
  writeJson(STORAGE_KEYS.pages, state.pages || []);
  writeJson(STORAGE_KEYS.pageWorkflowStatus, state.pageWorkflowStatus || {});
  writeJson(STORAGE_KEYS.pageBuildPacketDraft, state.pageBuildPacketDraft || {});
  writeJson(STORAGE_KEYS.pageQaNotes, state.pageQaNotes || {});
  writeJson(STORAGE_KEYS.pageLearningEvents, state.pageLearningEvents || []);

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEYS.activeProjectId, state.activeProjectId || "");
    window.localStorage.setItem(STORAGE_KEYS.activePageId, state.activePageId || "");
  }
}

export function resetOpsDemoData() {
  const defaults = createDefaultOpsState();
  saveOpsState(defaults);
  return defaults;
}

export function buildProjectId(name) {
  const slug = String(name || "ops-project")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return `ops_project_${slug || "new"}_${Date.now()}`;
}

export function buildPageId(name) {
  const slug = String(name || "ops-page")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return `ops_page_${slug || "new"}_${Date.now()}`;
}
