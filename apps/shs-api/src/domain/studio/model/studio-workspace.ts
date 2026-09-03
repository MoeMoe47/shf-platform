import { isStudioProjectType, type StudioProjectType } from "./studio-lifecycle.js";

export type StudioWebsiteWork = {
  pages: Array<{ path: string; title: string; content: string }>;
};

export type StudioAgentWork = {
  name: string;
  instructions: string;
  tools: string[];
};

export type StudioWorkspaceWork = StudioWebsiteWork | StudioAgentWork;

export interface StudioWorkspace {
  workspaceId: string | null;
  revisionId: string | null;
  projectId: string;
  projectType: StudioProjectType;
  revision: number;
  work: StudioWorkspaceWork;
  createdAt: string | null;
  updatedAt: string | null;
}

const MAX_TEXT = 50_000;
const MAX_PAGES = 20;
const MAX_TOOLS = 20;

function invalid(message: string): never { throw new Error(`WORKSPACE_PAYLOAD_INVALID:${message}`); }
function plain(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("object_required");
  return value as Record<string, unknown>;
}
function text(value: unknown, field: string, max = MAX_TEXT) {
  if (typeof value !== "string" || value.length > max) invalid(`${field}_invalid`);
  return value;
}

export function emptyStudioWorkspace(projectType: StudioProjectType): StudioWorkspaceWork {
  return projectType === "WEBSITE" ? { pages: [{ path: "/", title: "Home", content: "" }] } : { name: "", instructions: "", tools: [] };
}

export function validateStudioWorkspaceWork(projectType: StudioProjectType, input: unknown): StudioWorkspaceWork {
  if (!isStudioProjectType(projectType)) invalid("project_type_invalid");
  const value = plain(input);
  const forbidden = ["organizationId", "tenantId", "projectType", "destination", "status", "qaStatus", "reviewStatus", "deliveryStatus", "assignmentId", "curriculumReleaseId", "completed", "verified", "evidence", "approved"];
  if (forbidden.some((key) => key in value)) invalid("authority_field_forbidden");
  if (projectType === "WEBSITE") {
    if (!Array.isArray(value.pages) || value.pages.length > MAX_PAGES) invalid("pages_invalid");
    const pages = value.pages.map((page, index) => {
      const item = plain(page);
      const path = text(item.path, `pages_${index}_path`, 200);
      if (!path.startsWith("/") || path.includes("..") || path.includes("\\")) invalid(`pages_${index}_path_invalid`);
      return { path, title: text(item.title, `pages_${index}_title`, 200), content: text(item.content, `pages_${index}_content`) };
    });
    if (JSON.stringify(pages).length > 200_000) invalid("payload_too_large");
    return { pages };
  }
  const name = text(value.name, "name", 200);
  const instructions = text(value.instructions, "instructions");
  if (!Array.isArray(value.tools) || value.tools.length > MAX_TOOLS || value.tools.some((tool) => typeof tool !== "string" || tool.length > 200)) invalid("tools_invalid");
  return { name, instructions, tools: value.tools as string[] };
}

export function workspaceFromRow(row: any, fallbackType?: StudioProjectType): StudioWorkspace {
  const projectType = row?.project_type || fallbackType;
  if (!isStudioProjectType(projectType)) throw new Error("WORKSPACE_TYPE_INVALID");
  return {
    workspaceId: row?.workspace_id ?? null,
    revisionId: row?.current_revision_id ?? null,
    projectId: row.project_id,
    projectType,
    revision: Number(row?.revision || 0),
    work: row?.work_json ? validateStudioWorkspaceWork(projectType, row.work_json) : emptyStudioWorkspace(projectType),
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}
