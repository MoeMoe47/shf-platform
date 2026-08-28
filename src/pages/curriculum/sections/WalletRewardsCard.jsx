// src/pages/curriculum/sections/WalletRewardsCard.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { href as HREFS } from "@/router/paths.js";
import { ArrowRightIcon } from "@/components/curriculum/icons.jsx";

/**
 * Connects to the same canonical credit/wallet source WalletButton.jsx
 * already uses (useCreditCtx().balances). That provider does not yet
 * populate a `balances` field (verified in src/shared/credit/CreditProvider.jsx),
 * so real values always come back empty today. The fallback below is
 * isolated to this one spot and is used only when no real balance is
 * present — once CreditProvider starts populating balances, this card
 * updates automatically with no further changes needed.
 */
const FALLBACK_WALLET = { shf: 240, corn: 120, wheat: 75 };

function formatInt(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v).toLocaleString() : "0";
}

export default function WalletRewardsCard() {
  const credit = useCreditCtx() || {};
  const balances = credit.balances || {};
  const tokens = balances.tokens || balances;

  const shf = Number.isFinite(balances.shf) && balances.shf > 0 ? balances.shf : FALLBACK_WALLET.shf;
  const corn = Number.isFinite(tokens.corn) && tokens.corn > 0 ? tokens.corn : FALLBACK_WALLET.corn;
  const wheat = Number.isFinite(tokens.wheat) && tokens.wheat > 0 ? tokens.wheat : FALLBACK_WALLET.wheat;

  return (
    <section className="ld-card" aria-labelledby="ld-wallet-h">
      <p id="ld-wallet-h" className="ld-eyebrow">Wallet &amp; Rewards</p>

      <p className="ld-walletShf">{formatInt(shf)}</p>
      <p className="ld-mutedLine ld-walletShfLabel">SHF credits</p>

      <ul className="ld-walletTokens">
        <li>
          <span className="ld-tokenIcon" aria-hidden="true">🌽</span>
          <span className="ld-tokenLabel">Corn</span>
          <span className="ld-tokenValue">{formatInt(corn)}</span>
        </li>
        <li>
          <span className="ld-tokenIcon" aria-hidden="true">🌾</span>
          <span className="ld-tokenLabel">Wheat</span>
          <span className="ld-tokenValue">{formatInt(wheat)}</span>
        </li>
      </ul>

      <a href={HREFS.credit("/wallet")} className="ld-viewLink">
        View wallet
        <ArrowRightIcon size={16} />
      </a>
    </section>
  );
}
