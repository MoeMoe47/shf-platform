export type ResolverSourceStatus = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "NOT_APPLICABLE";
export type ResolverState = "REQUIRED" | "OPTIONAL" | "REFERENCE" | "WAITING" | "BLOCKED" | "COMPLETED";

export interface OrientationActor {
  user_id: string; organization_id: string; active_organization_id: string; tenant_id: string;
  roles: string[]; permissions: string[]; organization_type?: string | null;
}
export interface OrientationResolverHints {
  destinationId?: string; routeId?: string; serviceKey?: string; workflowType?: string; workflowStage?: string;
  resourceType?: string; resourceId?: string; priorOrientationVersion?: number;
  experienceLevel?: "NEW" | "EARLY" | "EXPERIENCED" | "RETURNING"; requestedHelpTopic?: string;
}
export interface OrientationCatalogEntry {
  orientationId: string; destinationId: string; owningService: string; version: number;
  lifecycle: "DRAFT" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
  visibility: "PUBLIC" | "AUTHENTICATED" | "ROLE_SCOPED"; roles: string[]; permissions: string[];
  title: string; purpose: string; tier: "TIER_A" | "TIER_B" | "TIER_C"; tourId: string | null;
  accessibleAlternativeRef: { kind: string; id: string } | null;
  dgalReferences: { kind: string; id: string }[]; companionTopics: string[];
  safeActions: Record<string, { destinationId: string; routeId: string }>;
  reorientation: { policy: "NONE" | "OPTIONAL" | "RECOMMENDED" | "REQUIRED"; changeClassification: string };
  testOnly?: boolean;
}
export interface DomainNextAction {
  id: string; title: string; explanation?: string; state: ResolverState; responsibility?: string | null;
  source: { sourceId: string; sourceDomain: string };
  actionTarget?: { route: string; resourceType?: string; resourceId?: string; action?: string } | null;
  priority?: number; required?: boolean;
}
export interface ResolverDependencies {
  resolveDgal: (actor: OrientationActor, context: Record<string, unknown>) => Promise<any>;
  resolveNextActions?: (actor: OrientationActor, context: Record<string, unknown>) => Promise<DomainNextAction[]>;
}
export interface OrientationResolution {
  status: "RESOLVED" | "PARTIAL" | "UNAVAILABLE" | "FORBIDDEN" | "NOT_FOUND";
  context: { actorId: string; organizationId: string; tenantId: string; destinationId: string; routeId: string | null; serviceKey: string | null; workflowType: string | null; workflowStage: string | null; experienceLevel: string };
  orientation: { orientationId: string; version: number; title: string; purpose: string; tourId: string | null; accessibleAlternativeRef: { kind: string; id: string } | null; companionTopics: string[]; safeActions: Record<string, { destinationId: string; routeId: string }>; source: { sourceId: string; sourceDomain: string }; presentation: string } | null;
  contextualGuidance: any[];
  checklist: Array<DomainNextAction & { completionSource: string; category: ResolverState }>;
  documentation: { references: { kind: string; id: string }[]; status: ResolverSourceStatus };
  companion: { enabled: boolean; suggestedTopics: string[]; status: ResolverSourceStatus };
  nextActions: DomainNextAction[];
  reorientation: { policy: string; priorVersion: number | null; currentVersion: number | null; changed: boolean; changeClassification: string | null };
  sourceStatus: Record<string, ResolverSourceStatus>;
  trace: { orientationId: string | null; orientationVersion: number | null; sources: string[] };
}
