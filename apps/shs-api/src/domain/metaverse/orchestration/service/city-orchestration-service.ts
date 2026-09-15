import { getSiliconHeartlandCityRegistry } from "../../registry/city-registry.js";
import { MetaverseEntryService } from "../../runtime/metaverse-entry-service.js";
import { listMissionsForActor } from "../../missions/mission-projection-service.js";
import { listOpportunitiesForActor } from "../../opportunities/service/opportunity-service.js";
import { listListings } from "../../market/service/listing-service.js";
import { getBalance, listMyOrders } from "../../market/service/order-service.js";
import { getMyPassport } from "../../passport/service/passport-projection-service.js";
import { listMyEnterprises } from "../../enterprise/service/enterprise-service.js";
import type {
  BuildingPreview,
  CityBriefingItem,
  CityDistrictPulse,
  CityEventProjection,
  CityOpportunityMarker,
  CityOrchestrationProjection,
  DailyCityBriefing,
  FastTravelDestination,
  GuidedNextAction,
} from "../model/orchestration-contract.js";

type Actor = {
  user_id?: string;
  id?: string;
  active_organization_id?: string;
  organization_id?: string;
  org_context_error?: string;
};

export type CityOrchestrationSources = {
  missions: any[];
  opportunities: any[];
  marketListings: any[];
  marketOrders: any[];
  marketBalance: any | null;
  passport: any | null;
  cityPresenceCounts?: Array<{ district_id?: string; districtId?: string; facility_id?: string; facilityId?: string; participant_count?: number; count?: number }>;
  enterprises?: any[];
};

export const CITY_ORCHESTRATION_AUTHORITY_REUSE = {
  assignments: "apps/shs-api/src/domain/assignments/service/assignment-entitlement-service.ts",
  curriculum: "apps/shs-api/src/domain/curriculum-catalog and completion-policy services",
  arcade: "apps/shs-api/src/domain/arcade plus MET-7 mission arcadeRelations",
  missions: "apps/shs-api/src/domain/metaverse/missions/mission-projection-service.ts",
  opportunities: "apps/shs-api/src/domain/metaverse/opportunities/service/opportunity-service.ts",
  projects: "Studio/project references from MET-8 awards and MET-10 passport sources",
  evidence: "apps/shs-api/src/domain/verified-evidence via Work Passport projection",
  treasury: "apps/shs-api/src/domain/metaverse/market/service/market-treasury-adapter.ts",
  market: "apps/shs-api/src/domain/metaverse/market service/repo",
  passport: "apps/shs-api/src/domain/metaverse/passport/service/passport-projection-service.ts",
  career: "career-pathway/career refs projected through missions, opportunities, and Passport",
  unlock: "apps/shs-api/src/domain/metaverse/unlocks/unlock-resolver.ts",
  protected_entry: "apps/shs-api/src/domain/metaverse/runtime/metaverse-entry-service.ts",
  registry: "apps/shs-api/src/domain/metaverse/registry/city-registry.ts",
  presence: "apps/shs-api/src/domain/metaverse/communication/runtime/presence-service.ts",
  notifications: "apps/shs-api/src/domain/notifications (NCA), not duplicated here",
  student_enterprise: "apps/shs-api/src/domain/metaverse/enterprise/service/enterprise-service.js (MET-12)",
} as const;

export class CityOrchestrationError extends Error {
  constructor(public code: string, message: string, public statusCode = 403) {
    super(message);
  }
}

function learnerId(actor: Actor) {
  return String(actor?.user_id || actor?.id || "").trim();
}

function organizationId(actor: Actor) {
  return String(actor?.active_organization_id || actor?.organization_id || "").trim();
}

function assertScope(actor: Actor) {
  if (!actor) throw new CityOrchestrationError("AUTH_REQUIRED", "Authentication required.", 401);
  if (actor.org_context_error) throw new CityOrchestrationError(actor.org_context_error, "Valid active organization context is required.", 403);
  const userId = learnerId(actor);
  const orgId = organizationId(actor);
  if (!userId || !orgId) throw new CityOrchestrationError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  return { learnerId: userId, organizationId: orgId };
}

