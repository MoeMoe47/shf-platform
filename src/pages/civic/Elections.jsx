// src/pages/civic/Elections.jsx
// Redesigned per the approved Elections mock (light + dark, supplied
// directly during this task). Shell/theme/shared design tokens are
// inherited unchanged from the Civic Lab Dashboard redesign — see
// src/styles/civic-dashboard.css and src/styles/civic-elections.css (this
// page's own additions only). All practice-voting, mission-logging, and
// Grant Story behavior below is functionally identical to the pre-redesign
// page; only presentation changed, plus one new UI-only state (the
// Review Ballot step) that does not alter what castVote() actually does.
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToasts } from "@/context/Toasts.jsx";
import { useRewards } from "@/hooks/useRewards.js";
import { useCompanion } from "@/hooks/useCompanion.js";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import MissionLogButtons from "@/components/civic/MissionLogButtons.jsx";
import CompanionFace from "@/components/companion/CompanionFace.jsx";

/* ---------------- Mock ballot data (single-choice races) ----------------
   Candidate names/parties/ids are unchanged from the existing data. Bio
   copy is updated to the approved mock's exact wording — a prose
   rewording of the same underlying facts (still "former council member" +
   "renewal", not a new policy claim), not an invented position. Topic tags
   are the mock's own explicit tag pairs, derived from each bio. */
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
        bio: "Former council member focused on smart growth and neighborhood renewal.",
        tags: ["Urban Renewal", "Infrastructure"],
      },
      {
        id: "c2",
        name: "Jordan Reyes",
        party: "Forward",
        bio: "Education advocate committed to stronger schools and transit.",
        tags: ["Education", "Transit"],
      },
      {
        id: "c3",
        name: "Taylor Kim",
        party: "Civic",
        bio: "Small business owner prioritizing public safety and local jobs.",
        tags: ["Public Safety", "Jobs"],
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
        bio: "CPA and transparency advocate building a clearer public budget.",
        tags: ["Transparency", "Fiscal Reform"],
      },
      {
        id: "t2",
        name: "Riley Brooks",
        party: "Forward",
        bio: "Fintech background pushing open data and modern systems.",
        tags: ["Open Data", "Technology"],
      },
    ],
  },
];

// One consistent accent per party, applied evenly to every candidate in
// that party — a fixed lookup, not a per-candidate/per-race choice, so no
// party is visually favored over another (Phase 18: political neutrality).
const PARTY_ACCENT = {
  Unity: "pink",
  Forward: "purple",
  Civic: "gold",
};

/* ---------------- Storage + KPI keys (unchanged) ---------------- */
const KEY_VOTES = "civic:votes"; // array of {at, ballotId, selections}
const KEY_VOTE_FLAG = "civic:flag:practiceVote";
const KPI_VOTES = "civic:kpi:votesCast";
const KEY_ATTEST = "civic:attestations";
const KEY_WALLET_LOG = "wallet:history";

