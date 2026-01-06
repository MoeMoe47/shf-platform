import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

export default function AppHeaderActions() {
  const { emit } = (typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} });
  const [connecting, setConnecting] = React.useState(false);

  const onConnect = async () => {
    try {
      setConnecting(true);
      if (!window.ethereum) {
        alert("No wallet found. Install MetaMask or a compatible wallet.");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      try { emit?.("wallet:connect", { accounts, provider: "eip1193", app: currentApp() }); } catch {}
    } finally {
      setConnecting(false);
    }
  };

  const Btn = ({ href, children, title }) => (
    <a className="sh-btn sh-btn--secondary" href={href} title={title} style={{ textDecoration: "none" }}>
      {children}
    </a>
  );

  return (
    <div className="app-header-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button className="sh-btn" onClick={onConnect} disabled={connecting} title="Connect wallet">
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {/* Pathways required in every app */}
      <Btn href="/career.html#/rewards" title="Rewards Wallet">Rewards</Btn>
      <Btn href="/career.html#/credit/report" title="Credit Report">Credit</Btn>
      <Btn href="/debt.html#/clock" title="Debt Clock">Debt</Btn>
      <Btn href="/career.html#/marketplace" title="Marketplace">Marketplace</Btn>
    </div>
  );
}

function currentApp() {
  // best-effort tag for analytics; adjust if you prefer something else
  if (location.pathname.includes("/sales")) return "sales";
  if (location.pathname.includes("/arcade")) return "arcade";
  if (location.pathname.includes("/debt")) return "debt";
  if (location.pathname.includes("/curriculum")) return "curriculum";
  return "career";
}