function item(input: Partial<CityBriefingItem> & { id: string; title: string; source_type: string; source_ref: string }): CityBriefingItem {
  return {
    id: input.id,
    title: input.title,
    summary: input.summary || "",
    source_type: input.source_type,
    source_ref: input.source_ref,
    district_id: input.district_id || null,
    facility_id: input.facility_id || null,
    due_at: input.due_at || null,
    status: input.status || null,
  };
}

function missionAvailable(mission: any) {
  return !["LOCKED", "CLOSED", "COMPLETED_SOURCE_PENDING_VERIFICATION", "COMPLETED_VERIFIED_SOURCE"].includes(String(mission?.missionStatus || ""));
}

function missionRequired(mission: any) {
  return missionAvailable(mission) && String(mission?.assignmentType || "").toLowerCase() !== "enrichment";
}

function eligibleOpportunity(opportunity: any) {
  return !opportunity?.eligibility || ["ELIGIBLE", "CONDITIONALLY_ELIGIBLE"].includes(String(opportunity.eligibility?.result || ""));
}

function opportunityOpen(opportunity: any) {
  return String(opportunity?.status || "") === "OPEN" && eligibleOpportunity(opportunity);
}

function sourceRouteForMission(mission: any) {
  const location = mission?.location || {};
  if (location.metaverseActivityId) return `ACTIVITY:${location.metaverseActivityId}`;
  if (location.facilityId) return `FACILITY:${location.facilityId}`;
  if (location.districtId) return `DISTRICT:${location.districtId}`;
  return "/metaverse";
}

function nextAction(input: Partial<GuidedNextAction> & Pick<GuidedNextAction, "action_type" | "title" | "summary" | "reason" | "source_type" | "source_ref" | "priority" | "priority_band" | "is_required" | "is_available">): GuidedNextAction {
  return {
    route_or_destination: null,
    district_id: null,
    facility_id: null,
    blocked_reason: null,
    ...input,
  };
}

