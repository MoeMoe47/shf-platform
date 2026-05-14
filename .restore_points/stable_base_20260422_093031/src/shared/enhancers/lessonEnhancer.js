import { audit } from "@/shared/audit/auditClient.js";
import { isEnabled } from "@/shared/appFlags.js";

/** Enhance lessons without altering layout (no DOM insertions in Career). */
export function bootLessonEnhancer({ app="unknown", lessonId="lesson:unknown", showProgressUI=false } = {}) {
  try {
    const root = document.querySelector('[data-sec], [data-lesson-root]')?.closest('main, [data-app], body') || document;
    if (!root) return;

    const KEY_SEEN = `seen:${lessonId}`;
    const seen = JSON.parse(localStorage.getItem(KEY_SEEN) || "{}");
    const io = new IntersectionObserver((entries) => {
      let changed = false;
      for (const ent of entries) {
        if (ent.isIntersecting) {
          const id = ent.target.getAttribute("data-sec");
          if (id && !seen[id]) { seen[id] = true; changed = true; }
        }
      }
      if (changed) {
        localStorage.setItem(KEY_SEEN, JSON.stringify(seen));
        audit("section_seen", { app, lessonId, seenCount: Object.keys(seen).length });
      }
    }, { rootMargin: "0px 0px -40% 0px", threshold: 0.2 });

    root.querySelectorAll('[data-sec]').forEach(el => io.observe(el));

    // Optional lightweight progress UI for non-career apps only (opt-in)
    if (showProgressUI && isEnabled(app, "showProgressUI")) {
      // no-op here to avoid any layout shifts by default; you can mount your own bar using seen data if desired
    }
  } catch {}
}

export function onQuizSubmitEnhance({ app="unknown", lessonId="lesson:unknown" }={}, result) {
  audit("quiz_submit", { app, lessonId, result });
}
