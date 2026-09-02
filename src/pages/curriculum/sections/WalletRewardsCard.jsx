// src/pages/curriculum/sections/WalletRewardsCard.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { href as HREFS } from "@/router/paths.js";
import { ArrowRightIcon } from "@/components/curriculum/icons.jsx";

/**
 * Connects to the same canonical credit/wallet source WalletButton.jsx
 * already uses (useCreditCtx().balances). That provider does not yet
 * populate a `balances` field (verified in src/shared/credit/CreditProvider.jsx),
 * so real values always come back empty today. Do not replace that absence
 * with browser-generated institutional credit.
 */
function formatInt(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v).toLocaleString() : "0";
}

export default function WalletRewardsCard() {
  const credit = useCreditCtx() || {};
  const balances = credit.balances || {};
  const tokens = balances.tokens || balances;

  const shf = Number.isFinite(balances.shf) ? balances.shf : null;
  const corn = Number.isFinite(tokens.corn) ? tokens.corn : null;
  const wheat = Number.isFinite(tokens.wheat) ? tokens.wheat : null;

  return (
    <section className="ld-card" aria-labelledby="ld-wallet-h">
      <p id="ld-wallet-h" className="ld-eyebrow">Wallet &amp; Rewards</p>

      <p className="ld-walletShf">{shf == null ? "—" : formatInt(shf)}</p>
      <p className="ld-mutedLine ld-walletShfLabel">SHF credits</p>

      <ul className="ld-walletTokens">
        <li>
          <span className="ld-tokenIcon" aria-hidden="true">🌽</span>
          <span className="ld-tokenLabel">Corn</span>
          <span className="ld-tokenValue">{corn == null ? "—" : formatInt(corn)}</span>
        </li>
        <li>
          <span className="ld-tokenIcon" aria-hidden="true">🌾</span>
          <span className="ld-tokenLabel">Wheat</span>
          <span className="ld-tokenValue">{wheat == null ? "—" : formatInt(wheat)}</span>
        </li>
      </ul>

      <a href={HREFS.credit("/wallet")} className="ld-viewLink">
        View wallet
        <ArrowRightIcon size={16} />
      </a>
    </section>
  );
}