export function deriveGuidedNextAction(sources: CityOrchestrationSources): GuidedNextAction {
  const missions = sources.missions || [];
  const opportunities = sources.opportunities || [];
  const orders = sources.marketOrders || [];
  const passport = sources.passport || {};

  const blockingArcade = missions.find((mission) => missionRequired(mission) && (mission.arcadeRelations || []).some((rel: any) => rel.requiredOrRecommended === "REQUIRED" && !rel.masteryAchieved));
  if (blockingArcade) {
    const rel = (blockingArcade.arcadeRelations || []).find((r: any) => r.requiredOrRecommended === "REQUIRED" && !r.masteryAchieved);
    return nextAction({
      action_type: "PRACTICE_IN_ARCADE",
      title: rel?.title ? `Practice ${rel.title}` : "Practice in the Arcade",
      summary: blockingArcade.missionTitle,
      reason: "Your current assignment requires Arcade preparation before mission completion.",
      source_type: "MET-7_MISSION_ARCADE_RELATION",
      source_ref: rel?.arcadeActivityId || blockingArcade.missionProjectionId,
      district_id: "learning-arcade-district",
      facility_id: "arcade-hub",
      route_or_destination: "/arcade.html#/dashboard",
      priority: 1,
      priority_band: "REQUIRED_BLOCKING_ACTION",
      is_required: true,
      is_available: true,
    });
  }

  const dueMission = missions.find((mission) => missionRequired(mission) && ["OVERDUE", "DUE_SOON"].includes(String(mission.dueState || "")));
  if (dueMission) {
    return nextAction({
      action_type: "ENTER_CITY_MISSION",
      title: dueMission.missionTitle,
      summary: dueMission.missionSummary,
      reason: "Your current assignment or project deadline is active.",
      source_type: "MET-7_MISSION_PROJECTION",
      source_ref: dueMission.missionProjectionId,
      district_id: dueMission.location?.districtId,
      facility_id: dueMission.location?.facilityId,
      route_or_destination: sourceRouteForMission(dueMission),
      priority: 2,
      priority_band: "ACTIVE_ASSIGNMENT_PROJECT_DEADLINE",
      is_required: true,
      is_available: missionAvailable(dueMission),
      blocked_reason: missionAvailable(dueMission) ? null : dueMission.nextAction?.reason,
    });
  }

  const requiredMission = missions.find(missionRequired);
  if (requiredMission) {
    const actionType = requiredMission.nextAction?.kind === "SUBMIT_ARTIFACT" ? "SUBMIT_MISSION_WORK" : "ENTER_CITY_MISSION";
    return nextAction({
      action_type: actionType,
      title: requiredMission.missionTitle,
      summary: requiredMission.missionSummary,
      reason: requiredMission.nextAction?.reason || "This required mission is the next learning step.",
      source_type: "MET-7_MISSION_PROJECTION",
      source_ref: requiredMission.missionProjectionId,
      district_id: requiredMission.location?.districtId,
      facility_id: requiredMission.location?.facilityId,
      route_or_destination: sourceRouteForMission(requiredMission),
      priority: 3,
      priority_band: "REQUIRED_MISSION",
      is_required: true,
      is_available: missionAvailable(requiredMission),
      blocked_reason: missionAvailable(requiredMission) ? null : requiredMission.nextAction?.reason,
    });
  }

  const projectClaim = (passport.claims || []).find((claim: any) => claim.claimType === "PROJECT_COMPLETION" && claim.verificationLevel !== "VERIFIED");
  if (projectClaim) {
    return nextAction({
      action_type: "REVIEW_EVIDENCE_STATUS",
      title: projectClaim.title,
      summary: projectClaim.summary,
      reason: "Project and evidence status should be reviewed through its canonical source.",
      source_type: "MET-10_WORK_PASSPORT",
      source_ref: projectClaim.sourceRef,
      route_or_destination: "/career.html#/portfolio",
      priority: 6,
      priority_band: "EVIDENCE_REVIEW_FOLLOW_UP",
      is_required: false,
      is_available: true,
    });
  }

  const opportunity = opportunities.find(opportunityOpen);
  if (opportunity) {
    return nextAction({
      action_type: "REVIEW_AVAILABLE_OPPORTUNITY",
      title: opportunity.title,
      summary: opportunity.summary,
      reason: opportunity.difficultyTier === "BEGINNER" ? "A beginner opportunity is available without reputation gating." : "An eligible opportunity matches your current source-backed state.",
      source_type: "MET-8_OPPORTUNITY_EXCHANGE",
      source_ref: opportunity.opportunityId,
      district_id: opportunity.districtId,
      facility_id: opportunity.facilityId,
      route_or_destination: "/metaverse?panel=opportunities",
      priority: 8,
      priority_band: "AVAILABLE_CAREER_OPPORTUNITY",
      is_required: false,
      is_available: true,
    });
  }

  const sideMission = missions.find((mission) => String(mission?.opportunityType || mission?.assignmentType || "").includes("SIDE") || String(mission?.sourceType || "").includes("SIDE"));
  if (sideMission) {
    return nextAction({
      action_type: "EXPLORE_SIDE_MISSION",
      title: sideMission.missionTitle,
      summary: sideMission.missionSummary,
      reason: "Required work is complete or unavailable, so enrichment stays available.",
      source_type: "MET-7_SIDE_MISSION_PROJECTION",
      source_ref: sideMission.missionProjectionId,
      district_id: sideMission.location?.districtId,
      facility_id: sideMission.location?.facilityId,
      route_or_destination: sourceRouteForMission(sideMission),
      priority: 10,
      priority_band: "SIDE_MISSION_ENRICHMENT",
      is_required: false,
      is_available: missionAvailable(sideMission),
    });
  }

  const pendingOrder = orders.find((order: any) => ["PENDING_PAYMENT", "PAID", "ACCEPTED"].includes(String(order.status || "")));
  if (pendingOrder) {
    return nextAction({
      action_type: "VISIT_MARKET",
      title: "Review Market Order",
      summary: String(pendingOrder.listingSnapshot?.title || "Student Market order"),
      reason: "Marketplace activity is available after required learning work.",
      source_type: "MET-9_STUDENT_MARKET",
      source_ref: pendingOrder.orderId,
      district_id: "treasury-commerce-district",
      facility_id: "store-marketplace",
      route_or_destination: "/metaverse?panel=market",
      priority: 12,
      priority_band: "MARKET_EXPLORATION",
      is_required: false,
      is_available: true,
    });
  }

  return nextAction({
    action_type: "NO_ACTION_AVAILABLE",
    title: "Explore Silicon Heartland",
    summary: "No required source-backed action is available right now.",
    reason: "All shown city activity must come from canonical sources.",
    source_type: "MET-11_ORCHESTRATION",
    source_ref: null,
    route_or_destination: "/metaverse",
    priority: 13,
    priority_band: "NO_ACTION",
    is_required: false,
    is_available: true,
  });
}

