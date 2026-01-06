// src/pages/catalog/Catalog.jsx
import React from "react";
import heroImg from "@/assets/brand/catalog-hero-16x9-1920.jpg"; // wider crop w/ wheat
import "@/styles/catalog.css";

const tracks = [
  "All",
  "AI Innovation Track",
  "Smart Contracts",
  "Silicon Stack",
  "Deaf Pilot",
];

const cards = [
  {
    id: "ai-101",
    title: "Intro to AI",
    by: "Billy Gateson",
    hours: 2,
    pct: 80,
    track: "AI Innovation Track",
  },
  {
    id: "cloud-101",
    title: "Cloud Computing Basics",
    by: "Billy Gateson",
    hours: 2,
    pct: 0,
    track: "AI Innovation Track",
  },
  {
    id: "google-it",
    title: "Google IT Support",
    by: "Coursera",
    hours: 20,
    pct: 0,
    external: true,
    track: "Silicon Stack",
  },
  // add more as needed…
];

export default function Catalog() {
  const [active, setActive] = React.useState("All");

  return (
    <div
      className="catalog"
      // CSS reads these custom properties for the full-page background
      style={{
        "--hero-url": `url(${heroImg})`,
        "--hero-pos": "center 65%", // tweak to 60–75% to show more/less wheat
      }}
    >
      {/* HERO */}
      <header className="cat-hero">
        <div className="hero-inner">
          <h1>
            Choose Your Path,
            <br />
            Build the Future
          </h1>
          <p>
            Browse our curriculum by track below. Start learning when you're
            ready.
          </p>
        </div>
      </header>

      {/* SLAB (filters + grid) */}
      <section className="cat-slab">
        {/* FILTER PILLS */}
        <div className="cat-pills">
          {tracks.map((t) => (
            <button
              key={t}
              className={`cat-pill ${t === active ? "is-active" : ""}`}
              onClick={() => setActive(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* CARD GRID */}
        <div className="cat-grid">
          {cards
            .filter((c) => active === "All" || c.track === active)
            .map((c) => (
              <article key={c.id} className="cat-card">
                <h3>{c.title}</h3>
                <div className="cat-meta">
                  {c.by} &nbsp;·&nbsp; {c.hours} hours
                </div>

                <div className="cat-bar" aria-label="progress">
                  <i style={{ "--w": `${c.pct || 0}%` }} />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                  {c.external ? (
                    <>
                      <a
                        className="btn btn-primary"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          window.dispatchEvent(
                            new CustomEvent("shf:click", {
                              detail: { provider: "coursera" },
                            })
                          );
                          window.open("https://www.coursera.org", "_blank");
                        }}
                      >
                        Launch on Coursera
                      </a>
                      <button
                        className="btn btn-ghost"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("shf:submit-proof", {
                              detail: { courseId: c.id },
                            })
                          )
                        }
                      >
                        Submit Proof
                      </button>
                    </>
                  ) : (
                    <a className="btn btn-primary" href={`#/lesson/${c.id}`}>
                      {(c.pct || 0) > 0 ? "Resume" : "Start"}
                    </a>
                  )}
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
