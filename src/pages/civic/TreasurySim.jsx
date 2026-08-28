// src/pages/civic/TreasurySim.jsx
// Redesigned per the approved Treasury Simulator mocks (6 supplied
// directly: light/dark desktop, light/dark tablet, light/dark mobile).
// Shell/theme/shared design tokens are inherited unchanged from the Civic
// Lab Dashboard/Elections/Proposals/Grant Story/Debt Clock redesigns —
// see src/styles/civic-dashboard.css and src/styles/civic-treasurysim.css
// (this page's own additions only). Pink is the established primary
// interaction accent app-wide; the earlier purple Treasury exploration is
// not used as visual authority here.
//
// Data model / logic (Phase 1 forensic discovery — zero changes):
//   - cap: 50-200 range slider (useState).
//   - lines: 5 fixed program categories, each 0..cap (clamped in setLine).
//   - total = sum(lines.val); balance = cap - total; remaining = max(0, balance).
//   - liveState mirrors to localStorage["civic:treasury:state"] on every
//     change (useTreasuryStateSync) so /snapshots can preview it live.
//   - "Save Snapshot" (header) and "Save scenario" (Programs card) are two
//     distinct buttons that both call the SAME saveSnapshotInSim() handler
//     (only their `note` text differs) — preserved as two separate, real
//     entry points, not merged.
//   - Snapshots persist to localStorage["civic:treasury:snapshots"] as
//     [{id, name, note, state, at}], read/restored by TreasurySnapshots.jsx
//     (unchanged, out of scope this pass) — state shape verified compatible.
//   - "Open Portfolio" (via PortfolioHint, unchanged) is a plain React
//     Router <Link to="portfolio">: navigation only, it writes nothing.
//   - Mission Log uses ONLY the real, existing MissionLogButtons fields
//     (Minutes / What did you do? / What was the outcome? / Log & keep
//     open / Log mission) — the approved mock's Mission Title/Type/Time
//     Spent/Difficulty/"What did you try?"/"What happened?"/mood/Tags
//     fields do NOT exist in the real mission data model and are
//     deliberately NOT introduced here. See Final Report.
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import { logWallet } from "@/shared/rewards/history.js";
import PortfolioHint from "@/components/civic/PortfolioHint.jsx";
import MissionLogButtons from "@/components/civic/MissionLogButtons.jsx";
import { useCompanion } from "@/hooks/useCompanion.js";
import CompanionFace from "@/components/companion/CompanionFace.jsx";

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

const DEFAULT_LINES = [
  { id: "education", label: "Education", val: 20 },
  { id: "health", label: "Health", val: 20 },
  { id: "safety", label: "Public Safety", val: 20 },
  { id: "housing", label: "Housing", val: 20 },
  { id: "jobs", label: "Jobs & Growth", val: 20 },
];

