// MET-11 — City Economy Orchestration projection contract.
//
// This is a read-oriented experience layer. It does not own assignments,
// missions, opportunities, projects, evidence, Treasury, Market, Passport,
// career, civic, organization, role, or credential truth.

export const CITY_NEXT_ACTION_TYPES = [
  "CONTINUE_ASSIGNMENT",
  "PRACTICE_IN_ARCADE",
  "ENTER_CITY_MISSION",
  "SUBMIT_MISSION_WORK",
  "REVIEW_AVAILABLE_OPPORTUNITY",
  "SUBMIT_OPPORTUNITY_BID",
  "CONTINUE_PROJECT",
  "SUBMIT_PROJECT_WORK",
  "REVIEW_EVIDENCE_STATUS",
  "CLAIM_AVAILABLE_REWARD",
  "VISIT_MARKET",
  "VIEW_WORK_PASSPORT",
  "CONTINUE_CAREER_PATH",
  "JOIN_PROGRAM_MISSION",
  "EXPLORE_SIDE_MISSION",
  "COMPLETE_CIVIC_COURSE",
  "FILE_CANDIDACY",
  "REVIEW_CANDIDATE_PROFILE",
  "ATTEND_CANDIDATE_FORUM",
  "CAST_STUDENT_BALLOT",
  "ATTEND_COUNCIL_SESSION",
  "REVIEW_COUNCIL_AGENDA",
  "SUBMIT_CITY_PROPOSAL",
  "VOTE_ON_COUNCIL_PROPOSAL",
  "CONTINUE_CITY_PROJECT",
  "COMPLETE_CIVIC_MISSION",
  "ATTEND_CITY_EVENT",
  "NO_ACTION_AVAILABLE",
] as const;
export type CityNextActionType = typeof CITY_NEXT_ACTION_TYPES[number];

export const CITY_NEXT_ACTION_PRIORITY = [
  "REQUIRED_BLOCKING_ACTION",
  "ACTIVE_ASSIGNMENT_PROJECT_DEADLINE",
  "REQUIRED_MISSION",
  "SUBMISSION_REVISION_REQUIRED",
  "AWARDED_OPPORTUNITY_WORK",
  "EVIDENCE_REVIEW_FOLLOW_UP",
  "PROGRAM_REQUIRED_ACTIVITY",
  "AVAILABLE_CAREER_OPPORTUNITY",
  "CIVIC_GOVERNMENT_ACTION",
  "ARCADE_PRACTICE_RECOMMENDATION",
  "SIDE_MISSION_ENRICHMENT",
  "CITY_EVENT",
  "MARKET_EXPLORATION",
  "NO_ACTION",
] as const;
export type CityNextActionPriorityBand = typeof CITY_NEXT_ACTION_PRIORITY[number];

export interface GuidedNextAction {
  action_type: CityNextActionType;
  title: string;
  summary: string;
  reason: string;
  source_type: string;
  source_ref: string | null;
  district_id?: string | null;
  facility_id?: string | null;
  route_or_destination: string | null;
  priority: number;
  priority_band: CityNextActionPriorityBand;
  is_required: boolean;
  is_available: boolean;
  blocked_reason?: string | null;
}

export interface CityBriefingItem {
  id: string;
  title: string;
  summary: string;
  source_type: string;
  source_ref: string;
  district_id?: string | null;
  facility_id?: string | null;
  due_at?: string | null;
  status?: string | null;
}

export interface DailyCityBriefing {
  generated_at: string;
  sections: {
    today: CityBriefingItem[];
    opportunities: CityBriefingItem[];
    city: CityBriefingItem[];
    economy: CityBriefingItem[];
    progress: CityBriefingItem[];
  };
  source_backed_only: true;
}

export interface CityDistrictPulse {
  district_id: string;
  active_missions: number;
  open_opportunities: number;
  active_projects: number;
  city_events: number;
  market_listings?: number;
  program_activity: number;
  learner_relevant_count: number;
  has_required_action: boolean;
  has_next_action: boolean;
  status_summary: string;
}

export interface CityOpportunityMarker {
  district_id: string;
  facility_id?: string | null;
  label: string;
  eligible_opportunity_count: number;
  beginner_count: number;
  team_count: number;
  mission_linked_count: number;
  source: "MET-8_OPPORTUNITY_ELIGIBILITY";
}

export interface CityEventProjection {
  event_id: string;
  source: "PROGRAM" | "ARCADE" | "MISSION" | "OPPORTUNITY" | "CAREER" | "CIVIC" | "COMMUNITY" | "MARKET" | "SYSTEM";
  source_ref: string;
  title: string;
  summary: string;
  starts_at: string | null;
  ends_at: string | null;
  district_id: string | null;
  facility_id: string | null;
  eligibility: string;
  visibility: "SELF" | "PROGRAM" | "ORGANIZATION" | "PUBLIC";
  status: "ACTIVE" | "UPCOMING" | "PAST" | "BLOCKED";
}

export interface BuildingPreview {
  facility_id: string;
  facility_name: string;
  district_id: string;
  current_missions: CityBriefingItem[];
  opportunity_count: number;
  active_program_or_event: CityEventProjection | null;
  learner_next_action: GuidedNextAction | null;
  presence_count: number | null;
  status: string;
  enter_action: GuidedNextAction;
  privacy: {
    exposes_identities: false;
    presence_is_aggregate: true;
  };
}

export interface FastTravelDestination {
  destination_id: string;
  label: string;
  district_id: string | null;
  facility_id: string | null;
  activity_id: string | null;
  route_or_destination: string | null;
  protected_entry_required: true;
  available: boolean;
  blocked_reason: string | null;
}

export interface CityOrchestrationProjection {
  projection_version: "MET-11";
  learner_id: string;
  organization_id: string;
  program_context: Record<string, unknown> | null;
  current_assignment: Record<string, unknown> | null;
  recommended_arcade_activity: Record<string, unknown> | null;
  available_missions: unknown[];
  recommended_mission: unknown | null;
  available_opportunities: unknown[];
  recommended_opportunity: unknown | null;
  active_project: Record<string, unknown> | null;
  evidence_state: Record<string, unknown>;
  reward_state: Record<string, unknown>;
  market_state: Record<string, unknown>;
  passport_state: Record<string, unknown>;
  career_state: Record<string, unknown>;
  civic_state?: Record<string, unknown> | null;
  next_action: GuidedNextAction;
  briefing: DailyCityBriefing;
  city_events: CityEventProjection[];
  district_pulses: CityDistrictPulse[];
  opportunity_markers: CityOpportunityMarker[];
  building_previews: BuildingPreview[];
  fast_travel_destinations: FastTravelDestination[];
  authority_reuse: Record<string, string>;
  generated_at: string;
  expires_at: string;
  persistence_policy: {
    duplicate_truth_persisted: false;
    allowed_state: string[];
  };
}
