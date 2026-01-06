// src/components/LessonInShell.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import CurriculumShellTemplate from "@/components/templates/CurriculumShellTemplate.jsx";
import LessonTemplate from "@/components/LessonTemplate.jsx";
import normalizeMergedLesson from "@/utils/normalizeMergedLesson.js";
import { LESSONS, LESSON } from "@/router/paths.js"; // ✅ use canonical builders

export default function LessonInShell({
  node = {},
  role = "student",
  onComplete = () => {},
  onSectionView = () => {},
  progressKey: progressKeyProp, // optional override
}) {
  const { curriculum = "asl", slug = "ch1" } = useParams();
  const navigate = useNavigate();

  // Normalize incoming lesson (supports student/instructor JSON)
  const data = React.useMemo(() => normalizeMergedLesson(node) || {}, [node]);

  // Safe fallbacks
  const title =
    data.title || data.student?.title || data.instructor?.title || "Untitled Lesson";
  const estMinutes = Number.isFinite(data.estMinutes) ? data.estMinutes : 30;

  const breadcrumbs =
    Array.isArray(data.breadcrumbs) && data.breadcrumbs.length
      ? data.breadcrumbs
      : [
          { label: curriculum.toUpperCase(), href: LESSONS(curriculum) }, // ✅
          { label: title },
        ];

  const instructor = data.instructor ?? null;

  // Progress key (use provided prop if given)
  const progressKey = progressKeyProp || `lesson.done.${curriculum}.${slug}`;

  /* ---------- Build prev/next from the curriculum index ---------- */
  const [slugs, setSlugs] = React.useState([]);
  const [loadingIdx, setLoadingIdx] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingIdx(true);

    (async () => {
      try {
        const res = await fetch(`/api/merged/${curriculum}/index`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        const j = await res.json();
        // Accept shapes: {lessons:[{slug}]}, {slugs:[...]} or array
        const raw = Array.isArray(j) ? j : j.lessons || j.slugs || [];
        const extracted = raw
          .map((v) => (typeof v === "string" ? v : v?.slug))
          .filter(Boolean);

        if (!cancelled) setSlugs(extracted);
      } catch {
        if (!cancelled) setSlugs([]);
      } finally {
        if (!cancelled) setLoadingIdx(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [curriculum]);

  const curIdx = React.useMemo(() => slugs.indexOf(slug), [slugs, slug]);
  const prevSlug = curIdx > 0 && curIdx !== -1 ? slugs[curIdx - 1] : null;
  const nextSlug =
    curIdx !== -1 && curIdx < slugs.length - 1 ? slugs[curIdx + 1] : null;

  /* ---------- Navigation (canonical /lessons/) ---------- */
  const goPrev = React.useCallback(() => {
    if (prevSlug) navigate(LESSON(curriculum, prevSlug)); // ✅
  }, [navigate, curriculum, prevSlug]);

  const goNext = React.useCallback(() => {
    if (nextSlug) navigate(LESSON(curriculum, nextSlug)); // ✅
  }, [navigate, curriculum, nextSlug]);

  // When marked complete → callback + advance
  const handleMarkComplete = React.useCallback(() => {
    try { onComplete(); } catch {}
    if (nextSlug) goNext();
  }, [onComplete, nextSlug, goNext]);

  // J / K keyboard shortcuts for next/prev
  React.useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.isComposing) return;

      const k = e.key;
      if (k === "j" || k === "J") {
        e.preventDefault();
        goNext();
      } else if (k === "k" || k === "K") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Prefer student slice if present
  const lessonForRender = data.student || data;

  /* ---------- Section view observer (fires once per section) ---------- */
  React.useEffect(() => {
    let io = null;
    let beforeUnloadBound = false;
    const seen = new Set();

    const teardown = () => {
      if (io) io.disconnect();
      if (beforeUnloadBound) {
        window.removeEventListener("beforeunload", teardown);
      }
      beforeUnloadBound = false;
    };

    const frame = window.requestAnimationFrame(() => {
      const root =
        document.getElementById("lesson-content") ||
        document.querySelector("[data-lesson-root]") ||
        document.querySelector(".lesson-root") ||
        document.querySelector("main[role='main']") ||
        document;

      const targets = [
        ...root.querySelectorAll("[data-lesson-section]"),
        ...root.querySelectorAll("section[id]"),
        ...root.querySelectorAll("h2"),
      ];
      if (!targets.length) return;

      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;

            const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
            const label =
              el.getAttribute?.("data-lesson-section") ||
              el.getAttribute?.("id") ||
              txt.slice(0, 80) ||
              "section";

            if (seen.has(label)) return;
            seen.add(label);

            try { onSectionView(label); } catch {}
          });
        },
        { root: null, rootMargin: "0px 0px -40% 0px", threshold: 0.4 }
      );

      targets.forEach((t) => io.observe(t));
      window.addEventListener("beforeunload", teardown, { once: true });
      beforeUnloadBound = true;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      teardown();
    };
  }, [lessonForRender, onSectionView, curriculum, slug]);

  return (
    <CurriculumShellTemplate
      title={title}
      minutes={estMinutes}
      role={role}
      breadcrumbs={breadcrumbs}
      prevHref={prevSlug ? LESSON(curriculum, prevSlug) : null} // ✅
      nextHref={nextSlug ? LESSON(curriculum, nextSlug) : null} // ✅
      loadingIndex={loadingIdx}
    >
      <LessonTemplate
        lesson={lessonForRender}
        instructorMeta={instructor}
        mode={role}
        curriculum={curriculum}
        currentSlug={slug}
        prevSlug={prevSlug}
        nextSlug={nextSlug}
        progressKey={progressKey}
        onMarkComplete={handleMarkComplete}
        onPrev={goPrev}
        onNext={goNext}
        onSectionView={onSectionView}
      />
    </CurriculumShellTemplate>
  );
}
