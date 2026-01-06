// src/pages/LessonPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import LessonInShell from "@/components/LessonInShell.jsx";
import HtmlFallback from "@/components/HtmlFallback.jsx";
import normalizeMerged from "@/utils/normalizeMergedLesson.js";
import * as mergedApi from "@/utils/mergedApi.js"; // optional (guarded below)

/* ---------- 1) Local fallback import map (ASL) ---------- */
const LOCAL_ASL = {
  // student copies
  "student.asl-01": () => import("@/content/lessons/asl-student/student.asl-01.json"),
  "student.asl-02": () => import("@/content/lessons/asl-student/student.asl-02.json"),
  "student.asl-03": () => import("@/content/lessons/asl-student/student.asl-03.json"),
  "student.asl-04": () => import("@/content/lessons/asl-student/student.asl-04.json"),
  "student.asl-05": () => import("@/content/lessons/asl-student/student.asl-05.json"),
  "student.asl-06": () => import("@/content/lessons/asl-student/student.asl-06.json"),
  "student.asl-07": () => import("@/content/lessons/asl-student/student.asl-07.json"),
  "student.asl-08": () => import("@/content/lessons/asl-student/student.asl-08.json"),
  "student.asl-09": () => import("@/content/lessons/asl-student/student.asl-09.json"),
  "student.asl-10": () => import("@/content/lessons/asl-student/student.asl-10.json"),

  // master copies
  "asl-1-foundations":            () => import("@/content/lessons/asl-master/asl-1-foundations.json"),
  "asl-2-communication-basics":   () => import("@/content/lessons/asl-master/asl-2-communication-basics.json"),
  "asl-3-descriptions-space":     () => import("@/content/lessons/asl-master/asl-3-descriptions-space.json"),
  "asl-4-classifiers-movement":   () => import("@/content/lessons/asl-master/asl-4-classifiers-movement.json"),
  "asl-5-narratives-past-future": () => import("@/content/lessons/asl-master/asl-5-narratives-past-future.json"),
  "asl-6-questions-roleshift":    () => import("@/content/lessons/asl-master/asl-6-questions-roleshift.json"),
  "asl-7-community-culture":      () => import("@/content/lessons/asl-master/asl-7-community-culture.json"),
  "asl-8-interpretive-skills":    () => import("@/content/lessons/asl-master/asl-8-interpretive-skills.json"),
  "asl-9-presentational-project": () => import("@/content/lessons/asl-master/asl-9-presentational-project.json"),
  "asl-10-capstone":               () => import("@/content/lessons/asl-master/asl-10-capstone.json"),
};

/* ---------- 2) alias builder: ch1 -> student/master ids ---------- */
function aliases(cur, slug) {
  const xs = [slug];
  const m = /^ch(\d+)(?:-(.*))?$/i.exec(slug || "");
  if (m) {
    const n = String(+m[1]);      // "1"
    const nn = n.padStart(2, "0"); // "01"
    xs.push(`student.${cur}-${nn}`); // student.asl-01

    if (cur === "asl") {
      const table = {
        "01": "asl-1-foundations",
        "02": "asl-2-communication-basics",
        "03": "asl-3-descriptions-space",
        "04": "asl-4-classifiers-movement",
        "05": "asl-5-narratives-past-future",
        "06": "asl-6-questions-roleshift",
        "07": "asl-7-community-culture",
        "08": "asl-8-interpretive-skills",
        "09": "asl-9-presentational-project",
        "10": "asl-10-capstone",
      };
      if (table[nn]) xs.push(table[nn]);
    }
  }
  return Array.from(new Set(xs));
}

/* ---------- 3) loaders with guard/timeout ---------- */
const withTimeout = (p, ms = 8000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });

async function tryMerged(cur, slug) {
  if (!mergedApi || typeof mergedApi.getLesson !== "function") throw new Error("no-mergedApi");
  const d = await withTimeout(mergedApi.getLesson(cur, slug));
  if (!d) throw new Error("merged-empty");
  return d;
}

