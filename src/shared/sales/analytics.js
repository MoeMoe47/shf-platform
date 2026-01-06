import { listProposals } from "./proposals.js";

export function computeMetrics() {
  const all = listProposals();
  const stages = ["Draft", "Sent", "Won", "Lost"];
  const byStage = Object.fromEntries(stages.map(s => [s, all.filter(p => p.status === s)]));
  const totals = Object.fromEntries(stages.map(s => [
    s,
    byStage[s].reduce((a, b) => a + estValue(b), 0),
  ]));
  const overall = all.reduce((a, b) => a + estValue(b), 0);
  const won = totals["Won"] || 0;
  const winRate = all.length ? (won / overall) * 100 : 0;

  return { count: all.length, byStage, totals, overall, winRate: winRate.toFixed(1) };
}

function estValue(p) {
  const items = p.items || [];
  return items.reduce((a, i) => a + (i.qty * i.unit || 0), 0);
}

export function mockAIInsights(metrics) {
  const m = metrics || computeMetrics();
  if (!m.count) return ["No data yet — start creating proposals!"];
  const tips = [];
  if (m.winRate < 25) tips.push("Focus on follow-ups: your close rate is below 25%.");
  if (m.totals.Sent > m.totals.Won) tips.push("Many proposals stuck in 'Sent' — schedule review calls.");
  if (m.totals.Won > 50000) tips.push("High momentum detected — consider premium upsells.");
  if (!tips.length) tips.push("Performance balanced. Keep pipeline flow steady.");
  return tips;
}
