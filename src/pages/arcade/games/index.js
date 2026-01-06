// src/pages/arcade/games/index.js
export const meta = {
  "classic/fingerspelling": {
    title: "Fingerspelling Speed",
    description: "Type what you see. Improve ASL fingerspelling recognition.",
    icon: "🤟",
    tags: ["ASL", "Speed", "Classic"],
    // thumb: "/arcade/fingerspelling.jpg",
    externalHref: "https://example.com/fingerspelling", // or remove for internal
  },
  "classic/vocab-match": {
    title: "Vocabulary Match",
    description: "Match sign to term under time pressure.",
    icon: "🧩",
    tags: ["ASL", "Memory", "Classic"],
  },
  "classic/gesture-memory": {
    title: "Gesture Memory",
    description: "Remember and replay sequences of gestures.",
    icon: "🧠",
    tags: ["Memory", "Pattern"],
  },
  "transport/cdl-driver": {
    title: "CDL Driver Trainer",
    description: "Back-in, lane discipline, and safe stops.",
    icon: "🚚",
    tags: ["CDL", "Simulation"],
    // If you host it internally, add: playPath, practicePath, leaderboardPath
    externalHref: "https://example.com/cdl-classic",
  },
};