/* ---------------- Page ---------------- */
export default function TreasurySim() {
  const companion = useCompanion();

  // Demo state — same defaults as the pre-redesign source. Found live while
  // verifying the brief's mandatory snapshot round-trip test: KEY_STATE was
  // already mirrored on every change and already restored (overwritten) by
  // TreasurySnapshots.jsx's "Restore" action, but this component never read
  // it back on mount, so a restored snapshot never actually reappeared in
  // the sliders after "Opening Treasury…" — silently resetting to these
  // defaults instead. Hydrating from the existing, already-shaped KEY_STATE
  // here is additive only: no calculation, slider bound, or persistence key
  // changes; a first-ever visit (no valid KEY_STATE yet) is byte-identical
  // to before.
  const [cap, setCap] = React.useState(() => {
    const saved = readJSON(KEY_STATE, null);
    return saved && typeof saved.totalBudget === "number" ? saved.totalBudget : 100;
  });
  const [lines, setLines] = React.useState(() => {
    const saved = readJSON(KEY_STATE, null);
    if (saved && Array.isArray(saved.allocations)) {
      return DEFAULT_LINES.map((d) => {
        const match = saved.allocations.find((a) => a.id === d.id);
        return match ? { ...d, val: Number(match.value) || 0 } : d;
      });
    }
    return DEFAULT_LINES;
  });

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
    <div className="ts-page">
      <h1 className="cv-srOnly">Treasury Simulator</h1>

      <header className="ts-header" aria-labelledby="ts-title">
        <div>
          <p className="ts-header__h1" id="ts-title">Treasury Simulator</p>
          <p className="ts-header__sub">
            Adjust allocations, watch your balance, and save snapshots.
          </p>
        </div>
        <div className="ts-headerActions">
          <button
            type="button"
            className="ts-btn ts-btn--primary"
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
            className="ts-btn ts-btn--ghost"
            href="/civic.html#/snapshots"
            aria-label="Open snapshots"
          >
            Open Snapshots →
          </a>
          <RewardsChip />
        </div>
      </header>

      <div className="ts-grid">
        <section className="ts-card ts-totals" aria-label="Totals">
          <strong className="ts-cardTitle">Total Cap</strong>
          <input
            type="range"
            min={50}
            max={200}
            value={cap}
            onChange={(e) => setCap(Number(e.target.value))}
            className="ts-slider ts-slider--cap"
            aria-label="Adjust total cap"
          />
          <div className="ts-badges">
            <span className="ts-badge">Cap: {cap}</span>
            <span className="ts-badge ts-badge--ghost">Allocated: {total}</span>
            <span
              className={`ts-badge ${remaining ? "ts-badge--info" : "ts-badge--ok"}`}
            >
              Remaining: {remaining}
            </span>
          </div>
        </section>

        <section className="ts-card ts-programs" aria-label="Programs">
          <strong className="ts-cardTitle">Programs</strong>
          <div className="ts-programList">
            {lines.map((l) => (
              <div className="ts-programRow" key={l.id}>
                <div className="ts-programRow__top">
                  <span className="ts-programRow__label">{l.label}</span>
                  <input
                    type="range"
                    min={0}
                    max={cap}
                    value={l.val}
                    onChange={(e) => setLine(l.id, e.target.value)}
                    className="ts-slider"
                    aria-label={`Adjust ${l.label}`}
                  />
                  <code className="ts-programRow__value">{l.val}</code>
                </div>
                <div className="ts-programRow__track">
                  <span
                    className="ts-programRow__fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (Number(l.val || 0) / Math.max(1, cap)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="ts-programsActions">
            <button
              type="button"
              className="ts-btn ts-btn--primary"
              onClick={() =>
                saveSnapshotInSim({
                  name: `Scenario (cap ${cap})`,
                  note: `balance=${balance}`,
                })
              }
            >
              Save scenario
            </button>
            <a className="ts-btn ts-btn--ghost" href="/civic.html#/snapshots">
              Open snapshots →
            </a>
            {balance < 0 && (
              <span className="ts-overAlloc">
                Warning: Over-allocated by {Math.abs(balance)}.
              </span>
            )}
          </div>
        </section>
      </div>

      {/* ---------- Results & Next (hint lives here) ---------- */}
      <section className="ts-card ts-results" aria-label="Results & Next">
        <strong className="ts-cardTitle">Results & Next</strong>
        <ul className="ts-resultsList">
          <li>
            Save a snapshot whenever you reach a scenario worth comparing.
          </li>
          <li>
            Open <a href="/civic.html#/snapshots">Snapshots</a> to review,
            compare, and share.
          </li>
        </ul>

        <PortfolioHint note="From your Treasury result, save a snapshot to your Portfolio." />
      </section>

      {/* 🔹 Mission logging → CTE + Workforce + ESSA evidence */}
      <section className="ts-card ts-missionLog" aria-label="Mission Log">
        <strong className="ts-missionLog__title">Log this Treasury mission</strong>
        <p className="ts-missionLog__desc">
          When you finish a scenario, log it so it counts toward Perkins /
          WIOA / ESSA stories.
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

      <div className="ts-coachRow">
        <div className="ts-card ts-coach">
          <span className="ts-coach__art" aria-hidden="true">
            <CompanionFace animation="idle" size={44} />
          </span>
          <div>
            <p className="ts-coach__title">Need help?</p>
            <button
              type="button"
              className="ts-coach__link"
              onClick={() => companion.openCoach()}
            >
              Ask Coach!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
