// src/pages/civic/TreasurySim.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import { logWallet } from "@/shared/rewards/history.js"; // ⬅️ NEW
import PortfolioHint from "@/components/civic/PortfolioHint.jsx"; // ⬅️ NEW
import MissionLogButtons from "@/components/civic/MissionLogButtons.jsx";

/* ---------------- Shared keys (match Snapshots page) ---------------- */
const KEY_STATE = "civic:treasury:state"; // live sim state mirror
const KEY_SNAPS = "civic:treasury:snapshots"; // saved snapshots list
const KPI_TSIMS = "civic:kpi:treasurySims"; // KPI counter

/* ---------------- Small utils ---------------- */
function readJSON(k, d) {
  try {
    return JSON.parse(
      localStorage.getItem(k) || JSON.stringify(d)
    );
  } catch {
    return d;
  }
}
function saveJSON(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function bumpKPI(key, delta = 1) {
  try {
    const n = Math.max(
      0,
      (Number(localStorage.getItem(key)) || 0) +
        Number(delta || 0)
    );
    localStorage.setItem(key, String(n));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: String(n),
      })
    );
  } catch {}
}
function uid(prefix = "snap") {
  return (
    `${prefix}_` +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  );
}

/* ---------------- Helpers to embed in the sim ---------------- */
/** Mirror current sim state to localStorage so other pages (Snapshots) can see it. */
function useTreasuryStateSync(stateObj) {
  const stateStr = JSON.stringify(stateObj ?? {});
  React.useEffect(() => {
    try {
      localStorage.setItem(KEY_STATE, stateStr);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: KEY_STATE,
          newValue: "updated",
        })
      );
    } catch {}
  }, [stateStr]);
}

/** Save-in-sim helper: persists a snapshot, bumps KPI, logs wallet history, and toasts. */
function useSaveSnapshotInSim() {
  const { toast } = useToasts();
  return React.useCallback(
    ({ name = "Snapshot", note = "" } = {}) => {
      const curr = readJSON(KEY_STATE, null);
      if (!curr) {
        toast(
          "No current treasury state found. Make some changes first.",
          { type: "warning" }
        );
        return;
      }
      const entry = {
        id: uid(),
        name,
        note,
        state: curr,
        at: Date.now(),
      };
      const next = [entry, ...readJSON(KEY_SNAPS, [])];
      saveJSON(KEY_SNAPS, next);

      // KPI + wallet history (capped via logWallet)
      bumpKPI(KPI_TSIMS, +1);
      logWallet({
        note: `Saved Treasury snapshot: ${entry.name}`,
        delta: 0,
      });

      try {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: KEY_SNAPS,
            newValue: "updated",
          })
        );
      } catch {}
      toast("Snapshot saved! (Treasury Sims KPI +1)", {
        type: "success",
      });
    },
    [toast]
  );
}

