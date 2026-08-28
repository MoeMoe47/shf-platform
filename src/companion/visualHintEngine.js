// src/companion/visualHintEngine.js
// Charades Mode's data layer. Maps a lesson concept to a progressive
// sequence of hints (gesture → visual → verbal → explanation) without
// ever skipping straight to the answer. Curriculum authors register more
// concepts later via registerConcept() — this file intentionally ships
// only a small proof-of-concept registry, per spec scope.
export const HINT_LEVELS = Object.freeze(["gesture", "visual", "verbal", "explanation"]);

/**
 * Concept shape:
 * {
 *   conceptId, conceptName, difficulty,
 *   gestures: [string],        // animation-token names Brainiact can play
 *   visualClues: [string],     // short face/bubble text, no animation required
 *   verbalClues: [string],     // one step more explicit than visual
 *   explanation: string,       // the actual teaching explanation (last resort)
 *   accessibilityAlternatives: [string], // non-visual equivalents for every
 *                                        // gesture/visual clue above — required
 *                                        // whenever a clue conveys info visually
 * }
 */
const registry = new Map();

function registerConcept(concept) {
  if (!concept || !concept.conceptId) return;
  registry.set(concept.conceptId, concept);
}

// Small controlled proof-of-concept set, per spec ("gravity, photosynthesis,
// coding loop, communication" were given as examples).
[
  {
    conceptId: "gravity",
    conceptName: "Gravity",
    difficulty: "intro",
    gestures: ["tossAndWatch", "pointDown"],
    visualClues: ["Everything falls the same way — which way?"],
    verbalClues: ["It pulls things toward the ground."],
    explanation: "Gravity is a force that pulls objects toward each other — on Earth, that means down, toward the ground.",
    accessibilityAlternatives: [
      "Gesture 1 (tossAndWatch) alt text: Brainiact mimes tossing a ball up and watching it fall back down.",
      "Gesture 2 (pointDown) alt text: Brainiact points firmly downward, toward the floor.",
    ],
  },
  {
    conceptId: "photosynthesis",
    conceptName: "Photosynthesis",
    difficulty: "intro",
    gestures: ["pointToSun", "mimeDrinking", "growUpward"],
    visualClues: ["Plants need three things to make their own food — what are they?"],
    verbalClues: ["Sunlight, water, and air all go in."],
    explanation: "Photosynthesis is how plants turn sunlight, water, and carbon dioxide into food (sugar) and oxygen.",
    accessibilityAlternatives: [
      "Gesture 1 (pointToSun) alt text: Brainiact points upward at an imaginary sun.",
      "Gesture 2 (mimeDrinking) alt text: Brainiact mimes drinking from a cupped hand.",
      "Gesture 3 (growUpward) alt text: Brainiact slowly raises both arms like a plant growing.",
    ],
  },
  {
    conceptId: "coding-loop",
    conceptName: "Coding: Loops",
    difficulty: "intro",
    gestures: ["repeatMotion"],
    visualClues: ["Watch Brainiact do the same move, again and again, until it stops."],
    verbalClues: ["A loop repeats a set of steps until a condition tells it to stop."],
    explanation: "A loop is a block of code that repeats a set of instructions until a stopping condition is met.",
    accessibilityAlternatives: [
      "Gesture 1 (repeatMotion) alt text: Brainiact repeats a single wave-and-tap motion three times, then stops.",
    ],
  },
  {
    conceptId: "communication",
    conceptName: "Communication",
    difficulty: "intro",
    gestures: ["pointToEarsAndMouth", "handOff"],
    visualClues: ["It takes two roles — one to send, one to receive."],
    verbalClues: ["Someone sends a message, someone else receives and understands it."],
    explanation: "Communication is the exchange of information between a sender and a receiver, using a shared method both understand.",
    accessibilityAlternatives: [
      "Gesture 1 (pointToEarsAndMouth) alt text: Brainiact points to its ear, then its mouth.",
      "Gesture 2 (handOff) alt text: Brainiact mimes handing an object from one hand to the other.",
    ],
  },
].forEach(registerConcept);

export function hasConcept(conceptId) {
  return registry.has(conceptId);
}

export function listConcepts() {
  return Array.from(registry.values()).map(({ conceptId, conceptName, difficulty }) => ({ conceptId, conceptName, difficulty }));
}

/**
 * getHint(conceptId, level) — returns the hint content for one progressive
 * level. Never returns a level beyond what was asked for, so a caller can't
 * accidentally leak the explanation while asking for "gesture".
 */
export function getHint(conceptId, level = "gesture") {
  const concept = registry.get(conceptId);
  if (!concept) return null;
  const levelIndex = HINT_LEVELS.indexOf(level);
  if (levelIndex === -1) return null;

  switch (level) {
    case "gesture":
      return { level, conceptId, gestures: concept.gestures, accessibilityAlternatives: concept.accessibilityAlternatives };
    case "visual":
      return { level, conceptId, clues: concept.visualClues, accessibilityAlternatives: concept.accessibilityAlternatives };
    case "verbal":
      return { level, conceptId, clues: concept.verbalClues };
    case "explanation":
      return { level, conceptId, explanation: concept.explanation };
    default:
      return null;
  }
}

/** nextHintLevel — walks the progression without skipping ahead. */
export function nextHintLevel(currentLevel) {
  const i = HINT_LEVELS.indexOf(currentLevel);
  if (i === -1) return HINT_LEVELS[0];
  return HINT_LEVELS[Math.min(i + 1, HINT_LEVELS.length - 1)];
}

export { registerConcept };
