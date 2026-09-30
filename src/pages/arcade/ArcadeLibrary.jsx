// src/pages/arcade/ArcadeLibrary.jsx
import React from "react";
import { arcadeGames } from "@/data/arcade.js";
import { adaptLegacyArcadeGames } from "@/shared/arcade/experience/legacyArcadeCatalogAdapter.js";

const adaptedGames = adaptLegacyArcadeGames(arcadeGames);
const validGames = adaptedGames.filter((entry) => entry.validation?.valid === true);
const previewCount = validGames.filter((entry) => entry.descriptor.lifecycle.status === "preview").length;
const playableCount = validGames.filter((entry) => entry.descriptor.lifecycle.playable === true).length;

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
      ? validGames
      : validGames.filter((entry) => {
          const { selTags, workforceTags } = entry.legacyMetadata;
          if (activeTag === "sel") return selTags?.length > 0;
          if (activeTag === "workforce") return workforceTags?.length > 0;
          if (activeTag === "career")
            return workforceTags?.some((w) =>
              /career|resume|job|interview/i.test(w)
            );
          if (activeTag === "cognitive")
            return selTags?.some((s) => /planning|focus|decision/i.test(s));
          if (activeTag === "leadership")
            return selTags?.some((s) => /leadership|relationship/i.test(s));
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
            Explore workforce and SEL-themed learning game previews. Practice
            scenarios and discover future Arcade experiences.
          </p>
          <div className="shf-arcade-library__hero-metrics">
            <div className="shf-arcade-library__metric">
              <span className="shf-arcade-library__metric-label">Experiences</span>
              <span className="shf-arcade-library__metric-value">{validGames.length}</span>
            </div>
            <div className="shf-arcade-library__metric">
              <span className="shf-arcade-library__metric-label">Preview</span>
              <span className="shf-arcade-library__metric-value">{previewCount}</span>
            </div>
            <div className="shf-arcade-library__metric">
              <span className="shf-arcade-library__metric-label">Playable</span>
              <span className="shf-arcade-library__metric-value">{playableCount}</span>
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
              These previews are designed to support future learning and
              workforce experiences. Verified results and portfolio evidence
              are handled by the systems that own those records.
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
        {filteredGames.map((entry) => {
          const { descriptor, legacyMetadata } = entry;
          const { presentation, lifecycle, capabilities, product } = descriptor;

          return (
            <article key={descriptor.id} className="shf-arcade-library__card">
              <div className="shf-arcade-library__card-top">
                <div className="shf-arcade-library__card-pill">
                  {product.experienceType === "simulation" ? "Simulation" : "Game"}
                </div>
                <div className="shf-arcade-library__card-difficulty">
                  {presentation.difficulty ?? "Difficulty not set"}
                </div>
              </div>

              <h2 className="shf-arcade-library__card-title">{presentation.title}</h2>
              <p className="shf-arcade-library__card-subtitle">
                {presentation.description}
              </p>

              <div className="shf-arcade-library__card-tags">
                {legacyMetadata.selTags?.length ? (
                  <span className="shf-arcade-library__chip shf-arcade-library__chip--sel">
                    SEL: {legacyMetadata.selTags.join(", ")}
                  </span>
                ) : null}
                {legacyMetadata.workforceTags?.length ? (
                  <span className="shf-arcade-library__chip shf-arcade-library__chip--workforce">
                    Workforce: {legacyMetadata.workforceTags.join(", ")}
                  </span>
                ) : null}
              </div>

              <div className="shf-arcade-library__card-footer">
                <div className="shf-arcade-library__xp">
                  <span className="shf-arcade-library__xp-label">Status</span>
                  <span className="shf-arcade-library__xp-value">
                    {lifecycle.status === "preview"
                      ? "Preview"
                      : capabilities.evidenceResultCapable
                        ? "Result capable"
                        : "Not result producing"}
                  </span>
                </div>
                <button
                  type="button"
                  className="shf-arcade-library__play-btn"
                  disabled
                >
                  Preview
                </button>
              </div>
            </article>
          );
        })}
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
