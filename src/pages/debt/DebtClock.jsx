// src/pages/debt/DebtClock.jsx
import React from "react";
import { useCreditCtx } from "@/shared/credit/CreditProvider.jsx"; // HYBRID: read score/tier

/**
 * SHF Ecosystem Debt Clock
 * - Primary source: GET /api/shf/finance/clock
 * - Fallback: internal snapshot (so UI never blanks in dev)
 */

const SEC_PER_YEAR = 365 * 24 * 60 * 60;

/* ---------- Fallback snapshot (safe dev values) ---------- */
const FB = {
  timestamp: Date.UTC(2025, 0, 1),
  portfolio: {
    outstandingPrincipal: 18_000_000,
    accruedInterestYTD: 1_450_000,
    blendedApr: 0.095,
    repaymentRateAnnual: 0.22,
    delinquencyRate: 0.06,
  },
  treasury: {
    reservesUSD: 7_250_000,
    rewardsLiabilityUSD: 420_000,
  },
  marketplace: {
    receivablesUSD: 3_100_000,
    payablesUSD: 1_250_000,
  },
  onchain: { tvlUSD: 5_600_000 },
  population: { activeLearners: 4200, activeEmployers: 160 },
  categories: {
    learnerFinanceUSD: 13_500_000,
    microcreditUSD: 2_200_000,
    deviceFinanceUSD: 650_000,
    marketplaceNetUSD: 1_850_000,
  },
};

/* ---------- formatters ---------- */
const fmt0 = new Intl.NumberFormat("en-US");
const fmt2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const usd0 = (n) => `$${fmt0.format(Math.round(n))}`;
const usd2 = (n) => `$${fmt2.format(n)}`;
const pct1 = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/* ---------- helpers ---------- */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function num(v, fb) {
  const n = typeof v === "number" && isFinite(v) ? v : Number(v);
  return Number.isFinite(n) ? n : fb;
}

/** Advance the ecosystem model by dt seconds. */
function stepPortfolio(p, dtSec, apr, repayRate) {
  const interest = p * apr * (dtSec / SEC_PER_YEAR);
  const repay = p * repayRate * (dtSec / SEC_PER_YEAR);
  return {
    nextPrincipal: Math.max(0, p + interest - repay),
    interestAccrued: interest,
    repaid: repay,
  };
}

