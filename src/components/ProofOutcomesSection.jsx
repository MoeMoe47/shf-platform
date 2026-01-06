// src/components/ProofOutcomesSection.jsx
import React from "react";

/**
 * ProofOutcomesSection
 * - Reads real pathway data (props.pathways)
 * - Summarizes time-to-paycheck, net cost, and wage signals
 * - Shows a compact per-pathway table
 * - Labels the SOURCE FIELDS used for each metric
 */
export default function ProofOutcomesSection({ pathways = [] }) {
  const rows = Array.isArray(pathways) ? pathways : [];

  const stats = React.useMemo(() => {
    if (!rows.length) return null;

    const n = rows.length;
    const sum = (sel) => rows.reduce((a, r) => a + Number(sel(r) || 0), 0);

    const avgWeeks = Math.round(sum((r) => r.estWeeks) / n) || 0;
    const avgCost = Math.round(sum((r) => r.estCost) / n) || 0;

    const starts = rows
      .map((r) => Number(r?.jobsMeta?.medianStart || 0))
      .filter((x) => Number.isFinite(x) && x > 0)
      .sort((a, b) => a - b);

    const medianStart =
      starts.length ? starts[Math.floor(starts.length / 2)] : 0;

    const employers = rows.flatMap((r) =>
      Array.isArray(r?.jobsMeta?.localEmployers)
        ? r.jobsMeta.localEmployers
        : []
    );
    const topEmployers = rankCounts(employers).slice(0, 6);

    const clusters = rankCounts(rows.map((r) => r.cluster).filter(Boolean));

    return { n, avgWeeks, avgCost, medianStart, topEmployers, clusters };
  }, [rows]);

  if (!rows.length) {
    return (
      <section className="card card--pad" aria-label="Outcomes & Signals">
        <h3 className="h3" style={{ marginTop: 0 }}>
          Outcomes & Local Signals
        </h3>
        <p className="subtle" style={{ margin: 0 }}>
          We’ll show wage, time-to-paycheck, and employer signals once pathways
          are loaded.
        </p>
      </section>
    );
  }

  return (
    <section className="card card--pad" aria-label="Outcomes & Signals">
      <div className="sh-row" style={{ alignItems: "center" }}>
        <h3 className="h3" style={{ margin: 0 }}>
          Outcomes & Local Signals
        </h3>
        <div style={{ flex: 1 }} />
        <span className="sh-chip soft">{stats.n} pathways</span>
      </div>

      {/* Summary chips */}
      <div
        className="sh-row"
        style={{ flexWrap: "wrap", gap: 8, marginTop: 10 }}
        aria-label="Key figures"
      >
        <Kpi label="Median start wage" value={usd(stats.medianStart)} />
        <Kpi label="Avg time to paycheck" value={stats.avgWeeks ? `${stats.avgWeeks} wks` : "Varies"} />
        <Kpi label="Avg net cost (est.)" value={usd(stats.avgCost)} />
      </div>

      {/* Top employers (if any) */}
      {!!stats.topEmployers.length && (
        <div style={{ marginTop: 12 }}>
          <div className="subtle" style={{ fontWeight: 700, marginBottom: 6 }}>
            Frequent local employers (sample)
          </div>
          <div className="sh-row" style={{ gap: 6, flexWrap: "wrap" }}>
            {stats.topEmployers.map(([name, count]) => (
              <span key={name} className="sh-chip sh-chip--soft" title={`${count} mentions`}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compact per-pathway table */}
      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <table className="sh-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Pathway</Th>
              <Th>Cluster</Th>
              <Th>Time to paycheck</Th>
              <Th>Net cost (est.)</Th>
              <Th>Median start wage</Th>
              <Th>Employers (sample)</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const jm = p?.jobsMeta || {};
              return (
                <tr key={p.id}>
                  <Td style={{ fontWeight: 600 }}>{p.title}</Td>
                  <Td>{p.cluster || "—"}</Td>
                  <Td>{p.estWeeks ? `${p.estWeeks} wks` : "Varies"}</Td>
                  <Td>{usd(p.estCost || 0)}</Td>
                  <Td>{usd(jm.medianStart || 0)}</Td>
                  <Td className="subtle">
                    {Array.isArray(jm.localEmployers) && jm.localEmployers.length
                      ? jm.localEmployers.slice(0, 3).join(", ")
                      : "—"}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sources label (explicit mapping of fields) */}
      <div className="subtle" style={{ marginTop: 10, lineHeight: 1.4 }}>
        <strong>Sources (by field):</strong>{" "}
        <SourceTag>Time to paycheck → pathway.estWeeks</SourceTag>{" "}
        <SourceTag>Net cost → pathway.estCost</SourceTag>{" "}
        <SourceTag>Median start wage → pathway.jobsMeta.medianStart</SourceTag>{" "}
        <SourceTag>Local employers → pathway.jobsMeta.localEmployers</SourceTag>
      </div>

      <style>{`
        .sh-table th, .sh-table td {
          border: 1px solid var(--ring, #e5e7eb);
          padding: 8px;
          text-align: left;
        }
      `}</style>
    </section>
  );
}

/* ---------- small presentational bits ---------- */
function Kpi({ label, value }) {
  return (
    <span
      className="sh-chip"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid var(--ring, #e5e7eb)",
        background: "var(--card, #fff)",
      }}
      aria-label={label}
      title={label}
    >
      <span className="subtle" style={{ fontSize: 12 }}>
        {label}
      </span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </span>
  );
}

function Th({ children }) {
  return <th style={{ background: "var(--surface,#fafafa)", fontWeight: 700 }}>{children}</th>;
}
function Td({ children, style }) {
  return <td style={style}>{children}</td>;
}
function SourceTag({ children }) {
  return (
    <span className="sh-chip sh-chip--soft" style={{ fontSize: 12, padding: "4px 8px", marginRight: 6 }}>
      {children}
    </span>
  );
}

/* ---------- helpers ---------- */
function rankCounts(list = []) {
  const map = new Map();
  for (const item of list) {
    const key = String(item || "").trim();
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function usd(n) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  } catch {
    return `$${Number(n || 0).toLocaleString()}`;
  }
}
/* --- SHF: Publish proof award --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_proof) return;
  window.__shfHook_proof = true;

  const once = (id) => {
    const k = `shf.award.proof.${id}`;
    if (localStorage.getItem(k)) return false;
    localStorage.setItem(k, "1");
    return true;
  };

  window.addEventListener("proof:published", (e) => {
    const { proofId, pathId } = (e && e.detail) || {};
    if (!proofId || !once(proofId)) return;
    try {
      window.shfCredit?.earn?.({
        action: "proof.publish",
        rewards: { heart: 1 }, // ❤️
        scoreDelta: 8,
        meta: { proofId, pathId }
      });
      window.shToast?.("🏁 Proof published · +1 ❤️ · +8 score");
    } catch {}
  });

  window.shfAward = Object.assign({}, window.shfAward || {}, {
    proofPublished: (proofId, pathId) =>
      window.dispatchEvent(new CustomEvent("proof:published", { detail: { proofId, pathId } }))
  });
})();
