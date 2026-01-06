// src/shared/quiz/grade.js
export function gradeMCQ(userIdx, correctIdx) {
  const isCorrect = Number(userIdx) === Number(correctIdx);
  const score = isCorrect ? 1 : 0;
  return { isCorrect, score };
}
