// Legacy compatibility hook. Arcade outcomes and economy changes are owned
// by their canonical server-side authorities.

import React from "react";
import { ARCADE_EVENTS, getArcadeEventRule } from "./arcadeRules.js";

const QUARANTINE_REASON = "LEGACY_BROWSER_AUTHORITY_DISABLED";

export function useArcadeLedger() {
  const recordArcadeEvent = React.useCallback(async (eventType, payload = {}) => {
    void payload;

    return {
      accepted: false,
      authority: "server",
      legacyCompatibility: true,
      eventType,
      rule: getArcadeEventRule(eventType),
      game: null,
      walletDelta: { xp: 0, tokens: 0, recordTransaction: false },
      creditDelta: { evu: 0, scoreDelta: 0 },
      skillImpact: { sel: [], workforce: [], cognitive: [], weight: 0 },
      timestamp: Date.now(),
      reason: QUARANTINE_REASON,
    };
  }, []);

  return {
    ARCADE_EVENTS,
    recordArcadeEvent,
  };
}