async function tryApi(cur, slug) {
  const r = await withTimeout(fetch(`/api/merged/${cur}/${slug}`));
  if (!r.ok) throw new Error(`api:${r.status}`);
  return r.json();
}

async function tryLocal(cur, key) {
  if (cur !== "asl") throw new Error("no-local");
  const f = LOCAL_ASL[key];
  if (!f) throw new Error("no-local");
  const mod = await f();
  return mod?.default ?? mod;
}

/* ---------- 4) normalize for the shell ---------- */
function normalizeForShell(raw, { curriculum, slug }) {
  const base = typeof normalizeMerged === "function"
    ? normalizeMerged(raw, { curriculum, slug })
    : raw || {};

  const secs = base.sections || {};
  return {
    id: base.id || `${curriculum}-${slug}`,
    title: base.title || base.name || `ASL Lesson ${slug.toUpperCase()}`,
    level: base.level || base.difficulty || "Beginner",
    minutes: base.minutes || base.estimate || 30,
    video: base.video || base.media?.video || null,
    sections: {
      intro: secs.intro || base.intro || [],
      vocabulary: secs.vocabulary || secs.vocab || base.vocab || [],
      practice: secs.practice || [],
      artifacts: secs.artifacts || [],
      reflection: secs.reflection || [],
      mastery: secs.mastery || null,
    },
    meta: base.meta || {},
  };
}

/* ---------- 5) Component ---------- */
export default function LessonPage() {
  const { curriculum = "asl", slug = "ch1" } = useParams();
  const [lesson, setLesson] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const [debug, setDebug] = React.useState({ tried: [] });

  React.useEffect(() => {
    let alive = true;
    setLesson(null); setErr(null); setDebug({ tried: [] });

    (async () => {
      const cur = (curriculum || "").toLowerCase();
      const sl = (slug || "").toLowerCase();
      const tries = aliases(cur, sl);

      const mark = (kind, key, ok, info) =>
        setDebug((d) => ({ tried: [...d.tried, { kind, key, ok, info }] }));

      // 1) mergedApi.getLesson on aliases
      for (const key of tries) {
        try {
          const raw = await tryMerged(cur, key);
          mark("merged", key, true);
          if (!alive) return;
          setLesson(normalizeForShell(raw, { curriculum: cur, slug: key }));
          return;
        } catch (e) { mark("merged", key, false, String(e)); }
      }

      // 2) REST API on aliases
      for (const key of tries) {
        try {
          const raw = await tryApi(cur, key);
          mark("api", key, true);
          if (!alive) return;
          setLesson(normalizeForShell(raw, { curriculum: cur, slug: key }));
          return;
        } catch (e) { mark("api", key, false, String(e)); }
      }

      // 3) local JSON (ASL)
      for (const key of tries) {
        try {
          const raw = await tryLocal(cur, key);
          mark("local", key, true);
          if (!alive) return;
          setLesson(normalizeForShell(raw, { curriculum: cur, slug: key }));
          return;
        } catch (e) { mark("local", key, false, String(e)); }
      }

      if (alive) setErr(new Error(`Failed to load lesson ${sl} in ${cur}`));
    })();

    return () => { alive = false; };
  }, [curriculum, slug]);

  if (err) {
    // Helpful debug in dev
    if (import.meta.env.DEV) {
      console.table(debug.tried);
    }
    return (
      <HtmlFallback
        path={`/curriculum/${curriculum}/${slug}.html`}
        title={`Lesson ${slug}`}
        note="Showing HTML fallback because merged content wasn’t available."
      />
    );
  }

  if (!lesson) {
    return <div style={{ padding: 20 }}>Loading lesson…</div>;
  }

  return (
    <LessonInShell
      curriculum={curriculum}
      slug={slug}
      lesson={lesson}
      // Debug: see where it came from in React DevTools
      sourceHint={
        debug.tried.find((t) => t.ok)?.kind + ":" + debug.tried.find((t) => t.ok)?.key
      }
    />
  );
}
