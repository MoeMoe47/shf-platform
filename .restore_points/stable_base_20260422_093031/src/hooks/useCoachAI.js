// src/hooks/useCoachAI.js
import { useMemo } from "react";
import { track } from "@/utils/analytics.js";

/**
 * useCoachAI — role-aware pedagogy assistant.
 * Later, replace internals with an API call to your LLM endpoint.
 */
export default function useCoachAI({ role = "student", lesson, studentProfile } = {}) {
  // Basic signals we can infer for suggestions
  const minutes = lesson?.estMinutes || lesson?.pacing?.minutes || 20;
  const objectives = lesson?.objectives || [];
  const sections = lesson?.sections || [];
  const topic = lesson?.title || "this lesson";

  const tips = useMemo(() => {
    const base = [];

    // Differentiation bundles (parent-friendly phrasing)
    base.push({
      label: "Explain differently",
      items: [
        `Use a real-world analogy for ${topic}. Keep it under 90 seconds.`,
        "Chunk into 3 micro-steps and confirm after each step.",
        "Ask the learner to teach it back in their own words.",
      ],
    });

    base.push({
      label: "Motivation & SEL",
      items: [
        "Normalize struggle: “This part is tricky for everyone at first.”",
        "Set a 2-minute timer → do a tiny win → celebrate → next tiny step.",
        "Praise process: call out effort, strategy, and improvement.",
      ],
    });

    base.push({
      label: "Checks for understanding",
      items: [
        "Ask for a 1-sentence summary.",
        "Ask for an example and a non-example.",
        "Quick self-rating: 1 (confused)–3 (ok)–5 (ready to teach).",
      ],
    });

    // Instructor extras
    if (/^(instructor|admin|coach)$/i.test(role)) {
      base.push({
        label: "Classroom tactics",
        items: [
          "Pair-share for 60 seconds, then cold-call with warmth.",
          "IEP support: pre-teach vocab with pictures before main task.",
          "Exit ticket: 1 skill I own, 1 question I have.",
        ],
      });
    }

    // Pull a couple of lesson-aware hints
    if (objectives.length) {
      base.unshift({
        label: "Focus",
        items: [
          `Keep the goal visible: “Today we’re aiming for: ${objectives[0]}.”`,
          `Timebox: ${Math.ceil(minutes / 2)} min core activity, ${Math.ceil(minutes / 4)} min practice, ${Math.ceil(minutes / 4)} min check.`,
        ],
      });
    } else {
      base.unshift({
        label: "Focus",
        items: [
          `Timebox: ${Math.ceil(minutes / 2)} min core activity, ${Math.ceil(minutes / 4)} min practice, ${Math.ceil(minutes / 4)} min check.`,
        ],
      });
    }

    // Section-aware whisper
    if (sections?.length) {
      base.push({
        label: "Live whisper",
        items: sections.slice(0, 2).map((s) => `When you reach “${s.heading}”, pause and ask: “What’s the most important idea so far?”`),
      });
    }

    return base;
  }, [role, minutes, objectives, sections, topic]);

  function onUseTip(groupLabel, tip) {
    track("coach_tip_used", { role, group: groupLabel, tip, lesson: lesson?.slug || lesson?.title });
  }

  return { tips, onUseTip };
}
