// src/components/credit/TaskFeed.jsx
import React from "react";
import tasks from "@/data/credit-tasks.json";
import RULES from "@/data/score-rules.json";
import { useCreditCtx } from "@/shared/credit/CreditProvider.jsx";

const MS = {
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  quarter: 90 * 24 * 60 * 60 * 1000,
};

function ruleForKey(key) {
  return (RULES?.rules || []).find(r => r.key === key) || null;
}

function estimatePoints(task, rule) {
  if (Number.isFinite(task?.estPoints)) return task.estPoints;
  if (!rule?.weights) return 0;
  const nums = Object.values(rule.weights).filter(v => typeof v === "number");
  return nums.length ? Math.max(0, ...nums) : 0;
}

function countInWindow(log, key, taskId, winMs) {
  const cutoff = Date.now() - winMs;
  // only count entries that actually applied (delta !== 0)
  return log.filter(e =>
    e.key === key &&
    (taskId ? e.taskId === taskId : true) &&
    e.ts >= cutoff &&
    (typeof e.delta === "number" ? e.delta !== 0 : true)
  ).length;
}

function capState(rule, log, key, taskId) {
  const cap = rule?.cap || {};
  const weekLeft    = Number.isFinite(cap.perWeek)    ? Math.max(0, cap.perWeek    - countInWindow(log, key, taskId, MS.week))    : Infinity;
  const monthLeft   = Number.isFinite(cap.perMonth)   ? Math.max(0, cap.perMonth   - countInWindow(log, key, taskId, MS.month))   : Infinity;
  const quarterLeft = Number.isFinite(cap.perQuarter) ? Math.max(0, cap.perQuarter - countInWindow(log, key, taskId, MS.quarter)) : Infinity;

  const disabled = (weekLeft !== Infinity && weekLeft <= 0)
    || (monthLeft !== Infinity && monthLeft <= 0)
    || (quarterLeft !== Infinity && quarterLeft <= 0);

  // Compact hint: show the tightest active cap
  let hint = "";
  if (weekLeft !== Infinity)    hint = `${weekLeft}/${cap.perWeek} this week`;
  if (monthLeft !== Infinity && (hint === "" || monthLeft < weekLeft))  hint = `${monthLeft}/${cap.perMonth} this month`;
  if (quarterLeft !== Infinity && (hint === "" || quarterLeft < Math.min(weekLeft, monthLeft))) hint = `${quarterLeft}/${cap.perQuarter} this quarter`;

  return { disabled, hint: hint || null };
}

export default function TaskFeed() {
  const { completeTask, log } = useCreditCtx();

  return (
    <section className="card card--pad" aria-labelledby="taskfeed-h">
      <h2 id="taskfeed-h" style={{ margin: 0, fontSize: 18 }}>Boost your score</h2>
      <ul className="clean-list" style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {tasks.map((t) => {
          const rule = ruleForKey(t.event || t.key);
          const est  = estimatePoints(t, rule);
          const { disabled, hint } = capState(rule, log || [], t.event || t.key, t.id);

          return (
            <li key={t.id || t.event} className="row" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{t.title}</div>
                <div style={{ color: "var(--ink-soft)", display: "flex", gap: 8, alignItems: "center" }}>
                  <span>≈ +{est} pts</span>
                  {hint && <span aria-label="cap hint" style={{ opacity: 0.8 }}>• {hint}</span>}
                </div>
              </div>
              <button
                className="sh-btn"
                onClick={() => completeTask(t)}
                disabled={disabled}
                aria-label={`Complete task: ${t.title}`}
                title={disabled ? (hint ? `Cap reached: ${hint}` : "Cap reached") : "Mark done"}
              >
                {disabled ? "Capped" : "Mark done"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