// MET-12 — pure mapping, independently unit-testable without a database.
function enterpriseNextActionType(lifecycleStatus: string): string {
  switch (lifecycleStatus) {
    case "DRAFT": return "COMPLETE_ENTERPRISE_SETUP";
    case "PENDING_APPROVAL": return "SUBMIT_ENTERPRISE_FOR_APPROVAL";
    case "ACTIVE": return "CONTINUE_ENTERPRISE_PROJECT";
    case "PAUSED": return "REVIEW_ENTERPRISE_OPPORTUNITY";
    default: return lifecycleStatus;
  }
}
function enterpriseBriefingSummary(lifecycleStatus: string): string {
  switch (lifecycleStatus) {
    case "DRAFT": return "Finish setting up this Student Enterprise before submitting it for approval.";
    case "PENDING_APPROVAL": return "Awaiting instructor/program/admin review.";
    case "ACTIVE": return "Active Student Enterprise — educational/simulated, not a legal business.";
    case "PAUSED": return "Paused; resume when ready to continue.";
    case "SUSPENDED": return "Suspended by review authority.";
    default: return "Student Enterprise activity.";
  }
}

export function buildDailyBriefing(sources: CityOrchestrationSources, generatedAt: string): DailyCityBriefing {
  const requiredMissions = (sources.missions || []).filter(missionRequired).slice(0, 5).map((mission) => item({
    id: `today:${mission.missionProjectionId}`,
    title: mission.missionTitle,
    summary: mission.nextAction?.reason || mission.missionSummary,
    source_type: "MET-7_MISSION_PROJECTION",
    source_ref: mission.missionProjectionId,
    district_id: mission.location?.districtId,
    facility_id: mission.location?.facilityId,
    due_at: mission.dueAt,
    status: mission.missionStatus,
  }));
  const opportunities = (sources.opportunities || []).filter(opportunityOpen).slice(0, 5).map((opportunity) => item({
    id: `opportunity:${opportunity.opportunityId}`,
    title: opportunity.title,
    summary: opportunity.summary,
    source_type: "MET-8_OPPORTUNITY_EXCHANGE",
    source_ref: opportunity.opportunityId,
    district_id: opportunity.districtId,
    facility_id: opportunity.facilityId,
    due_at: opportunity.applicationCloseAt,
    status: opportunity.eligibility?.result || opportunity.status,
  }));
  const city = (sources.missions || []).filter((mission) => mission.programId || String(mission.assignmentType || "").includes("side")).slice(0, 5).map((mission) => item({
    id: `city:${mission.missionProjectionId}`,
    title: mission.missionTitle,
    summary: mission.programId ? "Program Mission activity" : "Side Mission activity",
    source_type: mission.programId ? "MET-7_PROGRAM_MISSION" : "MET-7_SIDE_MISSION",
    source_ref: mission.missionProjectionId,
    district_id: mission.location?.districtId,
    facility_id: mission.location?.facilityId,
    status: mission.missionStatus,
  }));
  const economy = [
    ...(sources.marketBalance ? [item({
      id: "economy:balance",
      title: "SHF Credit balance available",
      summary: "Balance is read through the Treasury adapter; credits are not capability.",
      source_type: "MET-9_TREASURY_ADAPTER",
      source_ref: "balance",
      status: String(sources.marketBalance?.balance ?? sources.marketBalance?.amount ?? "available"),
    })] : []),
    ...(sources.marketOrders || []).slice(0, 4).map((order) => item({
      id: `economy:${order.orderId}`,
      title: String(order.listingSnapshot?.title || "Market order"),
      summary: "Order status is read from Student Market.",
      source_type: "MET-9_STUDENT_MARKET",
      source_ref: order.orderId,
      status: order.status,
    })),
    // MET-12 — enterprise items are informational briefing entries only;
    // they never become learner_next_action and cannot outrank a required
    // mission in the `today` section above (build brief §Phase H).
    ...(sources.enterprises || []).slice(0, 4).map((enterprise: any) => item({
      id: `economy:enterprise:${enterprise.enterpriseId}`,
      title: enterprise.name,
      summary: enterpriseBriefingSummary(enterprise.lifecycleStatus),
      source_type: "MET-12_STUDENT_ENTERPRISE",
      source_ref: enterprise.enterpriseId,
      status: enterpriseNextActionType(enterprise.lifecycleStatus),
    })),
  ];
  const progress = (sources.passport?.claims || []).slice(0, 5).map((claim: any) => item({
    id: `progress:${claim.passportClaimId}`,
    title: claim.title,
    summary: claim.summary,
    source_type: "MET-10_WORK_PASSPORT",
    source_ref: claim.sourceRef,
    status: claim.verificationLevel,
  }));
  return { generated_at: generatedAt, sections: { today: requiredMissions, opportunities, city, economy, progress }, source_backed_only: true };
}

