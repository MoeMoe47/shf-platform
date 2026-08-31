// SHF Ecosystem Phase 11 — Learning Companion Context contract.
//
// NON-NEGOTIABLE: this domain owns no institutional truth and issues no
// institutional decisions. It only reads already-canonical, already-
// entitled facts from Calendar Projection/Intelligence, Journey
// Milestones, Career Pathway, and Credentials, and derives a bounded,
// explainable summary plus a deterministic guidance list. It never marks
// anything complete, attended, approved, issued, or mastered, and it
// never fabricates career qualification, free time, or completion.
//
// This context is intentionally NOT the full payload any single source
// domain would return — only the fields the Companion UI actually
// consumes (see companionConfig.js / CompanionBubble.jsx), per the
// phase brief's own "only expose what Companion actually needs."
import { CalendarRecommendation, LoadCategory } from "../../calendar/service/calendar-intelligence-service.js";

export interface CompanionCalendarSummary {
  weeklyLoadCategory: LoadCategory;
  scheduledEventCount: number;
  requiredDeadlineCount: number;
  conflictCount: number;
  deadlineConcentrationCount: number;
}

export interface CompanionCredentialSummary {
  issuedCount: number;
  upcomingRenewalCount: number;
}

export interface CompanionJourneySummary {
  milestoneCount: number;
  completedCount: number;
}

export interface CompanionPathway {
  careerIds: string[];
  careerFamilyIds: string[];
}

// Guidance mode maps 1:1 onto the existing frontend COMPANION_MODES
// (src/companion/companionReducer.js) — Companion Context never invents a
// new mode taxonomy, it only labels which existing mode a guidance item
// belongs under.
export type CompanionGuidanceMode = "coach" | "career";

export type CompanionGuidanceReasonCode =
  | "CONFLICT"
  | "DEADLINE_CONCENTRATION"
  | "DEADLINE_SOON"
  | "CREDENTIAL_RENEWAL_SOON"
  | "PATHWAY_RELEVANT_OPPORTUNITY"
  | "EXTERNAL_BUSY_CONFLICT";

// Deterministic priority order (phase brief §16), lower number = higher
// priority. Only the ranks this phase's guidance types actually use are
// populated below (1, 4, 6) — the full 8-rank scale is documented in
// docs/SHF_LEARNING_COMPANION_INTELLIGENCE.md so a future phase can slot
// a new guidance type into the correct rank without renumbering existing
// ones. Phase 12.2 fills rank 3 (one of the ranks Phase 11's own §19
// boundary note reserved for exactly this) — an external-calendar
// conflict is advisory, so it ranks below a certain SHF CONFLICT/
// DEADLINE_SOON/DEADLINE_CONCENTRATION (rank 1-2) but above the less
// time-sensitive CREDENTIAL_RENEWAL_SOON/PATHWAY_RELEVANT_OPPORTUNITY.
export const GUIDANCE_PRIORITY: Record<CompanionGuidanceReasonCode, number> = {
  CONFLICT: 1,
  DEADLINE_SOON: 2,
  DEADLINE_CONCENTRATION: 2,
  EXTERNAL_BUSY_CONFLICT: 3,
  CREDENTIAL_RENEWAL_SOON: 4,
  PATHWAY_RELEVANT_OPPORTUNITY: 6,
};

export interface CompanionGuidance {
  id: string;
  mode: CompanionGuidanceMode;
  reasonCode: CompanionGuidanceReasonCode;
  message: string;
  relatedSourceIds: string[];
  action: { label: string; url: string | null };
  priority: number;
  dismissible: boolean;
}

export interface CompanionContext {
  pathway: CompanionPathway | null;
  calendar: CompanionCalendarSummary | null;
  credentials: CompanionCredentialSummary | null;
  journey: CompanionJourneySummary | null;
  guidance: CompanionGuidance[];
  sourceAvailability: { partial: boolean; unavailableSources: string[] };
  generatedAt: string;
}

export const COMPANION_SOURCES = ["calendar", "journey", "pathway", "credentials"] as const;
export type CompanionSource = typeof COMPANION_SOURCES[number];

// Re-exported so callers of this module don't need a second import for
// the one Calendar Intelligence type this contract embeds by reference.
export type { CalendarRecommendation };