/* ---------------- Tiny helpers (unchanged) ---------------- */
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
    window.dispatchEvent(new StorageEvent("storage", { key: KEY_VOTES, newValue: "updated" }));
  } catch {}
}
function bump(key, delta = 1) {
  try {
    const v = Number(localStorage.getItem(key) || "0") + Number(delta || 0);
    const n = Math.max(0, v);
    localStorage.setItem(key, String(n));
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: String(n) }));
  } catch {}
}
function readJSON(k, d) {
  try {
    return JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
  } catch {
    return d;
  }
}
function saveJSON(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function addAttestation(lessonId) {
  const arr = readJSON(KEY_ATTEST, []);
  if (!arr.some((a) => a.eventType === "micro-lesson-complete" && a.lessonId === lessonId)) {
    arr.push({ eventType: "micro-lesson-complete", lessonId, timestamp: Date.now() });
    saveJSON(KEY_ATTEST, arr);
    try {
      window.dispatchEvent(new StorageEvent("storage", { key: KEY_ATTEST, newValue: "updated" }));
    } catch {}
    bump("ns:kpi:microLessonsCompleted", +1);
    bump("civic:kpi:microDone", +1);
  }
}

function initials(name) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/* ---------------- Progress steps ---------------- */
const STEPS = [
  { n: 1, title: "Review Candidates", sub: "Read about the races" },
  { n: 2, title: "Make Your Selection", sub: "Choose one candidate per race" },
  { n: 3, title: "Cast Your Ballot", sub: "Submit your practice vote" },
  { n: 4, title: "Reflect & Log", sub: "Explain your choices" },
];

function currentStep(selections, reviewing) {
  const count = Object.keys(selections).length;
  if (reviewing) return 4;
  if (count === 0) return 1;
  if (count < BALLOT.length) return 2;
  return 3;
}

function ProgressSteps({ active }) {
  return (
    <nav className="elex-card elex-steps" aria-label="Election progress">
      <ol>
        {STEPS.map((s) => (
          <li key={s.n} className={s.n === active ? "is-active" : ""} aria-current={s.n === active ? "step" : undefined}>
            <span className="elex-steps__badge" aria-hidden="true">{s.n}</span>
            <span className="elex-steps__text">
              <span className="elex-steps__title">{s.title}</span>
              <span className="elex-steps__sub">{s.sub}</span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------------- Candidate card ---------------- */
function CandidateCard({ race, candidate, selected, onChange }) {
  const accent = PARTY_ACCENT[candidate.party] || "gold";
  return (
    <label className={`elex-candidate elex-candidate--${accent}${selected ? " is-selected" : ""}`}>
      <input
        type="radio"
        name={race.id}
        value={candidate.id}
        checked={selected}
        onChange={() => onChange(race.id, candidate.id)}
        className="elex-candidate__radio"
        aria-describedby={`${candidate.id}-bio`}
      />
      <span className="elex-candidate__avatar" aria-hidden="true">{initials(candidate.name)}</span>
      <span className="elex-candidate__name">{candidate.name}</span>
      <span className="elex-candidate__party">{candidate.party} Party</span>
      <span className="elex-candidate__bio" id={`${candidate.id}-bio`}>{candidate.bio}</span>
      {candidate.tags?.length > 0 && (
        <span className="elex-candidate__tags">
          {candidate.tags.map((t) => (
            <span key={t} className="elex-candidate__tag">{t}</span>
          ))}
        </span>
      )}
    </label>
  );
}

function RaceBallot({ race, value, onChange, columns }) {
  return (
    <fieldset className="elex-card elex-race">
      <legend className="elex-race__legend">
        <span className="elex-race__icon" aria-hidden="true">{race.id === "race-mayor" ? "🏛️" : "🏦"}</span>
        <span className="elex-race__title">{race.title}</span>
        <span className="elex-race__instructions">{race.instructions}</span>
      </legend>
      <div className={`elex-candidateGrid elex-candidateGrid--${columns}`}>
        {race.candidates.map((c) => (
          <CandidateCard key={c.id} race={race} candidate={c} selected={value === c.id} onChange={onChange} />
        ))}
      </div>
    </fieldset>
  );
}

/* ---------------- Page ---------------- */
export default function Elections() {
  const nav = useNavigate();
  const { toast } = useToasts();
  const companion = useCompanion();
  const { addPoints, addBadge, badges = [] } =
    typeof useRewards === "function" ? useRewards() : { addPoints: () => {}, addBadge: () => {}, badges: [] };

  const [selections, setSelections] = React.useState(() => ({}));
  const [saving, setSaving] = React.useState(false);
  const [reviewing, setReviewing] = React.useState(false);

  const allSelected = BALLOT.every((r) => selections[r.id]);
  const step = currentStep(selections, reviewing);

  const onPick = (raceId, candId) => {
    setSelections((s) => ({ ...s, [raceId]: candId }));
    setReviewing(false);
  };

  const castVote = () => {
    if (!allSelected || saving) return;
    setSaving(true);
    try {
      const record = { at: Date.now(), ballotId: "demo-local-001", selections };
      const arr = getVotes();
      arr.push(record);
      setVotes(arr);

      try {
        localStorage.setItem(KEY_VOTE_FLAG, "1");
      } catch {}

      bump(KPI_VOTES, 1);

      addAttestation("elections-howto");
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
        log.push({ at: Date.now(), delta: +10, note: "Practice ballot cast" });
        saveJSON(KEY_WALLET_LOG, log);
      } catch {}

      toast("🗳️ Vote recorded! +10 pts · 'Practice Voting' completed ✅", { type: "success" });
      nav("/dashboard-ns", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const mayorPick = BALLOT[0].candidates.find((c) => c.id === selections["race-mayor"]);
  const treasurerPick = BALLOT[1].candidates.find((c) => c.id === selections["race-treasurer"]);

  return (
    <div className="elex-page">
      <h1 className="cv-srOnly">Practice Election</h1>

      {/* Page Header */}
      <header className="elex-header" aria-labelledby="elex-title">
        <div className="elex-header__title">
          <span className="elex-header__icon" aria-hidden="true">📋</span>
          <div>
            <p className="elex-header__h1" id="elex-title">Practice Election</p>
            <p className="elex-header__sub">
              Cast a practice ballot. Your selection is stored locally for learning analytics and reflection.
            </p>
          </div>
        </div>
        <div className="elex-header__actions">
          <Link className="cv-btn cv-btn--ghost" to="/proposals">
            <span aria-hidden="true">📄</span> View Proposals
          </Link>
          <Link className="cv-btn cv-btn--ghost" to="/dashboard-ns">
            <span aria-hidden="true">⭐</span> Northstar Dashboard
          </Link>
          <RewardsChip />
        </div>
      </header>

      <ProgressSteps active={step} />

      <div className="elex-layout">
        <div className="elex-main">
          {!reviewing ? (
            <>
              <RaceBallot race={BALLOT[0]} value={selections["race-mayor"]} onChange={onPick} columns={3} />
              <RaceBallot race={BALLOT[1]} value={selections["race-treasurer"]} onChange={onPick} columns={2} />

              <section className="elex-card elex-actions" aria-label="Ballot actions">
                <div className="elex-actions__row">
                  <Link className="cv-btn cv-btn--ghost" to="/dashboard">
                    <span aria-hidden="true">✕</span> Cancel
                  </Link>
                  <button
                    type="button"
                    className="cv-btn elex-btn--primary"
                    disabled={!allSelected}
                    onClick={() => setReviewing(true)}
                  >
                    Review Ballot <span aria-hidden="true">→</span>
                  </button>
                </div>
                {!allSelected && (
                  <p className="elex-actions__hint" role="status">
                    Select one candidate in each race to continue.
                  </p>
                )}
              </section>
            </>
          ) : (
            <section className="elex-card elex-review" aria-labelledby="elex-review-title">
              <h2 className="elex-review__title" id="elex-review-title">Confirm your practice ballot</h2>
              <p className="elex-review__sub">Review your selections before casting your practice vote.</p>
              <dl className="elex-review__list">
                <div className="elex-review__row">
                  <dt>Mayor</dt>
                  <dd>{mayorPick?.name} <span className="elex-review__party">({mayorPick?.party} Party)</span></dd>
                </div>
                <div className="elex-review__row">
                  <dt>City Treasurer</dt>
                  <dd>{treasurerPick?.name} <span className="elex-review__party">({treasurerPick?.party} Party)</span></dd>
                </div>
              </dl>
              <div className="elex-actions__row">
                <button type="button" className="cv-btn cv-btn--ghost" onClick={() => setReviewing(false)} disabled={saving}>
                  <span aria-hidden="true">←</span> Back to edit
                </button>
                <button type="button" className="cv-btn elex-btn--primary" onClick={castVote} disabled={saving}>
                  {saving ? "Submitting…" : "Cast Practice Vote"}
                </button>
              </div>
            </section>
          )}

          <p className="elex-disclaimer">
            <span aria-hidden="true">🔒</span> This is a practice election. No official votes are recorded.
          </p>
        </div>

        <aside className="elex-side">
          <section className="elex-missionLog" aria-label="Your Mission Log">
            <MissionLogButtons
              missionId="elections-mission"
              missionTitle="Elections Strategy Mission"
              chapter="Democracy & Representation"
              defaultDuration={30}
              defaultSummary=""
              defaultOutcome=""
              fundingStreams={["essa", "civics"]}
              icon="🚩"
              title="Your Mission Log"
              description="After casting a practice ballot, log your mission so it counts toward the Civic Grant Story."
              placeholderSummary="e.g., Compared candidates and cast my practice vote."
              placeholderOutcome="e.g., Selected candidates and explained my reasoning."
            />
          </section>

          <section className="elex-card elex-history" aria-label="Recent Practice Votes">
            <div className="elex-history__head">
              <strong><span aria-hidden="true">🕐</span> Recent Practice Votes</strong>
              <Link className="cv-viewAll" to="/dashboard-ns">View all →</Link>
            </div>
            <VoteLog />
          </section>

          <section className="elex-card elex-coach" aria-labelledby="elex-coach-title">
            <div className="elex-coach__text">
              <h2 className="elex-coach__title" id="elex-coach-title">Need help deciding?</h2>
              <p className="elex-coach__body">
                Ask Coach for guidance on civic processes, candidate research, or trade-offs.
              </p>
              <button type="button" className="cv-btn elex-btn--primary" onClick={() => companion.openCoach()}>
                Ask Coach!
              </button>
            </div>
            <div className="elex-coach__art" aria-hidden="true">
              <CompanionFace animation="wave" size={100} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Small log viewer ---------------- */
function VoteLog() {
  const [rows, setRows] = React.useState(getVotes().slice().reverse());

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key == null) {
        setRows(getVotes().slice().reverse());
        return;
      }
      if (e.key === KEY_VOTES) setRows(getVotes().slice().reverse());
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => setRows(getVotes().slice().reverse()), 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  if (!rows.length) return <p className="elex-history__empty">No practice votes yet.</p>;

  return (
    <ul className="elex-history__list">
      {rows.slice(0, 6).map((r, i) => (
        <li key={i} className="elex-history__row">
          <div className="elex-history__when">{new Date(r.at).toLocaleString()}</div>
          <div className="elex-history__picks">
            {Object.entries(r.selections)
              .map(([raceId, candId]) => `${shortLabelForRace(raceId)}: ${labelForCandidate(raceId, candId)}`)
              .join(" · ")}
          </div>
          <span className="elex-history__status">Completed</span>
        </li>
      ))}
    </ul>
  );
}

function shortLabelForRace(raceId) {
  const race = BALLOT.find((r) => r.id === raceId);
  return race ? (race.id === "race-mayor" ? "Mayor" : "Treasurer") : raceId;
}
function labelForCandidate(raceId, candId) {
  const race = BALLOT.find((r) => r.id === raceId);
  const cand = race?.candidates.find((c) => c.id === candId);
  return cand ? cand.name : candId;
}
