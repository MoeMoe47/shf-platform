// src/shared/arcade/arcadeRules.js
// ------------------------------------------------------------
// SHF Skill Engine™ – Arcade Rules (Top 1% Version)
//
// This file defines the canonical arcade events and how they
// impact:
//   - SHF Wallet (XP, non-tradeable tokens, badges)
//   - SHF Credit System / EVUs
//   - On-chain logging on Polygon
//
// Nothing in here performs side effects directly.
//
// A separate helper / hook (e.g. useArcadeLedger) should:
//   1) Look up the rule via getArcadeEventRule(eventType)
//   2) Apply wallet + credit changes
//   3) Send Polygon tx when rule.onChain === true
// ------------------------------------------------------------

// 1) Canonical event names used everywhere in the arcade app.
export const ARCADE_EVENTS = {
  GAME_START: "arcade_game_start",
  GAME_COMPLETE: "arcade_game_complete",
  BADGE_CLAIMED: "arcade_badge_claimed",
  TOURNAMENT_JOIN: "arcade_tournament_join",
  TOURNAMENT_WIN: "arcade_tournament_win",
};

// 2) Optional shared skill taxonomies for reporting / dashboards.
// These do NOT do anything by themselves; they define the vocab
// you use across games and analytics.
export const SKILL_CATEGORIES = {
  SEL: "sel",
  WORKFORCE: "workforce",
  COGNITIVE: "cognitive",
};

export const SKILL_TAGS = {
  // SEL
  SEL_PLANNING: "planning",
  SEL_FOCUS: "focus",
  SEL_DECISION_MAKING: "decision-making",
  SEL_SELF_MANAGEMENT: "self-management",
  SEL_RELATIONSHIP: "relationship-skills",
  SEL_LEADERSHIP: "leadership",

  // Workforce
  WF_FINANCIAL_LITERACY: "financial-literacy",
  WF_CAREER_EXPLORATION: "career-exploration",
  WF_CUSTOMER_SERVICE: "customer-service",
  WF_RESUME_WRITING: "resume-writing",
  WF_INTERVIEWING: "interviewing",

  // Cognitive
  COG_MEMORY: "memory",
  COG_PROCESSING_SPEED: "processing-speed",
  COG_SPATIAL: "spatial-perception",
  COG_PROBLEM_SOLVING: "problem-solving",
};

// 3) Core rule table for the SHF arcade.
// Each entry describes how a single event type should behave.
// NOTE: The actual implementations (wallet, credit, Polygon) live
// in other modules. This is the *source of truth* for behavior.

/**
 * arcadeEventRules[eventType] = {
 *   label: string,
 *   description: string,
 *   onChain: boolean,
 *   wallet: {
 *     // XP rules
 *     baseXp: number,
 *     useGameXpReward: boolean,   // if true, add game.xpReward
 *
 *     // Token rules (non-tradeable SHF tokens)
 *     baseTokens: number,         // can be negative for buy-in
 *     useGameTokenReward: boolean,
 *
 *     // Whether to record a wallet transaction row
 *     recordTransaction: boolean,
 *   },
 *   credit: {
 *     evuBase: number,            // base EVU change
 *     evuFromGameWeight: boolean, // if true, scale using game.evuWeight
 *     scoreDelta: number,         // SHF "credit score" change
 *   },
 *   skills: {
 *     // These are *modifiers* to the student's skill graph.
 *     // Your skill engine can decide exactly how to store this.
 *     sel: string[],
 *     workforce: string[],
 *     cognitive: string[],
 *     skillWeight: number,        // 1 = normal, 2 = strong impact
 *   },
 *   telemetry: {
 *     analyticsOnly: boolean,     // for GAME_START
 *   },
 *   polygon: {
 *     // High-level label for how this appears on chain.
 *     actionType: "none" | "completion" | "badge" | "tournament",
 *   },
 * }
 */

