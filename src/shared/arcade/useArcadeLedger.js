// src/shared/arcade/useArcadeLedger.js
// ------------------------------------------------------------
// SHF Skill Engine™ – Arcade Ledger Hook
//
// Single entry point for recording arcade events in SHF:
//
//   const { ARCADE_EVENTS, recordArcadeEvent } = useArcadeLedger();
//
// It will:
//   1) Look up the arcade rule (arcadeRules.js)
//   2) Look up the game metadata (src/data/arcade.js)
//   3) Compute wallet + credit + skill deltas
//   4) Append to the credit ledger
//   5) Append to the SHF wallet (if available)
//   6) Send a Polygon transaction (if configured)
//
// Design goals:
//   - Never crash if deps are missing
//   - Log useful warnings in dev
//   - Keep all arcade logic in one place
// ------------------------------------------------------------

import React from "react";
import {
  ARCADE_EVENTS,
  getArcadeEventRule,
  resolveWalletDelta,
  resolveCreditDelta,
  resolveSkillImpact,
} from "./arcadeRules.js";
import { arcadeGames } from "@/data/arcade.js";
import { appendEntry } from "@/utils/creditLedger.js";
import { usePolygon } from "@/shared/chain/PolygonProvider.jsx";

// NOTE: Update this import if your wallet hook lives elsewhere.
import { useWallet } from "@/hooks/useWallet.js";

// Small helper to find a game by id.
function findGameById(gameId) {
  if (!gameId) return null;
  return arcadeGames.find((g) => g.id === gameId) || null;
}

/**
 * useArcadeLedger
 * ------------------------------------------------------------
 * Usage example:
 *
 *   const { ARCADE_EVENTS, recordArcadeEvent } = useArcadeLedger();
 *
 *   await recordArcadeEvent(ARCADE_EVENTS.GAME_COMPLETE, {
 *     userId: "student-123",
 *     userName: "Student 123",
 *     gameId: "debt-hunter",
 *     meta: { runTimeMs: 42000 },
 *   });
 *
 * Returns:
 *   { rule, game, walletDelta, creditDelta, skillImpact, timestamp }
 */
export function useArcadeLedger() {
  const wallet = typeof useWallet === "function" ? useWallet() : null;
  const polygon = typeof usePolygon === "function" ? usePolygon() : null;

  const recordArcadeEvent = React.useCallback(
    async (eventType, payload = {}) => {
      const rule = getArcadeEventRule(eventType);

      if (!rule) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[SHF Arcade] Unknown event type:", eventType, payload);
        }
        return {
          rule: null,
          game: null,
          walletDelta: { xp: 0, tokens: 0, recordTransaction: false },
          creditDelta: { evu: 0, scoreDelta: 0 },
          skillImpact: { sel: [], workforce: [], cognitive: [], weight: 0 },
        };
      }

      const { userId, userName, gameId, meta = {} } = payload;
      const game = findGameById(gameId);

      const walletDelta = resolveWalletDelta(rule, game);
      const creditDelta = resolveCreditDelta(rule, game);
      const skillImpact = resolveSkillImpact(rule, game);

      const timestamp = Date.now();

      // -----------------------------
      // 1) Credit ledger integration
      // -----------------------------
      try {
        await appendEntry({
          source: "arcade",
          app: "arcade",
          eventType,
          userId: userId || null,
          userName: userName || null,
          gameId: gameId || null,
          gameTitle: game?.title || null,
          xpDelta: walletDelta.xp,
          tokens: walletDelta.tokens,
          evuDelta: creditDelta.evu,
          scoreDelta: creditDelta.scoreDelta,
          creditsDelta: creditDelta.creditsDelta,
          skills: {
            sel: skillImpact.sel,
            workforce: skillImpact.workforce,
            cognitive: skillImpact.cognitive,
            weight: skillImpact.weight,
          },
          ruleMeta: {
            onChain: rule.onChain,
            polygonActionType: rule.polygon?.actionType || "none",
          },
          meta,
          timestamp,
        });
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[SHF Arcade] Failed to append credit entry:", err);
        }
      }

      // -----------------------------
      // 2) Wallet integration
      // -----------------------------
      try {
        if (
          walletDelta.recordTransaction &&
          wallet &&
          typeof wallet.addTransaction === "function"
        ) {
          await wallet.addTransaction({
            source: "arcade",
            eventType,
            userId: userId || null,
            userName: userName || null,
            gameId: gameId || null,
            xpChange: walletDelta.xp,
            tokenChange: walletDelta.tokens,
            timestamp,
            meta,
          });
        } else if (walletDelta.recordTransaction && !wallet) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[SHF Arcade] Wallet client not available; skipping wallet transaction.",
            );
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[SHF Arcade] Failed to record wallet transaction:",
            err,
          );
        }
      }

      // -----------------------------
      // 3) Polygon integration
      // -----------------------------
      try {
        if (rule.onChain && polygon && typeof polygon.submitTx === "function") {
          await polygon.submitTx({
            type: eventType,
            action: rule.polygon?.actionType || "none",
            userId: userId || null,
            userName: userName || null,
            gameId: gameId || null,
            xp: walletDelta.xp,
            evu: creditDelta.evu,
            credits: creditDelta.creditsDelta,
            skills: {
              sel: skillImpact.sel,
              workforce: skillImpact.workforce,
              cognitive: skillImpact.cognitive,
            },
            timestamp,
            meta,
          });
        } else if (rule.onChain && !polygon) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[SHF Arcade] Polygon client not available; skipping on-chain tx.",
            );
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[SHF Arcade] Failed to submit Polygon tx:", err);
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("[SHF Arcade] Event recorded:", {
          eventType,
          payload,
          walletDelta,
          creditDelta,
          skillImpact,
        });
      }

      return {
        rule,
        game,
        walletDelta,
        creditDelta,
        skillImpact,
        timestamp,
      };
    },
    [wallet, polygon],
  );

  return {
    ARCADE_EVENTS,
    recordArcadeEvent,
  };
}
