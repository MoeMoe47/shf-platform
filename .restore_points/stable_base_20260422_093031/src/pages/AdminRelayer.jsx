// src/pages/AdminRelayer.jsx
import React from "react";
import { Link } from "react-router-dom";          // ✅ nav links
import { track } from "@/utils/analytics.js";     // ✅ analytics

/**
 * AdminRelayer (mock)
 * - Queue monitor: queued / signing / broadcasting / mined / failed
 * - Per-tx details + actions: Retry, Speed-up, Cancel (console + analytics only)
 * - Demo controls: Enqueue N, Auto-process toggle, Failure rate slider
 *
 * Client-side only. Swap to real API/relayer later.
 */

const STATUS = ["queued", "signing", "broadcasting", "mined", "failed"];

function randHex(n = 64) {
  const chars = "abcdef0123456789";
  return (
    "0x" +
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
}
function short(a) {
  return a && a.startsWith("0x") ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;
}

export default function AdminRelayer() {
  const [queue, setQueue] = React.useState(() => seedQueue(6));
  const [auto, setAuto] = React.useState(true);
  const [failRate, setFailRate] = React.useState(0.15); // 0..1
  const [selectedId, setSelectedId] = React.useState(null);

  // pageview
  React.useEffect(() => {
    track("admin_relayer_viewed", { role: "admin" });
  }, []);

  // derived counts
  const counts = React.useMemo(() => {
    const c = { queued: 0, signing: 0, broadcasting: 0, mined: 0, failed: 0 };
    queue.forEach((j) => c[j.status]++);
    return c;
  }, [queue]);

  // 🔊 Broadcaster: push compact snapshot to listeners + persist
  React.useEffect(() => {
    const snap = summarize(queue);
    try {
      localStorage.setItem("relayer:stats", JSON.stringify(snap));
    } catch {}
    window.dispatchEvent(new CustomEvent("relayer:stats", { detail: snap }));
  }, [queue]);

  // Auto-processor (ticks every 1.2s)
  React.useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => processOne(), 1200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, queue, failRate]);

  function processOne() {
    setQueue((q) => {
      const nextIdx = q.findIndex(
        (j) =>
          j.status === "queued" ||
          j.status === "signing" ||
          j.status === "broadcasting"
      );
      if (nextIdx === -1) return q;

      const j = { ...q[nextIdx] };
      j.history = j.history.slice();

      if (j.status === "queued") {
        j.status = "signing";
        j.updatedAt = Date.now();
        j.history.push(step("signing"));
        track("relayer_signing_started", { id: j.id });
      } else if (j.status === "signing") {
        j.status = "broadcasting";
        j.txHash = randHex(64);
        j.updatedAt = Date.now();
        j.history.push(step("broadcasting", { txHash: j.txHash }));
        track("relayer_broadcast", { id: j.id, txHash: short(j.txHash) });
      } else if (j.status === "broadcasting") {
        if (Math.random() < failRate) {
          j.status = "failed";
          j.error = "Mock: nonce too low";
          j.updatedAt = Date.now();
          j.history.push(step("failed", { error: j.error }));
          track("relayer_failed", { id: j.id, error: j.error });
        } else {
          j.status = "mined";
          j.blockNumber = 5_000_000 + Math.floor(Math.random() * 10_000);
          j.gasUsed = 21_000 + Math.floor(Math.random() * 10_000);
          j.updatedAt = Date.now();
          j.history.push(step("mined", { blockNumber: j.blockNumber, gasUsed: j.gasUsed }));
          track("relayer_mined", {
            id: j.id,
            txHash: short(j.txHash),
            blockNumber: j.blockNumber,
          });
        }
      }

      const next = q.slice();
      next[nextIdx] = j;
      return next;
    });
  }

  function enqueue(n = 1) {
    setQueue((q) => {
      const jobs = Array.from({ length: n }, () => mkJob());
      const out = q.concat(jobs);
      track("relayer_enqueued", { count: n });
      return out;
    });
  }

  function retry(id) {
    setQueue((q) =>
      q.map((j) =>
        j.id === id && j.status === "failed"
          ? {
              ...j,
              status: "queued",
              error: undefined,
              updatedAt: Date.now(),
              history: j.history.concat(step("queued_retry")),
            }
          : j
      )
    );
    track("relayer_retry", { id });
  }

  function speedUp(id) {
    // In real life: resubmit w/ higher gas. Here: mark hint and keep status.
    setQueue((q) =>
      q.map((j) => {
        if (j.id !== id) return j;
        const next = {
          ...j,
          updatedAt: Date.now(),
          history: j.history.concat(step("speedup")),
        };
        if (next.status === "broadcasting") next.hint = "Speed-up requested";
        return next;
      })
    );
    track("relayer_speedup", { id });
    // eslint-disable-next-line no-console
    console.log("[relayer] speed-up", id);
  }

  function cancel(id) {
    setQueue((q) =>
      q.map((j) =>
        j.id === id && (j.status === "queued" || j.status === "signing")
          ? {
              ...j,
              status: "failed",
              error: "Canceled by admin",
              updatedAt: Date.now(),
              history: j.history.concat(step("canceled")),
            }
          : j
      )
    );
    track("relayer_cancel", { id });
  }

  function clearMined() {
    setQueue((q) => q.filter((j) => j.status !== "mined"));
  }

  const selected = queue.find((j) => j.id === selectedId) || null;

  return (
    <div style={sx.page}>
      <header style={sx.header}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={sx.h1}>Relayer (Mock)</h1>
          <span style={sx.muted}>control room · demo</span>
        </div>
        <div style={sx.row}>
          <Link to="/admin" style={{ ...sx.btn, textDecoration: "none" }}>
            ← Admin
          </Link>
          <Link to="/admin/analytics" style={{ ...sx.btn, textDecoration: "none" }}>
            Analytics →
          </Link>

          <button style={sx.btn} onClick={() => enqueue(1)}>
            Enqueue +1
          </button>
          <button style={sx.btn} onClick={() => enqueue(5)}>
            Enqueue +5
          </button>
          <button style={sx.btn} onClick={processOne}>
            Process One ▶︎
          </button>
          <label style={sx.label}>
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />{" "}
            Auto
          </label>
          <label style={sx.label}>
            Fail rate {Math.round(failRate * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={failRate}
              onChange={(e) => setFailRate(parseFloat(e.target.value))}
            />
          </label>
          <button style={sx.btn} onClick={clearMined}>
            Clear mined
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <section style={sx.kpis}>
        {STATUS.map((s) => (
          <div key={s} style={sx.kpi}>
            <div style={sx.kpiVal}>{counts[s]}</div>
            <div style={sx.kpiLabel}>{s}</div>
          </div>
        ))}
      </section>

      {/* Queue table */}
      <section style={sx.card}>
        <div style={sx.cardHead}>
          <h2 style={sx.cardTitle}>Queue</h2>
          <span style={sx.muted}>{queue.length} total</span>
        </div>
        <div style={{ overflow: "auto" }}>
          <table style={sx.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Student</th>
                <th>Action</th>
                <th>Token</th>
                <th>Tx</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {queue.map((j) => (
                <tr
                  key={j.id}
                  onClick={() => setSelectedId(j.id)}
                  style={{
                    cursor: "pointer",
                    background: selectedId === j.id ? "#fff7ed" : "transparent",
                  }}
                >
                  <td>{j.id.slice(0, 6)}</td>
                  <td style={{ fontWeight: 700 }}>{j.status}</td>
                  <td>{j.student}</td>
                  <td>{j.action}</td>
                  <td>{j.tokenId ?? "—"}</td>
                  <td>{j.txHash ? short(j.txHash) : "—"}</td>
                  <td>{new Date(j.updatedAt).toLocaleTimeString()}</td>
                  <td>
                    <div style={sx.row}>
                      {j.status === "failed" && (
                        <button
                          style={sx.btnTiny}
                          onClick={(e) => (e.stopPropagation(), retry(j.id))}
                        >
                          Retry
                        </button>
                      )}
                      {j.status === "broadcasting" && (
                        <button
                          style={sx.btnTiny}
                          onClick={(e) => (e.stopPropagation(), speedUp(j.id))}
                        >
                          Speed-up
                        </button>
                      )}
                      {(j.status === "queued" || j.status === "signing") && (
                        <button
                          style={sx.btnTiny}
                          onClick={(e) => (e.stopPropagation(), cancel(j.id))}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", color: "#6b7280", padding: 16 }}
                  >
                    Queue empty. Enqueue to demo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Drawer */}
      {selected && (
        <section style={sx.card}>
          <div style={sx.cardHead}>
            <h3 style={sx.cardTitle}>Tx Details — {selected.id.slice(0, 8)}</h3>
            <span style={sx.muted}>{selected.status}</span>
          </div>
          <div style={sx.detailCols}>
            <div>
              <Detail k="Student" v={selected.student} />
              <Detail k="Action" v={selected.action} />
              <Detail k="Token ID" v={selected.tokenId ?? "—"} />
              <Detail k="Tx Hash" v={selected.txHash ?? "—"} />
              <Detail k="Block" v={selected.blockNumber ?? "—"} />
              <Detail k="Gas Used" v={selected.gasUsed ?? "—"} />
              <Detail k="Hint" v={selected.hint ?? "—"} />
              <Detail k="Error" v={selected.error ?? "—"} />
            </div>
            <div>
              <div style={sx.subhead}>History</div>
              <ul style={sx.ul}>
                {selected.history.map((h, i) => (
                  <li key={i}>
                    <code style={sx.code}>
                      {new Date(h.t).toLocaleTimeString()}
                    </code>{" "}
                    — <b>{h.s}</b>
                    {h.note ? ` · ${h.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function mkJob() {
  const id = randHex(16);
  const student = `student_${Math.floor(Math.random() * 900 + 100)}`;
  const tokenId = Math.floor(Math.random() * 10000);
  const action = Math.random() < 0.7 ? "mint_credential" : "notarize_artifact";
  const now = Date.now();
  return {
    id,
    status: "queued",
    student,
    action,
    tokenId,
    updatedAt: now,
    history: [step("queued")],
  };
}
function step(s, extra = {}) {
  return { t: Date.now(), s, ...extra };
}
function seedQueue(n = 5) {
  return Array.from({ length: n }, () => mkJob());
}
// 🧮 Compact snapshot for dashboard-side widgets & persistence
function summarize(q) {
  const s = { queued: 0, signing: 0, broadcasting: 0, mined: 0, failed: 0 };
  q.forEach((j) => {
    s[j.status] = (s[j.status] || 0) + 1;
  });
  return { ...s, total: q.length, updatedAt: Date.now() };
}

/* ---------- tiny UI bits ---------- */
function Detail({ k, v }) {
  return (
    <div style={{ margin: "4px 0", fontSize: 13 }}>
      <span style={{ color: "#6b7280" }}>{k}:</span>{" "}
      <span style={{ fontWeight: 600 }}>{String(v)}</span>
    </div>
  );
}

/* ---------- styles ---------- */
const sx = {
  page: {
    padding: 16,
    background: "#f6f3ed",
    minHeight: "100vh",
    color: "#0f172a",
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  h1: { margin: 0, fontSize: 22, fontWeight: 800 },
  muted: { fontSize: 12, color: "#6b7280", fontWeight: 600 },
  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  btn: {
    border: "1px solid #dcd7ce",
    background: "#fff",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  btnTiny: {
    border: "1px solid #e6e4de",
    background: "#fff",
    padding: "4px 8px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))",
    gap: 10,
    marginBottom: 12,
  },
  kpi: {
    background: "#fff",
    border: "1px solid #e6e4de",
    borderRadius: 12,
    padding: 10,
    textAlign: "center",
  },
  kpiVal: { fontSize: 22, fontWeight: 800 },
  kpiLabel: { fontSize: 12, color: "#6b7280" },
  card: {
    background: "#fff",
    border: "1px solid #e6e4de",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,.04)",
    marginBottom: 12,
  },
  cardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: { margin: 0, fontSize: 14, fontWeight: 800 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  subhead: { fontWeight: 800, marginBottom: 6 },
  detailCols: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  ul: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 },
  code: {
    background: "#0f172a",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: 6,
    fontSize: 12,
  },
};
