import React from "react";
import MetricTile from "@/components/lordOutcomes/MetricTile.jsx";

export default function Hero({
  title = "Lord of Outcomes",
  subtitle = "Regional outcome intelligence, funding performance, and pilot-ready metrics.",
  tiles = [],
}) {
  return (
    <section className="looHero">
      <h1 className="looHeroTitle">{title}</h1>
      <p className="looHeroSubtitle">{subtitle}</p>

      <div className="looTileGrid" role="list">
        {tiles.map((t, idx) => (
          <div className="looTileSlot" role="listitem" key={t.key ?? idx}>
            <MetricTile
              label={t.label}
              value={t.value}
              hint={t.hint}
              variant={t.variant}
              align={t.align}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