export default function DebtClock() {
  // Hybrid credit (safe if provider isn't mounted)
  const credit = (typeof useCreditCtx === "function" ? useCreditCtx() : null) || {};
  const bandName = credit?.tier?.name ?? "Foundation";
  const bandCode = credit?.tier?.band ?? "D";
  // simple band → APR discount mapping (tune in creditEngine/market config)
  const BAND_DISCOUNT = { "A+": 0.20, "A": 0.15, "B": 0.08, "C": 0.03, "D": 0.0 };
  const aprBandDiscount = BAND_DISCOUNT[bandCode] ?? 0;

  // Snapshot (server → fallback)
  const [snap, setSnap] = React.useState(FB);

  // Live state
  const [principal, setPrincipal] = React.useState(
    FB.portfolio.outstandingPrincipal
  );
  const [accruedYTD, setAccruedYTD] = React.useState(
    FB.portfolio.accruedInterestYTD
  );

  // What-if knobs
  const [apr, setApr] = React.useState(FB.portfolio.blendedApr);
  const [repayRate, setRepayRate] = React.useState(
    FB.portfolio.repaymentRateAnnual
  );

  // Controls
  const [running, setRunning] = React.useState(true);
  const [speed, setSpeed] = React.useState(1);

  /* ----- Load SHF snapshot if available ----- */
  React.useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/shf/finance/clock", {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (cancelled) return;

        const normalized = {
          timestamp: new Date(j.timestamp ?? Date.now()).valueOf(),
          portfolio: {
            outstandingPrincipal: num(
              j.portfolio?.outstandingPrincipal,
              FB.portfolio.outstandingPrincipal
            ),
            accruedInterestYTD: num(
              j.portfolio?.accruedInterestYTD,
              FB.portfolio.accruedInterestYTD
            ),
            blendedApr: num(j.portfolio?.blendedApr, FB.portfolio.blendedApr),
            repaymentRateAnnual: num(
              j.portfolio?.repaymentRateAnnual,
              FB.portfolio.repaymentRateAnnual
            ),
            delinquencyRate: num(
              j.portfolio?.delinquencyRate,
              FB.portfolio.delinquencyRate
            ),
          },
          treasury: {
            reservesUSD: num(
              j.treasury?.reservesUSD,
              FB.treasury.reservesUSD
            ),
            rewardsLiabilityUSD: num(
              j.treasury?.rewardsLiabilityUSD,
              FB.treasury.rewardsLiabilityUSD
            ),
          },
          marketplace: {
            receivablesUSD: num(
              j.marketplace?.receivablesUSD,
              FB.marketplace.receivablesUSD
            ),
            payablesUSD: num(
              j.marketplace?.payablesUSD,
              FB.marketplace.payablesUSD
            ),
          },
          onchain: { tvlUSD: num(j.onchain?.tvlUSD, FB.onchain.tvlUSD) },
          population: {
            activeLearners: Math.max(
              0,
              Math.floor(
                num(j.population?.activeLearners, FB.population.activeLearners)
              )
            ),
            activeEmployers: Math.max(
              0,
              Math.floor(
                num(
                  j.population?.activeEmployers,
                  FB.population.activeEmployers
                )
              )
            ),
          },
          categories: {
            learnerFinanceUSD: num(
              j.categories?.learnerFinanceUSD,
              FB.categories.learnerFinanceUSD
            ),
            microcreditUSD: num(
              j.categories?.microcreditUSD,
              FB.categories.microcreditUSD
            ),
            deviceFinanceUSD: num(
              j.categories?.deviceFinanceUSD,
              FB.categories.deviceFinanceUSD
            ),
            marketplaceNetUSD: num(
              j.categories?.marketplaceNetUSD,
              FB.categories.marketplaceNetUSD
            ),
          },
        };

        setSnap(normalized);
        setPrincipal(normalized.portfolio.outstandingPrincipal);
        setAccruedYTD(normalized.portfolio.accruedInterestYTD);
        setApr(normalized.portfolio.blendedApr);
        setRepayRate(normalized.portfolio.repaymentRateAnnual);
      } catch {
        // keep fallback
      }
    })();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);

  /* ----- Live ticker (rAF) with interest + repayments ----- */
  React.useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let P = principal;
    let I = accruedYTD;

    const frame = (t) => {
      const dtSec = ((t - last) / 1000) * speed;
      last = t;

      if (running && dtSec > 0 && Number.isFinite(P)) {
        const { nextPrincipal, interestAccrued } = stepPortfolio(
          P,
          dtSec,
          apr,
          repayRate
        );
        P = nextPrincipal;
        I += interestAccrued;
        setPrincipal(P);
        setAccruedYTD(I);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed, apr, repayRate]);

  /* ----- Derived metrics ----- */
  const liveInterestYTD = accruedYTD;
  const reserves = snap.treasury.reservesUSD;
  const rewardsLiab = snap.treasury.rewardsLiabilityUSD;
  const netLiability = Math.max(
    0,
    principal + liveInterestYTD + rewardsLiab - reserves
  );
  const arMinusAp =
    snap.marketplace.receivablesUSD - snap.marketplace.payablesUSD;
  const aprPct = (apr * 100).toFixed(2);
  const repayPct = (repayRate * 100).toFixed(1);

  // APR band effects (from Reliability Score)
  const effApr = Math.max(0, apr * (1 - aprBandDiscount));
  const effAprPct = (effApr * 100).toFixed(2);
  const estInterestYr = principal * apr; // baseline
  const estInterestYrEff = principal * effApr; // after band benefit
  const estSavedAnnual = Math.max(0, estInterestYr - estInterestYrEff);

  return (
    <div className="page pad" data-scope="debt-clock">
      {/* Header + knobs */}
      <header className="card card--pad" style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24 }}>SHF Ecosystem Debt Clock</h1>
          <span style={{ color: "var(--ink-soft)" }}>
            Live accrual + repayments on SHF portfolios. Data sourced from SHF
            ledgers, marketplace, and treasury.
          </span>
        </div>

        <div
          className="controls"
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            className="sh-btn"
            onClick={() => setRunning((v) => !v)}
            aria-pressed={running}
          >
            {running ? "Pause" : "Resume"}
          </button>

          <label className="control">
            <span>Speed</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={1}>1×</option>
              <option value={5}>5×</option>
              <option value={10}>10×</option>
            </select>
          </label>

          <label className="control">
            <span>Blended APR</span>
            <input
              type="range"
              min="0"
              max="0.28"
              step="0.001"
              value={apr}
              onChange={(e) =>
                setApr(clamp(Number(e.target.value), 0, 0.28))
              }
              aria-valuetext={`${aprPct}%`}
              style={{ width: 220 }}
            />
            <strong style={{ marginLeft: 8 }}>{aprPct}%</strong>
          </label>

          <label className="control">
            <span>Repayment rate (annual)</span>
            <input
              type="range"
              min="0"
              max="0.60"
              step="0.005"
              value={repayRate}
              onChange={(e) =>
                setRepayRate(clamp(Number(e.target.value), 0, 0.6))
              }
              aria-valuetext={`${repayPct}%`}
              style={{ width: 260 }}
            />
            <strong style={{ marginLeft: 8 }}>{repayPct}%</strong>
          </label>
        </div>
      </header>

      {/* Hero stats */}
      <section
        className="grid hero"
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <BigStat
          ariaLive
          label="Outstanding Principal (live)"
          value={usd0(principal)}
          sub={`APR ~ ${aprPct}%`}
        />
        <BigStat
          label="Interest Accrued (YTD, live)"
          value={usd0(liveInterestYTD)}
          sub={`${usd2((principal * apr) / SEC_PER_YEAR)}/sec`}
        />
        <BigStat label="Reserves" value={usd0(reserves)} sub="Treasury (cash/stables)" />
        <BigStat label="Rewards Liability" value={usd0(rewardsLiab)} sub="Unredeemed rewards" />
        <BigStat
          label="Net Liability"
          value={usd0(netLiability)}
          sub="(Principal + Interest + Rewards − Reserves)"
        />
        <BigStat label="Marketplace Net" value={usd0(arMinusAp)} sub="Receivables − Payables" />
        <BigStat
          label="Delinquency"
          value={pct1.format(snap.portfolio.delinquencyRate)}
          sub="Portfolio level"
        />
        <BigStat label="On-chain TVL" value={usd0(snap.onchain.tvlUSD)} sub="Polygon & custody" />
        {/* New: band-driven financing effect from Reliability Score */}
        <BigStat label="APR Band" value={`${bandName} (${bandCode})`} sub={`Effective APR ≈ ${effAprPct}%`} />
        <BigStat label="Est. Interest Saved / yr" value={usd0(estSavedAnnual)} sub="Band benefit vs. baseline APR" />
      </section>

      {/* Buckets */}
      <section className="card card--pad">
        <h2 style={{ margin: 0, fontSize: 18 }}>Portfolio Composition</h2>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            marginTop: 10,
          }}
        >
          <Tile title="Learner Finance" amount={snap.categories.learnerFinanceUSD} />
          <Tile title="Microcredit" amount={snap.categories.microcreditUSD} />
          <Tile title="Device Finance" amount={snap.categories.deviceFinanceUSD} />
          <Tile title="Marketplace Net" amount={snap.categories.marketplaceNetUSD} />
        </div>
      </section>

      {/* Population */}
      <section className="card card--pad">
        <h2 style={{ margin: 0, fontSize: 18 }}>Active Participants</h2>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            marginTop: 10,
          }}
        >
          <SmallTile title="Active Learners" value={fmt0.format(snap.population.activeLearners)} />
          <SmallTile title="Active Employers" value={fmt0.format(snap.population.activeEmployers)} />
        </div>
      </section>

      {/* Notes */}
      <footer className="card card--pad" style={{ color: "var(--ink-soft)" }}>
        <strong>Methodology.</strong> We start from the latest SHF snapshot and simulate forward:
        interest accrues on outstanding principal; repayments reduce principal continuously based on
        the annual repayment rate. Rewards liability and reserves come from treasury; marketplace net
        derives from AR/AP. Your <em>Reliability Score</em> sets an APR band that can reduce effective APR
        and estimated annual interest. With backend + Polygon connected, this respects scoring rules,
        caps, and on-chain mirrors automatically.
      </footer>
    </div>
  );
}

/* ---------- subcomponents ---------- */
function BigStat({ label, value, sub, ariaLive }) {
  return (
    <div className="card card--pad" role="group" aria-label={label}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{label}</div>
      <div
        style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}
        aria-live={ariaLive ? "polite" : undefined}
      >
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--ink-soft)" }}>{sub}</div>
      )}
    </div>
  );
}

function Tile({ title, amount }) {
  return (
    <div className="card card--pad" role="group" aria-label={title}>
      <strong>{title}</strong>
      <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700 }}>{usd0(amount)}</div>
    </div>
  );
}

function SmallTile({ title, value }) {
  return (
    <div className="card card--pad" role="group" aria-label={title}>
      <strong>{title}</strong>
      <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
