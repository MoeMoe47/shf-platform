// src/hooks/useMockWallet.js
import { useEffect, useMemo, useState } from "react";

/** Keys */
const STORAGE_KEY = "mock:wallet:v1";

/** Helpers */
const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
const randomHex = (len) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");

const makeNewWalletState = () => ({
  connected: true,
  address: `0x${randomHex(40)}`,
  network: { name: "Polygon PoS", chainId: 137, token: "MATIC" },
  xp: 420,          // fun starter XP
  nfts: 2,          // starter NFTs
  lastUpdated: Date.now(),
});

export function useMockWallet() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { connected: false, address: null, network: null, xp: 0, nfts: 0, lastUpdated: 0 };
  });

  const [loading, setLoading] = useState(false);

  // persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  // actions
  const connect = async () => {
    if (state.connected) return;
    setLoading(true);
    // tiny delay to show skeleton
    await new Promise((r) => setTimeout(r, 600));
    setState(makeNewWalletState());
    setLoading(false);
  };

  const disconnect = () => {
    setState({ connected: false, address: null, network: null, xp: 0, nfts: 0, lastUpdated: Date.now() });
  };

  const addXP = (amt = 50) => {
    if (!state.connected) return;
    setState((s) => ({ ...s, xp: Math.max(0, s.xp + amt), lastUpdated: Date.now() }));
  };

  const mintNFT = () => {
    if (!state.connected) return;
    setState((s) => ({ ...s, nfts: s.nfts + 1, lastUpdated: Date.now() }));
  };

  const reset = () => setState({ connected: false, address: null, network: null, xp: 0, nfts: 0, lastUpdated: Date.now() });

  const view = useMemo(
    () => ({
      ...state,
      shortAddress: shortAddr(state.address),
      isPolygon: state?.network?.chainId === 137,
    }),
    [state]
  );

  return { ...view, loading, connect, disconnect, addXP, mintNFT, reset };
}

export default useMockWallet;
