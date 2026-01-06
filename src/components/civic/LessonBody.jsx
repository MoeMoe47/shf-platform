// src/components/civic/LessonBody.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import earn from "@/shared/credit/earn-shim.js";
import { enqueue } from "@/shared/offline/queue.js";
import { touchStreak } from "@/shared/engagement/streaks.js";
import { award } from "@/shared/rewards/shim.js";
import { useLocale } from "@/context/LocaleProvider.jsx";
import { useReadingLevel } from "@/context/ReadingLevelProvider.jsx";
import { getVariant } from "@/shared/reading-level/getVariant.js";
import { seedReview, getDue, scheduleNext } from "@/shared/review/spacedReview.js";

/* ✅ NEW: shared accreditation components/styles */
import AccreditationPanel from "@/components/civic/AccreditationPanel.jsx";
import "@/styles/accreditation.css";

/* ------------------------------------------------------------------
   Small helpers
------------------------------------------------------------------- */
function ping(name, data = {}) {
  try {
    window.dispatchEvent(new CustomEvent("analytics:ping", { detail: { name, ...data } }));
  } catch {}
}

function useSpeech() {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const [speaking, setSpeaking] = React.useState(false);
  const speak = React.useCallback((text, opts = {}) => {
    if (!synth || !text) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (opts.lang) u.lang = opts.lang;
      if (opts.rate) u.rate = opts.rate;
      if (opts.pitch) u.pitch = opts.pitch;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      synth.speak(u);
    } catch {}
  }, [synth]);
  const stop = React.useCallback(() => {
    try { synth?.cancel(); setSpeaking(false); } catch {}
  }, [synth]);
  return { speak, stop, speaking };
}

