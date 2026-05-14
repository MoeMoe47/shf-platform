// src/components/credit/CreditCoachAgent.jsx
import React from "react";
import { useCreditCtx } from "@/shared/credit/CreditProvider.jsx";
import allTasks from "@/data/credit-tasks.json";
import RULES from "@/data/score-rules.json";
import useCoachAI from "@/hooks/useCoachAI.js";

/**
 * Upgrades over the old version:
 * - Reads caps from score-rules.json and disables capped tasks.
 * - Computes "effective points" (0 if capped) and recommends the best next steps.
 * - Builds a quick plan to the next credit tier (or +30 pts) from available tasks.
 * - Keeps the simple "Ask the coach" box.
 */

const MS = {
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  quarter: 90 * 24 * 60 * 60 * 1000,
};

function ruleForKey(key) {
  return (RULES?.rules || []).find((r) => r.key === key) || null;
}

function estimateTaskPoints(task, rule) {
  if (Number.isFinite(task?.estPoints)) return task.estPoints;
  if (!rule?.weights) return 0;
  const nums = Object.values(rule.weights).filter((v) => typeof v === "number");
  return nums.length ? Math.max(0, ...nums) : 0;
}

function countInWindow(log, key, taskId, winMs) {
  const cutoff = Date.now() - winMs;
  // Only count entries that actually applied (delta !== 0 if present)
  return log.filter(
    (e) =>
      e.key === key &&
      (taskId ? e.taskId === taskId : true) &&
      e.ts >= cutoff &&
      (typeof e.delta === "number" ? e.delta !== 0 : true)
  ).length;
}

function capState(rule, log, key, taskId) {
  const cap = rule?.cap || {};
  const weekLeft =
    Number.isFinite(cap.perWeek)
      ? Math.max(0, cap.perWeek - countInWindow(log, key, taskId, MS.week))
      : Infinity;
  const monthLeft =
    Number.isFinite(cap.perMonth)
      ? Math.max(0, cap.perMonth - countInWindow(log, key, taskId, MS.month))
      : Infinity;
  const quarterLeft =
    Number.isFinite(cap.perQuarter)
      ? Math.max(0, cap.perQuarter - countInWindow(log, key, taskId, MS.quarter))
      : Infinity;

  const disabled =
    (weekLeft !== Infinity && weekLeft <= 0) ||
    (monthLeft !== Infinity && monthLeft <= 0) ||
    (quarterLeft !== Infinity && quarterLeft <= 0);

  // choose the tightest cap to show
  let hint = "";
  if (weekLeft !== Infinity) hint = `${weekLeft}/${cap.perWeek} this week`;
  if (monthLeft !== Infinity && (hint === "" || monthLeft < weekLeft))
    hint = `${monthLeft}/${cap.perMonth} this month`;
  if (
    quarterLeft !== Infinity &&
    (hint === "" || quarterLeft < Math.min(weekLeft, monthLeft))
  )
    hint = `${quarterLeft}/${cap.perQuarter} this quarter`;

  return { disabled, hint: hint || null };
}

const nextTierTarget = (score) => {
  // mirrors engine tiers: Foundation<660, Bronze>=660, Silver>=700, Gold>=740, Platinum>=780
  if (score < 660) return { name: "Bronze", target: 660 };
  if (score < 700) return { name: "Silver", target: 700 };
  if (score < 740) return { name: "Gold", target: 740 };
  if (score < 780) return { name: "Platinum", target: 780 };
  return { name: "Platinum+", target: Math.min(850, score + 20) }; // stretch goal if already top
};

function buildPlan({ tasks, log, needPoints }) {
  // Greedy: pick highest effective points first (not capped)
  const scored = tasks
    .map((t) => {
      const key = t.event || t.key;
      const rule = ruleForKey(key);
      const est = estimateTaskPoints(t, rule);
      const { disabled, hint } = capState(rule, log, key, t.id);
      return { task: t, rule, est, disabled, hint, eff: disabled ? 0 : est };
    })
    .sort((a, b) => (b.eff || 0) - (a.eff || 0));

  const plan = [];
  let sum = 0;
  for (const item of scored) {
    if (sum >= needPoints) break;
    if (item.eff <= 0) continue;
    plan.push(item);
    sum += item.eff;
  }
  return { plan, sum };
}

