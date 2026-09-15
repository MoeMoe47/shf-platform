import { MarketError } from "./market-errors.js";
import { scope } from "./market-policy.js";
import { defaultTreasuryAdapter, type TreasuryAdapter } from "./market-treasury-adapter.js";

export async function settleMissionReward(actor: any, input: { missionProjectionId: string; learnerUserId: string; amount: number; rewardType: "PROGRAM_MISSION" | "SIDE_MISSION"; completionVerified: boolean; idempotencyKey: string }, treasury: TreasuryAdapter = defaultTreasuryAdapter) {
  const s = scope(actor);
  if (!input.completionVerified) throw new MarketError("MISSION_REWARD_NOT_ELIGIBLE", "Mission completion must be canonically verified before reward settlement.", 409);
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new MarketError("INVALID_REWARD", "Reward amount must be positive.", 400);
  return treasury.refund({
    organizationId: s.organizationId,
    buyerUserId: input.learnerUserId,
    sellerType: "SYSTEM",
    sellerRef: s.organizationId,
    amount: input.amount,
    currencyType: "SHF_CREDITS",
    purpose: "MISSION_REWARD",
    sourceRef: input.missionProjectionId,
    idempotencyKey: `mission_reward:${input.idempotencyKey}`,
  });
}
