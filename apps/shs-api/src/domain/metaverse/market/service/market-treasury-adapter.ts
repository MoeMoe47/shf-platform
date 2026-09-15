import { randomUUID } from "node:crypto";
import type { MarketCurrencyType } from "../model/market-contract.js";
import { MarketError } from "./market-errors.js";

export interface TreasuryTransferInput {
  organizationId: string;
  buyerUserId: string;
  sellerType: string;
  sellerRef: string;
  amount: number;
  currencyType: MarketCurrencyType;
  purpose: "MARKET_PURCHASE" | "MARKET_REFUND" | "MISSION_REWARD" | "OPPORTUNITY_COMPENSATION";
  sourceRef: string;
  idempotencyKey: string;
}

export interface TreasuryTransferResult {
  transactionRef: string;
  status: "SETTLED" | "ALREADY_SETTLED";
  ledgerTrace: string;
}

export interface TreasuryAdapter {
  getBalance(input: { organizationId: string; userId: string; currencyType: MarketCurrencyType }): Promise<{ amount: number; currencyType: MarketCurrencyType; source: "TREASURY" }>;
  authorizeDebit(input: { organizationId: string; userId: string; amount: number; currencyType: MarketCurrencyType }): Promise<{ authorized: boolean; reason?: string }>;
  executeTransfer(input: TreasuryTransferInput): Promise<TreasuryTransferResult>;
  refund(input: TreasuryTransferInput): Promise<TreasuryTransferResult>;
}

type AccountKey = string;

function key(organizationId: string, userId: string, currencyType: MarketCurrencyType): AccountKey {
  return `${organizationId}:${userId}:${currencyType}`;
}

// Bounded Treasury adapter for MET-9. This is intentionally not a Market
// ledger and not canonical storage: it models the Treasury boundary until a
// durable SHF Credit ledger is introduced. Market services persist only the
// returned refs on orders/refunds.
export class InMemoryTreasuryAdapter implements TreasuryAdapter {
  readonly balances = new Map<AccountKey, number>();
  readonly transfers = new Map<string, TreasuryTransferResult>();
  debitCalls = 0;

  setBalance(organizationId: string, userId: string, amount: number, currencyType: MarketCurrencyType = "SHF_CREDITS") {
    this.balances.set(key(organizationId, userId, currencyType), amount);
  }

  async getBalance(input: { organizationId: string; userId: string; currencyType: MarketCurrencyType }) {
    return { amount: this.balances.get(key(input.organizationId, input.userId, input.currencyType)) || 0, currencyType: input.currencyType, source: "TREASURY" as const };
  }

  async authorizeDebit(input: { organizationId: string; userId: string; amount: number; currencyType: MarketCurrencyType }) {
    if (input.currencyType === "NONE" || input.amount === 0) return { authorized: true };
    const balance = await this.getBalance({ organizationId: input.organizationId, userId: input.userId, currencyType: input.currencyType });
    return balance.amount >= input.amount ? { authorized: true } : { authorized: false, reason: "INSUFFICIENT_BALANCE" };
  }

  async executeTransfer(input: TreasuryTransferInput) {
    if (this.transfers.has(input.idempotencyKey)) return { ...this.transfers.get(input.idempotencyKey)!, status: "ALREADY_SETTLED" as const };
    const authorized = await this.authorizeDebit({ organizationId: input.organizationId, userId: input.buyerUserId, amount: input.amount, currencyType: input.currencyType });
    if (!authorized.authorized) throw new MarketError("INSUFFICIENT_BALANCE", "Insufficient SHF Credits for this purchase.", 402);
    this.debitCalls += input.amount > 0 ? 1 : 0;
    if (input.currencyType !== "NONE" && input.amount > 0) {
      const buyerKey = key(input.organizationId, input.buyerUserId, input.currencyType);
      this.balances.set(buyerKey, (this.balances.get(buyerKey) || 0) - input.amount);
      const sellerKey = key(input.organizationId, input.sellerRef, input.currencyType);
      this.balances.set(sellerKey, (this.balances.get(sellerKey) || 0) + input.amount);
    }
    const result = { transactionRef: `treasury_txn_${randomUUID()}`, status: "SETTLED" as const, ledgerTrace: `treasury:${input.purpose}:${input.sourceRef}` };
    this.transfers.set(input.idempotencyKey, result);
    return result;
  }

  async refund(input: TreasuryTransferInput) {
    if (this.transfers.has(input.idempotencyKey)) return { ...this.transfers.get(input.idempotencyKey)!, status: "ALREADY_SETTLED" as const };
    if (input.currencyType !== "NONE" && input.amount > 0) {
      const buyerKey = key(input.organizationId, input.buyerUserId, input.currencyType);
      this.balances.set(buyerKey, (this.balances.get(buyerKey) || 0) + input.amount);
    }
    const result = { transactionRef: `treasury_refund_${randomUUID()}`, status: "SETTLED" as const, ledgerTrace: `treasury:${input.purpose}:${input.sourceRef}` };
    this.transfers.set(input.idempotencyKey, result);
    return result;
  }
}

export const defaultTreasuryAdapter = new InMemoryTreasuryAdapter();
