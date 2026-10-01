import React from "react";
import { Link, useParams } from "react-router-dom";
import { useArcadeReplay } from "@/shared/arcade/replay/useArcadeReplay.js";

function dateLabel(value) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ArcadeResultReplay() {
  const { resultId = "" } = useParams();
  const { replay, loading, error } = useArcadeReplay(resultId);

  return (
    <main className="page pad">
      <header>
        <p><Link to="/history">Arcade History</Link></p>
        <h1>Execution Replay</h1>
        <p>Replay explains existing records. It does not verify evidence or create new outcomes.</p>
      </header>
      {loading && <p role="status">Loading recorded execution…</p>}
      {!loading && error && <p role="alert">This Arcade execution replay is unavailable.</p>}
      {!loading && !error && replay && (
        <>
          <section aria-labelledby="replay-activity-heading">
            <h2 id="replay-activity-heading">{replay.activity.title}</h2>
            <p>Activity: {replay.activity.slug}</p>
            <p>Attempt: {replay.attempt.status} · Started {dateLabel(replay.attempt.startedAt)}</p>
            <p>Source: Arcade Attempt <code>{replay.attempt.id}</code></p>
            <h3>Recorded Result</h3>
            <p>Result ID: <code>{replay.result.id}</code></p>
            <p>Score: {replay.result.score ?? "Not recorded"}{replay.result.maxScore == null ? "" : ` / ${replay.result.maxScore}`}</p>
            <p>Mastery: {String(replay.result.masteryAchieved)} (stored by canonical Result)</p>
            <p>Recorded: {dateLabel(replay.result.createdAt)} · Source: Arcade Result <code>{replay.result.id}</code></p>
          </section>
          <section aria-labelledby="replay-timeline-heading">
            <h2 id="replay-timeline-heading">Recorded Timeline</h2>
            <ol>
              {replay.timeline.map((event, index) => (
                <li key={`${event.sourceType}:${event.sourceId}:${event.kind}:${index}`}>
                  <time dateTime={event.occurredAt}>{dateLabel(event.occurredAt)}</time>
                  <strong> {event.label}</strong>
                  <span> · Source: {event.sourceType} <code>{event.sourceId}</code></span>
                  {event.details?.score !== undefined && <span> · {event.details.score}{event.details.maxScore == null ? "" : ` / ${event.details.maxScore}`}</span>}
                </li>
              ))}
            </ol>
          </section>
          <aside>
            <strong>Explanatory projection</strong>
            <p>{replay.provenance.runtimeSessionNote}</p>
            <p>Runtime observations and current save-state are not joined because no canonical Session-to-Attempt relationship exists.</p>
          </aside>
        </>
      )}
    </main>
  );
}
