import type { RegistryUpsertPayload } from "./registry_entity.client";

type AgentKind = "agent";
type AppKind = "app";

export function buildAgentUpsert(args: {
  id: string;
  name: string;
  title: string;
  layer: string;
  notes: string;
  agentId?: string;
  reason: string;
}): RegistryUpsertPayload {
  return {
    entity: {
      kind: "agent" as AgentKind,
      id: args.id,
      name: args.name,
      title: args.title,
      layer: args.layer,
      lifecycle: { status: "active" },
      policy: { humanApproval: false, maxSteps: 6, notes: args.notes },
      ...(args.agentId ? { agentId: args.agentId } : {}),
      legal: {
        classification: "internal",
        dataCategory: ["none"],
        authority: { approvedBy: "shf-admin", basis: "ui_upsert" },
        jurisdiction: "US-OH",
        termsRef: "legal/terms/shf-registry-terms@1.0.0",
        disclaimerRef: "legal/disclaimers/default@1.0.0",
        retention: { artifactsDays: 365, auditLogsDays: 365, deletionPolicy: "retire_only" },
        attestations: [],
      },
    },
    reason: args.reason,
  } as any;
}

export function buildAppUpsert(args: {
  id: string;
  name: string;
  title: string;
  layer: string;
  notes: string;
  reason: string;
}): RegistryUpsertPayload {
  return {
    entity: {
      kind: "app" as AppKind,
      id: args.id,
      name: args.name,
      title: args.title,
      layer: args.layer,
      lifecycle: { status: "active" },
      policy: { humanApproval: false, maxSteps: 6, notes: args.notes },
      legal: {
        classification: "internal",
        dataCategory: ["none"],
        authority: { approvedBy: "shf-admin", basis: "ui_upsert" },
        jurisdiction: "US-OH",
        termsRef: "legal/terms/shf-registry-terms@1.0.0",
        disclaimerRef: "legal/disclaimers/default@1.0.0",
        retention: { artifactsDays: 365, auditLogsDays: 365, deletionPolicy: "retire_only" },
        attestations: [],
      },
    },
    reason: args.reason,
  } as any;
}
