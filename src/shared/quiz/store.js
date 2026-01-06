// src/shared/quiz/store.js
const K = (lessonId) => `civic:quiz:${lessonId}`;

export function readQuizState(lessonId) {
  try { return JSON.parse(localStorage.getItem(K(lessonId)) || "{}"); }
  catch { return {}; }
}
export function writeQuizState(lessonId, state) {
  try {
    localStorage.setItem(K(lessonId), JSON.stringify(state));
    window.dispatchEvent(new StorageEvent("storage", { key: K(lessonId), newValue: "updated" }));
  } catch {}
}

/** Count distinct correct answers stored for a lesson */
export function countCorrect(lessonId) {
  const s = readQuizState(lessonId);
  return Object.values(s).filter(v => v?.isCorrect === true).length;
}