export function buildCityEvents(sources: CityOrchestrationSources): CityEventProjection[] {
  const opportunityEvents = (sources.opportunities || [])
    .filter((opportunity) => opportunityOpen(opportunity) && ["EVENT", "PROGRAM_MISSION", "SIDE_MISSION", "ARCADE_CHALLENGE_CONTRACT"].includes(String(opportunity.opportunityType || opportunity.sourceType || "")))
    .map((opportunity) => ({
      event_id: `event:${opportunity.opportunityId}`,
      source: opportunity.opportunityType === "ARCADE_CHALLENGE_CONTRACT" ? "ARCADE" : opportunity.sourceType === "SIDE_MISSION" ? "COMMUNITY" : opportunity.sourceType === "PROGRAM_MISSION" ? "PROGRAM" : "OPPORTUNITY",
      source_ref: opportunity.opportunityId,
      title: opportunity.title,
      summary: opportunity.summary,
      starts_at: opportunity.applicationOpenAt || null,
      ends_at: opportunity.applicationCloseAt || null,
      district_id: opportunity.districtId || null,
      facility_id: opportunity.facilityId || null,
      eligibility: opportunity.eligibility?.result || "ELIGIBLE",
      visibility: "ORGANIZATION",
      status: "ACTIVE",
    } as CityEventProjection));
  const missionEvents = (sources.missions || [])
    .filter((mission) => mission.programId)
    .map((mission) => ({
      event_id: `program:${mission.missionProjectionId}`,
      source: "PROGRAM",
      source_ref: mission.missionProjectionId,
      title: mission.missionTitle,
      summary: "Program Mission activity projected from MET-7.",
      starts_at: null,
      ends_at: mission.dueAt || null,
      district_id: mission.location?.districtId || null,
      facility_id: mission.location?.facilityId || null,
      eligibility: mission.missionStatus,
      visibility: "PROGRAM",
      status: missionAvailable(mission) ? "ACTIVE" : "BLOCKED",
    } as CityEventProjection));
  return [...missionEvents, ...opportunityEvents];
}

