// src/pages/civic/Elections.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToasts } from "@/context/Toasts.jsx";
import { useRewards } from "@/hooks/useRewards.js";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import MissionLogButtons from "@/components/civic/MissionLogButtons.jsx";

/* ---------------- Mock ballot data (single-choice races) ---------------- */
const BALLOT = [
  {
    id: "race-mayor",
    title: "Mayor",
    instructions: "Select one (1).",
    candidates: [
      {
        id: "c1",
        name: "Alex Carter",
        party: "Unity",
        bio: "Former council member, urban renewal plan.",
      },
      {
        id: "c2",
        name: "Jordan Reyes",
        party: "Forward",
        bio: "Education advocate, transit upgrades.",
      },
      {
        id: "c3",
        name: "Taylor Kim",
        party: "Civic",
        bio: "Small business owner, safety-first.",
      },
    ],
  },
  {
    id: "race-treasurer",
    title: "City Treasurer",
    instructions: "Select one (1).",
    candidates: [
      {
        id: "t1",
        name: "Morgan Singh",
        party: "Civic",
        bio: "CPA, transparency platform.",
      },
      {
        id: "t2",
        name: "Riley Brooks",
        party: "Forward",
        bio: "Fintech background, open data.",
      },
    ],
  },
];

/* ---------------- Storage + KPI keys ---------------- */
const KEY_VOTES = "civic:votes"; // array of {at, ballotId, selections}
const KEY_VOTE_FLAG = "civic:flag:practiceVote"; // "1" after first cast (legacy flag if needed)
const KPI_VOTES = "civic:kpi:votesCast"; // optional KPI counter
const KEY_ATTEST = "civic:attestations"; // JSON[ {eventType, lessonId, timestamp} ]
const KEY_WALLET_LOG = "wallet:history"; // JSON log of point changes

/* ---------------- Tiny helpers ---------------- */
function getVotes() {
  try {
    const raw = localStorage.getItem(KEY_VOTES);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function setVotes(arr) {
  try {
    localStorage.setItem(KEY_VOTES, JSON.stringify(arr));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: KEY_VOTES,
        newValue: "updated",
      })
    );
  } catch {}
}
function bump(key, delta = 1) {
  try {
    const v =
      Number(localStorage.getItem(key) || "0") +
      Number(delta || 0);
    const n = Math.max(0, v);
    localStorage.setItem(key, String(n));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: String(n),
      })
    );
  } catch {}
}
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

/* Mark micro-lesson complete (id aligns with your micro-lessons JSON) */
function addAttestation(lessonId) {
  const arr = readJSON(KEY_ATTEST, []);
  if (
    !arr.some(
      (a) =>
        a.eventType === "micro-lesson-complete" &&
        a.lessonId === lessonId
    )
  ) {
    arr.push({
      eventType: "micro-lesson-complete",
      lessonId,
      timestamp: Date.now(),
    });
    saveJSON(KEY_ATTEST, arr);
    try {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: KEY_ATTEST,
          newValue: "updated",
        })
      );
    } catch {}
    // Bump the KPIs that your Northstar reads for completions
    bump("ns:kpi:microLessonsCompleted", +1);
    bump("civic:kpi:microDone", +1);
  }
}

