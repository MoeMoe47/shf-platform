// src/components/curriculum/lesson/ArcadeMissionCard.jsx
//
// Approved mock's "Arcade Mission" card. Real lesson JSON's `games[]`
// entries carry a `route` field (e.g. "/arcade/asl/greeting-match") that
// does not resolve anywhere in the real Arcade app (src/router/
// ArcadeRoutes.jsx has no per-game routes — checked live) — following
// that route would silently land on Arcade's own dashboard fallback,
// which would misrepresent a specific mission as launched. Per the guided
// experience's "fail safely, never invent a working route" rule, every
// launch action here goes to the real, working Arcade entry point
// instead (src/router/paths.js's href.arcade("/games")), while still
// showing the game's own real title/time/XP/outcomes from lesson data.
// No Attempt or Result is created here — Arcade's own backend/local state
// is untouched.
import React from "react";
import { href } from "@/router/paths.js";
import { TargetIcon, ClockIcon, PlayIcon } from "@/components/curriculum/icons.jsx";

export default function ArcadeMissionCard({ games, suggestedGames }) {
  const hasGames = Array.isArray(games) && games.length > 0;
  const hasSuggested = Array.isArray(suggestedGames) && suggestedGames.length > 0;

  if (!hasGames && !hasSuggested) return null;

  return (
    <div>
      {hasGames &&
        games.map((game) => (
          <div className="ld-arcadeCard" key={game.id || game.title}>
            <div className="ld-arcadeCardHead">
              <TargetIcon size={16} />
              Arcade Mission
            </div>
            <h3 className="ld-arcadeCardTitle">{game.title}</h3>
            <div className="ld-arcadeCardMeta">
              {game.estMinutes ? (
                <span><ClockIcon size={13} style={{ verticalAlign: -2, marginRight: 4 }} />~{game.estMinutes} min</span>
              ) : null}
              {game.xp ? <span>{game.xp} XP</span> : null}
            </div>
            {Array.isArray(game.outcomes) && game.outcomes.length > 0 && (
              <ul className="ld-arcadeOutcomes">
                {game.outcomes.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            )}
            <a className="ld-btnGhost" href={href.arcade("/games")}>
              <PlayIcon size={15} /> Open in Arcade
            </a>
          </div>
        ))}

      {!hasGames && hasSuggested && (
        <div className="ld-arcadeCard">
          <div className="ld-arcadeCardHead">
            <TargetIcon size={16} />
            Suggested Arcade Activities
          </div>
          <ul className="ld-arcadeSuggestedList">
            {suggestedGames.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
          <a className="ld-btnGhost" style={{ marginTop: 12 }} href={href.arcade("/games")}>
            <PlayIcon size={15} /> Open in Arcade
          </a>
        </div>
      )}
    </div>
  );
}