export function buildDistrictPulses(sources: CityOrchestrationSources, next: GuidedNextAction): CityDistrictPulse[] {
  const registry = getSiliconHeartlandCityRegistry();
  const events = buildCityEvents(sources);
  return registry.districts.map((district) => {
    const activeMissions = (sources.missions || []).filter((m) => m.location?.districtId === district.id && missionAvailable(m)).length;
    const openOpportunities = (sources.opportunities || []).filter((o) => o.districtId === district.id && opportunityOpen(o)).length;
    const activeProjects = (sources.passport?.claims || []).filter((claim: any) => claim.claimType === "PROJECT_COMPLETION" && (claim.metadata?.projectStatus || "").toUpperCase() !== "FINALIZED").length;
    const cityEvents = events.filter((event) => event.district_id === district.id).length;
    const marketListings = (sources.marketListings || []).filter((listing) => (listing.districtId || "treasury-commerce-district") === district.id).length;
    const programActivity = (sources.missions || []).filter((m) => m.location?.districtId === district.id && m.programId).length;
    const learnerRelevantCount = activeMissions + openOpportunities + cityEvents + marketListings + programActivity;
    const hasRequiredAction = Boolean(next.is_required && next.district_id === district.id);
    const hasNextAction = next.district_id === district.id;
    const summaryParts = [
      activeMissions ? `${activeMissions} active mission${activeMissions === 1 ? "" : "s"}` : "",
      openOpportunities ? `${openOpportunities} eligible opportunit${openOpportunities === 1 ? "y" : "ies"}` : "",
      cityEvents ? `${cityEvents} event${cityEvents === 1 ? "" : "s"}` : "",
    ].filter(Boolean);
    return {
      district_id: district.id,
      active_missions: activeMissions,
      open_opportunities: openOpportunities,
      active_projects: activeProjects,
      city_events: cityEvents,
      market_listings: marketListings,
      program_activity: programActivity,
      learner_relevant_count: learnerRelevantCount,
      has_required_action: hasRequiredAction,
      has_next_action: hasNextAction,
      status_summary: summaryParts.join(", ") || "No source-backed activity right now.",
    };
  });
}

export function buildOpportunityMarkers(sources: CityOrchestrationSources): CityOpportunityMarker[] {
  const byLocation = new Map<string, any[]>();
  for (const opportunity of sources.opportunities || []) {
    if (!opportunityOpen(opportunity) || !opportunity.districtId) continue;
    const key = `${opportunity.districtId}|${opportunity.facilityId || ""}`;
    byLocation.set(key, [...(byLocation.get(key) || []), opportunity]);
  }
  return [...byLocation.entries()].map(([key, items]) => {
    const [districtId, facilityId] = key.split("|");
    const beginner = items.filter((o) => o.difficultyTier === "BEGINNER").length;
    const team = items.filter((o) => ["TEAM", "EITHER"].includes(o.participationMode)).length;
    const missionLinked = items.filter((o) => o.missionProjectionId).length;
    return {
      district_id: districtId,
      facility_id: facilityId || null,
      label: `${items.length} opportunities match your current skills`,
      eligible_opportunity_count: items.length,
      beginner_count: beginner,
      team_count: team,
      mission_linked_count: missionLinked,
      source: "MET-8_OPPORTUNITY_ELIGIBILITY",
    };
  });
}

export function buildFastTravelDestinations(next: GuidedNextAction): FastTravelDestination[] {
  const registry = getSiliconHeartlandCityRegistry();
  const base: FastTravelDestination[] = [
    { destination_id: "CITY_HOME", label: "City Home", district_id: null, facility_id: null, activity_id: null, route_or_destination: "/metaverse", protected_entry_required: true, available: true, blocked_reason: null },
    { destination_id: "NEXT_ACTION", label: "Next Action", district_id: next.district_id || null, facility_id: next.facility_id || null, activity_id: null, route_or_destination: next.route_or_destination, protected_entry_required: true, available: next.is_available, blocked_reason: next.blocked_reason || null },
    { destination_id: "CAREER_CENTER", label: "Career Center", district_id: "career-education-district", facility_id: "career-center", activity_id: null, route_or_destination: "/career.html#/", protected_entry_required: true, available: true, blocked_reason: null },
    { destination_id: "ARCADE", label: "Arcade", district_id: "learning-arcade-district", facility_id: "arcade-hub", activity_id: null, route_or_destination: "/arcade.html#/dashboard", protected_entry_required: true, available: true, blocked_reason: null },
    { destination_id: "TREASURY_MARKET", label: "Treasury & Market", district_id: "treasury-commerce-district", facility_id: "store-marketplace", activity_id: null, route_or_destination: "/metaverse?panel=market", protected_entry_required: true, available: true, blocked_reason: null },
    { destination_id: "DATA_CENTER", label: "Data Center", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: null, route_or_destination: "/metaverse", protected_entry_required: true, available: true, blocked_reason: null },
    { destination_id: "CIVIC", label: "Civic", district_id: "civic-district", facility_id: "city-hall", activity_id: null, route_or_destination: "/civic.html#/dashboard", protected_entry_required: true, available: true, blocked_reason: null },
  ];
  return base.filter((dest) => !dest.facility_id || registry.facilities.some((f) => f.id === dest.facility_id));
}