/* ---------------- Page ---------------- */
export default function TreasurySim() {
  const { toast } = useToasts();

  // Demo state — adapt to your real logic
  const [cap, setCap] = React.useState(100);
  const [lines, setLines] = React.useState([
    { id: "education", label: "Education", val: 20 },
    { id: "health", label: "Health", val: 20 },
    { id: "safety", label: "Public Safety", val: 20 },
    { id: "housing", label: "Housing", val: 20 },
    { id: "jobs", label: "Jobs & Growth", val: 20 },
  ]);

  const total = lines.reduce(
    (s, l) => s + (Number(l.val) || 0),
    0
  );
  const balance = cap - total;
  const remaining = Math.max(0, balance);

  // Clamp + set a line
  const setLine = (id, v) => {
    const num = Math.max(
      0,
      Math.min(cap, Number(v) || 0)
    );
    setLines((ls) =>
      ls.map((l) => (l.id === id ? { ...l, val: num } : l))
    );
  };

  // Build a normalized state shape that Snapshots page can preview nicely
  const liveState = React.useMemo(
    () => ({
      totalBudget: cap,
      revenue: cap,
      expense: total,
      balance,
      allocations: lines.map(({ id, label, val }) => ({
        id,
        label,
        value: Number(val) || 0,
      })),
    }),
    [cap, total, balance, lines]
  );

  // Keep KEY_STATE mirrored as the user interacts
  useTreasuryStateSync(liveState);

  // Save-in-sim action for the header/button
  const saveSnapshotInSim = useSaveSnapshotInSim();

  return (
    <section
      className="crb-main"
      aria-labelledby="ts-title"
    >
      <header className="db-head">
        <div>
          <h1 id="ts-title" className="db-title">
            Treasury Simulator
          </h1>
          <p className="db-subtitle">
            Adjust allocations, watch your balance, and save
            snapshots.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            className="sh-btn"
            onClick={() =>
              saveSnapshotInSim({
                name: `Scenario (cap ${cap})`,
                note: `${lines.length} programs`,
              })
            }
          >
            Save Snapshot
          </button>
          <a
            className="sh-btn is-ghost"
            href="/civic.html#/snapshots"
            aria-label="Open snapshots"
          >
            Open Snapshots →
          </a>
          <RewardsChip />
        </div>
      </header>

      <div
        className="db-grid"
        style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}
      >
        <article
          className="card card--pad"
          aria-label="Totals"
        >
          <strong>Total Cap</strong>
          <input
            type="range"
            min={50}
            max={200}
            value={cap}
            onChange={(e) =>
              setCap(Number(e.target.value))
            }
            style={{ width: "100%", marginTop: 8 }}
          />
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <span className="sh-badge">Cap: {cap}</span>
            <span className="sh-badge is-ghost">
              Allocated: {total}
            </span>
            <span
              className="sh-badge"
              style={{
                background: remaining
                  ? "#ecfeff"
                  : "#f0fdf4",
              }}
            >
              Remaining: {remaining}
            </span>
          </div>
        </article>

        <article
          className="card card--pad"
          aria-label="Programs"
        >
          <strong>Programs</strong>
          <div
            style={{ display: "grid", gap: 12, marginTop: 8 }}
          >
            {lines.map((l) => (
              <div key={l.id}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span style={{ width: 160 }}>
                    {l.label}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={cap}
                    value={l.val}
                    onChange={(e) =>
                      setLine(l.id, e.target.value)
                    }
                    style={{ flex: 1 }}
                    aria-label={`Adjust ${l.label}`}
                  />
                  <code
                    style={{
                      width: 64,
                      textAlign: "right",
                    }}
                  >
                    {l.val}
                  </code>
                </div>
                {/* tiny bar */}
                <div
                  style={{
                    height: 6,
                    background: "#eef2ff",
                    borderRadius: 999,
                    marginTop: 6,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: `${Math.min(
                        100,
                        (Number(l.val || 0) /
                          Math.max(1, cap)) *
                          100
                      )}%`,
                      background:
                        "var(--brand,#2563eb)",
                      opacity: 0.35,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              className="sh-btn"
              onClick={() =>
                saveSnapshotInSim({
                  name: `Scenario (cap ${cap})`,
                  note: `balance=${balance}`,
                })
              }
            >
              Save scenario
            </button>
            <a
              className="sh-btn is-ghost"
              href="/civic.html#/snapshots"
            >
              Open snapshots →
            </a>
            {balance < 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "var(--danger,#b91c1c)",
                }}
              >
                Warning: Over-allocated by{" "}
                {Math.abs(balance)}.
              </span>
            )}
          </div>
        </article>
      </div>

      {/* ---------- Results & Next (hint lives here) ---------- */}
      <section
        className="card card--pad"
        style={{ marginTop: 12 }}
      >
        <strong>Results & Next</strong>
        <ul style={{ marginTop: 8 }}>
          <li>
            Save a snapshot whenever you reach a scenario
            worth comparing.
          </li>
          <li>
            Open{" "}
            <a href="/civic.html#/snapshots">
              Snapshots
            </a>{" "}
            to review, compare, and share.
          </li>
        </ul>

        {/* ⬇️ The hint you asked for (placed after the sim results block) */}
        <PortfolioHint note="From your Treasury result, save a snapshot to your Portfolio." />
      </section>

      {/* 🔹 Mission logging → CTE + Workforce + ESSA evidence */}
      <section
        className="card card--pad"
        style={{ marginTop: 12 }}
      >
        <strong style={{ fontSize: 15 }}>
          Log this Treasury mission
        </strong>
        <p
          style={{
            marginTop: 4,
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          When you finish a scenario, log it so it counts
          toward Perkins / WIOA / ESSA stories.
        </p>
        <MissionLogButtons
          missionId="treasury-sim-mission"
          missionTitle="Treasury Simulation Mission"
          chapter="Budget & Trade-Offs"
          defaultDuration={45}
          defaultSummary=""
          defaultOutcome=""
          fundingStreams={["perkins", "wioa", "essa"]}
        />
      </section>
    </section>
  );
}
