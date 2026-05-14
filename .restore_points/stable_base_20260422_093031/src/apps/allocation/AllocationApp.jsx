import React, { useMemo, useState, useEffect } from "react";
import methodologyText from "./methodology/methodology-v1.md?raw";
import { DEFAULTS, clamp, round, simulate } from "./model.js";
import baseline from "./franklin-baseline.json";

const ADMIN_CODE = "SHF-ADMIN"; // ✅ change this to your real code

const LS_EXPORTS_KEY = "shf_allocation_exports_v1";
const MAX_EXPORTS = 10;

const shell = {
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  background: "#0a0f18",
  color: "#e8eefc",
  minHeight: "100vh",
  padding: 24,
};
const card = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 16,
};
const subtle = { color: "rgba(232,238,252,0.70)", fontSize: 12 };

const money = (n) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";
const pct = (n) => (Number.isFinite(n) ? (n * 100).toFixed(1) + "%" : "—");
const compactMoney = (n) => {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(round(n, 0));
};

/**
 * Deterministic JSON stringify (stable key order)
 * - This makes hashing/signing repeatable across exports.
 */
function stableStringify(obj) {
  const seen = new WeakSet();

  const sorter = (value) => {
    if (value && typeof value === "object") {
      if (seen.has(value)) return null; // drop cycles (shouldn't happen)
      seen.add(value);

      if (Array.isArray(value)) return value.map(sorter);

      // sort keys
      return Object.keys(value)
        .sort()
        .reduce((acc, k) => {
          acc[k] = sorter(value[k]);
          return acc;
        }, {});
    }
    return value;
  };

  return JSON.stringify(sorter(obj), null, 2);
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(text) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

/**
 * HMAC-SHA256 signing (browser)
 * - Key = ADMIN_CODE
 * - Payload = canonical_json
 */
async function hmacSha256Hex(keyText, messageText) {
  const enc = new TextEncoder();
  const keyData = enc.encode(keyText);
  const msgData = enc.encode(messageText);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return bytesToHex(new Uint8Array(sig));
}

function readExports() {
  try {
    const raw = localStorage.getItem(LS_EXPORTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeExports(list) {
  try {
    localStorage.setItem(LS_EXPORTS_KEY, JSON.stringify(list.slice(0, MAX_EXPORTS)));
  } catch {
    // ignore quota errors
  }
}

export default function AllocationApp() {
  const [tab, setTab] = useState("dashboard");
  const [shiftPct, setShiftPct] = useState(0.10);

  // ✅ Power move: editable funding
  const [totalFunding, setTotalFunding] = useState(DEFAULTS.totalFunding);

  // ✅ Admin lock (simple)
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  // ✅ export history
  const [exportHistory, setExportHistory] = useState([]);

  useEffect(() => {
    setExportHistory(readExports());
  }, []);

  const adultServed =
    baseline?.wioa?.area7?.demographics?.totals?.participants_served?.adult ?? 0;

  const sourceYear = baseline?.wioa?.source_year ?? "PY2024";

  const adultMedianEarningsQ2 =
    baseline?.wioa?.area7?.performance?.adult?.median_earnings_2nd_qtr_after_exit?.usd ?? null;

  const sim = useMemo(() => {
    const base = { ...DEFAULTS, totalFunding };
    return simulate(base, shiftPct);
  }, [shiftPct, totalFunding]);

  const retainedDelta = sim.adjusted.retained - sim.base.retained;
  const wageDelta = sim.adjusted.wageImpact - sim.base.wageImpact;
  const recidDelta = sim.adjusted.recidivismReduction - sim.base.recidivismReduction;
  const effDelta = sim.adjusted.efficiency - sim.base.efficiency;

  const exportReport = async () => {
    // Base payload (what we *intend* to sign)
    const unsigned = {
      generated_local: new Date().toISOString(),
      baseline: {
        region: baseline?.region,
        source_year: baseline?.wioa?.source_year,
        source_label: baseline?.wioa?.source_label,
        adult_participants_served: adultServed,
        adult_median_earnings_q2_after_exit_usd: adultMedianEarningsQ2,
        pdf_path: baseline?.wioa?.area7?.sources?.pdf_path ?? null,
        demographics_pages: baseline?.wioa?.area7?.sources?.demographics_pages ?? null,
        performance_pages: baseline?.wioa?.area7?.sources?.performance_pages ?? null,
      },
      inputs: {
        totalFunding,
        shiftPct,
        assumedParticipants_in_model: DEFAULTS.assumedParticipants,
      },
      simulation: sim,
      deltas: {
        retainedDelta,
        wageDelta,
        recidDelta,
        effDelta,
      },
    };

    // Canonicalize for stable hash/signature
    const canonical = stableStringify(unsigned);

    // Hash + signature
    const sha256 = await sha256Hex(canonical);
    const hmac = await hmacSha256Hex(ADMIN_CODE, canonical);

    // Final export payload (contains both the signed content AND the proof)
    const payload = {
      ...unsigned,
      audit: {
        canonical_json: canonical,
        sha256,
        hmac_sha256: hmac,
        algo: "SHA-256 + HMAC-SHA256",
        note:
          "Client-side HMAC is tamper-evident for audit trails; not a secret server-side signature.",
      },
    };

    // Save to localStorage history (last 10)
    const record = {
      id: `${sourceYear}_${new Date().toISOString()}`,
      ts: new Date().toISOString(),
      sha256,
      hmac_sha256: hmac,
      totalFunding,
      shiftPct,
      adultServed,
      filename: `allocation_report_area7_adult_${sourceYear}_${new Date().toISOString().slice(0, 10)}.json`,
    };

    const next = [record, ...readExports()].slice(0, MAX_EXPORTS);
    writeExports(next);
    setExportHistory(next);

    // Download file
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = record.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const requestAdminUnlock = () => {
    const code = window.prompt("Enter Admin passcode:");
    if (!code) return;
    if (String(code).trim() === ADMIN_CODE) {
      setAdminUnlocked(true);
      window.alert("Admin unlocked.");
    } else {
      window.alert("Incorrect code.");
    }
  };

  const lockAdmin = () => setAdminUnlocked(false);

  return (
    <div style={shell}>
      {/* Top banner / header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={subtle}>SHF Allocation Intelligence</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            Franklin County (Area 7) — Adult Workforce Baseline
          </div>
          <div style={{ ...subtle, marginTop: 4 }}>
            Adult Participants Served: <b>{Number(adultServed || 0).toLocaleString()}</b> ({sourceYear})
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 4,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <button style={tabBtn(tab === "dashboard")} onClick={() => setTab("dashboard")}>
              Dashboard
            </button>
            <button style={tabBtn(tab === "methodology")} onClick={() => setTab("methodology")}>
              Methodology
            </button>
          </div>

          <button style={btn(false)} onClick={exportReport}>
            Export Report
          </button>

          {!adminUnlocked ? (
            <button style={btn(true)} onClick={requestAdminUnlock}>
              Admin
            </button>
          ) : (
            <button style={btn(true)} onClick={lockAdmin}>
              Admin (Lock)
            </button>
          )}
        </div>
      </div>

      {/* Admin audit strip */}
      {adminUnlocked ? (
        <div
          style={{
            ...card,
            padding: 12,
            marginBottom: 14,
            borderColor: "rgba(120,170,255,0.35)",
            background: "rgba(120,170,255,0.08)",
          }}
        >
          <div style={{ fontWeight: 900 }}>VALIDATED MODE: ADMIN UNLOCKED</div>
          <div style={subtle}>
            Exports now include canonical JSON + SHA-256 + HMAC-SHA256 (tamper-evident audit proof).
          </div>
        </div>
      ) : (
        <div
          style={{
            ...card,
            padding: 12,
            marginBottom: 14,
            borderColor: "rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 900 }}>PROXY MODE (DEFAULT)</div>
          <div style={subtle}>
            You’re viewing modeled outcomes. Unlock Admin for “validated/audit” banner + stronger export audit proof.
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, alignItems: "start" }}>
        {/* Left side */}
        <div style={{ ...card, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Navigation</div>
          <NavItem label="Workforce Programs" />
          <NavItem label="Recovery Programs" />
          <NavItem label="Funding Sources" />
          <NavItem label="Risk Metrics" />
          <NavItem label="Data Insights" />

          <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.08)", margin: "14px 0" }} />

          <div style={{ fontWeight: 800, marginBottom: 10 }}>Filters</div>
          <div style={{ ...card, padding: 12 }}>
            <div style={subtle}>Timeframe</div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>12 Months</div>

            <div style={subtle}>Funding Shift</div>
            <div style={{ fontWeight: 700 }}>{Math.round(shiftPct * 100)}% (A → B)</div>

            {/* Power move: editable funding + cost per participant */}
            <div style={{ marginTop: 12 }}>
              <div style={subtle}>Total Funding (editable)</div>
              <input
                value={String(totalFunding)}
                onChange={(e) => {
                  const n = Number(String(e.target.value).replace(/[^\d]/g, ""));
                  setTotalFunding(Number.isFinite(n) && n > 0 ? n : 0);
                }}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "10px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#e8eefc",
                  fontWeight: 800,
                }}
                placeholder="10000000"
              />

              <div style={{ ...subtle, marginTop: 10 }}>Cost / Adult Participant ({sourceYear}):</div>
              <div style={{ fontWeight: 900 }}>
                {adultServed > 0 ? money(totalFunding / adultServed) : "—"}
              </div>
            </div>

            {/* Export history */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Last Exports</div>
              {exportHistory?.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {exportHistory.slice(0, 10).map((x) => (
                    <div
                      key={x.id}
                      style={{
                        padding: "10px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 12 }}>
                        {String(x.filename || "export.json")}
                      </div>
                      <div style={subtle}>
                        {String(x.ts || "").slice(0, 19).replace("T", " ")} · shift {Math.round((x.shiftPct || 0) * 100)}% ·{" "}
                        {money(x.totalFunding || 0)}
                      </div>
                      <div style={{ ...subtle, marginTop: 6 }}>
                        sha256: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{String(x.sha256 || "").slice(0, 16)}…</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={subtle}>No exports yet. Click “Export Report”.</div>
              )}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ display: "grid", gap: 18 }}>
          {/* Top metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <Metric title="Cost Per Retained Placement" value={money(sim.adjusted.costPerRetained)} />
            <Metric title="12-Month Wage Impact" value={`+${compactMoney(sim.adjusted.wageImpact)}`} />
            <Metric title="Recidivism Reduction (proxy)" value={pct(sim.adjusted.recidivismReduction)} />
            <Metric title="Efficiency Score" value={`${round(sim.adjusted.efficiency, 0)}`} sub={`Δ ${round(effDelta, 1)}`} />
            <Metric
              title={`Adult Median Earnings (Q2 after exit) — ${sourceYear}`}
              value={adultMedianEarningsQ2 ? money(adultMedianEarningsQ2) : "—"}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 12 }}>
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Allocation Simulation</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={subtle}>Reallocate funding</div>
                  <div style={{ fontWeight: 750 }}>Program A → Program B</div>
                </div>
                <div style={{ fontWeight: 900 }}>{Math.round(shiftPct * 100)}%</div>
              </div>

              <input
                type="range"
                min={0}
                max={50}
                value={Math.round(shiftPct * 100)}
                onChange={(e) => setShiftPct(clamp(Number(e.target.value) / 100, 0, 0.5))}
                style={{ width: "100%" }}
              />

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <Row
                  label="Retained Placements"
                  value={`${round(sim.base.retained, 0)} → ${round(sim.adjusted.retained, 0)}`}
                  delta={round(retainedDelta, 0)}
                />
                <Row label="Wage Impact Change" value={pct(wageDelta / Math.max(sim.base.wageImpact, 1))} />
                <Row label="Recidivism Change (proxy)" value={pct(recidDelta)} />
              </div>

              <div style={{ ...subtle, marginTop: 12 }}>
                Proxy model until all policy baselines are fully validated end-to-end (WIOA + DRC + BLS).
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Trends (placeholder)</div>
              <MiniTrend />
              <div style={{ ...subtle, marginTop: 10 }}>
                This becomes a sourced trend panel once Ohio PDFs are loaded.
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Executive Summary (auto)</div>
            <div style={{ lineHeight: 1.45 }}>
              Reallocating <b>{Math.round(shiftPct * 100)}%</b> from <b>Program A</b> to <b>Program B</b> increases retained placements by{" "}
              <b>{pct(retainedDelta / Math.max(sim.base.retained, 1))}</b>, increases modeled 12-month wage impact by{" "}
              <b>{pct(wageDelta / Math.max(sim.base.wageImpact, 1))}</b>, and improves modeled recidivism reduction by{" "}
              <b>{pct(recidDelta)}</b>.
            </div>
          </div>

          {/* Methodology tab content */}
          {tab === "methodology" ? (
            <div style={card}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Methodology</div>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "rgba(232,238,252,0.85)",
                }}
              >
                {methodologyText}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const tabBtn = (active) => ({
  background: active ? "rgba(255,255,255,0.12)" : "transparent",
  color: "#e8eefc",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 8,
  padding: "8px 10px",
  fontWeight: 800,
  cursor: "pointer",
});

const btn = (secondary) => ({
  background: secondary ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.10)",
  color: "#e8eefc",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 750,
  cursor: "pointer",
});

function NavItem({ label }) {
  return (
    <div
      style={{
        padding: "10px 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 8,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {label}
    </div>
  );
}

function Metric({ title, value, sub }) {
  return (
    <div style={card}>
      <div style={subtle}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>{value}</div>
      {sub ? <div style={{ ...subtle, marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

function Row({ label, value, delta }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div style={subtle}>{label}</div>
      <div style={{ fontWeight: 800 }}>
        {value}{" "}
        {Number.isFinite(delta) && delta !== 0 ? (
          <span style={{ ...subtle, marginLeft: 8 }}>
            ({delta > 0 ? "+" : ""}
            {delta})
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MiniTrend() {
  return (
    <svg
      viewBox="0 0 420 220"
      width="100%"
      height="220"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <g stroke="rgba(255,255,255,0.10)">
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={20} y1={20 + i * 35} x2={400} y2={20 + i * 35} />
        ))}
      </g>
      <path
        d="M20,60 C90,40 120,110 180,95 C240,80 270,140 330,120 C360,110 380,135 400,130"
        fill="none"
        stroke="rgba(120,170,255,0.95)"
        strokeWidth="3"
      />
      <path
        d="M20,120 C90,130 120,150 180,160 C240,170 270,175 330,180 C360,184 380,186 400,188"
        fill="none"
        stroke="rgba(255,160,120,0.95)"
        strokeWidth="3"
      />
      <text x="20" y="210" fill="rgba(232,238,252,0.60)" fontSize="12">
        Jan
      </text>
      <text x="120" y="210" fill="rgba(232,238,252,0.60)" fontSize="12">
        Apr
      </text>
      <text x="220" y="210" fill="rgba(232,238,252,0.60)" fontSize="12">
        Jul
      </text>
      <text x="320" y="210" fill="rgba(232,238,252,0.60)" fontSize="12">
        Oct
      </text>
    </svg>
  );
}