export function buildBuildingPreviews(sources: CityOrchestrationSources, next: GuidedNextAction): BuildingPreview[] {
  const registry = getSiliconHeartlandCityRegistry();
  const events = buildCityEvents(sources);
  return registry.facilities.map((facility) => {
    const currentMissions = (sources.missions || []).filter((m) => m.location?.facilityId === facility.id && missionAvailable(m)).slice(0, 3).map((mission) => item({
      id: `building:${mission.missionProjectionId}`,
      title: mission.missionTitle,
      summary: mission.missionSummary,
      source_type: "MET-7_MISSION_PROJECTION",
      source_ref: mission.missionProjectionId,
      district_id: mission.location?.districtId,
      facility_id: mission.location?.facilityId,
      status: mission.missionStatus,
    }));
    const opportunityCount = (sources.opportunities || []).filter((o) => o.facilityId === facility.id && opportunityOpen(o)).length;
    const event = events.find((e) => e.facility_id === facility.id) || null;
    const presence = (sources.cityPresenceCounts || []).find((p) => (p.facility_id || p.facilityId) === facility.id);
    const enterAction = nextAction({
      action_type: "NO_ACTION_AVAILABLE",
      title: `Enter ${facility.label}`,
      summary: "Navigation only; protected entry still decides access.",
      reason: "Fast travel and building entry must pass canonical metaverse protected entry.",
      source_type: "MET-5_PROTECTED_ENTRY",
      source_ref: facility.id,
      district_id: facility.district_id,
      facility_id: facility.id,
      route_or_destination: `FACILITY:${facility.id}`,
      priority: 13,
      priority_band: "NO_ACTION",
      is_required: false,
      is_available: true,
    });
    return {
      facility_id: facility.id,
      facility_name: facility.label,
      district_id: facility.district_id,
      current_missions: currentMissions,
      opportunity_count: opportunityCount,
      active_program_or_event: event,
      learner_next_action: next.facility_id === facility.id ? next : null,
      presence_count: presence ? Number(presence.participant_count ?? presence.count ?? 0) : null,
      status: currentMissions.length || opportunityCount || event ? "ACTIVE" : "QUIET",
      enter_action: enterAction,
      privacy: { exposes_identities: false, presence_is_aggregate: true },
    };
  });
}

export function buildCityOrchestrationProjection(actor: Actor, sources: CityOrchestrationSources, now: Date = new Date()): CityOrchestrationProjection {
  const scope = assertScope(actor);
  const generatedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 60_000).toISOString();
  const next = deriveGuidedNextAction(sources);
  const briefing = buildDailyBriefing(sources, generatedAt);
  const districtPulses = buildDistrictPulses(sources, next);
  const events = buildCityEvents(sources);
  const opportunityMarkers = buildOpportunityMarkers(sources);
  const buildingPreviews = buildBuildingPreviews(sources, next);
  const fastTravelDestinations = buildFastTravelDestinations(next);
  const currentMission = (sources.missions || []).find(missionRequired) || null;
  const arcade = currentMission?.arcadeRelations?.find((rel: any) => !rel.masteryAchieved) || null;
  const recommendedOpportunity = (sources.opportunities || []).find(opportunityOpen) || null;
  return {
    projection_version: "MET-11",
    learner_id: scope.learnerId,
    organization_id: scope.organizationId,
    program_context: currentMission?.programId ? { program_id: currentMission.programId, source: "MET-7_PROGRAM_MISSION" } : null,
    current_assignment: currentMission ? { assignment_id: currentMission.assignmentId, source: "assignment_entitlement", mission_projection_id: currentMission.missionProjectionId } : null,
    recommended_arcade_activity: arcade ? { arcade_activity_id: arcade.arcadeActivityId, title: arcade.title, source: arcade.source } : null,
    available_missions: sources.missions || [],
    recommended_mission: currentMission,
    available_opportunities: (sources.opportunities || []).filter(opportunityOpen),
    recommended_opportunity: recommendedOpportunity,
    active_project: null,
    evidence_state: { source: "MET-10_WORK_PASSPORT", pending: (sources.passport?.claims || []).filter((claim: any) => claim.verificationLevel === "EVIDENCE_CANDIDATE").length },
    reward_state: { source: "MET-9_TREASURY_ADAPTER", balance: sources.marketBalance || null, direct_balance_mutation: false },
    market_state: { source: "MET-9_STUDENT_MARKET", listing_count: (sources.marketListings || []).length, order_count: (sources.marketOrders || []).length },
    passport_state: { source: "MET-10_WORK_PASSPORT", claim_count: (sources.passport?.claims || []).length, read_only: true },
    career_state: { source: "career_authority_via_passport", career_claim_count: (sources.passport?.claims || []).filter((claim: any) => claim.claimType === "CAREER_PROGRESS").length, job_ready_invented: false },
    next_action: next,
    city_events: events,
    district_pulses: districtPulses,
    opportunity_markers: opportunityMarkers,
    building_previews: buildingPreviews,
    fast_travel_destinations: fastTravelDestinations,
    authority_reuse: CITY_ORCHESTRATION_AUTHORITY_REUSE,
    generated_at: generatedAt,
    expires_at: expiresAt,
    persistence_policy: { duplicate_truth_persisted: false, allowed_state: ["dismissed_briefing_items", "ui_preference", "last_visited_district", "navigation_preference"] },
    briefing,
  };
}

