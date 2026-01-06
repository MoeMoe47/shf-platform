// src/pages/CareerLearningBridge.jsx
import React from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";

/**
 * Career → Curriculum Bridge
 * - Shows "Recent" from localStorage (if any)
 * - Shows "Explore" from /api/merged/admin/index (mocked in dev)
 * - Each card can display an optional thumbnail and a progress ring
 *   when present in the API payload (e.g., { thumb, progress } or similar).
 *
 * Cross-app links are anchors to curriculum.html with hash routes.
 * Any hash query (?brand=…&program=…) is preserved.
 */

export default function CareerLearningBridge() {
  const { emit } =
    typeof useCreditCtx === "function" ? useCreditCtx() : { emit: () => {} };

  const [index, setIndex] = React.useState({ units: [], updatedAt: 0 });
  const [loading, setLoading] = React.useState(true);

  const hashQS = getHashQueryString(); // preserve brand/program/etc

  React.useEffect(() => {
    try { emit?.("bridge:view", { app: "career" }); } catch {}
  }, []); // eslint-disable-line

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/merged/admin/index", { headers: { Accept: "application/json" } });
        const data = await res.json();
        if (!cancelled && data?.ok) {
          setIndex({
            units: Array.isArray(data.units) ? data.units : [],
            updatedAt: data.updatedAt || Date.now(),
          });
        }
      } catch {
        if (!cancelled) setIndex({ units: [], updatedAt: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const recent = getRecentLessons(); // from localStorage if available
  const explore = index.units
    .filter((u) => u.curriculum === "asl" && u.type === "student")
    .slice(0, 8);

  return (
    <div className="page pad" style={{ display: "grid", gap: 16 }}>
      <header className="card card--pad">
        <h1 style={{ margin: 0, fontSize: 24 }}>Continue learning</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>
          Jump to Curriculum to keep your streak going.
        </p>
      </header>

      {/* Recent */}
      <section className="card card--pad">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Recent</h2>
        {recent.length === 0 ? (
          <div style={{ color: "var(--ink-soft)" }}>No recent lessons yet.</div>
        ) : (
          <Cards>
            {recent.map((r, i) => (
              <LessonCard
                key={`${r.curriculum}/${r.slug}/${i}`}
                title={r.title || r.slug}
                subtitle={r.curriculum?.toUpperCase() || "ASL"}
                href={mkLessonHref(r.curriculum || "asl", r.slug, hashQS)}
                thumb={pickThumb(r)}
                progressPct={computeProgressPct(r)}
                onClick={() =>
                  safeEmit(emit, "bridge:lesson_click", {
                    app: "career",
                    curriculum: r.curriculum || "asl",
                    slug: r.slug,
                    origin: "recent",
                  })
                }
              />
            ))}
          </Cards>
        )}
      </section>

      {/* Explore */}
      <section className="card card--pad">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Explore ASL lessons</h2>
          <a
            className="sh-btn sh-btn--secondary"
            href={`/curriculum.html#/asl/lessons${hashQS}`}
          >
            View all lessons
          </a>
        </div>

        {loading ? (
          <div className="skel skel--card" style={{ height: 120, marginTop: 12 }} />
        ) : explore.length === 0 ? (
          <div style={{ color: "var(--ink-soft)", marginTop: 8 }}>
            No lessons found.
          </div>
        ) : (
          <Cards>
            {explore.map((u) => (
              <LessonCard
                key={`${u.curriculum}/${u.slug}`}
                title={u.title || u.slug}
                subtitle={`${u.curriculum?.toUpperCase() || "ASL"} · ${u.type}`}
                href={mkLessonHref(u.curriculum || "asl", u.slug, hashQS)}
                thumb={pickThumb(u)}
                progressPct={computeProgressPct(u)}
                onClick={() =>
                  safeEmit(emit, "bridge:lesson_click", {
                    app: "career",
                    curriculum: u.curriculum || "asl",
                    slug: u.slug,
                    origin: "explore",
                  })
                }
              />
            ))}
          </Cards>
        )}
      </section>

      <footer
        className="card card--pad"
        style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
      >
        <a
          className="sh-btn"
          href={`/curriculum.html#/asl/dashboard${hashQS}`}
          onClick={() =>
            safeEmit(emit, "bridge:open_dashboard", {
              app: "career",
              curriculum: "asl",
            })
          }
        >
          Open Curriculum Dashboard
        </a>
      </footer>
    </div>
  );
}

/* ---------- Card + visuals ---------- */

function LessonCard({ title, subtitle, href, thumb, progressPct, onClick }) {
  const pct =
    typeof progressPct === "number" && isFinite(progressPct)
      ? Math.max(0, Math.min(100, progressPct))
      : null;

  return (
    <a
      className="card card--pad"
      href={href}
      onClick={onClick}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Thumb src={thumb} alt={title} />
        {pct !== null && (
          <div
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              background: "rgba(255,255,255,.9)",
              borderRadius: 999,
              padding: 4,
              boxShadow: "0 4px 12px rgba(0,0,0,.12)",
            }}
            title={`${Math.round(pct)}% complete`}
            aria-label={`${Math.round(pct)}% complete`}
          >
            <ProgressRing size={38} stroke={6} progress={pct} />
          </div>
        )}
      </div>

      <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
      {subtitle && (
        <div style={{ marginTop: 6, color: "var(--ink-soft)", fontSize: 13 }}>
          {subtitle}
        </div>
      )}
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-soft)" }}>
        Open in Curriculum →
      </div>
    </a>
  );
}

