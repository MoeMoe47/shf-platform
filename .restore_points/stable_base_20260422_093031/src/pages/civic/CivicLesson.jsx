// src/pages/civic/CivicLesson.jsx
import React from "react";
import { useLocation, useParams } from "react-router-dom";
import LessonBody from "@/components/civic/LessonBody.jsx";
import lessons from "@/data/civic/micro-lessons.v1.json";
import SpeakerBtn from "@/components/SpeakerBtn.jsx";

function useLessonId() {
  const { search } = useLocation();
  const params = useParams?.() || {};
  const fromQuery = new URLSearchParams(search).get("id");
  return fromQuery || params.id || null;
}

function loadLessonById(id) {
  if (!id) return null;
  const flat = Array.isArray(lessons) ? lessons : lessons?.items || [];
  return flat.find((l) => String(l.id) === String(id)) || null;
}

export default function CivicLesson() {
  const id = useLessonId() || "civ-101";
  const lesson = loadLessonById(id);
  const [focus, setFocus] = React.useState(false);

  // Focus mode → toggles an attribute for CSS to target (optional)
  React.useEffect(() => {
    const html = document.documentElement;
    if (focus) html.setAttribute("data-focus", "1");
    else html.removeAttribute("data-focus");
  }, [focus]);

  // Simple scroll progress → updates #les-progress width
  React.useEffect(() => {
    const el = document.getElementById("les-progress");
    if (!el) return;
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight || 1;
      const pct = Math.max(0, Math.min(1, scrolled / max));
      el.style.width = `${Math.round(pct * 100)}%`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Text to read aloud
  const readTitleAndOverview = [
    lesson?.title || "",
    (lesson?.objectives || []).map((o, i) => `${i + 1}. ${o}`).join(". "),
  ]
    .filter(Boolean)
    .join(". ");

  const readFullPage = [
    readTitleAndOverview,
    (lesson?.sections || [])
      .map((s, i) => `${s?.heading || `Section ${i + 1}`}. ${typeof s?.body === "string" ? s.body.replace(/<[^>]+>/g, " ") : ""}`)
      .join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="crb-main" aria-labelledby="lesson-title">
      {/* Top strip: progress + Focus + speakers */}
      <div className="card card--pad" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: "#eef2ff", borderRadius: 999, overflow: "hidden" }}>
            <div id="les-progress" style={{ width: "0%", height: "100%", background: "var(--brand,#2563eb)", opacity: 0.4 }} />
          </div>
        </div>
        <SpeakerBtn text={readTitleAndOverview} label="Read title + objectives" />
        <SpeakerBtn text={readFullPage} label="Read page" />
        <button className="sh-btn is-ghost" onClick={() => setFocus((f) => !f)}>
          {focus ? "Exit Focus" : "Focus Mode"}
        </button>
      </div>

      <LessonBody lesson={lesson} nextHref={null} />
    </section>
  );
}
