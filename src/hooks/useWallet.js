// src/hooks/useWallet.js
// ------------------------------------------------------------
// Central wallet hook for SHF.
//
// In dev we fall back to useMockWallet, but this file always
// exposes a named + default `useWallet` so other code (like
// useArcadeLedger) can safely import it.
// ------------------------------------------------------------

import * as mock from "./useMockWallet.js";

function getImpl() {
  // If useMockWallet is exported as a named hook
  if (typeof mock.useMockWallet === "function") {
    return mock.useMockWallet;
  }

  // If useMockWallet is the default export
  if (typeof mock.default === "function") {
    return mock.default;
  }

  // Super-safe no-op wallet so the app never crashes in dev
  return function useNoopWallet() {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[useWallet] No wallet implementation found. Using no-op wallet."
      );
    }
    return {
      balance: 0,
      xp: 0,
      tokens: 0,
      addTransaction: async () => {},
    };
  };
}

const impl = getImpl();

export function useWallet() {
  return impl();
}

export default useWallet;
