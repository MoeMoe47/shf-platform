// src/pages/arcade/ArcadeLibrary.jsx
import React from "react";
import { arcadeGames } from "@/data/arcade.js";

const GAME_TAGS = [
  "all",
  "sel",
  "workforce",
  "career",
  "cognitive",
  "leadership",
];

export default function ArcadeLibrary() {
  const [activeTag, setActiveTag] = React.useState("all");

  const filteredGames =
    activeTag === "all"
      ? arcadeGames
      : arcadeGames.filter((game) => {
          if (activeTag === "sel") return game.selTags && game.selTags.length > 0;
          if (activeTag === "workforce")
            return game.workforceTags && game.workforceTags.length > 0;
          if (activeTag === "career")
            return game.workforceTags?.some((w) =>
              /career|resume|job|interview/i.test(w)
            );
          if (activeTag === "cognitive")
            return game.selTags?.some((s) => /planning|focus|decision/i.test(s));
          if (activeTag === "leadership")
            return game.selTags?.some((s) => /leadership|relationship/i.test(s));
          return true;
        });

  return (
    <div className="shf-arcade-library">
      {/* Hero header */}
      <header className="shf-arcade-library__hero">
        <div className="shf-arcade-library__hero-main">
          <div className="shf-arcade-library__hero-label">Silicon Heartland</div>
          <h1 className="shf-arcade-library__hero-title">Workforce Arcade</h1>
          <p className="shf-arcade-library__hero-subtitle">
            Play PS2-style mini-games. Build SEL skills. Earn blockchain-backed
            credentials for real careers.
          </p>
          <div className="shf-arcade-library__hero-metrics">
            <div className="shf-arcade-library__metric">
              <span className="shf-arcade-library__metric-label">XP</span>
              <span className="shf-arcade-library__metric-value">12,340</span>
            </div>
            <div className="shf-arcade-library__metric">
              <span className="shf-arcade-library__metric-label">Badges</span>
              <span className="shf-arcade-library__metric-value">18</span>
            </div>
            <div className="shf-arcade-library__metric">
              <span className="shf-arcade-library__metric-label">
                On-Chain Proofs
              </span>
              <span className="shf-arcade-library__metric-value">7</span>
            </div>
          </div>
        </div>

        <div className="shf-arcade-library__hero-side">
          <div className="shf-arcade-library__avatar">
            <div className="shf-arcade-library__avatar-ring" />
            <div className="shf-arcade-library__avatar-inner">
              <span className="shf-arcade-library__avatar-emoji">🧑‍🚀</span>
            </div>
          </div>
          <div className="shf-arcade-library__hero-note">
            <p className="shf-arcade-library__hero-note-title">
              Billy Gateson says:
            </p>
            <p className="shf-arcade-library__hero-note-body">
              “Every win in here can show up on your resume or scholarship
              application. Pick a game, and I’ll track your progress.”
            </p>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="shf-arcade-library__filters">
        {GAME_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={
              "shf-arcade-library__filter-btn" +
              (activeTag === tag ? " shf-arcade-library__filter-btn--active" : "")
            }
          >
            {labelForTag(tag)}
          </button>
        ))}
      </div>

      {/* Games grid */}
      <section className="shf-arcade-library__grid">
        {filteredGames.map((game) => (
          <article key={game.id} className="shf-arcade-library__card">
            <div className="shf-arcade-library__card-top">
              <div className="shf-arcade-library__card-pill">
                {game.mode === "builder" ? "Builder" : "Scenario"}
              </div>
              <div className="shf-arcade-library__card-difficulty">
                {game.difficulty}
              </div>
            </div>

            <h2 className="shf-arcade-library__card-title">{game.title}</h2>
            <p className="shf-arcade-library__card-subtitle">
              {game.subtitle}
            </p>

            <div className="shf-arcade-library__card-tags">
              {game.selTags?.length ? (
                <span className="shf-arcade-library__chip shf-arcade-library__chip--sel">
                  SEL: {game.selTags.join(", ")}
                </span>
              ) : null}
              {game.workforceTags?.length ? (
                <span className="shf-arcade-library__chip shf-arcade-library__chip--workforce">
                  Workforce: {game.workforceTags.join(", ")}
                </span>
              ) : null}
            </div>

            <div className="shf-arcade-library__card-footer">
              <div className="shf-arcade-library__xp">
                <span className="shf-arcade-library__xp-label">Reward</span>
                <span className="shf-arcade-library__xp-value">
                  {game.xpReward} XP · On-Chain Badge
                </span>
              </div>
              <button
                type="button"
                className="shf-arcade-library__play-btn"
                // TODO: replace with navigation + ledger + Polygon
                onClick={() => {
                  alert(`Launch game: ${game.title}`);
                }}
              >
                Play
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function labelForTag(tag) {
  switch (tag) {
    case "all":
      return "All Games";
    case "sel":
      return "SEL Skills";
    case "workforce":
      return "Workforce Ready";
    case "career":
      return "Career Path";
    case "cognitive":
      return "Cognitive Fitness";
    case "leadership":
      return "Leadership";
    default:
      return tag;
  }
}
