import React from "react";
import { appendEvent as append, queryEvents as query } from "./ledgerClient.js";

const LedgerCtx = React.createContext({ appendEvent: () => {}, queryEvents: () => [] });

export function useLedger() { return React.useContext(LedgerCtx); }

export default function LedgerProvider({ children }) {
  const value = React.useMemo(() => ({
    appendEvent: append,
    queryEvents: query,
  }), []);
  return <LedgerCtx.Provider value={value}>{children}</LedgerCtx.Provider>;
}