function Thumb({ src, alt }) {
  // Maintain 16:9 aspect, cover the area, rounded corners.
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: "100%",
          aspectRatio: "16/9",
          objectFit: "cover",
          borderRadius: 10,
          background: "#f3f4f6",
          display: "block",
        }}
      />
    );
  }
  // Placeholder if no thumb exists
  const initials = (alt || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return (
    <div
      aria-hidden
      style={{
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: 10,
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        letterSpacing: ".06em",
        background:
          "linear-gradient(135deg, #eef2ff 0%, #e0f2fe 50%, #ecfeff 100%)",
        color: "#0f172a",
      }}
    >
      {initials}
    </div>
  );
}

function ProgressRing({ size = 40, stroke = 6, progress = 0 }) {
  const pct = Math.max(0, Math.min(100, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${Math.round(pct)}% complete`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        style={{ color: "#2563eb", transition: "stroke-dashoffset 260ms ease" }}
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="50%"
        dy="0.34em"
        textAnchor="middle"
        fontSize={Math.max(10, size * 0.32)}
        fontWeight="700"
        fill="#111827"
      >
        {Math.round(pct)}
      </text>
    </svg>
  );
}

/* ---------- helpers ---------- */

function Cards({ children }) {
  return (
    <div
      style={{
        marginTop: 12,
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      }}
    >
      {children}
    </div>
  );
}

function mkLessonHref(cur, slug, qs) {
  // Curriculum routes: /:cur/lesson/:slug
  return `/curriculum.html#/${encodeURIComponent(cur)}/lesson/${encodeURIComponent(
    slug
  )}${qs || ""}`;
}

function getHashQueryString() {
  // Preserve hash query from the current app for brand/program/etc.
  const h = window.location.hash || "";
  const qIndex = h.indexOf("?");
  return qIndex >= 0 ? h.slice(qIndex) : "";
}

function safeEmit(emit, event, payload) {
  try {
    emit?.(event, payload);
  } catch {}
}

/** Try common fields to compute a 0–100 percentage. */
function computeProgressPct(obj) {
  // Exact percentage
  if (isFiniteNum(obj.progress)) return clampPct(obj.progress);
  if (isFiniteNum(obj.percent)) return clampPct(obj.percent);
  if (isFiniteNum(obj.pct)) return clampPct(obj.pct);
  if (isFiniteNum(obj.completion)) {
    const v = obj.completion;
    if (v <= 1 && v >= 0) return clampPct(v * 100);
    return clampPct(v);
  }

  // Fractions: completed / total
  const c = pickNum(obj.completed ?? obj.done ?? obj.progressDone);
  const t = pickNum(obj.total ?? obj.of ?? obj.progressTotal);
  if (isFiniteNum(c) && isFiniteNum(t) && t > 0) {
    return clampPct((c / t) * 100);
  }

  // Time-based: minutes / estMinutes
  const m = pickNum(obj.minutes ?? obj.spentMinutes ?? obj.elapsedMinutes);
  const e = pickNum(obj.estMinutes ?? obj.estimate ?? obj.expectedMinutes);
  if (isFiniteNum(m) && isFiniteNum(e) && e > 0) {
    return clampPct((m / e) * 100);
  }

  return null;
}

/** Try common thumbnail keys. */
function pickThumb(obj) {
  return (
    obj.thumb ||
    obj.image ||
    obj.cover ||
    obj.banner ||
    (obj.assets && (obj.assets.thumb || obj.assets.cover)) ||
    null
  );
}

function isFiniteNum(v) {
  return typeof v === "number" && isFinite(v);
}
function pickNum(v) {
  return isFiniteNum(v) ? v : null;
}
function clampPct(v) {
  return Math.max(0, Math.min(100, v));
}

/* --------- Recent lessons from localStorage (best-effort) ---------- */
function getRecentLessons() {
  const keys = ["recent.lessons", "curriculum.recent", "sh.recent.lessons"];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .map((x) => ({
            curriculum: x.curriculum || x.cur || "asl",
            slug: x.slug || x.id || "",
            title: x.title || x.name || undefined,
            thumb: pickThumb(x),
            // allow any progress hint stored by your app
            progress: computeProgressPct(x),
          }))
          .filter((x) => x.slug);
      }
    } catch {}
  }
  return [];
}
