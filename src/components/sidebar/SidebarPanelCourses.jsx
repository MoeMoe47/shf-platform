import AppLink from "@/components/nav/AppLink";
// src/components/SidebarPanelCourses.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * Data-driven Courses panel
 * - Loads curricula from /api/curricula
 * - Loads lessons/slugs from /api/merged/:curriculum/index
 * - Gracefully handles { slugs: [] } | { lessons: [] } | string[]
 */

export default function SidebarPanelCourses() {
  const { curriculum: routeCur } = useParams();
  const navigate = useNavigate();

  const [curricula, setCurricula] = React.useState([]);
  const [cur, setCur] = React.useState(routeCur || "");
  const [loadingCur, setLoadingCur] = React.useState(true);
  const [errCur, setErrCur] = React.useState("");

  const [slugs, setSlugs] = React.useState([]);
  const [loadingLessons, setLoadingLessons] = React.useState(false);
  const [errLessons, setErrLessons] = React.useState("");

  // ---- helpers ----
  const fetchJSON = async (url, signal) => {
    const r = await fetch(url, { signal });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  };

  const toSlug = (x) => (typeof x === "string" ? x : x?.slug || null);

  // Normalize “lessons response”
  const normalizeSlugs = (j) => {
    if (Array.isArray(j)) return j.map(toSlug).filter(Boolean);
    if (Array.isArray(j?.slugs)) return j.slugs.map(toSlug).filter(Boolean);
    if (Array.isArray(j?.lessons)) return j.lessons.map(toSlug).filter(Boolean);
    return [];
  };

  const titleizeSlug = (slug) => {
    if (!slug) return "";
    // ch1 / unit2 / lesson3 -> “Chapter 1” / “Unit 2” / “Lesson 3”
    const m = slug.replace(/[-_]/g, "").match(/^(ch|unit|lesson)(\d+)$/i);
    if (m) {
      const label = m[1].toLowerCase() === "ch" ? "Chapter" : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
      return `${label} ${Number(m[2])}`;
    }
    // fallback: "intro-basics" -> "Intro Basics"
    return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const canonicalLessonHref = (curr, slug) => `/${curr}/lessons/${slug}`; // ✅ plural "lessons"

  // ---- load curricula once ----
  React.useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoadingCur(true);
        setErrCur("");
        const j = await fetchJSON("/api/curricula", ac.signal);
        const arr = Array.isArray(j) ? j : j?.curricula || [];
        setCurricula(arr);

        // Pick initial curriculum (prefer route)
        const initial = routeCur || arr[0] || "";
        setCur(initial);
      } catch (e) {
        setErrCur(e?.message || "Failed to load curricula");
        setCurricula([]);
      } finally {
        setLoadingCur(false);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- load lessons whenever curriculum changes ----
  React.useEffect(() => {
    if (!cur) {
      setSlugs([]);
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        setLoadingLessons(true);
        setErrLessons("");
        setSlugs([]);
        const j = await fetchJSON(`/api/merged/${cur}/index`, ac.signal);
        setSlugs(normalizeSlugs(j));
      } catch (e) {
        setErrLessons(e?.message || "Failed to load lessons");
        setSlugs([]);
      } finally {
        setLoadingLessons(false);
      }
    })();
    return () => ac.abort();
  }, [cur]);

  // ---- actions ----
  const switchCurriculum = (next) => {
    setCur(next);
    navigate(`/${next}/lessons`); // ✅ push to canonical hub
  };

  const hasData = slugs.length > 0;

  return (
    <div className="sb-panel" aria-label="Courses Panel">
      {/* Curricula selector */}
      <div className="sb-chips" role="listbox" aria-label="Curricula">
        {loadingCur && <div className="sb-skel">Loading curricula…</div>}
        {!!errCur && <div className="sb-skel" style={{ color: "#b45309" }}>⚠ {errCur}</div>}
        {!loadingCur && !errCur && (!curricula.length ? (
          <div className="sb-skel">No curricula yet.</div>
        ) : (
          curricula.map((c) => (
            <button
              key={c}
              role="option"
              aria-selected={c === cur}
              className={`sb-chip${c === cur ? " is-active" : ""}`}
              onClick={() => switchCurriculum(c)}
              title={c.toUpperCase()}
            >
              📚 {c.toUpperCase()}
            </button>
          ))
        ))}
      </div>

      {/* Course block */}
      <div className="sb-course" aria-label={`Course: ${cur || ""}`}>
        <div className="sb-course__sum">
          <span className="app-ico" aria-hidden>📘</span>
          <strong>{cur ? cur.toUpperCase() : "Course"}</strong>
          <span className="sb-badge">{slugs.length} lessons</span>
        </div>

        <div className="sb-unit">
          <div className="sb-unit__sum">
            <span className="app-ico" aria-hidden>📂</span>
            <span>All Lessons</span>
          </div>

          {loadingLessons && <div className="sb-skel">Loading lessons…</div>}
          {!!errLessons && <div className="sb-skel" style={{ color: "#b45309" }}>⚠ {errLessons}</div>}

          {!loadingLessons && !errLessons && (!hasData ? (
            <div className="sb-skel">No lessons yet.</div>
          ) : (
            <ol className="sb-lessons">
              {slugs.map((slug) => (
                <li key={slug} className="sb-row">
                  <AppLink
                    to={canonicalLessonHref(cur, slug)}
                    className="app-nav__item"
                    title={titleizeSlug(slug)}
                  >
                    <span className="app-ico" aria-hidden>📖</span>
                    <span className="sb-lessonTitle">{titleizeSlug(slug)}</span>
                    <span className="sb-min">~10m</span>
                  </AppLink>
                </li>
              ))}
            </ol>
          ))}
        </div>
      </div>
    </div>
  );
}