/* ------------------------------------------------------------------
   ReviewTrainer (SRS modal)
------------------------------------------------------------------- */
function ReviewTrainer({ open, onClose, mode = "due", seedStack = [] }) {
  const [cards, setCards] = React.useState([]);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "practice") {
      setCards(Array.isArray(seedStack) ? [...seedStack] : []);
      setIdx(0);
    } else {
      const due = getDue(Date.now());
      setCards(due);
      setIdx(0);
    }
  }, [open, mode, seedStack]);

  if (!open) return null;
  const card = cards[idx];
  const close = () => onClose?.();

  const answer = (rating) => {
    try {
      if (mode === "due" && card?.id) scheduleNext(card.id, rating); // 0..3
    } catch {}
    const next = idx + 1;
    if (next >= cards.length) onClose?.({ finished: true, count: cards.length, mode });
    else setIdx(next);
  };

  return (
    <div className="kb-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="kb-card" role="dialog" aria-modal="true" aria-label="Review">
        <div className="sh-cardHead" style={{ marginBottom: 8 }}>
          <strong>{mode === "practice" ? "Practice" : "Review"} ({idx + 1}/{cards.length || 0})</strong>
        </div>
        {card ? (
          <>
            <div className="sh-callout sh-callout--example" style={{ marginBottom: 8 }}>
              <div className="sh-calloutHead">
                <span className="sh-calloutIcon">📘</span>
                <strong>{card.kind === "vocab" ? "Term" : "Prompt"}</strong>
              </div>
              <div className="sh-calloutBody">{card.prompt}</div>
            </div>
            {card.answer ? (
              <details className="sh-collapse" open>
                <summary className="sh-collapseSummary">Show answer</summary>
                <div className="sh-collapseBody">
                  <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{card.answer}</p>
                </div>
              </details>
            ) : null}
            <div className="sh-actionsRow" style={{ marginTop: 10, gap: 6 }}>
              <button className="sh-btn" onClick={() => answer(0)} title="Again">Again</button>
              <button className="sh-btn" onClick={() => answer(1)} title="Hard">Hard</button>
              <button className="sh-btn sh-btn--secondary" onClick={() => answer(2)} title="Good">Good</button>
              <button className="sh-btn sh-btn--primary" onClick={() => answer(3)} title="Easy">Easy</button>
              <button className="sh-btn is-ghost" onClick={close} style={{ marginLeft: "auto" }}>Close</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: 0 }}>No cards in this stack.</p>
            <div className="sh-actionsRow" style={{ marginTop: 8 }}>
              <button className="sh-btn sh-btn--primary" onClick={close}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   MicroQuiz
------------------------------------------------------------------- */
function MicroQuiz(props) {
  const { toast } = useToasts?.() || { toast: (m) => alert(m) };
  const lessonId = props.lessonId || "";
  const KEY = `civic:quiz:${lessonId}`;

  const questions = React.useMemo(() => {
    if (props.questions && Array.isArray(props.questions)) return props.questions;
    if (props.qid != null) {
      return [{
        q: props.stem ?? "",
        a: Array.isArray(props.choices) ? props.choices : [],
        correct: Number(props.correctIndex ?? -1),
        hint: props.hint ?? undefined,
        _qid: props.qid,
      }];
    }
    return [];
  }, [props.questions, props.qid, props.stem, props.choices, props.correctIndex, props.hint]);

  if (!questions.length) return null;

  const [answers, setAnswers] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
  });
  const [showHintIdx, setShowHintIdx] = React.useState(null);

  const onPick = (i, choiceIdx) => {
    const next = { ...answers, [i]: choiceIdx };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setAnswers(next);
  };

  const onCheck = () => {
    let got = 0;
    questions.forEach((q, i) => { if (Number(answers[i]) === Number(q.correct)) got += 1; });

    if (got > 0) {
      earn({ kind: "microquiz", points: got, meta: { lessonId } });
      window.dispatchEvent(new Event("rewards:update"));
      window.dispatchEvent(new Event("rewards:pulse"));
      ping("civic.lesson.quiz.submit", { lessonId, correct: got, total: questions.length });
      (toast || alert)(`+${got} point${got === 1 ? "" : "s"} from Micro-Quiz!`, { type: "success" });

      try {
        const K_ANY = "civic:quiz:anyCorrect";
        const K_TOT = "civic:quiz:correctTotal";
        localStorage.setItem(K_ANY, "1");
        const tot = got + Number(localStorage.getItem(K_TOT) || "0");
        localStorage.setItem(K_TOT, String(tot));
        if (tot >= 5) award("quiz_5");
        window.dispatchEvent(new Event("rewards:update"));
      } catch {}
    } else {
      (toast || alert)("No correct answers yet — try again! (Hints can help)", { type: "info" });
    }
  };

  return (
    <section className="sh-mcq" aria-label="Micro-Quiz">
      <h3 className="sh-mcqQ">Quick Check</h3>
      <div className="sh-mcqBody" style={{ display: "grid", gap: 10 }}>
        {questions.map((q, i) => {
          const picked = answers[i];
          const correct = Number(picked) === Number(q.correct);
          const stateClass = picked == null ? "" : (correct ? "is-correct" : "is-wrong");
          return (
            <div key={i} className={`sh-mcq ${stateClass}`} style={{ marginTop: 0 }}>
              <div className="sh-mcqQ" style={{ marginBottom: 6 }}>{q.q}</div>
              <div className="sh-mcqOpts">
                {(q.a || []).map((opt, idx) => (
                  <button
                    key={idx}
                    className={`sh-mcqBtn ${picked === idx ? "is-picked" : ""}`}
                    onClick={() => onPick(i, idx)}
                    aria-pressed={picked === idx}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="sh-mcqFeedback">
                <button className="sh-linkBtn" onClick={() => setShowHintIdx(showHintIdx === i ? null : i)}>
                  {showHintIdx === i ? "Hide hint" : "Need a hint?"}
                </button>
                {showHintIdx === i && q.hint ? (
                  <div className="sh-callout sh-callout--tip" style={{ marginTop: 8 }}>
                    <div className="sh-calloutHead"><span className="sh-calloutIcon">💡</span><strong>Hint</strong></div>
                    <div className="sh-calloutBody">{q.hint}</div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="sh-btn sh-btn--primary" onClick={onCheck}>Check Answers</button>
        <button
          className="sh-btn sh-btn--secondary"
          onClick={() => window.dispatchEvent(new CustomEvent("coach:open", { detail: { lessonId } }))}
        >
          Ask Coach
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   NotesModal — quick capture → Portfolio (kind: "note")
------------------------------------------------------------------- */
function NotesModal({ open, onClose, onSave }) {
  const [text, setText] = React.useState("");
  if (!open) return null;
  return (
    <div className="kb-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="kb-card" role="dialog" aria-modal="true" aria-label="Add Note">
        <strong style={{ fontSize: 16 }}>Add Note</strong>
        <textarea
          className="sh-input"
          rows={6}
          style={{ marginTop: 8, resize: "vertical" }}
          placeholder="What’s important here? Summarize or highlight a key idea."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="sh-actionsRow" style={{ marginTop: 8 }}>
          <button
            className="sh-btn"
            onClick={() => { onSave?.(text.trim()); setText(""); onClose?.(); }}
            disabled={!text.trim()}
          >
            Save to Portfolio
          </button>
          <button className="sh-btn is-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Main LessonBody (toggleable Accreditation layer)
------------------------------------------------------------------- */
export default function LessonBody({ lesson, nextId, onGoNext }) {
  const { toast } = useToasts?.() || { toast: (m) => alert(m) };
  const { t, locale } = useLocale?.() || { t: (s) => s, locale: "en" };
  const { level } = useReadingLevel?.() || { level: "standard" };
  const { speak, stop, speaking } = useSpeech();
  const lang = locale === "es" ? "es-ES" : "en-US";

  const vLesson = React.useMemo(() => getVariant(lesson, { locale, level }), [lesson, locale, level]);

  // seed spaced-review
  React.useEffect(() => {
    if (!lesson) return;
    try {
      const cards = [
        ...(Array.isArray(vLesson?.vocab) ? vLesson.vocab : []).map((v) => {
          const term = typeof v === "string" ? v : v?.term ?? "";
          const def = typeof v === "string" ? "" : v?.def ?? "";
          return { id: `vocab:${lesson.id}:${term}`, kind: "vocab", prompt: term, answer: def, lessonId: String(lesson.id) };
        }),
        ...(Array.isArray(vLesson?.objectives) ? vLesson.objectives : []).map((o, i) => ({
          id: `obj:${lesson.id}:${i + 1}`, kind: "objective", prompt: String(o), answer: "", lessonId: String(lesson.id),
        })),
      ];
      seedReview(cards);
    } catch {}
  }, [lesson, vLesson]);

  const id = String(lesson?.id || "unknown");
  const LES_KEY = (x) => `civic:lesson:${x}:seen`;
  const totalSections = 4;

  /* Mastery */
  const objIds = React.useMemo(() => (lesson?.objectives || []).map((_, i) => `obj${i + 1}`), [lesson?.objectives]);
  function readMastery(objKey) {
    try { return Number(localStorage.getItem(`civic:lesson:${id}:mastery:${objKey}`) || "0"); } catch { return 0; }
  }
  function writeMastery(objKey, val) {
    try {
      const v = Math.max(0, Math.min(3, Number(val || 0)));
      localStorage.setItem(`civic:lesson:${id}:mastery:${objKey}`, String(v));
    } catch {}
  }
  function bumpAllAtLeast(minVal) {
    objIds.forEach((k) => { const cur = readMastery(k); if (cur < minVal) writeMastery(k, minVal); });
    setMasteryMap((m) => {
      const next = { ...(m || {}) };
      objIds.forEach((k) => { next[k] = Math.max(Number(next[k] || 0), minVal); });
      return next;
    });
  }
  const [masteryMap, setMasteryMap] = React.useState(() => Object.fromEntries(objIds.map((k) => [k, readMastery(k)])));

  /* resume meta + streak + analytics */
  React.useEffect(() => {
    try {
      localStorage.setItem("civic:lastLessonId", String(id));
      localStorage.setItem(`civic:lesson:${id}:title`, vLesson?.title || "");
    } catch {}
  }, [id, vLesson?.title]);
  React.useEffect(() => {
    const s = touchStreak();
    if (s === 3) award("streak_3");
    if (s === 7) award("streak_7");
  }, []);
  React.useEffect(() => { ping("civic.lesson.view", { id, title: vLesson?.title || "" }); }, [id, vLesson?.title]);

  /* seen tracking */
  const SECTION_IDS = ["objectives", "vocab", "content", "reflection"];
  const sectionRefs = React.useRef(Object.fromEntries(SECTION_IDS.map((s) => [s, React.createRef()])));
  const [seen, setSeen] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`civic:lesson:${id}:seen`) || "[]")); } catch { return new Set(); }
  });

  React.useEffect(() => {
    const key = `civic:lesson:${id}:seen`;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const section = e.target.getAttribute("data-section");
        if (!section || !SECTION_IDS.includes(section)) return;
        setSeen((prev) => {
          if (prev.has(section)) return prev;
          const next = new Set(prev);
          next.add(section);
          try { localStorage.setItem(key, JSON.stringify([...next])); } catch {}
          document.documentElement.style.setProperty("--lessonProgress",
            Math.min(100, Math.round(((next.size + (isComplete ? 1 : 0)) / (totalSections + 1)) * 100)) + "%"
          );
          ping("civic.lesson.seen", { id, section });
          if (section === "objectives") bumpAllAtLeast(1);
          return next;
        });
      });
    }, { rootMargin: "0px 0px -30% 0px", threshold: 0.15 });
    SECTION_IDS.forEach((s) => { const el = sectionRefs.current[s]?.current; if (el) obs.observe(el); });
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* reflection */
  const [reflection, setReflection] = React.useState(() => {
    try { return localStorage.getItem(`civic:lesson:${id}:reflection`) || ""; } catch { return ""; }
  });
  const lastReflectionRef = React.useRef("");
  const refTextarea = React.useRef(null);

  React.useEffect(() => {
    const onSuggest = (e) => {
      const text = (e.detail?.text || "").trim();
      if (!text) return;
      lastReflectionRef.current = reflection;
      setReflection((prev) => (prev ? prev + "\n\n" + text : text));
      try {
        const undo = () => setReflection(lastReflectionRef.current);
        toast?.("Suggestion inserted.", { actionText: "Undo", onAction: undo, type: "success" });
      } catch {}
      refTextarea.current?.focus?.();
    };
    window.addEventListener("coach:suggest", onSuggest);
    return () => window.removeEventListener("coach:suggest", onSuggest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflection]);

  /* completion + progress */
  const [isComplete, setIsComplete] = React.useState(() => {
    try { return localStorage.getItem(`civic:lesson:${id}:complete`) === "1"; } catch { return false; }
  });
  const progressPct = React.useMemo(() => Math.min(100, Math.round(((seen.size + (isComplete ? 1 : 0)) / (totalSections + 1)) * 100)), [seen, isComplete]);
  function emitProgress() {
    const pct = Math.min(100, Math.round(((seen.size + (isComplete ? 1 : 0)) / (totalSections + 1)) * 100));
    document.documentElement.style.setProperty("--lessonProgress", pct + "%");
  }
  React.useEffect(() => { emitProgress(); }, [seen, isComplete]);

  const progressLiveRef = React.useRef(null);
  React.useEffect(() => {
    try { if (progressLiveRef.current) progressLiveRef.current.textContent = `Progress ${progressPct}%`; } catch {}
  }, [progressPct]);

  React.useEffect(() => {
    const tmo = setTimeout(() => {
      const key = `civic:lesson:${id}:reflection`;
      try { localStorage.setItem(key, reflection); } catch {}
      if ((reflection || "").trim().length >= 120) {
        const hitKey = `civic:lesson:${id}:reflectionAwarded`;
        const already = localStorage.getItem(hitKey) === "1";
        if (!already) {
          earn({ kind: "reflection", points: 2, meta: { id } });
          try { localStorage.setItem(hitKey, "1"); } catch {}
          window.dispatchEvent(new CustomEvent("rewards:earned", { detail: { points: 2, kind: "reflection", id } }));
          window.dispatchEvent(new Event("rewards:update"));
          window.dispatchEvent(new Event("rewards:pulse"));
          award("first_reflection");
          enqueue("reflection", { lessonId: id, body: reflection.slice(0, 2000) });
          ping("civic.lesson.reflection_award", { id, points: 2 });
        }
      }
    }, 300);
    return () => clearTimeout(tmo);
  }, [reflection, id]);

  React.useEffect(() => {
    const onQuiz = () => {
      try {
        const kTot = "civic:quiz:correctTotal";
        let total = 0;
        const sRaw = localStorage.getItem(`civic:quiz:${id}`) || "{}";
        const s = JSON.parse(sRaw);
        let usedIsCorrect = false;
        Object.values(s).forEach((v) => {
          if (v && typeof v === "object" && "isCorrect" in v) { usedIsCorrect = true; if (v.isCorrect) total += 1; }
        });
        if (!usedIsCorrect) {
          const bank = [];
          if (Array.isArray(vLesson?.quiz)) bank.push(...vLesson.quiz.map((q) => ({ correct: Number(q.correct) })));
          if (Array.isArray(lesson?.quizzes)) bank.push(...lesson.quizzes.map((q) => ({ correct: Number(q.correctIndex) })));
          Object.keys(s).forEach((k) => {
            const idx = Number(k); const picked = Number(s[k]);
            if (!Number.isNaN(idx) && bank[idx] && Number(bank[idx].correct) === picked) total += 1;
          });
        }
        const prev = Number(localStorage.getItem(kTot) || "0");
        if (total > prev) { localStorage.setItem(kTot, String(total)); bumpAllAtLeast(2); }
        if (total >= 5) award("quiz_5");
        window.dispatchEvent(new Event("rewards:update"));
      } catch {}
    };
    window.addEventListener("storage", onQuiz);
    return () => window.removeEventListener("storage", onQuiz);
  }, [id, lesson, vLesson?.quiz]);

  const onComplete = React.useCallback(() => {
    if (isComplete) return;
    try { localStorage.setItem(`civic:lesson:${id}:complete`, "1"); } catch {}
    setIsComplete(true);
    earn({ kind: "complete", points: 5, meta: { id } });
    window.dispatchEvent(new CustomEvent("rewards:earned", { detail: { points: 5, kind: "complete", id } }));
    window.dispatchEvent(new Event("rewards:update"));
    window.dispatchEvent(new Event("rewards:pulse"));
    let totalCompleted = 0;
    try {
      totalCompleted = Object.keys(localStorage).filter(
        (key) => key.startsWith("civic:lesson:") && key.endsWith(":complete") && localStorage.getItem(key) === "1"
      ).length;
    } catch {}
    if (totalCompleted >= 5) award("five_lessons");
    ping("civic.lesson.complete", { id, points: 5, totalCompleted });
    if (nextId) toast?.("Nice! Ready for the next lesson?");
  }, [isComplete, id, nextId, toast]);

  /* Portfolio */
  const addToPortfolio = React.useCallback(() => {
    const key = "portfolio:items";
    try {
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const artifact = {
        id: `lesson-${id}-${Date.now()}`,
        kind: "lesson",
        title: vLesson?.title || `Lesson ${id}`,
        lessonId: id,
        createdAt: Date.now(),
        tags: ["civic", "lesson"],
        pathwayId: null,
        reflection: (localStorage.getItem(`civic:lesson:${id}:reflection`) || "").slice(0, 1000),
        progress: seen.size ? Math.round((seen.size / totalSections) * 100) : 0,
        meta: {
          pointsAwarded: {
            reflection: localStorage.getItem(`civic:lesson:${id}:reflectionAwarded`) === "1" ? 2 : 0,
            complete: localStorage.getItem(`civic:lesson:${id}:complete`) === "1" ? 5 : 0,
          },
        },
      };
      arr.unshift(artifact);
      localStorage.setItem(key, JSON.stringify(arr));
      enqueue("portfolio", { lessonId: id, title: vLesson?.title || id, tags: ["civic", "lesson"] });
      toast?.("Added to Portfolio", { type: "success" });
      window.dispatchEvent(new CustomEvent("portfolio:update"));
      ping("civic.lesson.portfolio.add", { id });
    } catch { toast?.("Couldn’t add to Portfolio", { type: "error" }); }
  }, [id, vLesson?.title, seen.size, toast]);

  /* Review controls  */
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewMode, setReviewMode] = React.useState("due");
  const [practiceStack, setPracticeStack] = React.useState([]);
  const [dueCount, setDueCount] = React.useState(0);

  const refreshDue = React.useCallback(() => {
    try { setDueCount((getDue(Date.now()) || []).length); } catch { setDueCount(0); }
  }, []);
  React.useEffect(() => { refreshDue(); }, [refreshDue]);
  React.useEffect(() => {
    const onFocus = () => refreshDue();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshDue]);

  function buildPracticeStack() {
    const stack = [];
    (Array.isArray(vLesson?.vocab) ? vLesson.vocab : []).forEach((v) => {
      const term = typeof v === "string" ? v : v?.term ?? "";
      const def = typeof v === "string" ? "" : v?.def ?? "";
      if (!term) return;
      stack.push({ id: `practice:vocab:${id}:${term}`, kind: "vocab", prompt: term, answer: def, lessonId: id });
    });
    (Array.isArray(vLesson?.objectives) ? vLesson.objectives : []).forEach((o, i) => {
      stack.push({ id: `practice:obj:${id}:${i + 1}`, kind: "objective", prompt: String(o), answer: "", lessonId: id });
    });
    return stack;
  }
  const openReview = React.useCallback(() => {
    refreshDue();
    const nowDue = (() => { try { return (getDue(Date.now()) || []).length; } catch { return 0; } })();
    if (nowDue > 0) {
      setReviewMode("due"); setPracticeStack([]); setReviewOpen(true);
      ping("civic.lesson.review.open", { id, mode: "due" });
    } else {
      const stack = buildPracticeStack();
      setReviewMode("practice"); setPracticeStack(stack); setReviewOpen(true);
      ping("civic.lesson.review.open", { id, mode: "practice", size: stack.length });
    }
  }, [id, refreshDue, vLesson]);

  /* ✅ NEW: Evidence Pack helpers (count, clear, print, add) */
  const [evidenceCount, setEvidenceCount] = React.useState(() => {
    try { return ((JSON.parse(localStorage.getItem("evidence:pack") || "[]") || []).length || 0); } catch { return 0; }
  });

  const addToEvidencePack = React.useCallback(() => {
    try {
      const key = "evidence:pack";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const payload = {
        id: `evidence-${id}-${Date.now()}`,
        lessonId: id,
        title: vLesson?.title || `Lesson ${id}`,
        addedAt: new Date().toISOString(),
        objectives: Array.isArray(vLesson?.objectives) ? vLesson.objectives : [],
        vocab: Array.isArray(vLesson?.vocab) ? vLesson.vocab : [],
        reflection: (localStorage.getItem(`civic:lesson:${id}:reflection`) || "").slice(0, 1200),
        progressPct,
      };
      arr.unshift(payload);
      localStorage.setItem(key, JSON.stringify(arr));
      setEvidenceCount(arr.length);
      toast?.("Added to Evidence Pack", { type: "success" });
      ping("civic.lesson.evidence.add", { id });
    } catch { toast?.("Couldn’t add to Evidence Pack", { type: "error" }); }
  }, [id, vLesson?.title, vLesson?.objectives, vLesson?.vocab, progressPct, toast]);

  const clearEvidencePack = React.useCallback(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("evidence:pack") || "[]");
      if (!arr.length) return;
      const ok = window.confirm(`Clear Evidence Pack (${arr.length} item${arr.length === 1 ? "" : "s"})?`);
      if (!ok) return;
      localStorage.setItem("evidence:pack", "[]");
      setEvidenceCount(0);
      toast?.("Evidence Pack cleared", { type: "success" });
      ping("civic.lesson.evidence.clear", { count: arr.length });
    } catch { toast?.("Couldn’t clear Evidence Pack", { type: "error" }); }
  }, [toast]);

  const printEvidencePack = React.useCallback(() => {
    try {
      const key = "evidence:pack";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const html = `
<!doctype html><html><head>
<meta charset="utf-8"/>
<title>Instructor Evidence Pack</title>
<style>
  @page { margin: 18mm; }
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;line-height:1.45;margin:24px;color:#111}
  h1{margin:0 0 8px 0} h2{margin:18px 0 6px 0} h3{margin:14px 0 4px 0}
  .card{border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin:12px 0;page-break-inside:avoid}
  .muted{color:#6b7280;font-size:12px}
  ul{margin:6px 0 0 18px}
  .row{display:flex;gap:8px;align-items:center;justify-content:space-between}
  .chip{display:inline-block;border:1px solid #e5e7eb;border-radius:999px;padding:2px 8px;font-size:12px}
  .hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  @media print {.no-print{display:none}}
</style>
</head><body>
  <div class="hdr">
    <h1>Instructor Evidence Pack</h1>
    <span class="muted">Generated: ${new Date().toLocaleString()}</span>
  </div>
  ${arr.length === 0 ? `<p class="muted">No lessons added yet.</p>` : ""}
  ${arr.map((item) => {
    const vocab = (item.vocab || []).map((v) => typeof v === "string" ? v : `${v.term}${v.def ? " — " + v.def : ""}`);
    return `
      <div class="card">
        <div class="row">
          <h2>${item.title}</h2>
          <span class="chip">Progress: ${item.progressPct || 0}%</span>
        </div>
        <p class="muted">Lesson ID: ${item.lessonId} • Added: ${new Date(item.addedAt).toLocaleString()}</p>
        ${item.objectives?.length ? `<h3>Objectives</h3><ul>${item.objectives.map((o) => `<li>${String(o)}</li>`).join("")}</ul>` : ""}
        ${vocab?.length ? `<h3>Vocabulary</h3><ul>${vocab.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}
        ${item.reflection ? `<h3>Student Reflection (excerpt)</h3><p>${item.reflection.replace(/</g,"&lt;")}</p>` : ""}
      </div>
    `;
  }).join("")}
  <div class="no-print" style="margin-top:16px"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) return;
      w.document.open(); w.document.write(html); w.document.close();
      try { w.focus(); w.print(); } catch {}
      ping("civic.lesson.evidence.print", { count: arr.length });
    } catch { toast?.("Couldn’t open Evidence Pack", { type: "error" }); }
  }, [toast]);

  /* ✅ Accreditation toggle (role-aware, local key) + global sync */
  const [showAccred, setShowAccred] = React.useState(() => {
    try {
      const role = (localStorage.getItem("role") || "").toLowerCase();
      const saved = localStorage.getItem("acc:toggle");
      const global = localStorage.getItem("ui:showAccreditation"); // header switch, if present
      if (saved != null) return saved === "1";
      if (global != null) return global === "1";
      return ["instructor", "teacher", "parent", "admin"].includes(role);
    } catch { return false; }
  });

  const toggleAccred = React.useCallback(() => {
    setShowAccred((v) => {
      const next = !v;
      try {
        localStorage.setItem("acc:toggle", next ? "1" : "0");
        localStorage.setItem("ui:showAccreditation", next ? "1" : "0"); // keep global in sync (optional)
      } catch {}
      try { window.dispatchEvent(new CustomEvent("ui.accreditation.toggle", { detail: { on: next ? 1 : 0, lessonId: id } })); } catch {}
      ping("ui.accreditation.toggle", { on: next ? 1 : 0, lessonId: id });
      return next;
    });
  }, [id]);

  React.useEffect(() => {
    const onExternal = (e) => {
      const on = !!(e?.detail?.on ?? (localStorage.getItem("ui:showAccreditation") === "1"));
      setShowAccred(on);
      try { localStorage.setItem("acc:toggle", on ? "1" : "0"); } catch {}
    };
    window.addEventListener("ui.accreditation.toggle", onExternal);
    window.addEventListener("storage", onExternal);
    return () => {
      window.removeEventListener("ui.accreditation.toggle", onExternal);
      window.removeEventListener("storage", onExternal);
    };
  }, []);

  /* keyboard: prev/next sections + open review + toggle accred (Shift+A) */
  const goToSectionIndex = React.useCallback((nextIdx) => {
    const sections = ["objectives", "vocab", "content", "reflection"];
    const clamped = Math.max(0, Math.min(sections.length - 1, nextIdx));
    const sec = sections[clamped];
    const el = sectionRefs.current[sec]?.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  React.useEffect(() => {
    const handler = (e) => {
      if (!e) return;
      if (!e.altKey && !e.ctrlKey && !e.metaKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault(); openReview(); return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "m") onComplete();
      if (e.key === "r") {
        const el = sectionRefs.current.reflection?.current?.querySelector("textarea");
        el?.focus();
      }
      if (e.key === "f") {
        const cur = document.documentElement.dataset.focus === "1";
        document.documentElement.dataset.focus = cur ? "0" : "1";
      }
      if (e.key === "[" || e.key === "]") {
        const tops = ["objectives", "vocab", "content", "reflection"].map(
          (s) => sectionRefs.current[s]?.current?.getBoundingClientRect()?.top ?? 0
        );
        const idx = tops.findIndex((t) => t > 40);
        const curIdx = idx <= 0 ? 0 : idx - 1;
        const nextIdx = e.key === "[" ? curIdx - 1 : curIdx + 1;
        goToSectionIndex(nextIdx);
      }
      // Shift+A => toggle accreditation layer
      if (!e.altKey && !e.ctrlKey && !e.metaKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault(); toggleAccred();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onComplete, goToSectionIndex, openReview, toggleAccred]);

  const lastSeenId = React.useMemo(() => {
    let arr = [];
    try {
      const raw = localStorage.getItem(LES_KEY(id)) || localStorage.getItem(`civic:lesson:${id}:seen`);
      arr = JSON.parse(raw || "[]");
    } catch {}
    const seenSet = new Set(Array.isArray(arr) ? arr : []);
    const order = ["objectives", "vocab", "content", "reflection"];
    for (let i = order.length - 1; i >= 0; i--) {
      if (seen.has(order[i]) || seenSet.has(order[i])) return order[i];
    }
    return null;
  }, [id, seen]);

  /* TTS text blobs */
  const ttsText = {
    objectives: (vLesson?.objectives || []).join(". "),
    content: Array.isArray(vLesson?.content) ? vLesson.content.join(" ") : (vLesson?.content || lesson?.content || ""),
    reflection: t("reflection_instructions") || "Write at least 120 characters to earn two points.",
  };

  /* ────────────────────────────────────────────────────────────── */
  return (
    <div className="lesson-body" data-surface="soft">
      <div className="lesson-surface">
        <div className="sh-grid" style={{ gap: 12 }}>
          {/* Title + Review chip + Accreditation toggle */}
          <header className="sh-card">
            <div className="sh-cardStripe" aria-hidden />
            <div className="sh-cardBody sh-cardBody--flat">
              <div className="sh-cardHead" style={{ alignItems: "center" }}>
                <h1 id="lesson-title" className="sh-title" style={{ marginTop: 0 }}>
                  {vLesson.title}
                </h1>
                <div className="sh-actionsRow" style={{ marginLeft: "auto", gap: 8, flexWrap: "wrap" }}>
                  <button className="sh-chip" onClick={openReview} title="Open Review (Shift+R)" aria-label={`Review due: ${dueCount}`}>
                    🔁 Review due{typeof dueCount === "number" ? `: ${dueCount}` : ""}
                  </button>

                  <button className="sh-btn is-ghost" onClick={addToEvidencePack} title="Add this lesson to the Instructor Evidence Pack">
                    📎 Add to Pack
                  </button>

                  {/* Accreditation toggle (local) */}
                  <label className="sh-chip" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={showAccred}
                      onChange={toggleAccred}
                      aria-label="Toggle accreditation layer"
                      style={{ accentColor: "currentColor", transform: "translateY(1px)" }}
                    />
                    {showAccred ? "Accreditation: On" : "Accreditation: Off"}
                  </label>
                </div>
              </div>
              {vLesson.overview && (
                <p className="sh-sub" style={{ margin: "6px 0 0" }}>
                  {Array.isArray(vLesson.overview) ? vLesson.overview.join(" ") : vLesson.overview}
                </p>
              )}
            </div>
          </header>

          {/* Resume + Review row */}
          <div className="sh-card">
            <div className="sh-cardBody" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {seen.size > 0 && (
                <button
                  className="sh-btn is-ghost"
                  onClick={() => {
                    const target = lastSeenId || "objectives";
                    const el = sectionRefs.current[target]?.current;
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Resume where I left off
                </button>
              )}
              <button className="sh-btn sh-btn--secondary" onClick={openReview} title="Open Review (Shift+R)">
                Review{" "}
                {dueCount > 0 ? (<span className="sh-chip soft" style={{ marginLeft: 6 }}>{dueCount} due</span>)
                               : (<span className="sh-chip soft" style={{ marginLeft: 6 }}>practice</span>)}
              </button>
            </div>
          </div>

          {/* Objectives */}
          <section ref={sectionRefs.current.objectives} data-section="objectives" className="sh-card" aria-labelledby="sec-objectives">
            <div className="sh-cardStripe" aria-hidden />
            <div className="sh-cardBody">
              <div className="sh-cardHead">
                <h2 id="sec-objectives" className="sh-cardTitle">
                  {t("Objectives")} {seen.has("objectives") && (<span className="sec-done" title="Completed" aria-label="Completed"> ✓</span>)}
                </h2>
                <div className="sh-actionsRow">
                  <button className="sh-btn sh-btn--secondary" onClick={() => speak(ttsText.objectives, { lang })} title="Listen">
                    🔊 {t("Listen")}
                  </button>
                  {speaking ? <button className="sh-btn" onClick={stop}>{t("Stop")}</button> : null}
                </div>
              </div>
              <div className="sh-cardContent">
                <ul className="sh-list">
                  {(vLesson.objectives || []).map((o, i) => {
                    const key = `obj${i + 1}`;
                    const val = Number(masteryMap?.[key] ?? 0); // 0..3
                    return (
                      <li key={i} className="sh-listItem">
                        <span className="sh-dot" aria-hidden />
                        <span className="sh-listMain">{o}</span>
                        <span className="mast" role="radiogroup" aria-label={`Mastery for objective ${i + 1}`}>
                          {[0, 1, 2, 3].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className={n <= val ? "is-on" : ""}
                              role="radio"
                              aria-checked={n === val ? "true" : "false"}
                              title={["Not started", "Emerging", "Developing", "Proficient"][n]}
                              onClick={() => { writeMastery(key, n); setMasteryMap((m) => ({ ...(m || {}), [key]: n })); }}
                            />
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

          {/* Vocabulary */}
          <section ref={sectionRefs.current.vocab} data-section="vocab" className="sh-card" aria-labelledby="sec-vocab">
            <div className="sh-cardStripe" aria-hidden />
            <div className="sh-cardBody">
              <div className="sh-cardHead">
                <h2 id="sec-vocab" className="sh-cardTitle">
                  {t("Vocabulary")} {seen.has("vocab") && (<span className="sec-done" title="Completed" aria-label="Completed"> ✓</span>)}
                </h2>
              </div>
              <div className="sh-cardContent">
                <ul className="sh-list">
                  {(vLesson.vocab || []).map((v, i) => {
                    const term = typeof v === "string" ? v : v.term;
                    const def = typeof v === "string" ? "" : v.def || "";
                    return (
                      <li key={i} className="sh-listItem">
                        <strong className="sh-listMain">{term}</strong>
                        {def ? <span className="sh-listMeta"> — {def}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

          {/* Content (inline quiz injection) */}
          <section ref={sectionRefs.current.content} data-section="content" className="sh-card" aria-labelledby="sec-content">
            <div className="sh-cardStripe" aria-hidden />
            <div className="sh-cardBody">
              <div className="sh-cardHead">
                <h2 id="sec-content" className="sh-cardTitle">
                  {t("Lesson")} {seen.has("content") && (<span className="sec-done" title="Completed" aria-label="Completed"> ✓</span>)}
                </h2>
                <div className="sh-actionsRow">
                  <button className="sh-btn sh-btn--secondary" onClick={() => speak(ttsText.content, { lang })} title="Listen">🔊 {t("Listen")}</button>
                  {speaking ? <button className="sh-btn" onClick={stop}>{t("Stop")}</button> : null}
                  <button className="sh-btn is-ghost" onClick={() => setNoteOpen(true)} title="Add Note">🖊️ {t("Add Note")}</button>
                </div>
              </div>

              <div className="sh-cardContent">
                {Array.isArray(lesson?.content) ? (
                  lesson.content.map((p, i) => (
                    <React.Fragment key={i}>
                      <p style={{ marginTop: 0 }}>{p}</p>
                      {Array.isArray(lesson?.quizzes) &&
                        lesson.quizzes
                          .filter((q) => Number(q.afterParagraphIndex) === i)
                          .map((q) => (
                            <div key={q.id ?? `q-${i}`} style={{ marginTop: 8 }}>
                              <MicroQuiz
                                lessonId={id}
                                qid={q.id}
                                stem={q.stem}
                                choices={q.choices}
                                correctIndex={q.correctIndex}
                                hint={q.hint}
                              />
                            </div>
                          ))}
                    </React.Fragment>
                  ))
                ) : (
                  <>
                    <p style={{ marginTop: 0 }}>{vLesson?.content || lesson?.content || "—"}</p>
                    {Array.isArray(lesson?.quizzes) &&
                      lesson.quizzes
                        .filter((q) => q.afterParagraphIndex == null)
                        .map((q) => (
                          <div key={q.id ?? "q-end"} style={{ marginTop: 8 }}>
                            <MicroQuiz
                              lessonId={id}
                              qid={q.id}
                              stem={q.stem}
                              choices={q.choices}
                              correctIndex={q.correctIndex}
                              hint={q.hint}
                            />
                          </div>
                        ))}
                  </>
                )}

                {/* Optional media block */}
                {lesson?.media?.url && (
                  <div className="sh-callout sh-callout--example" style={{ marginTop: 10 }}>
                    <div className="sh-calloutHead"><span className="sh-calloutIcon">🎬</span><strong>{t("Media")}</strong></div>
                    <div className="sh-calloutBody">
                      <a className="sh-link" href={lesson.media.url} target="_blank" rel="noreferrer">{t("Open media in new tab")}</a>
                    </div>
                  </div>
                )}
              </div>

              {/* Legacy support: bottom quiz */}
              {Array.isArray(vLesson?.quiz) && vLesson.quiz.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <MicroQuiz questions={vLesson.quiz} lessonId={id} />
                </div>
              )}

              {/* Transcript (collapsible) */}
              <details className="sh-collapse" style={{ marginTop: 10 }}>
                <summary className="sh-collapseSummary">📜 {t("Transcript")}</summary>
                <div className="sh-collapseBody">
                  <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>
                    {Array.isArray(vLesson?.content)
                      ? vLesson.content.join("\n\n")
                      : vLesson?.content || lesson?.content || ""}
                  </p>
                </div>
              </details>
            </div>
          </section>

          {/* Reflection */}
          <section ref={sectionRefs.current.reflection} data-section="reflection" className="sh-card" aria-labelledby="sec-reflection">
            <div className="sh-cardStripe" aria-hidden />
            <div className="sh-cardBody">
              <div className="sh-cardHead">
                <h2 id="sec-reflection" className="sh-cardTitle">
                  {t("Reflection")} {seen.has("reflection") && (<span className="sec-done" title="Completed" aria-label="Completed"> ✓</span>)}
                </h2>
                <div className="sh-actionsRow">
                  <button className="sh-btn sh-btn--secondary" onClick={() => speak(ttsText.reflection, { lang })} title="Listen">🔊 {t("Listen")}</button>
                  {speaking ? <button className="sh-btn" onClick={stop}>{t("Stop")}</button> : null}
                </div>
              </div>
              <div className="sh-cardContent">
                <p className="sh-hint">{t("Write at least 120 characters to earn +2 points automatically.")}</p>
                <textarea
                  ref={refTextarea}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={6}
                  className="sh-inputText"
                  style={{ width: "100%", fontSize: 15 }}
                  placeholder={t("What did you take away from this lesson? Any real-world examples or ideas you want to try?")}
                />
                <div className="sh-hint" aria-live="polite" style={{ marginTop: 6 }}>
                  {Math.max(0, 120 - (reflection || "").trim().length)} {t("characters to +2")}
                </div>
                <div className="sh-actionsRow" style={{ marginTop: 10 }}>
                  <button className="sh-btn sh-btn--secondary" onClick={addToPortfolio}>{t("Add to Portfolio")}</button>
                  <button
                    className="sh-btn is-ghost"
                    onClick={() => window.dispatchEvent(new CustomEvent("coach:open", { detail: { lessonId: id } }))}
                  >
                    💬 {t("Ask Coach")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ✅ Accreditation Layer (only when toggled on) */}
          {showAccred && (
            <AccreditationPanel
              lesson={lesson}
              vLesson={vLesson}
              onPrintEvidence={printEvidencePack}
              onClearEvidence={clearEvidencePack}
              evidenceCount={evidenceCount}
            />
          )}

          {/* Sticky footer with tiny due badge */}
          <footer className="sh-footer" style={{ position: "sticky", bottom: 0, zIndex: 5 }}>
            <div className="sh-footerInner" style={{ justifyContent: "space-between" }}>
              <div className="sh-progressWrap" aria-label="Progress">
                <div className="sh-progressBar" style={{ width: `${progressPct}%` }} />
              </div>
              <div ref={progressLiveRef} className="sr-only" aria-live="polite">Progress {progressPct}%</div>
              <div className="sh-actionsRow" style={{ alignItems: "center", gap: 8 }}>
                <button className="sh-chip" onClick={openReview} title="Open Review (Shift+R)">
                  🔁 Review {typeof dueCount === "number" ? `(${dueCount})` : ""}
                </button>
                <span className="sh-chip soft">{t("Progress")}: <strong style={{ marginLeft: 6 }}>{progressPct}%</strong></span>
                <button className="sh-btn sh-btn--primary" onClick={onComplete} disabled={isComplete} title="Mark as Complete (+5) (m)">
                  {isComplete ? t("Completed ✓") : t("Mark as Complete (+5)")}
                </button>
                <button className="sh-btn sh-btn--secondary" disabled={!nextId} onClick={() => nextId && onGoNext?.()} title={nextId ? t("Next lesson (n)") : t("No next lesson")}>
                  {t("Next Lesson")} ➜
                </button>
              </div>
            </div>
          </footer>

          {/* Notes → Portfolio modal */}
          <NotesModal
            open={noteOpen}
            onClose={() => setNoteOpen(false)}
            onSave={(text) => {
              try {
                const key = "portfolio:items";
                const arr = JSON.parse(localStorage.getItem(key) || "[]");
                const art = {
                  id: `note-${id}-${Date.now()}`,
                  kind: "note",
                  title: `${vLesson?.title || "Lesson"} — Note`,
                  lessonId: id,
                  createdAt: Date.now(),
                  tags: ["civic", "note", "lesson"],
                  pathwayId: null,
                  desc: text,
                };
                arr.unshift(art);
                localStorage.setItem(key, JSON.stringify(arr));
                enqueue("portfolio", { lessonId: id, title: art.title, tags: art.tags });
                toast?.("Note saved to Portfolio", { type: "success" });
                window.dispatchEvent(new CustomEvent("portfolio:update"));
                ping("civic.lesson.note.add", { id });
              } catch {}
            }}
          />
        </div>
      </div>

      {/* Review modal */}
      <ReviewTrainer
        open={reviewOpen}
        onClose={(meta) => {
          setReviewOpen(false);
          refreshDue();
          if (meta?.finished) {
            const msg = meta.mode === "practice" ? "Practice complete" : "Review complete";
            toast?.(msg, { type: "success" });
          }
        }}
        mode={reviewMode}
        seedStack={practiceStack}
      />
    </div>
  );
}