export const arcadeEventRules = {
  [ARCADE_EVENTS.GAME_START]: {
    label: "Game started",
    description: "Player launched an arcade game session.",
    // We keep this off-chain to avoid noise & gas usage.
    onChain: false,
    wallet: {
      baseXp: 0,
      useGameXpReward: false,
      baseTokens: 0,
      useGameTokenReward: false,
      recordTransaction: false, // engagement-only
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
    telemetry: {
      analyticsOnly: true,
    },
    polygon: {
      actionType: "none",
    },
  },

  [ARCADE_EVENTS.GAME_COMPLETE]: {
    label: "Game completed",
    description:
      "Player completed a game run. Main learning event for EVUs, XP, and on-chain proof.",
    onChain: true, // this is your main Polygon event
    wallet: {
      // Add base XP plus game.xpReward from src/data/arcade.js
      baseXp: 0,
      useGameXpReward: true,
      baseTokens: 0,
      useGameTokenReward: false, // can flip this true later if you want auto tokens
      recordTransaction: true,
    },
    credit: {
      // Base EVU + optional scaling using game metadata (e.g. game.evuWeight).
      evuBase: 1,
      evuFromGameWeight: true,
      scoreDelta: 1,
    },
    skills: {
      // The SKILL_TAGS here are *defaults*; game-specific metadata
      // can add to or override these.
      sel: [SKILL_TAGS.SEL_PLANNING, SKILL_TAGS.SEL_FOCUS],
      workforce: [],
      cognitive: [SKILL_TAGS.COG_PROBLEM_SOLVING],
      skillWeight: 1, // normal impact
    },
    telemetry: {
      analyticsOnly: false,
    },
    polygon: {
      actionType: "completion",
    },
  },

  [ARCADE_EVENTS.BADGE_CLAIMED]: {
    label: "Badge claimed",
    description:
      "Player claimed a badge after meeting specific skill or performance conditions.",
    onChain: true, // badges = micro-credentials on chain
    wallet: {
      baseXp: 25, // small bonus XP on top of game completions
      useGameXpReward: false,
      baseTokens: 0,
      useGameTokenReward: false,
      recordTransaction: true,
    },
    credit: {
      evuBase: 2, // more impact than a single game clear
      evuFromGameWeight: false, // badge-level, not per-game
      scoreDelta: 2,
    },
    skills: {
      // Badges are usually more focused: leadership, persistence, etc.
      sel: [SKILL_TAGS.SEL_LEADERSHIP],
      workforce: [],
      cognitive: [],
      skillWeight: 2, // stronger impact on skill graph
    },
    telemetry: {
      analyticsOnly: false,
    },
    polygon: {
      actionType: "badge",
    },
  },

  [ARCADE_EVENTS.TOURNAMENT_JOIN]: {
    label: "Joined tournament",
    description:
      "Player joined a tournament bracket or scheduled competitive event.",
    onChain: false, // can be toggled true for special sponsor events
    wallet: {
      baseXp: 0,
      useGameXpReward: false,
      baseTokens: -25, // optional buy-in; set to 0 if tournaments are free
      useGameTokenReward: false,
      recordTransaction: true, // we want to track token flows
    },
    credit: {
      evuBase: 0,
      evuFromGameWeight: false,
      scoreDelta: 0,
    },
    skills: {
      // Joining does not change skills, but your analytics
      // can still use this to measure engagement.
      sel: [],
      workforce: [],
      cognitive: [],
      skillWeight: 0,
    },
    telemetry: {
      analyticsOnly: false,
    },
    polygon: {
      actionType: "none",
    },
  },

  [ARCADE_EVENTS.TOURNAMENT_WIN]: {
    label: "Tournament win",
    description:
      "Player won or placed top in an arcade tournament. High-stakes skill proof.",
    onChain: true, // flagship on-chain achievement
    wallet: {
      baseXp: 300, // big XP reward
      useGameXpReward: false,
      baseTokens: 100, // optional prize tokens
      useGameTokenReward: false,
      recordTransaction: true,
    },
    credit: {
      evuBase: 3, // highest EVU impact in arcade
      evuFromGameWeight: false,
      scoreDelta: 3,
    },
    skills: {
      sel: [SKILL_TAGS.SEL_LEADERSHIP, SKILL_TAGS.SEL_DECISION_MAKING],
      workforce: [],
      cognitive: [SKILL_TAGS.COG_PROCESSING_SPEED],
      skillWeight: 2, // strong impact
    },
    telemetry: {
      analyticsOnly: false,
    },
    polygon: {
      actionType: "tournament",
    },
  },
};

// 4) Safe helper: get rules for an event type.
export function getArcadeEventRule(eventType) {
  return arcadeEventRules[eventType] || null;
}

// 5) Helper to resolve final wallet deltas given a game definition.
// This keeps your usage consistent from any game screen.
/**
 * resolveWalletDelta(rule, game):
 *  - rule: arcadeEventRules[eventType]
 *  - game: arcadeGames entry from src/data/arcade.js (may be null)
 */
export function resolveWalletDelta(rule, game) {
  if (!rule) return { xp: 0, tokens: 0, recordTransaction: false };

  const gameXp = rule.wallet.useGameXpReward && game ? game.xpReward || 0 : 0;
  const gameTokens =
    rule.wallet.useGameTokenReward && game ? game.tokenReward || 0 : 0;

  return {
    xp: (rule.wallet.baseXp || 0) + gameXp,
    tokens: (rule.wallet.baseTokens || 0) + gameTokens,
    recordTransaction: !!rule.wallet.recordTransaction,
  };
}

// 6) Helper to resolve credit deltas given a game definition.
/**
 * resolveCreditDelta(rule, game):
 *  - rule: arcadeEventRules[eventType]
 *  - game: arcadeGames entry from src/data/arcade.js (may be null)
 *
 * If evuFromGameWeight is true, we multiply evuBase by game.evuWeight
 * (or 1 if not present).
 */
export function resolveCreditDelta(rule, game) {
  if (!rule) return { evu: 0, scoreDelta: 0 };

  const weight =
    rule.credit.evuFromGameWeight && game && typeof game.evuWeight === "number"
      ? game.evuWeight
      : 1;

  const evu = (rule.credit.evuBase || 0) * weight;

  return {
    evu,
    scoreDelta: rule.credit.scoreDelta || 0,
  };
}

// 7) Helper to resolve skill impact.
// This can be used by a central "skill graph" engine to keep
// per-student skill progress consistent.
export function resolveSkillImpact(rule, game) {
  if (!rule) {
    return {
      sel: [],
      workforce: [],
      cognitive: [],
      weight: 0,
    };
  }

  // Allow game metadata to add/override skills later if needed.
  // For now we just return the rule's defaults.
  return {
    sel: rule.skills.sel || [],
    workforce: rule.skills.workforce || [],
    cognitive: rule.skills.cognitive || [],
    weight: rule.skills.skillWeight || 0,
  };
}
