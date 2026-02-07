export type LifecycleStatus = "active" | "deprecated" | "retired";

export type Retention = {
  artifactsDays: number;
  auditLogsDays: number;
  deletionPolicy: string; // e.g. "retire_only"
};

export type Authority = {
  approvedBy: string;
  basis: string;
  approvedAt?: string; // server may add
};

export type Legal = {
  classification: string;      // e.g. "internal"
  dataCategory: string[];      // e.g. ["none"]
  authority: Authority;
  jurisdiction: string;        // e.g. "US-OH"
  termsRef: string;            // e.g. "legal/terms/shf-registry-terms@1.0.0"
  disclaimerRef: string;       // e.g. "legal/disclaimers/default@1.0.0"
  retention: Retention;
  attestations: unknown[];     // opaque list
};

export type Lifecycle = { status: LifecycleStatus };

export type Policy = {
  humanApproval?: boolean;
  maxSteps?: number;
  notes?: string;
  [k: string]: unknown;
};

export type BaseEntity = {
  id: string;                  // stable entity id (primary key)
  name: string;                // display name
  title?: string;
  layer: string;               // e.g. "L10"
  lifecycle: Lifecycle;        // MUST be active|deprecated|retired
  policy?: Policy;
  legal: Legal;                // REQUIRED
};

export type AgentEntity = BaseEntity & {
  kind: "agent";
  agentId?: string;            // optional external ref (like L10-INTAKE-001)
};

export type AppEntity = BaseEntity & {
  kind: "app";
  entry?: string;              // e.g. "src/entries/admin.main.jsx"
  home?: string;               // e.g. "/admin.html#/home"
  capabilities?: string[];     // e.g. ["ledger","analytics"]
};

export type RegistryEntity = AgentEntity | AppEntity;

export type UpsertPayload = {
  entity: RegistryEntity;
  reason: string;              // required audit note
};
