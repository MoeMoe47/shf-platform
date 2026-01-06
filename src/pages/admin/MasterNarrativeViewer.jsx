// src/pages/admin/MasterNarrativeViewer.jsx
import React from "react";
import {
  loadMasterNarrativeFromStorage,
  mergeAdminAndCivicLogs,
  buildGrantNarrative,
} from "@/utils/binderMerge.js";

function getWindowLogsSafe() {
  if (typeof window === "undefined") return { admin: [], civic: [] };
  const admin = Array.isArray(window.__shfAdminLogs) ? window.__shfAdminLogs : [];
  const civic = Array.isArray(window.__shfCivicLogs) ? window.__shfCivicLogs : [];
  return { admin, civic };
}

function buildCsv(merged) {
  if (!merged || !Array.isArray(merged.all) || !merged.all.length) return "";

  const headers = [
    "when",
    "org",
    "category",
    "type",
    "toolOrMission",
    "durationMinutes",
    "headline",
  ];

  const rows = merged.all.map((item) => [
    item.when || "",
    item.org || "",
    item.category || "",
    item.type || "",
    item.toolOrMission || "",
    String(item.duration || 0),
    (item.headline || "").replace(/\r?\n/g, " "),
  ]);

  const lines = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))];
  return lines.join("\n");
}

function buildInsights(merged) {
  if (!merged) return [];

  const {
    totalTimeHours = 0,
    fundingCount = 0,
    salesCount = 0,
    curriculumCount = 0,
    productCount = 0,
    civicMissionCount = 0,
    foundationHours = 0,
    solutionsHours = 0,
  } = merged;

  const categories = [
    { label: "Funding & grants", count: fundingCount },
    { label: "Sales & outreach", count: salesCount },
    { label: "Curriculum build", count: curriculumCount },
    { label: "Product & UX", count: productCount },
    { label: "Civic missions", count: civicMissionCount },
  ].filter((c) => c.count > 0);

  const top = categories.sort((a, b) => b.count - a.count)[0];

  const insights = [];

  insights.push(
    `SHF logged about ${totalTimeHours.toFixed(
      1
    )} hours of AI-assisted work across operations and civic learning.`
  );

  if (top) {
    insights.push(
      `The most active category in this window was **${top.label}**, indicating where AI is currently driving the biggest lift.`
    );
  }

  if (foundationHours || solutionsHours) {
    insights.push(
      `Roughly **${foundationHours.toFixed(
        1
      )} hours** of AI work supported the Foundation (nonprofit) and **${solutionsHours.toFixed(
        1
      )} hours** supported Solutions (for-profit) — all tracked from the same tool cockpit.`
    );
  }

  if (civicMissionCount > 0) {
    insights.push(
      `Students and community members completed **${civicMissionCount} civic missions**, each linked to real issues like proposals, debt analysis, or treasury trade-offs — very strong for SEL and civics reporting.`
    );
  }

  return insights;
}

export default function MasterNarrativeViewer() {
  const [markdown, setMarkdown] = React.useState("");
  const [meta, setMeta] = React.useState({});
  const [merged, setMerged] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const { markdown: storedMd, meta: storedMeta } = loadMasterNarrativeFromStorage();
    setMarkdown(storedMd || "");
    setMeta(storedMeta || {});

    const { admin, civic } = getWindowLogsSafe();
    if (admin.length || civic.length) {
      const mergedNow = mergeAdminAndCivicLogs(admin, civic);
      setMerged(mergedNow);

      // If nothing stored yet, auto-build from current logs
      if (!storedMd || !storedMd.trim()) {
        const freshMd = buildGrantNarrative(mergedNow);
        setMarkdown(freshMd);
      }
    }
  }, []);

  const insights = React.useMemo(() => buildInsights(merged), [merged]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn("Copy failed", err);
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdown || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateTag = (meta?.updatedAt || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
    a.href = url;
    a.download = `shf-master-grant-narrative-${dateTag}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!merged || !merged.all || !merged.all.length) return;
    const csv = buildCsv(merged);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateTag = (meta?.updatedAt || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
    a.href = url;
    a.download = `shf-ai-sessions-merged-${dateTag}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = merged || {};

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Master Grant Narrative</h1>
          <p style={{ margin: "4px 0", opacity: 0.8, maxWidth: 680 }}>
            Read-only view of the unified AI impact story used for grants, audits, and annual
            reports. This combines Admin Tool usage with Civic missions into one binder-ready
            narrative.
          </p>
          {meta?.updatedAt && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Last updated: <strong>{meta.updatedAt}</strong>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="sh-btn"
            onClick={handleCopy}
            disabled={!markdown}
          >
            {copied ? "Copied!" : "Copy for Grant Portal"}
          </button>
          <button
            type="button"
            className="sh-btn is-ghost"
            onClick={handleDownloadMd}
            disabled={!markdown}
          >
            Download .md
          </button>
          <button
            type="button"
            className="sh-btn is-ghost"
            onClick={handleDownloadCsv}
            disabled={!merged || !merged.all || !merged.all.length}
          >
            Download CSV (AI sessions)
          </button>
        </div>
      </header>

      {/* Quick stats */}
      {merged && (
        <section
          className="card card--pad"
          style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Admin sessions</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.adminCount ?? 0}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Funding / sales / curriculum / product</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Civic missions</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.civicCount ?? 0}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Student & community-facing work</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Total AI time redirected</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {Number(stats.totalTimeHours || 0).toFixed(1)} hrs
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Foundation vs Solutions split built into narrative
            </div>
          </div>
        </section>
      )}

      {/* AI-ish interpretation */}
      {insights.length > 0 && (
        <section className="card card--pad">
          <strong style={{ display: "block", marginBottom: 4 }}>AI Summary</strong>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {insights.map((line, idx) => (
              <li key={idx} style={{ fontSize: 14, marginBottom: 4 }}>
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Narrative viewer */}
      <section className="card card--pad">
        <strong style={{ display: "block", marginBottom: 8 }}>Narrative (Markdown)</strong>
        <textarea
          style={{
            width: "100%",
            minHeight: 320,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 13,
            lineHeight: 1.5,
            padding: 10,
          }}
          value={markdown || ""}
          readOnly
        />
      </section>
    </div>
  );
}
