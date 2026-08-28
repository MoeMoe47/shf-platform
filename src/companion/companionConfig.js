// src/companion/companionConfig.js
// Small, declarative config the companion reads instead of branching on
// app name throughout the runtime/UI. "The character should mature with
// the learner" (spec) — Career gets the "navigator" persona; Curriculum
// gets "coach" by default. Curriculum's early-vs-later "playful vs coach"
// split needs lesson-progress data this pass doesn't have a signal for
// yet, so it's a documented deferred hook (see getPersona), not guessed.
export const PERSONAS = Object.freeze({
  PLAYFUL: "playful",
  COACH: "coach",
  NAVIGATOR: "navigator",
});

const APP_PERSONA = Object.freeze({
  career: PERSONAS.NAVIGATOR,
  curriculum: PERSONAS.COACH,
});

export function getPersona(appScope) {
  return APP_PERSONA[appScope] || PERSONAS.COACH;
}

// localStorage key prefix — matches the repo's dominant `namespace:key`
// convention (rewards:points, sh:locale, flags:dev).
export const STORAGE_PREFIX = "companion:";
export const STORAGE_KEYS = Object.freeze({
  HIDDEN: `${STORAGE_PREFIX}hidden`,
  FOCUS: `${STORAGE_PREFIX}focus`,
  REDUCE_ANIMATION: `${STORAGE_PREFIX}reduceAnimation`,
  PROGRESSION_LEVEL: `${STORAGE_PREFIX}progressionLevel`,
});

// Motion tokens the visual layer is allowed to reference. The runtime only
// ever hands the UI a token name (e.g. "fistPump") — never raw animation
// implementation details — so a future sprite/Lottie/Rive/video asset can
// replace the CSS behind these tokens without any caller changing.
export const MOTION_TOKENS = Object.freeze([
  "idle", "blink", "look", "wave", "thinking", "hint",
  "fistPump", "miniDance", "victoryDance", "celebrate",
  "projectVictory", "majorCelebration", "sleep", "wake",
]);

/**
 * z-index policy (deliberate, not guessed): Brainiact sits above ordinary
 * content but below dialogs/modals/critical menus/system alerts. Career
 * pages already define a `--z-ask-coach` token (career-shell.css) — reusing
 * it via `var(--z-ask-coach, 90)` in companion.css slots Brainiact into
 * that existing scale exactly where `.coach-fab` used to sit on Career
 * pages, while safely falling back to 90 on Curriculum, which has no
 * z-index scale of its own. 90 sits above ordinary page content (Career's
 * own scale starts sticky-action content at 300, so this is intentionally
 * conservative) and below every existing overlay: CoachSlideOver's panel
 * (hardcoded 101), Career's menus (500), dialogs (900).
 */
export const Z_INDEX = Object.freeze({
  BASE_CSS_VAR: "var(--z-ask-coach, 90)",
  EXPANDED_CSS_VAR: "var(--z-ask-coach, 90)",
});

// Mobile safe-area/offset convention already established by .coach-fab —
// reused verbatim so Brainiact clears the same sticky bottom bars.
export const MOBILE_BOTTOM_OFFSET_PX = 78;
