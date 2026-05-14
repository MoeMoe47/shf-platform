import React from "react";

const FlagsCtx = React.createContext({ flags: {}, setFlag: () => {} });

export function FlagsProvider({ children }) {
  const [flags, setFlags] = React.useState(() => {
    const base = {};
    // URL overrides: ?flag.foo=1&flag.walletV2=0
    const q = new URLSearchParams(window.location.search);
    for (const [k, v] of q.entries()) {
      if (!k.startsWith("flag.")) continue;
      base[k.slice(5)] = v === "1" || v === "true";
    }
    // persisted dev flags
    try {
      const saved = JSON.parse(localStorage.getItem("flags:dev") || "{}");
      Object.assign(base, saved);
    } catch {}
    return base;
  });

  const setFlag = React.useCallback((key, val) => {
    setFlags((f) => {
      const next = { ...f, [key]: !!val };
      try { localStorage.setItem("flags:dev", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const value = React.useMemo(() => ({ flags, setFlag }), [flags, setFlag]);
  return <FlagsCtx.Provider value={value}>{children}</FlagsCtx.Provider>;
}

export function useFlags() {
  return React.useContext(FlagsCtx);
}
