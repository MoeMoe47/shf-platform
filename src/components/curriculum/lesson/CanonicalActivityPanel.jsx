import React from "react";
import { announce } from "@/components/ally/A11yTools.jsx";
import { submitAssessment, submitPractice, submitReflection } from "@/lib/curriculum/activityApi.js";

function keyFor(prefix, assignmentId, lessonKey, attempt = 0) {
  return `${prefix}:${assignmentId}:${lessonKey}:${attempt}:${Date.now()}`;
}

function ActivityMessage({ error, result }) {
  if (error) return <p role="alert" className="ld-mutedLine">{error}</p>;
  if (!result) return null;
  return <p role="status" aria-live="polite" className="ld-mutedLine">{result}</p>;
}

export function PracticeActivity({ definition, context }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);
  async function submit() {
    setBusy(true); setError("");
    try {
      const response = await submitPractice(context.role, {
        ...context,
        practiceDefinitionId: definition.practiceDefinitionId,
        actions: [{ action: "completed" }],
        idempotencyKey: keyFor("practice", context.assignmentId, context.lessonStableKey),
      });
      setResult(response.completed ? "Practice completed." : "Practice submitted for follow-up.");
      announce("Practice result saved.");
    } catch (err) { setError(err.message || "Practice could not be submitted."); }
    finally { setBusy(false); }
  }
  return <section className="ld-card ld-panelCard" aria-label="Practice activity">
    <h3>Practice</h3><p>Complete this canonical practice activity to continue.</p>
    <button type="button" className="ld-btn ld-btnPrimary" onClick={submit} disabled={busy || !!result}>{busy ? "Submitting…" : result ? "Completed" : "Submit practice"}</button>
    <ActivityMessage error={error} result={result} />
  </section>;
}

export function AssessmentActivity({ definition, context }) {
  const [answers, setAnswers] = React.useState({});
  const [attempt, setAttempt] = React.useState(definition.latestResult?.attemptNumber || 0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(() => {
    if (!definition.latestResult) return null;
    return definition.latestResult.passed ? "Assessment passed." : "Assessment not passed. Review the feedback and retry.";
  });
  const items = definition.items || [];
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await submitAssessment(context.role, { ...context, answers: items.map((item) => ({ itemId: item.itemId, choiceIndex: answers[item.itemId] })), idempotencyKey: `assessment:${context.assignmentId}:${context.lessonStableKey}:${attempt}` });
      setResult(response.passed ? "Assessment passed." : "Assessment not passed. Review the feedback and retry.");
      announce(response.passed ? "Assessment passed." : "Assessment not passed.");
    } catch (err) { setError(err.message || "Assessment could not be submitted."); }
    finally { setBusy(false); }
  }
  return <section className="ld-card ld-panelCard" aria-label="Assessment"><h3>{definition.title || "Assessment"}</h3>
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      {items.map((item) => <fieldset key={item.itemId} className="cj-field"><legend>{item.prompt}</legend>{(item.options || item.choices || []).map((option, index) => <label key={index} style={{ display: "block", marginTop: 6 }}><input type="radio" name={item.itemId} checked={answers[item.itemId] === index} onChange={() => setAnswers((current) => ({ ...current, [item.itemId]: index }))} /> {option}</label>)}</fieldset>)}
      <button type="submit" className="ld-btn ld-btnPrimary" disabled={busy || !!result || items.some((item) => answers[item.itemId] == null)}>{busy ? "Submitting…" : result ? "Submitted" : "Submit assessment"}</button>
    </form>{result && result.includes("not passed") && <button type="button" className="ld-btnGhost" onClick={() => { setAttempt((value) => value + 1); setAnswers({}); setResult(null); }}>Retry assessment</button>}<ActivityMessage error={error} result={result} />
  </section>;
}

export function ReflectionActivity({ definition, context }) {
  const [text, setText] = React.useState(""); const [busy, setBusy] = React.useState(false); const [error, setError] = React.useState(""); const [saved, setSaved] = React.useState(false);
  async function submit() { setBusy(true); setError(""); try { await submitReflection(context.role, { ...context, responses: [{ itemId: definition.items?.[0]?.itemId || "reflection", text }], idempotencyKey: keyFor("reflection", context.assignmentId, context.lessonStableKey) }); setSaved(true); announce("Reflection saved."); } catch (err) { setError(err.message || "Reflection could not be saved."); } finally { setBusy(false); } }
  return <section className="ld-card ld-panelCard" aria-label="Reflection"><h3>Reflection</h3><label htmlFor="canonical-reflection">{definition.items?.[0]?.prompt || "What did you learn?"}</label><textarea id="canonical-reflection" className="sh-inputText" rows={4} value={text} onChange={(event) => { setText(event.target.value); setSaved(false); }} /><button type="button" className="ld-btnGhost" onClick={submit} disabled={busy || !text.trim() || saved}>{busy ? "Saving…" : saved ? "Saved" : "Save reflection"}</button><ActivityMessage error={error} /></section>;
}
