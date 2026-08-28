// src/companion/companionReducer.js
// Pure state machine for the companion. No DOM/localStorage access here —
// CompanionProvider owns side effects (timers, persistence); this file is
// trivially testable and keeps "what state comes next" in one place.
export const COMPANION_MODES = Object.freeze({
  IDLE: "idle",
  HINT: "hint",
  CHARADES: "charades",
  COACH: "coach",
  CAREER: "career",
  CELEBRATION: "celebration",
  FOCUS: "focus",
});

export function initialCompanionState({ appScope, persona, hidden, reduceAnimation, focus, systemReducedMotion, progressionLevel }) {
  return {
    appScope,
    persona,
    mode: focus ? COMPANION_MODES.FOCUS : COMPANION_MODES.IDLE,
    expanded: false,
    hidden: !!hidden,
    focus: !!focus,
    reduceAnimation: !!reduceAnimation,
    systemReducedMotion: !!systemReducedMotion,
    faceMessage: "",
    animation: "idle",
    celebrationTier: "none",
    hint: null, // { conceptId, level }
    coachOpen: false,
    progressionLevel: progressionLevel || 1,
  };
}

export function companionReducer(state, action) {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "SET_EXPANDED":
      return { ...state, expanded: action.expanded };

    case "SET_HIDDEN":
      return { ...state, hidden: action.hidden, expanded: action.hidden ? false : state.expanded };

    case "SET_REDUCE_ANIMATION":
      return { ...state, reduceAnimation: action.value };

    case "SET_SYSTEM_REDUCED_MOTION":
      return { ...state, systemReducedMotion: action.value };

    case "SET_FOCUS": {
      const focus = action.value;
      // Focus quiets the companion but must not erase reachability — mode
      // flips to FOCUS/IDLE, hidden/expanded are untouched by this action.
      return { ...state, focus, mode: focus ? COMPANION_MODES.FOCUS : COMPANION_MODES.IDLE, faceMessage: "", celebrationTier: "none" };
    }

    case "SET_COACH_OPEN":
      return { ...state, coachOpen: action.open };

    // React to a resolved reaction (short face message, no celebration tier).
    case "REACT":
      if (state.focus) return state; // Focus Mode: no unsolicited messages
      return { ...state, faceMessage: action.message || "", animation: action.animation || state.animation };

    // React to a resolved celebration. Focus Mode still allows CREDENTIAL/
    // MAJOR tiers through per spec ("no celebrations except critical
    // milestones unless user preference allows").
    case "CELEBRATE": {
      const isCritical = action.tier === "major";
      if (state.focus && !isCritical) return state;
      return {
        ...state,
        mode: COMPANION_MODES.CELEBRATION,
        celebrationTier: action.tier,
        animation: action.animation,
        faceMessage: action.message || "",
      };
    }

    case "CELEBRATION_DONE":
      return { ...state, mode: state.focus ? COMPANION_MODES.FOCUS : COMPANION_MODES.IDLE, celebrationTier: "none" };

    case "REQUEST_HINT":
      if (state.focus) return state;
      return {
        ...state,
        mode: COMPANION_MODES.HINT,
        expanded: true,
        hint: { conceptId: action.conceptId, level: action.level || "gesture" },
      };

    case "SET_HINT_LEVEL":
      if (!state.hint) return state;
      return { ...state, hint: { ...state.hint, level: action.level } };

    case "CLEAR_HINT":
      return { ...state, hint: null, mode: state.focus ? COMPANION_MODES.FOCUS : COMPANION_MODES.IDLE };

    case "SET_CAREER_MESSAGE":
      if (state.focus) return state;
      return { ...state, mode: COMPANION_MODES.CAREER, faceMessage: action.message || "" };

    case "CLEAR_FACE_MESSAGE":
      return { ...state, faceMessage: "" };

    default:
      return state;
  }
}
