// Legacy Arcade UI/event vocabulary. These values do not authorize outcomes.
//
// This module is legacy compatibility metadata only. It does not authorize
// wallet, Treasury, credit, skill, evidence, credential, mastery, or
// blockchain outcomes.

export const ARCADE_EVENTS = Object.freeze({
  GAME_START: "arcade_game_start",
  GAME_COMPLETE: "arcade_game_complete",
  BADGE_CLAIMED: "arcade_badge_claimed",
  TOURNAMENT_JOIN: "arcade_tournament_join",
  TOURNAMENT_WIN: "arcade_tournament_win",
});

export const SKILL_CATEGORIES = Object.freeze({
  SEL: "sel",
  WORKFORCE: "workforce",
  COGNITIVE: "cognitive",
});

export const SKILL_TAGS = Object.freeze({
  SEL_PLANNING: "planning",
  SEL_FOCUS: "focus",
  SEL_DECISION_MAKING: "decision-making",
  SEL_SELF_MANAGEMENT: "self-management",
  SEL_RELATIONSHIP: "relationship-skills",
  SEL_LEADERSHIP: "leadership",
  WF_FINANCIAL_LITERACY: "financial-literacy",
  WF_CAREER_EXPLORATION: "career-exploration",
  WF_CUSTOMER_SERVICE: "customer-service",
  WF_RESUME_WRITING: "resume-writing",
  WF_INTERVIEWING: "interviewing",
  COG_MEMORY: "memory",
  COG_PROCESSING_SPEED: "processing-speed",
  COG_SPATIAL: "spatial-perception",
  COG_PROBLEM_SOLVING: "problem-solving",
});

function compatibilityRule(label, description, analyticsOnly = false) {
  return {
    label,
    description,
    authoritative: false,
    onChain: false,
    wallet: {
      baseXp: 0,
      useGameXpReward: false,
      baseTokens: 0,
      useGameTokenReward: false,
      recordTransaction: false,
    },
    credit: {
      evuBase: 0,
      evuFromGameWeight: false,
      scoreDelta: 0,
    },
    skills: {
      sel: [],
      workforce: [],
      cognitive: [],
      skillWeight: 0,
    },
    telemetry: { analyticsOnly },
    polygon: { actionType: "none" },
  };
}

// ARCADE_EVENTS remains for caller compatibility. The backend Arcade Result
// workflow emits the canonical downstream `arcade.resulted` event.
export const arcadeEventRules = Object.freeze({
  [ARCADE_EVENTS.GAME_START]: compatibilityRule(
    "Game started",
    "Legacy UI event vocabulary for a game start.",
    true,
  ),
  [ARCADE_EVENTS.GAME_COMPLETE]: compatibilityRule(
    "Game completion intent",
    "Legacy UI event vocabulary for a game completion interaction.",
  ),
  [ARCADE_EVENTS.BADGE_CLAIMED]: compatibilityRule(
    "Badge claim intent",
    "Legacy UI event vocabulary for a badge claim interaction.",
  ),
  [ARCADE_EVENTS.TOURNAMENT_JOIN]: compatibilityRule(
    "Tournament join intent",
    "Legacy UI event vocabulary for a tournament join interaction.",
  ),
  [ARCADE_EVENTS.TOURNAMENT_WIN]: compatibilityRule(
    "Tournament result intent",
    "Legacy UI event vocabulary for a tournament result interaction.",
  ),
});

export function getArcadeEventRule(eventType) {
  return arcadeEventRules[eventType] || null;
}

export function resolveWalletDelta(rule, game) {
  void rule;
  void game;
  return { xp: 0, tokens: 0, recordTransaction: false };
}

export function resolveCreditDelta(rule, game) {
  void rule;
  void game;
  return { evu: 0, scoreDelta: 0 };
}

export function resolveSkillImpact(rule, game) {
  void rule;
  void game;
  return { sel: [], workforce: [], cognitive: [], weight: 0 };
}
