export const STUDIO_TERMINOLOGY = Object.freeze({
  handoff: "Start Project",
  project: "My Project",
  library: "Project Resources",
  buildPacket: "Project Plan / Requirements",
  qa: "Check My Project",
  delivery: "Submit / Publish / Finish",
  evidence: "What You Proved",
});

export const STUDIO_EXPERIENCE_MODES = Object.freeze({ BEGINNER: "BEGINNER", ADVANCED: "ADVANCED" });

export function projectTypeLabel(projectType) {
  return projectType === "AI_AGENT" ? "AI Agent" : "Website";
}

export function stageLabel(status) {
  return {
    DRAFT: "Start",
    PLANNING: "Plan",
    BUILDING: "Build",
    READY_FOR_CHECK: "Check",
    CHANGES_REQUIRED: "Improve",
    READY_FOR_REVIEW: "Review",
    APPROVED: "Review complete",
    DELIVERY_READY: "Finish",
    DELIVERED: "Submitted",
  }[status] || "Start";
}

// This resolver reads canonical project facets only. It never writes status,
// completion, QA, review, delivery, Evidence, or progress facts.
export function resolveStudioNextAction(project) {
  if (!project) return { key: "create", label: "Start a project", description: "Choose a Website or AI Agent to begin.", href: "/studio/new" };
  if (project.status === "DRAFT") return { key: "describe", label: "Tell us what you want to build", description: "Give your project a clear starting point.", href: null };
  if (project.status === "PLANNING") return { key: "plan", label: "Review your project plan", description: "Your requirements are the guide for this project.", href: null };
  if (project.status === "BUILDING") return { key: "build", label: "Continue building your project", description: "Keep shaping the work toward your project requirements.", href: null };
  if (project.status === "READY_FOR_CHECK") return { key: "check", label: "Check your project", description: "Review the project checks when that workspace is available.", href: null };
  if (project.status === "CHANGES_REQUIRED") return { key: "improve", label: "Fix the remaining project checks", description: "Make the requested improvements before review.", href: null };
  if (project.status === "READY_FOR_REVIEW") return { key: "review", label: "Review your project", description: "Your project is ready for the next review step.", href: null };
  if (project.status === "APPROVED") return { key: "finish", label: "Your project is ready to submit", description: "Continue when the submission step is available.", href: null };
  if (project.status === "DELIVERY_READY") return { key: "finish", label: "Finish your project", description: "Complete the final submission step when available.", href: null };
  if (project.status === "DELIVERED") return { key: "prove", label: "See what you proved", description: "Evidence and portfolio connections will appear when available.", href: null };
  return { key: "start", label: "Continue your project", description: "Open your Studio workspace to keep going.", href: null };
}

export function deriveStudioProgress(project) {
  const status = project?.status || "DRAFT";
  const stages = ["Start", "Plan", "Build", "Check", "Review", "Finish", "Prove"];
  const index = { DRAFT: 0, PLANNING: 1, BUILDING: 2, READY_FOR_CHECK: 3, CHANGES_REQUIRED: 2, READY_FOR_REVIEW: 4, APPROVED: 4, DELIVERY_READY: 5, DELIVERED: 5 }[status] ?? 0;
  return { currentStage: stageLabel(status), stages, completedStages: stages.slice(0, index), remainingStages: stages.slice(index + 1), blocked: status === "CHANGES_REQUIRED", explanation: status === "CHANGES_REQUIRED" ? "A project check needs attention before you continue." : `Your project is in the ${stageLabel(status).toLowerCase()} stage.` };
}

export function toStudioCompanionContext({ project, route = "/studio", nextAction = resolveStudioNextAction(project), progress = deriveStudioProgress(project), resources = [] } = {}) {
  if (!project) return { route, project: null, nextAction: nextAction.label, currentStage: "Start", availableRequirements: [], authority: "read-only" };
  return {
    route,
    authority: "read-only",
    project: { id: project.projectId, title: project.title, type: projectTypeLabel(project.projectType), origin: project.origin },
    assignment: project.assignmentId ? { id: project.assignmentId, releaseId: project.curriculumReleaseId } : null,
    currentStage: progress.currentStage,
    nextAction: nextAction.label,
    availableRequirements: [],
    qaBlockers: [],
    resources: resources.map((resource) => ({ id: resource.id, title: resource.title, type: resource.type, description: resource.description, sourceLabel: resource.sourceLabel })).slice(0, 12),
  };
}
