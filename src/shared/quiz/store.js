// src/shared/quiz/store.js
//
// Phase 2B: this file previously had zero live callers anywhere in the
// repo despite being real, working code — the `app` param below is
// additive (defaults to "civic", the original hardcoded prefix, so any
// future civic caller stays byte-identical) and lets Curriculum become
// its first real consumer without a second, duplicate quiz store.
const K = (lessonId, app = "civic") => `${app}:quiz:${lessonId}`;

export function readQuizState(lessonId, app = "civic") {
  try { return JSON.parse(localStorage.getItem(K(lessonId, app)) || "{}"); }
  catch { return {}; }
}
export function writeQuizState(lessonId, state, app = "civic") {
  try {
    localStorage.setItem(K(lessonId, app), JSON.stringify(state));
    window.dispatchEvent(new StorageEvent("storage", { key: K(lessonId, app), newValue: "updated" }));
  } catch {}
}

/** Count distinct correct answers stored for a lesson */
export function countCorrect(lessonId, app = "civic") {
  const s = readQuizState(lessonId, app);
  return Object.values(s).filter(v => v?.isCorrect === true).length;
}