export async function loadCityOrchestrationSources(actor: Actor): Promise<CityOrchestrationSources> {
  assertScope(actor);
  const [missions, opportunities, marketListings, marketOrders, marketBalance, passport, enterprises] = await Promise.all([
    listMissionsForActor(actor).catch(() => []),
    listOpportunitiesForActor(actor).catch(() => []),
    listListings(actor).catch(() => []),
    listMyOrders(actor).catch(() => []),
    getBalance(actor).catch(() => null),
    getMyPassport(actor).catch(() => null),
    // MET-12 — best-effort; city orchestration must not fail if the
    // enterprise domain is unavailable (mirrors every other source here).
    listMyEnterprises(actor).catch(() => []),
  ]);
  return { missions, opportunities, marketListings, marketOrders, marketBalance, passport, enterprises };
}

export async function getCityOrchestration(actor: Actor, now: Date = new Date()) {
  const sources = await loadCityOrchestrationSources(actor);
  return buildCityOrchestrationProjection(actor, sources, now);
}

function destinationResource(destination: FastTravelDestination) {
  if (destination.activity_id) return { scope: "activity", district_id: destination.district_id, facility_id: destination.facility_id, activity_id: destination.activity_id, resource_id: destination.activity_id };
  if (destination.facility_id) return { scope: "facility", district_id: destination.district_id, facility_id: destination.facility_id, resource_id: destination.facility_id };
  if (destination.district_id) return { scope: "district", district_id: destination.district_id, resource_id: destination.district_id };
  return { scope: "city", resource_id: "silicon-heartland-city" };
}

export async function fastTravel(actor: Actor, destinationId: string, clientBody: any = {}) {
  const projection = await getCityOrchestration(actor);
  const destination = projection.fast_travel_destinations.find((item) => item.destination_id === destinationId);
  if (!destination) throw new CityOrchestrationError("DESTINATION_NOT_FOUND", "Fast travel destination not found.", 404);
  if (!destination.available) throw new CityOrchestrationError("DESTINATION_BLOCKED", destination.blocked_reason || "Fast travel destination is blocked.", 403);
  const entry = await new MetaverseEntryService().decide({
    user: actor,
    resource: destinationResource(destination),
    clientBody,
    emitEvent: true,
    eventName: "enter",
  });
  return {
    destination,
    entry,
    can_enter: entry.can_enter,
    authority: {
      navigation_only: true,
      protected_entry_reused: true,
      client_authority_ignored: true,
    },
  };
}

export function statusForCityOrchestrationError(error: any) {
  if (error instanceof CityOrchestrationError) return error.statusCode;
  if (String(error?.message || "").includes("Authentication required")) return 401;
  return 500;
}
