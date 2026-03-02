import React, { useEffect, useMemo, useState } from "react";
import { SEED_CLAIMS } from "@/shared/growth/mockSignals.js";
import {
  loadMarket,
  saveMarket,
  createClaim,
  challengeClaim,
  auditChallenge,
  resolveClaim,
  computeKpis,
  markBaselineIfMissing,
  clamp01,
} from "@/shared/growth/claimMarket.js";

function Pill({ children, tone = "dark" }) {
  const bg = tone === "orange" ? "rgba(255,79,0,.18)" : "rgba(148,163,184,.12)";
  const bd = tone === "orange" ? "rgba(255,79,0,.35)" : "rgba(148,163,184,.18)";
  const fg = tone === "orange" ? "#ff4f00" : "#cbd5e1";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${bd}`,
        color: fg,
        fontSize: 12,
        lineHeight: "12px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Tile({ label, value, sub }) {
  return (
    <div
      style={{
        background: "rgba(2,6,23,.35)",
        border: "1px solid rgba(148,163,184,.14)",
        borderRadius: 12,
        padding: 14,
        minHeight: 76,
        boxShadow: "0 8px 30px rgba(0,0,0,.25)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{value}</div>
      {sub ? <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>{sub}</div> : null}
    </div>
  );
}

function Card({ title, children, right }) {
  return (
    <div
      style={{
        background: "rgba(2,6,23,.32)",
        border: "1px solid rgba(148,163,184,.14)",
        borderRadius: 14,
        padding: 18,
        boxShadow: "0 10px 40px rgba(0,0,0,.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
        <div style={{ marginLeft: "auto" }}>{right}</div>
      </div>
      {children}
    </div>
  );
}

function Btn({ children, onClick, tone = "dark", disabled }) {
  const isOrange = tone === "orange";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn"
      style={{
        appearance: "none",
        border: "1px solid " + (isOrange ? "rgba(255,79,0,.45)" : "rgba(148,163,184,.22)"),
        background: isOrange ? "#ff4f00" : "rgba(15,23,42,.55)",
        color: isOrange ? "#0b1220" : "#e5e7eb",
        borderRadius: 10,
        padding: "9px 12px",
        fontWeight: 800,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function GrowthObservationTower() {
  const [mode, setMode] = useState("metaverse"); // metaverse | infra
  const [market, setMarket] = useState(() => loadMarket(SEED_CLAIMS));
  const kpis = useMemo(() => computeKpis(market), [market]);

  // Persist
  useEffect(() => {
    try {
      saveMarket(market);
    } catch {}
  }, [market]);

  // Create claim form
  const [title, setTitle] = useState("");
  const [thesis, setThesis] = useState("");
  const [prob, setProb] = useState(0.6);
  const [horizon, setHorizon] = useState("30d");
  const [evidence, setEvidence] = useState("metrics snapshot; watchtower export link");
  const [tags, setTags] = useState("growth, watchtower");

  // Challenge controls (single shared input)
  const [challengeNote, setChallengeNote] = useState("Missing proof link or baseline metric. Suggest recalibration.");
  const [challengeP, setChallengeP] = useState(0.5);

  function onCreate() {
    const ev = evidence
      .split(";")
      .map(s => s.trim())
      .filter(Boolean);

    const tg = tags
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const next = createClaim(market, {
      title: title || "New growth claim",
      thesis,
      probability: clamp01(Number(prob)),
      horizon,
      evidence: ev,
      tags: tg,
    });

    setMarket(next);
    setTitle("");
    setThesis("");
  }

  function onChallenge(id) {
    // Ensure we have a baseline locked before first challenge (for fair scoring)
    let next = markBaselineIfMissing(market, id);
    next = challengeClaim(next, id, { note: challengeNote, suggestedProbability: clamp01(Number(challengeP)) });
    setMarket(next);
  }

  function onAudit(id, accept) {
    const next = auditChallenge(market, id, { accept });
    setMarket(next);
  }

  function onResolve(id, outcome) {
    const next = resolveClaim(market, id, { outcome });
    setMarket(next);
  }

  // UI styling: matches your screenshot vibe (deep navy gradient + clean tiles)
  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        padding: "28px 28px 60px",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(99,102,241,.18), transparent 60%)," +
          "radial-gradient(900px 500px at 85% 20%, rgba(255,79,0,.14), transparent 55%)," +
          "linear-gradient(180deg, rgba(2,6,23,.94), rgba(2,6,23,.92))",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, color: "#e5e7eb" }}>
              Growth Observation Tower
            </div>
            <div style={{ marginTop: 6, fontSize: 15, color: "rgba(226,232,240,.78)" }}>
              Metaverse node for growth signals backed by Watchtower truth.
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pill tone="orange">Game-Theory Claims Market</Pill>
              <Pill>Adversarial Challenges</Pill>
              <Pill>Proper Scoring (Brier)</Pill>
              <Pill>Local Persistence</Pill>
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <Btn tone={mode === "metaverse" ? "orange" : "dark"} onClick={() => setMode("metaverse")}>
              Metaverse View
            </Btn>
            <Btn tone={mode === "infra" ? "orange" : "dark"} onClick={() => setMode("infra")}>
              Infra View
            </Btn>
          </div>
        </div>

        {/* KPI tiles */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <Tile label="Signals" value={kpis.signals} sub={`${kpis.meaningfulChallenges} meaningful challenges`} />
          <Tile label="Attestations (24h)" value={kpis.attestations24h} sub="Wire to Watchtower Postgres next" />
          <Tile label="Mismatches" value={kpis.mismatches} sub="High-confidence wrong calls" />
          <Tile label="Last Export (UTC)" value={kpis.lastExportUtc} sub={`Avg Scout Score: ${kpis.avgScout}`} />
        </div>

        <div style={{ marginTop: 14 }}>
          {mode === "metaverse" ? (
            <Card title="Metaverse Node" right={<Pill tone="orange">Live layer</Pill>}>
              <div style={{ color: "rgba(226,232,240,.78)", fontSize: 14, lineHeight: 1.6 }}>
                This tower represents the live growth layer of SHF. Signals are observed here and converted into strategic
                actions.
                <ul style={{ marginTop: 10 }}>
                  <li>Signal summaries</li>
                  <li>Funding context</li>
                  <li>Impact tracking</li>
                  <li>Audit export links</li>
                </ul>
              </div>
            </Card>
          ) : (
            <Card title="Infra View" right={<Pill>Truth layer</Pill>}>
              <div style={{ color: "rgba(226,232,240,.78)", fontSize: 14, lineHeight: 1.6 }}>
                Infra mode is where Watchtower becomes the source of truth.
                <ul style={{ marginTop: 10 }}>
                  <li>Postgres Watchtower attestations</li>
                  <li>Nightly JSONL export to immutable storage</li>
                  <li>Integrity monitor verifies recent window</li>
                </ul>
              </div>
            </Card>
          )}
        </div>

        {/* Claims Market */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 14 }}>
          <Card
            title="Claims Market (Scout ↔ Skeptic ↔ Auditor)"
            right={<Pill tone="orange">Truth-seeking equilibrium</Pill>}
          >
            <div style={{ display: "grid", gap: 10 }}>
              {market.claims.slice(0, 10).map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,.14)",
                    background: "rgba(15,23,42,.35)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 900, color: "#e5e7eb" }}>{c.title}</div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                      <Pill tone={c.status === "resolved" ? "dark" : "orange"}>
                        {c.status.toUpperCase()}
                      </Pill>
                      <Pill>p={Math.round((c.probability ?? 0) * 100)}%</Pill>
                      <Pill>{c.horizon}</Pill>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, color: "rgba(226,232,240,.78)", fontSize: 13, lineHeight: 1.55 }}>
                    {c.thesis || <span style={{ opacity: 0.7 }}>(no thesis yet)</span>}
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(c.tags || []).slice(0, 6).map(t => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                    <Pill>Evidence: {(c.evidence || []).length}</Pill>
                  </div>

                  {/* Challenge history */}
                  {(c.challenges || []).length ? (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,.12)" }}>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                        Latest challenge:
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <Pill tone="orange">
                          Δ {((c.challenges[0].delta ?? 0) >= 0 ? "+" : "")}{c.challenges[0].delta}
                        </Pill>
                        <Pill>suggest p={Math.round((c.challenges[0].suggestedProbability ?? 0) * 100)}%</Pill>
                        <Pill>{c.challenges[0].meaningful ? "meaningful" : "low-signal"}</Pill>
                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                          {c.challenges[0].note}
                        </span>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Btn onClick={() => onAudit(c.id, true)} tone="orange" disabled={c.status === "resolved"}>
                          Auditor: Accept update
                        </Btn>
                        <Btn onClick={() => onAudit(c.id, false)} disabled={c.status === "resolved"}>
                          Auditor: Reject
                        </Btn>
                      </div>
                    </div>
                  ) : null}

                  {/* Resolution */}
                  {c.status === "resolved" && c.scoring ? (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,.12)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <Pill tone={c.outcome ? "orange" : "dark"}>Outcome: {c.outcome ? "TRUE" : "FALSE"}</Pill>
                        <Pill>Scout: {c.scoring.scoutReward}</Pill>
                        <Pill>Skeptic: {c.scoring.skepticReward}</Pill>
                        <Pill>Brier {c.scoring.brierBefore} → {c.scoring.brierAfter}</Pill>
                        <span style={{ fontSize: 12, opacity: 0.75 }}>{c.scoring.notes}</span>
                      </div>
                    </div>
                  ) : null}

                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Btn
                      onClick={() => onChallenge(c.id)}
                      disabled={c.status === "resolved"}
                    >
                      Skeptic: Challenge
                    </Btn>
                    <Btn
                      onClick={() => onResolve(c.id, true)}
                      tone="orange"
                      disabled={c.status === "resolved"}
                    >
                      Resolve: TRUE
                    </Btn>
                    <Btn
                      onClick={() => onResolve(c.id, false)}
                      disabled={c.status === "resolved"}
                    >
                      Resolve: FALSE
                    </Btn>
                  </div>
                </div>
              ))}
            </div>

            {/* Agent scoreboard */}
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pill tone="orange">Scout rep: {market.agents?.scout?.rep ?? 0}</Pill>
              <Pill>Skeptic rep: {market.agents?.skeptic?.rep ?? 0}</Pill>
              <Pill>Auditor rep: {market.agents?.auditor?.rep ?? 0}</Pill>
              <Pill>Allocator rep: {market.agents?.allocator?.rep ?? 0}</Pill>
            </div>
          </Card>

          {/* Create + challenge controls */}
          <div style={{ display: "grid", gap: 14 }}>
            <Card title="Create Claim (Scout)" right={<Pill tone="orange">High-signal only</Pill>}>
              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ fontSize: 12, opacity: 0.75 }}>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: 2 meetings booked from outreach sprint"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,.18)",
                    background: "rgba(2,6,23,.35)",
                    color: "#e5e7eb",
                  }}
                />

                <label style={{ fontSize: 12, opacity: 0.75 }}>Thesis</label>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  rows={4}
                  placeholder="Explain why this should happen + what would prove it."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,.18)",
                    background: "rgba(2,6,23,.35)",
                    color: "#e5e7eb",
                    resize: "vertical",
                  }}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, opacity: 0.75 }}>Probability (0–1)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prob}
                      onChange={(e) => setProb(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(148,163,184,.18)",
                        background: "rgba(2,6,23,.35)",
                        color: "#e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, opacity: 0.75 }}>Horizon</label>
                    <select
                      value={horizon}
                      onChange={(e) => setHorizon(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(148,163,184,.18)",
                        background: "rgba(2,6,23,.35)",
                        color: "#e5e7eb",
                      }}
                    >
                      <option value="48h">48h</option>
                      <option value="7d">7d</option>
                      <option value="14d">14d</option>
                      <option value="30d">30d</option>
                      <option value="90d">90d</option>
                    </select>
                  </div>
                </div>

                <label style={{ fontSize: 12, opacity: 0.75 }}>Evidence (separate with semicolons)</label>
                <input
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="metrics snapshot; export link; calendar proof"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,.18)",
                    background: "rgba(2,6,23,.35)",
                    color: "#e5e7eb",
                  }}
                />

                <label style={{ fontSize: 12, opacity: 0.75 }}>Tags (comma separated)</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="watchtower, funding, growth"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,.18)",
                    background: "rgba(2,6,23,.35)",
                    color: "#e5e7eb",
                  }}
                />

                <div style={{ display: "flex", gap: 10 }}>
                  <Btn tone="orange" onClick={onCreate}>
                    Publish Claim
                  </Btn>
                  <Btn onClick={() => setMarket(loadMarket(SEED_CLAIMS))}>
                    Reload from Storage
                  </Btn>
                </div>
              </div>
            </Card>

            <Card title="Skeptic Controls" right={<Pill>Anti-spam enforced</Pill>}>
              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ fontSize: 12, opacity: 0.75 }}>Suggested Probability</label>
                <input
                  type="number"
                  step="0.01"
                  value={challengeP}
                  onChange={(e) => setChallengeP(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,.18)",
                    background: "rgba(2,6,23,.35)",
                    color: "#e5e7eb",
                  }}
                />

                <label style={{ fontSize: 12, opacity: 0.75 }}>Challenge note</label>
                <textarea
                  value={challengeNote}
                  onChange={(e) => setChallengeNote(e.target.value)}
                  rows={4}
                  placeholder="What proof is missing? What’s being gamed? Why adjust p?"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,.18)",
                    background: "rgba(2,6,23,.35)",
                    color: "#e5e7eb",
                    resize: "vertical",
                  }}
                />

                <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                  Rule: challenge must be meaningful (|Δp| ≥ 0.05 OR note ≥ 18 chars). Noise challenges get penalized at resolution.
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.65 }}>
          Dev note: Watchtower/Postgres wiring will replace the placeholder KPI fields (Attestations/Exports). The market schema is stable—API can drop in without UI changes.
        </div>
      </div>
    </div>
  );
}