/* ---------------- UI bits ---------------- */
function RaceCard({ race, value, onChange }) {
  return (
    <section
      className="card card--pad"
      role="group"
      aria-labelledby={`${race.id}-label`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <h3
          id={`${race.id}-label`}
          style={{ margin: 0 }}
        >
          {race.title}
        </h3>
        <span
          style={{ fontSize: 12, opacity: 0.7 }}
        >
          {race.instructions}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gap: 8,
          marginTop: 8,
        }}
      >
        {race.candidates.map((c) => (
          <label
            key={c.id}
            className="sh-card-radio"
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name={race.id}
              value={c.id}
              checked={value === c.id}
              onChange={() => onChange(race.id, c.id)}
              style={{ marginTop: 4 }}
            />
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                }}
              >
                <strong>{c.name}</strong>
                <span className="sh-badge is-ghost">
                  {c.party}
                </span>
              </div>
              {c.bio && (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                    marginTop: 2,
                  }}
                >
                  {c.bio}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
export default function Elections() {
  const nav = useNavigate();
  const { toast } = useToasts();
  const {
    addPoints,
    addBadge,
    badges = [],
  } =
    typeof useRewards === "function"
      ? useRewards()
      : {
          addPoints: () => {},
          addBadge: () => {},
          badges: [],
        };

  const [selections, setSelections] =
    React.useState(() => ({}));
  const [saving, setSaving] = React.useState(false);

  const allSelected = BALLOT.every(
    (r) => selections[r.id]
  );

  const onPick = (raceId, candId) => {
    setSelections((s) => ({
      ...s,
      [raceId]: candId,
    }));
  };

  const castVote = () => {
    if (!allSelected || saving) return;
    setSaving(true);
    try {
      const record = {
        at: Date.now(),
        ballotId: "demo-local-001",
        selections, // { raceId: candidateId }
      };
      const arr = getVotes();
      arr.push(record);
      setVotes(arr);

      // Legacy flag if other code watches it
      try {
        localStorage.setItem(KEY_VOTE_FLAG, "1");
      } catch {}

      // KPI bump specific to votes
      bump(KPI_VOTES, 1);

      // 🎯 Micro-lesson attestation + rewards (+ wallet history)
      addAttestation("elections-howto"); // id should match your micro-lesson id
      try {
        addPoints?.(10);
      } catch {}
      if (!(badges || []).includes("micro:elections-howto")) {
        try {
          addBadge?.("micro:elections-howto");
        } catch {}
      }
      try {
        const log = readJSON(KEY_WALLET_LOG, []);
        log.push({
          at: Date.now(),
          delta: +10,
          note: "Practice ballot cast",
        });
        saveJSON(KEY_WALLET_LOG, log);
      } catch {}

      toast(
        "🗳️ Vote recorded! +10 pts · ‘Practice Voting’ completed ✅",
        { type: "success" }
      );
      nav("/dashboard-ns", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="crb-main"
      aria-labelledby="elex-title"
    >
      <header className="db-head">
        <div>
          <h1 id="elex-title" className="db-title">
            Elections (Practice)
          </h1>
          <p className="db-subtitle">
            Cast a practice ballot. Your selection is stored
            locally for learning analytics.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Link
            className="sh-btn is-ghost"
            to="/proposals"
          >
            View Proposals
          </Link>
          <Link
            className="sh-btn is-ghost"
            to="/dashboard-ns"
          >
            Northstar
          </Link>
          <RewardsChip />
        </div>
      </header>

      <div
        className="db-grid"
        style={{ gridTemplateColumns: "1fr", rowGap: 12 }}
      >
        {BALLOT.map((r) => (
          <RaceCard
            key={r.id}
            race={r}
            value={selections[r.id]}
            onChange={onPick}
          />
        ))}

        <section
          className="card card--pad"
          aria-label="Submit"
        >
          <div
            style={{ display: "flex", gap: 8 }}
          >
            <button
              className="sh-btn"
              disabled={!allSelected || saving}
              onClick={castVote}
            >
              {saving ? "Submitting…" : "Cast Vote"}
            </button>
            <Link
              className="sh-btn is-ghost"
              to="/dashboard"
            >
              Cancel
            </Link>
            {!allSelected && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                Select one candidate in each race to enable
                voting.
              </span>
            )}
          </div>
        </section>

        <aside
          className="card card--pad"
          aria-label="Your Last Votes"
        >
          <strong
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            Recent Practice Votes
          </strong>
          <VoteLog />
        </aside>
      </div>

      {/* 🔹 Mission logging → ESSA + Civics evidence */}
      <section
        className="card card--pad"
        style={{ marginTop: 16 }}
      >
        <strong style={{ fontSize: 15 }}>
          Log this Elections mission
        </strong>
        <p
          style={{
            marginTop: 4,
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          After casting a practice ballot, log your mission
          so it shows up in the ESSA / Civics grant story.
        </p>
        <MissionLogButtons
          missionId="elections-mission"
          missionTitle="Elections Strategy Mission"
          chapter="Democracy & Representation"
          defaultDuration={30}
          defaultSummary=""
          defaultOutcome=""
          fundingStreams={["essa", "civics"]}
        />
      </section>
    </section>
  );
}

/* ---------------- Small log viewer ---------------- */
function VoteLog() {
  const [rows, setRows] = React.useState(
    getVotes().slice().reverse()
  );

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key == null) {
        setRows(getVotes().slice().reverse());
        return;
      }
      if (e.key === KEY_VOTES)
        setRows(getVotes().slice().reverse());
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(
      () => setRows(getVotes().slice().reverse()),
      1500
    );
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  if (!rows.length)
    return (
      <div
        style={{ opacity: 0.7, fontSize: 13 }}
      >
        No votes yet.
      </div>
    );

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "grid",
        gap: 8,
      }}
    >
      {rows.slice(0, 6).map((r, i) => (
        <li
          key={i}
          style={{
            border:
              "1px solid var(--ring,#eee)",
            borderRadius: 10,
            padding: "8px 10px",
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            {new Date(r.at).toLocaleString()}
          </div>
          <div
            style={{
              display: "grid",
              gap: 4,
              marginTop: 6,
            }}
          >
            {Object.entries(r.selections).map(
              ([raceId, candId]) => (
                <div
                  key={raceId}
                  style={{ fontSize: 13 }}
                >
                  <strong>
                    {labelForRace(raceId)}:
                  </strong>{" "}
                  {labelForCandidate(raceId, candId)}
                </div>
              )
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Label helpers (from BALLOT) ---------------- */
function labelForRace(raceId) {
  const race = BALLOT.find((r) => r.id === raceId);
  return race ? race.title : raceId;
}
function labelForCandidate(raceId, candId) {
  const race = BALLOT.find((r) => r.id === raceId);
  const cand = race?.candidates.find(
    (c) => c.id === candId
  );
  return cand
    ? `${cand.name} (${cand.party})`
    : candId;
}
