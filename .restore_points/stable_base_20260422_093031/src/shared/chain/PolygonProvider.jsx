import React from "react";

// Simple, dependency-free Polygon connector.
// Mode "simulate" logs locally; flip to "onchain" when your RPC + contract are ready.
const DEFAULT_CHAIN_ID = Number(import.meta.env.VITE_POLYGON_CHAIN_ID || 137); // 137=Polygon, 80001=Mumbai
const DEFAULT_RPC_URL  = import.meta.env.VITE_POLYGON_RPC_URL || "";           // optional fallback

export const PolygonCtx = React.createContext(null);
export const usePolygon = () => React.useContext(PolygonCtx);

export function PolygonProvider({ children, config = {} }) {
  const [account, setAccount] = React.useState(null);
  const [chainId, setChainId] = React.useState(null);
  const mode    = config.mode || (DEFAULT_RPC_URL ? "onchain" : "simulate");

  // Minimal wallet connect (if MetaMask present)
  const connect = React.useCallback(async () => {
    if (!window.ethereum) return null;
    const [acc] = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(acc || null);
    const cid = await window.ethereum.request({ method: "eth_chainId" });
    setChainId(parseInt(cid, 16));
    return acc;
  }, []);

  const switchOrAdd = React.useCallback(async (targetId = DEFAULT_CHAIN_ID) => {
    if (!window.ethereum) return;
    const hex = "0x" + targetId.toString(16);
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e) {
      if (e?.code === 4902 && DEFAULT_RPC_URL) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: hex,
            chainName: targetId === 137 ? "Polygon" : "Polygon Testnet",
            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
            rpcUrls: [DEFAULT_RPC_URL],
            blockExplorerUrls: ["https://polygonscan.com/"],
          }]
        });
      }
    }
  }, []);

  // Demo “log to chain” shim (replace with contract call later)
  const logEvent = React.useCallback(async (name, payload = {}) => {
    if (mode === "simulate") {
      console.debug("[Polygon:simulate]", name, payload);
      return { tx: "simulated" };
    }
    // When ready: send to your logging contract or use a relayer/meta-tx
    // For now, hit an API or store to your backend that relays to chain.
    try {
      console.debug("[Polygon:onchain]", name, payload);
      // await fetch("/api/chain/log", { method:"POST", body: JSON.stringify({ name, payload })})
      return { tx: "queued" };
    } catch (e) {
      console.error("logEvent failed", e);
      return { error: String(e?.message || e) };
    }
  }, [mode]);

  React.useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accs) => setAccount(accs?.[0] || null);
    const onChain    = (cid) => setChainId(parseInt(cid,16));
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccounts);
      window.ethereum.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const value = React.useMemo(() => ({
    mode, account, chainId,
    connect, switchOrAdd, logEvent,
    desiredChainId: DEFAULT_CHAIN_ID,
    rpcUrl: DEFAULT_RPC_URL
  }), [mode, account, chainId, connect, switchOrAdd, logEvent]);

  return <PolygonCtx.Provider value={value}>{children}</PolygonCtx.Provider>;
}
