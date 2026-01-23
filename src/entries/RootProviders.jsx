// src/entries/RootProviders.jsx
import React from "react";

// Keep your dev mock API in development
if (import.meta.env.DEV) {
  void import("@/dev/mockApi.js");
}

// Existing contexts you already use
import { EntitlementsCtx } from "@/context/EntitlementsContext.jsx";
import CreditProvider from "@/shared/credit/CreditProvider.jsx";

// NEW (already present in repo)
import LedgerProvider from "@/shared/ledger/LedgerProvider.jsx";
import ProgressProvider from "@/shared/progress/ProgressProvider.jsx";
import { initMode } from "@/runtime/mode.js";

/* ⬇️ Keep this LAST among CSS so it wins the cascade */
import "@/styles/app-shell.css";

/* ---------------- Emoji Context (lightweight) ---------------- */
export const EmojiCtx = React.createContext({
  get: (k, fb = "") => fb,
  map: {},
});

/** Default emoji map (extend anytime) */
const DEFAULT_EMOJI = {
  heart: "❤️",
  rocket: "🚀",
  wheat: "🌾",
  corn: "🌽",
  star: "⭐",
  check: "✅",
  warn: "⚠️",
  money: "💵",
  gov: "🏛️",
  ballot: "🗳️",
  party: "🎉",
  book: "📘",
  mic: "🎤",
  chartUp: "📈",
  chartDown: "📉",
  // AI Jobs Clock palette
  jobLoss: "🔴",
  jobGain: "🟢",
  aiJob: "🟠",
};

export default function RootProviders({ children, appScope }) {
  // SHF global mode (PILOT vs SYSTEM)
  React.useEffect(() => { try { initMode(); } catch {} }, []);

  // Minimal mock user/entitlements (dev-safe)
  const ent = React.useMemo(
    () => ({
      user: { id: "dev", name: "Dev User" },
      entitlements: [
        "career",
        "curriculum",
        "credit",
        "debt",
        "sales",
        "treasury",
        "foundation",
        "solutions",
        "employer",
        "arcade",
        "store",
        "launch",
        "civic",
      ],
      roles: ["student"],
      loading: false,
      refresh: () => {},
    }),
    []
  );

  /* Emoji provider value */
  const emojiValue = React.useMemo(() => {
    const map = { ...DEFAULT_EMOJI };
    const get = (k, fb = "") => (map[k] ? map[k] : fb);
    return { get, map };
  }, []);

  /* Optional: expose helper + data-app hook for CSS */
  React.useEffect(() => {
    try {
      // Make available for non-React surfaces (toasts, etc.)
      window.shEmoji = (k, fb = "") => emojiValue.get(k, fb);
    } catch {}
  }, [emojiValue]);

  React.useEffect(() => {
    // Label <html> with active app for any emoji CSS tweaks
    try {
      if (appScope) document.documentElement.setAttribute("data-app", appScope);
      document.documentElement.setAttribute("data-emoji", "on");
      try { document.documentElement.setAttribute("data-shf-mode", (window.__SHF_MODE__ || "PILOT")); } catch {}
    } catch {}
  }, [appScope]);

  return (
    <EntitlementsCtx.Provider value={ent}>
      <LedgerProvider>
        <ProgressProvider>
          <CreditProvider>
            <EmojiCtx.Provider value={emojiValue}>
              {/* Each HTML entry mounts its own Router + shell */}
              {children}
            </EmojiCtx.Provider>
          </CreditProvider>
        </ProgressProvider>
      </LedgerProvider>
    </EntitlementsCtx.Provider>
  );
}
