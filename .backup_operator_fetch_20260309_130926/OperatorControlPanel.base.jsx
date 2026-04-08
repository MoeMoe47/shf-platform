import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${path}`);
  }
  return res.json();
}

function Card({ title, children, right }) {
  return (
    <section
      style={{
        background: "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, color: "#f8fafc" }}>{title}</h2>
        {right || null}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, subtext }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", lineHeight: 1.1 }}>{value}</div>
      {subtext ? (
        <div style={{ marginTop: 8, fontSize: 12, color: "#60a5fa" }}>{subtext}</div>
      ) : null}
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const styles = {
    neutral: { bg: "rgba(148,163,184,0.15)", fg: "#cbd5e1" },
    ok: { bg: "rgba(34,197,94,0.16)", fg: "#86efac" },
    warn: { bg: "rgba(245,158,11,0.16)", fg: "#fcd34d" },
    danger: { bg: "rgba(239,68,68,0.16)", fg: "#fca5a5" },
    info: { bg: "rgba(59,130,246,0.16)", fg: "#93c5fd" },
  };
  const toneStyle = styles[tone] || styles.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: 999,
        background: toneStyle.bg,
        color: toneStyle.fg,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, variant = "primary", disabled = false }) {
  const variants = {
    primary: { bg: "#2563eb", fg: "#fff", border: "none" },
    secondary: { bg: "#334155", fg: "#fff", border: "none" },
    ghost: { bg: "transparent", fg: "#cbd5e1", border: "1px solid rgba(255,255,255,0.12)" },
  };
  const v = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        background: v.bg,
        color: v.fg,
        border: v.border,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }) {
  return <div style={{ color: "#94a3b8" }}>{text}</div>;
}

function DataTable({ columns, rows, emptyText = "No data" }) {
  if (!rows?.length) return <EmptyState text={emptyText} />;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", color: "#e5e7eb", fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "#94a3b8",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || row.pool_id || row.dispute_id || row.intent_id || row.key || i}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    verticalAlign: "top",
                  }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlowStage({ stage, isLast }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 180 }}>
      <div
        style={{
          flex: 1,
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>{stage.label}</div>
          <Badge tone="info">{stage.status || "LIVE"}</Badge>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", lineHeight: 1.1 }}>
          {Number(stage.count || 0).toLocaleString()}
        </div>
        {Number(stage.amount_cents || 0) > 0 ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "#60a5fa" }}>
            {moneyCents(stage.amount_cents)}
          </div>
        ) : null}
      </div>

      {!isLast ? (
        <div style={{ color: "#60a5fa", fontSize: 24, fontWeight: 800 }}>→</div>
      ) : null}
    </div>
  );
}

function moneyCents(v) {
  const n = Number(v || 0);
  return `$${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function stateTone(state) {
  const s = String(state || "").toUpperCase();
  if (["OPEN", "PENDING", "INTENDED"].includes(s)) return "warn";
  if (["SETTLED", "VERIFIED", "ACTIVE", "APPROVED", "RESOLVED"].includes(s)) return "ok";
  if (["REJECTED", "FAILED", "CANCELLED"].includes(s)) return "danger";
  return "info";
}

export default function OperatorControlPanel() {
  const [summary, setSummary] = useState(null);
  const [flow, setFlow] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [poolDetail, setPoolDetail] = useState(null);
  const [payoutIntentId, setPayoutIntentId] = useState("");
  const [payoutDetail, setPayoutDetail] = useState(null);
  const [treasuryCode, setTreasuryCode] = useState("");
  const [treasuryData, setTreasuryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, flowRes, disputesRes, poolsRes] = await Promise.all([
        fetchJson(`/api/v1/operator/summary`),
        fetchJson(`/api/v1/operator/flow`),
        fetchJson(`/api/v1/operator/disputes`),
        fetchJson(`/api/v1/operator/pools`),
      ]);

      setSummary(summaryRes.summary || null);
      setFlow(flowRes.flow || null);
      setDisputes(disputesRes.items || []);
      setPools(poolsRes.items || []);
      setLastLoadedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || "Failed to load Capital Ops dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPoolDetail(poolId) {
    setSelectedPoolId(poolId);
    setError("");
    try {
      const res = await fetchJson(`/api/v1/operator/pools/${poolId}`);
      setPoolDetail(res);
    } catch (err) {
      setPoolDetail(null);
      setError(err.message || "Failed to load pool detail.");
    }
  }

  async function loadPayoutDetail() {
    if (!payoutIntentId.trim()) return;
    setError("");
    try {
      const res = await fetchJson(`/api/v1/operator/payouts/${encodeURIComponent(payoutIntentId.trim())}`);
      setPayoutDetail(res);
    } catch (err) {
      setPayoutDetail(null);
      setError(err.message || "Failed to load payout detail.");
    }
  }

  async function loadTreasuryAccount() {
    if (!treasuryCode.trim()) return;
    setError("");
    try {
      const res = await fetchJson(`/api/v1/operator/treasury/accounts/${encodeURIComponent(treasuryCode.trim())}`);
      setTreasuryData(res);
    } catch (err) {
      setTreasuryData(null);
      setError(err.message || "Failed to load treasury account.");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Pools", value: summary.pool_count ?? 0, subtext: "Registered funding pools" },
      { label: "Open Disputes", value: summary.open_dispute_count ?? 0, subtext: "Governance queue" },
      { label: "Committed", value: moneyCents(summary.committed_amount_total ?? 0), subtext: "Total committed capital" },
      { label: "Reserved", value: moneyCents(summary.reserved_amount_total ?? 0), subtext: "Reserved against pools" },
      { label: "Deployed", value: moneyCents(summary.deployed_amount_total ?? 0), subtext: "Settled / deployed capital" },
    ];
  }, [summary]);

  const overview = useMemo(() => {
    const committed = Number(summary?.committed_amount_total || 0);
    const reserved = Number(summary?.reserved_amount_total || 0);
    const deployed = Number(summary?.deployed_amount_total || 0);
    const available = Math.max(committed - reserved - deployed, 0);
    return {
      committed,
      reserved,
      deployed,
      available,
    };
  }, [summary]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>System Dashboard</div>
          <h1 style={{ margin: 0, fontSize: 36, color: "#f8fafc" }}>Operator Control Panel</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {lastLoadedAt ? `Last refreshed: ${lastLoadedAt}` : "Not yet refreshed"}
          </div>
          <ActionButton onClick={loadDashboard} variant="secondary">
            Refresh
          </ActionButton>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: "rgba(127,29,29,0.35)",
            border: "1px solid rgba(248,113,113,0.35)",
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={{ color: "#94a3b8" }}>Loading Capital Ops…</div>
      ) : (
        <>
          <Card
            title="System Summary"
            right={<Badge tone="info">Live control plane</Badge>}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              {stats.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} subtext={s.subtext} />
              ))}
            </div>
          </Card>

          <Card
            title="Outcome Flow Monitor"
            right={<Badge tone="ok">exchange pipeline</Badge>}
          >
            {flow?.stages?.length ? (
              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "flex", gap: 12, minWidth: "max-content" }}>
                  {flow.stages.map((stage, idx) => (
                    <FlowStage
                      key={stage.key || idx}
                      stage={stage}
                      isLast={idx === flow.stages.length - 1}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState text="No flow stages available." />
            )}

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <div style={{ color: "#cbd5e1" }}>
                <strong style={{ color: "#f8fafc" }}>Verified outcomes:</strong>{" "}
                {Number(flow?.totals?.verified_outcomes || 0).toLocaleString()}
              </div>
              <div style={{ color: "#cbd5e1" }}>
                <strong style={{ color: "#f8fafc" }}>Credits minted:</strong>{" "}
                {Number(flow?.totals?.credits_minted_count || 0).toLocaleString()}
              </div>
              <div style={{ color: "#cbd5e1" }}>
                <strong style={{ color: "#f8fafc" }}>Allocated:</strong>{" "}
                {Number(flow?.totals?.allocations_count || 0).toLocaleString()}
              </div>
              <div style={{ color: "#cbd5e1" }}>
                <strong style={{ color: "#f8fafc" }}>Payout intents:</strong>{" "}
                {Number(flow?.totals?.payout_intents_count || 0).toLocaleString()}
              </div>
              <div style={{ color: "#cbd5e1" }}>
                <strong style={{ color: "#f8fafc" }}>Settled:</strong>{" "}
                {Number(flow?.totals?.payout_settled_count || 0).toLocaleString()}
              </div>
              <div style={{ color: "#cbd5e1" }}>
                <strong style={{ color: "#f8fafc" }}>Open disputes:</strong>{" "}
                {Number(flow?.totals?.disputes_open_count || 0).toLocaleString()}
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }}>
            <Card title="Capital Overview">
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "#94a3b8" }}>Committed</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{moneyCents(overview.committed)}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "#1f2937", overflow: "hidden" }}>
                    <div style={{ width: "100%", height: "100%", background: "#60a5fa" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "#94a3b8" }}>Reserved</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{moneyCents(overview.reserved)}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "#1f2937", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${overview.committed > 0 ? Math.min((overview.reserved / overview.committed) * 100, 100) : 0}%`,
                        height: "100%",
                        background: "#f59e0b",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "#94a3b8" }}>Deployed</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{moneyCents(overview.deployed)}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "#1f2937", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${overview.committed > 0 ? Math.min((overview.deployed / overview.committed) * 100, 100) : 0}%`,
                        height: "100%",
                        background: "#22c55e",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "#94a3b8" }}>Available</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{moneyCents(overview.available)}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "#1f2937", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${overview.committed > 0 ? Math.min((overview.available / overview.committed) * 100, 100) : 0}%`,
                        height: "100%",
                        background: "#a78bfa",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Disputes Queue" right={<Badge tone={disputes.length ? "warn" : "ok"}>{disputes.length} total</Badge>}>
              <DataTable
                columns={[
                  { key: "dispute_id", label: "Dispute ID" },
                  { key: "reference_type", label: "Ref Type" },
                  { key: "reference_id", label: "Ref ID" },
                  {
                    key: "state",
                    label: "State",
                    render: (v) => <Badge tone={stateTone(v)}>{String(v || "UNKNOWN")}</Badge>,
                  },
                  { key: "reason", label: "Reason" },
                ]}
                rows={disputes}
                emptyText="No disputes found."
              />
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            <Card title="Funding Pools" right={<Badge tone="info">{pools.length} pools</Badge>}>
              <DataTable
                columns={[
                  {
                    key: "pool_code",
                    label: "Pool Code",
                    render: (v) => v || "—",
                  },
                  { key: "name", label: "Name" },
                  {
                    key: "status",
                    label: "Status",
                    render: (v) => <Badge tone={stateTone(v)}>{String(v || "UNKNOWN")}</Badge>,
                  },
                  {
                    key: "committed_amount",
                    label: "Committed",
                    render: (v) => moneyCents(v),
                  },
                  {
                    key: "reserved_amount",
                    label: "Reserved",
                    render: (v) => moneyCents(v),
                  },
                  {
                    key: "deployed_amount",
                    label: "Deployed",
                    render: (v) => moneyCents(v),
                  },
                  {
                    key: "pool_id",
                    label: "Action",
                    render: (_v, row) => (
                      <ActionButton onClick={() => loadPoolDetail(row.pool_id)}>
                        View
                      </ActionButton>
                    ),
                  },
                ]}
                rows={pools}
                emptyText="No pools found."
              />
            </Card>

            <Card
              title="Pool Detail"
              right={selectedPoolId ? <Badge tone="info">{selectedPoolId}</Badge> : null}
            >
              {selectedPoolId && poolDetail ? (
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div><strong style={{ color: "#f8fafc" }}>Name:</strong> <span style={{ color: "#cbd5e1" }}>{poolDetail.pool?.name || "—"}</span></div>
                    <div><strong style={{ color: "#f8fafc" }}>Pool ID:</strong> <span style={{ color: "#cbd5e1" }}>{poolDetail.pool?.pool_id || "—"}</span></div>
                    <div><strong style={{ color: "#f8fafc" }}>Committed:</strong> <span style={{ color: "#cbd5e1" }}>{moneyCents(poolDetail.pool?.committed_amount || 0)}</span></div>
                    <div><strong style={{ color: "#f8fafc" }}>Reserved:</strong> <span style={{ color: "#cbd5e1" }}>{moneyCents(poolDetail.pool?.reserved_amount || 0)}</span></div>
                    <div><strong style={{ color: "#f8fafc" }}>Deployed:</strong> <span style={{ color: "#cbd5e1" }}>{moneyCents(poolDetail.pool?.deployed_amount || 0)}</span></div>
                  </div>

                  <div>
                    <div style={{ marginBottom: 8, color: "#94a3b8", fontWeight: 700 }}>Allocations</div>
                    <DataTable
                      columns={[
                        { key: "allocation_id", label: "Allocation ID" },
                        { key: "credit_id", label: "Credit ID" },
                        {
                          key: "amount_cents",
                          label: "Amount",
                          render: (v) => moneyCents(v),
                        },
                      ]}
                      rows={poolDetail.allocations || []}
                      emptyText="No allocations for this pool."
                    />
                  </div>
                </div>
              ) : (
                <EmptyState text="Select a pool to inspect allocations." />
              )}
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card title="Payout Monitor">
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input
                  value={payoutIntentId}
                  onChange={(e) => setPayoutIntentId(e.target.value)}
                  placeholder="Enter payout intent id"
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#0b1220",
                    color: "#f8fafc",
                  }}
                />
                <ActionButton onClick={loadPayoutDetail}>Load</ActionButton>
              </div>

              {payoutDetail ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div><strong style={{ color: "#f8fafc" }}>Intent ID:</strong> <span style={{ color: "#cbd5e1" }}>{payoutDetail.payout?.intent_id || "—"}</span></div>
                  <div><strong style={{ color: "#f8fafc" }}>Credit ID:</strong> <span style={{ color: "#cbd5e1" }}>{payoutDetail.payout?.credit_id || "—"}</span></div>
                  <div><strong style={{ color: "#f8fafc" }}>Amount:</strong> <span style={{ color: "#cbd5e1" }}>{moneyCents(payoutDetail.payout?.amount_cents || 0)}</span></div>
                  <div>
                    <strong style={{ color: "#f8fafc" }}>State:</strong>{" "}
                    <Badge tone={stateTone(payoutDetail.payout?.state)}>{String(payoutDetail.payout?.state || "UNKNOWN")}</Badge>
                  </div>
                </div>
              ) : (
                <EmptyState text="Load a payout intent to inspect settlement state." />
              )}
            </Card>

            <Card title="Treasury Account Lookup">
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input
                  value={treasuryCode}
                  onChange={(e) => setTreasuryCode(e.target.value)}
                  placeholder="Enter treasury account code"
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#0b1220",
                    color: "#f8fafc",
                  }}
                />
                <ActionButton onClick={loadTreasuryAccount}>Load</ActionButton>
              </div>

              {treasuryData ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div><strong style={{ color: "#f8fafc" }}>Account:</strong> <span style={{ color: "#cbd5e1" }}>{treasuryData.account?.account_code || "—"}</span></div>
                  <div><strong style={{ color: "#f8fafc" }}>Name:</strong> <span style={{ color: "#cbd5e1" }}>{treasuryData.account?.name || "—"}</span></div>
                  <div><strong style={{ color: "#f8fafc" }}>Entries:</strong> <span style={{ color: "#cbd5e1" }}>{treasuryData.ledger?.entry_count ?? 0}</span></div>
                  <div><strong style={{ color: "#f8fafc" }}>Debits:</strong> <span style={{ color: "#cbd5e1" }}>{moneyCents(treasuryData.ledger?.debit_total ?? 0)}</span></div>
                  <div><strong style={{ color: "#f8fafc" }}>Credits:</strong> <span style={{ color: "#cbd5e1" }}>{moneyCents(treasuryData.ledger?.credit_total ?? 0)}</span></div>
                </div>
              ) : (
                <EmptyState text="Load a treasury account to inspect ledger balances." />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
