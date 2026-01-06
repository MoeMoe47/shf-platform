// src/data/arcade.js

// Simple local fallback data.
// Replace art paths with your real images in /public/arcade/
export const sections = [
  {
    id: "featured",
    title: "Featured",
    items: [
      {
        id: "grid-runner",
        title: "Grid Runner",
        tag: "Racing",
        art: "/arcade/grid-runner.jpg",
        hue: 210,
      },
      {
        id: "neon-shift",
        title: "Neon Shift",
        tag: "Puzzles",
        art: "/arcade/neon-shift.jpg",
        hue: 275,
      },
      {
        id: "orbital",
        title: "Orbital",
        tag: "Strategy",
        art: "/arcade/orbital.jpg",
        hue: 190,
      },
      {
        id: "synth-city",
        title: "Synth City",
        tag: "Builder",
        art: "/arcade/synth-city.jpg",
        hue: 330,
      },
    ],
  },
  {
    id: "trending",
    title: "Trending Now",
    items: [
      {
        id: "rail-drift",
        title: "Rail Drift",
        tag: "Racing",
        art: "/arcade/rail-drift.jpg",
        hue: 8,
      },
      {
        id: "mono-blocks",
        title: "Mono Blocks",
        tag: "Puzzles",
        art: "/arcade/mono-blocks.jpg",
        hue: 48,
      },
      {
        id: "deep-field",
        title: "Deep Field",
        tag: "Strategy",
        art: "/arcade/deep-field.jpg",
        hue: 160,
      },
      {
        id: "hollow-grid",
        title: "Hollow Grid",
        tag: "Action",
        art: "/arcade/hollow-grid.jpg",
        hue: 280,
      },
    ],
  },
];

export const categories = ["All", "Racing", "Puzzles", "Strategy", "Builder", "Action"];

// Convenience: flatten all section items into one list
export const allGames = sections.flatMap((s) => s.items);

// Workforce / SEL / Polygon-aware arcade metadata
export const arcadeGames = [
  {
    id: "debt-hunter",
    title: "Debt Hunter",
    subtitle: "Slash bad debt, learn payoff strategies.",
    route: "/arcade/games/debt-hunter",
    difficulty: "Intermediate",
    xpReward: 150,
    selTags: ["self-management", "planning"],
    workforceTags: ["financial literacy"],
    polygonAction: "arcade_game_complete",
  },
  {
    id: "career-rush",
    title: "Career Match Rush",
    subtitle: "Match careers, skills, and salaries under pressure.",
    route: "/arcade/games/career-rush",
    difficulty: "Beginner",
    xpReward: 100,
    selTags: ["decision-making"],
    workforceTags: ["career exploration"],
    polygonAction: "arcade_game_complete",
  },
  {
    id: "client-sim",
    title: "Client Service Simulator",
    subtitle: "Handle tough customers and keep your cool.",
    route: "/arcade/games/client-sim",
    difficulty: "Advanced",
    xpReward: 200,
    selTags: ["relationship skills", "self-awareness"],
    workforceTags: ["customer service"],
    polygonAction: "arcade_game_complete",
  },
  {
    id: "resume-quest",
    title: "Resume Builder Quest",
    subtitle: "Turn your wins into real resume bullets.",
    route: "/arcade/games/resume-quest",
    difficulty: "Beginner",
    xpReward: 75,
    selTags: ["goal-setting"],
    workforceTags: ["resume writing"],
    polygonAction: "arcade_game_complete",
  },
];
