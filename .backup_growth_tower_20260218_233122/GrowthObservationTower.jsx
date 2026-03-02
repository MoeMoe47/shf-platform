import React, { useEffect, useMemo, useState } from "react";
import {
  getGrowthDashboard,
  listGrowthClaims,
  supportClaim,
  challengeClaim,
  resolveClaim,
  agentJournal,
} from "@/shared/api/growthMarket.js";

function fmtPct(x) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return "—";
  return `${Math.round(Number(x) * 100)}%`;
}
function fmtNum(x) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return "—";
  return Number(x).toFixed(0);
}
function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const ORANGE = "#ff4f00";
const SLATE = "#0b1220";
const SLATE2 = "#111b2e";
const TEXT = "#e5e7eb";

export default function GrowthObservationTower() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dash, setDash] = useState(null);
  const [claims, setClaims] = useState([]);

  const [actorId, setActorId] = useState(() => {
    const k = "shf_growth_actor_id";
    const v = localStorage.getItem(k);
    if (v) return v;
    const gen = `agent.${Math.random().toString(16).slice(2, 8)}`;
    localStorage.setItem(k, gen);
    return gen;
  });

  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const [d, c] = await Promise.all([getGrowthDashboard(), listGrowthClaims()]);
      setDash(d);
      setClaims(c?.items || []);
      if (!selectedId && (c?.items || []).length) setSelectedId((c.items[0] || {}).id);
    } catch (e) {
      setErr(e?.message || "Failed to load Growth Market.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    localStorage.setItem("shf_growth_actor_id", actorId || "");
  }, [actorId]);

  const selected = useMemo(
    () => claims.find((x) => x.id === selectedId) || null,
    [claims, selectedId]
  );

  async function act(fn) {
    setBusy(true);
    setErr("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setErr(e?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  function Card({ children, style }) {
    return (
      <div
        style={{
          background: SLATE2,
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 16,
          padding: 14,
          boxShadow: "0 12px 35px rgba(0,0,0,.35)",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  function Btn({ children, onClick, tone = "neutral", disabled }) {
    const bg =
      tone === "orange" ? ORANGE : tone === "danger" ? "#ef4444" : "rgba(255,255,255,.08)";
    const color = tone === "neutral" ? TEXT : "#0b1220";
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          border: "1px solid rgba(255,255,255,.10)",
          background: bg,
          color,
          padding: "10px 12px",
          borderRadius: 12,
          fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {children}
      </button>
    );
  }

  function Input({ value, onChange, placeholder }) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(0,0,0,.25)",
          color: TEXT,
          outline: "none",
        }}
      />
    );
  }

  async function stakeSupport(confidence, stake) {
    if (!selected) return;
    await act(() =>
      supportClaim(selected.id, { actorId, confidence, stake })
    );
    await act(() =>
      agentJournal({
        actorId,
        kind: "agent",
        claimId: selected.id,
        entry: {
          hypothesis: `Support ${selected.id}`,
          confidence,
          expected_value: stake * (confidence - 0.5) * 2,
          game_theory: {
            role: "scout",
            strategy: "Stake only when evidence >= 2 signals",
            risk: "Overconfidence punished by proper scoring",
          },
          falsify: ["Counter-attestation", "Data mismatch", "Stake imbalance"],
          at: new Date().toISOString(),
        },
      })
    );
  }

  async function stakeChallenge(confidence, stake) {
    if (!selected) return;
    await act(() =>
      challengeClaim(selected.id, { actorId, confidence, stake })
    );
    await act(() =>
      agentJournal({
        actorId,
        kind: "agent",
        claimId: selected.id,
        entry: {
          hypothesis: `Challenge ${selected.id}`,
          confidence,
          expected_value: stake * (confidence - 0.5) * 2,
          game_theory: {
            role: "skeptic",
            strategy: "Punish weak claims; profit from falsification",
            risk: "Under-challenging allows bad claims to pass",
          },
          falsify: ["Strong attestation", "Independent confirmation"],
          at: new Date().toISOString(),
        },
      })
    );
  }

  async function quickResolve(outcome) {
    if (!selected) return;
    await act(() => resolveClaim(selected.id, { outcome, note: "Resolved in UI (dev)" }));
  }

  const marketP = selected?.market?.market_p_true ?? null;
  const scoutStake = selected?.market?.scout_stake ?? 0;
  const skepticStake = selected?.market?.skeptic_stake ?? 0;

  return (
    <div style={{ padding: 18, color: TEXT }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2 }}>
          Growth Observation Tower
        </h1>
        <div style={{ opacity: 0.8, fontSize: 13 }}>
          Live growth signals as a <b>game-theory market</b> (scouts vs skeptics) + agent journals.
        </div>
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14 }}>
        {/* LEFT: Claims list */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Claims</div>
            <Btn onClick={refresh} disabled={busy || loading}>Refresh</Btn>
            <div style={{ marginLeft: "auto", width: 320, maxWidth: "100%" }}>
              <Input value={actorId} onChange={setActorId} placeholder="actor id (agent.* or human.*)" />
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                Your stakes + journals are attributed to <code style={{ opacity: 0.95 }}>{actorId}</code>
              </div>
            </div>
          </div>

          {err ? (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)" }}>
              <b>Error:</b> {err}
            </div>
          ) : null}

          {loading ? (
            <div style={{ marginTop: 14, opacity: 0.8 }}>Loading market…</div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {(claims || []).map((c) => {
                const active = c.id === selectedId;
                const p = c?.market?.market_p_true ?? null;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    style={{
                      textAlign: "left",
                      borderRadius: 14,
                      padding: 12,
                      border: active ? `1px solid ${ORANGE}` : "1px solid rgba(255,255,255,.10)",
                      background: active ? "rgba(255,79,0,.10)" : "rgba(0,0,0,.18)",
                      color: TEXT,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>{c.title}</div>
                      <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>
                        {c.status === "resolved" ? "RESOLVED" : "OPEN"} • {timeAgo(c.created_at)}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
                      {c.thesis}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 12, opacity: 0.85 }}>
                        Market P(True): <b>{fmtPct(p)}</b>
                      </span>
                      <span style={{ fontSize: 12, opacity: 0.75 }}>
                        Scout stake: <b>{fmtNum(c?.market?.scout_stake ?? 0)}</b>
                      </span>
                      <span style={{ fontSize: 12, opacity: 0.75 }}>
                        Skeptic stake: <b>{fmtNum(c?.market?.skeptic_stake ?? 0)}</b>
                      </span>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(c.tags || []).slice(0, 4).map((t) => (
                          <span key={t} style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,.08)",
                            border: "1px solid rgba(255,255,255,.10)",
                            opacity: 0.9,
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* RIGHT: Selected claim + actions */}
        <div style={{ display: "grid", gap: 14 }}>
          <Card>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Market Status</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: 10, borderRadius: 14, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Provider</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{dash?.provider || "—"}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 14, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Open claims</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{dash?.claims_open ?? "—"}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 14, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Positions</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{dash?.positions ?? "—"}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 14, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Agent journals</div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{dash?.journals ?? "—"}</div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
              Tip: set <code>VITE_FABRIC_API_BASE</code> for dev if your API is on a different port.
              Example: <code>http://127.0.0.1:8000</code>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Selected Claim</div>
            {!selected ? (
              <div style={{ opacity: 0.8 }}>Select a claim to view the market.</div>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{selected.title}</div>
                <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>{selected.thesis}</div>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div style={{ padding: 10, borderRadius: 14, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Market P(True)</div>
                      <div style={{ fontSize: 18, fontWeight: 1000, color: ORANGE }}>{fmtPct(marketP)}</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 14, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Scout stake</div>
                      <div style={{ fontSize: 18, fontWeight: 1000 }}>{fmtNum(scoutStake)}</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 14, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Skeptic stake</div>
                      <div style={{ fontSize: 18, fontWeight: 1000 }}>{fmtNum(skepticStake)}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Btn
                      tone="orange"
                      disabled={busy || selected.status === "resolved"}
                      onClick={() => stakeSupport(0.78, 25)}
                    >
                      Scout: Support (78%, stake 25)
                    </Btn>

                    <Btn
                      disabled={busy || selected.status === "resolved"}
                      onClick={() => stakeSupport(0.62, 10)}
                    >
                      Scout: Support (62%, stake 10)
                    </Btn>

                    <Btn
                      tone="orange"
                      disabled={busy || selected.status === "resolved"}
                      onClick={() => stakeChallenge(0.65, 30)}
                    >
                      Skeptic: Challenge (65%, stake 30)
                    </Btn>

                    <Btn
                      disabled={busy || selected.status === "resolved"}
                      onClick={() => stakeChallenge(0.55, 12)}
                    >
                      Skeptic: Challenge (55%, stake 12)
                    </Btn>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Dev resolve (proves settlement loop works):
                    </div>
                    <Btn tone="orange" disabled={busy || selected.status === "resolved"} onClick={() => quickResolve(1)}>
                      Resolve TRUE
                    </Btn>
                    <Btn tone="danger" disabled={busy || selected.status === "resolved"} onClick={() => quickResolve(0)}>
                      Resolve FALSE
                    </Btn>
                  </div>

                  <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
                    Proper scoring (Brier) punishes bluffing. High confidence without evidence gets wrecked.
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Recent Positions</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {(selected.positions || []).slice(-8).reverse().map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: 10,
                          borderRadius: 14,
                          background: "rgba(0,0,0,.18)",
                          border: "1px solid rgba(255,255,255,.08)",
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: p.side === "scout" ? ORANGE : "#60a5fa",
                          boxShadow: "0 0 18px rgba(255,79,0,.25)",
                        }} />
                        <div style={{ fontWeight: 900 }}>{p.side.toUpperCase()}</div>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>
                          {p.actor_id}
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
                          conf <b>{fmtPct(p.confidence)}</b> • stake <b>{fmtNum(p.stake)}</b> • {timeAgo(p.created_at)}
                        </div>
                      </div>
                    ))}
                    {(!selected.positions || selected.positions.length === 0) ? (
                      <div style={{ opacity: 0.8, fontSize: 13 }}>
                        No positions yet. Stake to create the market.
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card style={{ background: SLATE, borderRadius: 18 }}>
            <div style={{ fontWeight: 1000 }}>Why this is “top 1%”</div>
            <ul style={{ margin: "10px 0 0 18px", opacity: 0.9, lineHeight: 1.35 }}>
              <li><b>Game theory</b>: scouts profit by finding truth early, skeptics profit by falsifying weak claims.</li>
              <li><b>Proper scoring</b>: confidence must match reality or you lose stake.</li>
              <li><b>Agent journaling</b>: every move can carry evidence + falsifiers for auditability.</li>
              <li><b>Hybrid</b>: today it runs on dev storage; tomorrow it pulls Watchtower attestations from Postgres.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
