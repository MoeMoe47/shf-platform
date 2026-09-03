import { randomUUID } from "node:crypto";
import { validateStudioWorkspaceWork } from "../model/studio-workspace.js";

type Connection = { id: string; userId: string; name: string; actor: any; response: any };

function displayName(actor: any) {
  return String(actor?.full_name || [actor?.first_name, actor?.last_name].filter(Boolean).join(" ") || actor?.user_id || actor?.id || "Collaborator");
}

function write(response: any, event: string, data: unknown) {
  if (!response.writableEnded && !response.destroyed) {
    response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

export class StudioCollaborationService {
  private sessions = new Map<string, Map<string, Connection>>();

  async connect(actor: any, projectId: string, response: any, authorize: (actor: any, projectId: string) => Promise<any>) {
    const access = await authorize(actor, projectId);
    const id = randomUUID();
    const projectSessions = this.sessions.get(projectId) || new Map<string, Connection>();
    projectSessions.set(id, { id, userId: String(actor.user_id || actor.id), name: displayName(actor), actor, response });
    this.sessions.set(projectId, projectSessions);
    write(response, "session", { connectionId: id, projectId, revision: access.workspace?.revision || 0, revisionId: access.workspace?.current_revision_id || null });
    this.broadcastPresence(projectId);
    return () => {
      const current = this.sessions.get(projectId);
      current?.delete(id);
      if (current && current.size === 0) this.sessions.delete(projectId);
      else this.broadcastPresence(projectId);
    };
  }

  async publish(actor: any, projectId: string, input: any, authorize: (actor: any, projectId: string) => Promise<any>) {
    const access = await authorize(actor, projectId);
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => key !== "work")) {
      throw new Error("COLLABORATION_PAYLOAD_INVALID");
    }
    const work = input?.work;
    if (!work || JSON.stringify(work).length > 100000) throw new Error("COLLABORATION_PAYLOAD_INVALID");
    validateStudioWorkspaceWork(access.project.studio_project_type, work);
    const sender = String(actor.user_id || actor.id);
    for (const connection of this.sessions.get(projectId)?.values() || []) {
      if (connection.userId !== sender) write(connection.response, "remote_update", { projectId, work, by: displayName(actor), revision: access.workspace?.revision || 0 });
    }
    return { delivered: Math.max(0, (this.sessions.get(projectId)?.size || 0) - 1), revision: access.workspace?.revision || 0 };
  }

  async revalidate(projectId: string, authorize: (actor: any, projectId: string) => Promise<any>) {
    const current = this.sessions.get(projectId);
    if (!current) return;
    for (const connection of [...current.values()]) {
      try {
        await authorize(connection.actor, projectId);
      } catch {
        current.delete(connection.id);
        if (!connection.response.writableEnded) connection.response.end();
      }
    }
    if (current.size === 0) this.sessions.delete(projectId);
    else this.broadcastPresence(projectId);
  }

  private broadcastPresence(projectId: string) {
    const connections = [...(this.sessions.get(projectId)?.values() || [])];
    const collaborators = connections.map(({ userId, name }) => ({ userId, name }));
    for (const connection of connections) write(connection.response, "presence", { collaborators });
  }
}