export default function CreditCoachAgent() {
  const { score, tier, log, completeTask } = useCreditCtx();
  const coach = useCoachAI(); // { ask(prompt) }

  const { name: nextTierName, target } = nextTierTarget(score);
  const needPoints = Math.max(0, target - score);

  // Top 3 suggestions by effective points (cap-aware)
  const suggestions = React.useMemo(() => {
    const decorated = allTasks.map((t) => {
      const key = t.event || t.key;
      const rule = ruleForKey(key);
      const est = estimateTaskPoints(t, rule);
      const { disabled, hint } = capState(rule, log || [], key, t.id);
      return { task: t, rule, est, disabled, hint, eff: disabled ? 0 : est };
    });
    return decorated
      .sort((a, b) => (b.eff || 0) - (a.eff || 0))
      .slice(0, 3);
  }, [log]);

  const { plan, sum } = React.useMemo(
    () => buildPlan({ tasks: allTasks, log: log || [], needPoints }),
    [log, needPoints]
  );

  const runPlan = React.useCallback(() => {
    if (!plan?.length) return;
    if (!confirm(`Mark ${plan.length} task(s) complete for an estimated +${sum} pts?`)) return;
    // In demo mode we mark each task complete (one shot).
    for (const item of plan) completeTask(item.task);
  }, [plan, sum, completeTask]);

  return (
    <section className="card card--pad" aria-labelledby="coach-h">
      <h2 id="coach-h" style={{ margin: 0, fontSize: 18 }}>Coach</h2>

      <p style={{ marginTop: 6, color: "var(--ink-soft)" }}>
        You’re at <strong>{score}</strong> ({tier?.name}). Next milestone: <strong>{nextTierName}</strong> at{" "}
        <strong>{target}</strong> (need ≈ <strong>{needPoints}</strong> pts).
      </p>

      {/* Suggested quick wins */}
      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        {suggestions.map(({ task, est, disabled, hint }) => (
          <div
            key={task.id || task.event}
            className="card card--soft"
            style={{ padding: 10, display: "flex", alignItems: "center", gap: 10, opacity: disabled ? 0.6 : 1 }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{task.title}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                ≈ +{est} pts {hint ? ` • ${hint}` : ""}
              </div>
            </div>
            <button
              className="sh-btn"
              onClick={() => completeTask(task)}
              disabled={disabled}
              title={disabled ? (hint || "Cap reached") : "Mark done"}
            >
              {disabled ? "Capped" : "Do it"}
            </button>
          </div>
        ))}
      </div>

      {/* Auto plan to next tier */}
      <div className="card card--pad" style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          Quick plan to <span style={{ whiteSpace: "nowrap" }}>{nextTierName} ({target})</span>
        </div>
        {plan.length ? (
          <>
            <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
              {plan.map(({ task, est, hint }) => (
                <li key={task.id || task.event} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>{task.title}{hint ? <span style={{ color: "var(--ink-soft)" }}> • {hint}</span> : null}</span>
                  <strong>+{est}</strong>
                </li>
              ))}
            </ol>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <div style={{ color: "var(--ink-soft)" }}>Estimated gain</div>
              <div style={{ fontWeight: 800 }}>+{sum} pts</div>
              <div style={{ flex: 1 }} />
              <button className="sh-btn" onClick={runPlan}>Mark these done (demo)</button>
            </div>
          </>
        ) : (
          <div style={{ color: "var(--ink-soft)" }}>
            You’re at cap for the best actions right now. Check back tomorrow, or try coursework/attendance tasks.
          </div>
        )}
      </div>

      {/* Coach Q&A */}
      <details style={{ marginTop: 10 }}>
        <summary className="link">Ask the coach</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q");
            coach.ask?.(String(q || ""));
          }}
          style={{ marginTop: 8, display: "grid", gap: 8 }}
        >
          <input className="sh-input" name="q" placeholder="E.g., fastest way to add 30 points?" />
          <button className="sh-btn">Ask</button>
        </form>
      </details>
    </section>
  );
}
