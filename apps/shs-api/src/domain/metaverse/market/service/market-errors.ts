export class MarketError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
    this.name = "MarketError";
  }
}

export function statusForMarketError(error: unknown) {
  return error instanceof MarketError ? error.status : 500;
}
