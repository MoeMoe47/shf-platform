// src/hooks/useCompanion.js
// Stable public API surface for pages: `const companion = useCompanion()`.
// Pages call companion.emit("quiz_perfect") — the runtime resolves what
// that means visually. See src/companion/CompanionProvider.jsx.
export { useCompanionContext as useCompanion } from "@/companion/CompanionProvider.jsx";
