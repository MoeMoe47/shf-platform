import React, { useEffect, useRef } from "react";
import "./institutional-eclipse.css";

// SHUIC_SCROLL_ECLIPSE_V1
// The Moon moves into solar alignment as the section
// enters the viewport. The Sun's existing WebGL engine
// and scene remain untouched.

const earlySteps = [
  ["01", "Plan", "Assess needs and set goals."],
  ["02", "Build", "Select programs and resources."],
  ["03", "Implement", "Launch, train, and deliver."]
];

const laterSteps = [
  ["04", "Measure", "Track outcomes and impact."],
  ["05", "Expand", "Add programs and partnerships."],
  ["06", "Sustain", "Grow long-term opportunity."]
];

const resources = [
  ["▤", "Implementation Guide",
    "Plan organizational onboarding and delivery."],
  ["◇", "Funding & Grant Readiness",
    "Explore pre-award funding alignment and evidence."],
  ["⚖", "Compare Solutions",
    "Evaluate curriculum, licensing, and delivery options."],
  ["◎", "Institutional Partnerships",
    "Explore collaboration and support pathways."]
];

export default function InstitutionalEclipseSection() {
  const ref = useRef(null);

  // SHUIC_TRUE_ECLIPSE_V3
  // Align the Moon with the existing WebGL Sun.
  useEffect(() => {
    const section = ref.current;
    const sun = document.querySelector(
      ".cosmic-sun-position"
    );
    const system = section?.querySelector(
      ".shuic-eclipse-system"
    );

    if (!section || !system) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const clamp = (value, min, max) =>
      Math.max(min, Math.min(max, value));

    const update = () => {
      raf = 0;

      const sectionRect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const mobile = window.innerWidth <= 1050;

      const progress = clamp(
        (viewport * 0.92 - sectionRect.top) /
        (viewport * 0.66),
        0,
        1
      );

      const amount = reduced.matches ? 1 : progress;

      section.style.setProperty(
        "--eclipse-progress",
        String(amount)
      );

      if (!sun || mobile) {
        lastX = 0;
        lastY = 0;
        system.style.transform = "none";
        return;
      }

      const sunRect = sun.getBoundingClientRect();
      const moonRect = system.getBoundingClientRect();

      // Remove the previous translation from the
      // measurement to prevent animation feedback.
      const moonBaseX =
        moonRect.left + moonRect.width / 2 - lastX;
      const moonBaseY =
        moonRect.top + moonRect.height / 2 - lastY;

      const sunX = sunRect.left + sunRect.width / 2;
      const sunY = sunRect.top + sunRect.height / 2;

      // Keep the Moon in its central content column.
      // Most correction should be vertical.
      const offsetX = clamp(
        sunX - moonBaseX, -45, 45
      );
      const offsetY = clamp(
        sunY - moonBaseY, -190, 190
      );

      lastX = offsetX * amount;
      lastY = offsetY * amount;

      system.style.transform =
        `translate3d(${lastX}px, ${lastY}px, 0)`;

      // Use the live Sun container as a sizing guide,
      // but do not let the Moon invade text columns.
      const targetSize = clamp(
        sunRect.width * 0.88, 400, 650
      );

      system.style.setProperty(
        "--eclipse-target-size",
        `${targetSize}px`
      );
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, {
      passive: true
    });
    window.addEventListener("resize", schedule);

    if (reduced.addEventListener) {
      reduced.addEventListener("change", schedule);
    }

    update();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);

      if (reduced.removeEventListener) {
        reduced.removeEventListener("change", schedule);
      }
    };
  }, []);

  return (
    <section
      ref={ref}
      className="shuic-eclipse-section"
      aria-label="Institutional Success Path and Resources"
    >
      <div className="shuic-eclipse-layout">
        <div className="shuic-eclipse-left">
          <p className="shuic-eclipse-eyebrow">
            YOUR INSTITUTIONAL PATH
          </p>
          <p className="shuic-eclipse-intro">
            Follow a guided path to plan, build,
            implement, and grow.
          </p>

          <div className="shuic-eclipse-steps">
            {earlySteps.map(([number, title, description]) => (
              <div className="shuic-eclipse-step" key={number}>
                <span className="shuic-eclipse-number">
                  {number}
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            className="shuic-eclipse-cta"
            href="#shuic-solutions-title"
          >
            Start Your Institutional Path
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="shuic-eclipse-center">
          <div className="shuic-eclipse-system">
            <div className="shuic-eclipse-moon">
              <img
                src="/assets/shu/cosmic-v2/moon_catalog.png"
                alt=""
                aria-hidden="true"
              />
              <div className="shuic-eclipse-moon-shade"/>

              <div className="shuic-eclipse-moon-content">
                <span>INSTITUTIONAL</span>
                <h2>Success Path</h2>
                <div className="shuic-eclipse-moon-line"/>

                <div className="shuic-eclipse-late-steps">
                  {laterSteps.map(
                    ([number, title, description]) => (
                      <div
                        className="shuic-eclipse-late-step"
                        key={number}
                      >
                        <span>{number}</span>
                        <strong>{title}</strong>
                        <p>{description}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shuic-eclipse-right">
          <p className="shuic-eclipse-eyebrow">
            INSTITUTIONAL RESOURCES
          </p>
          <p className="shuic-eclipse-intro">
            Tools and guidance from planning to
            measurable impact.
          </p>

          <div className="shuic-eclipse-resources">
            {resources.map(([symbol, title, description]) => (
              <div
                className="shuic-eclipse-resource"
                key={title}
              >
                <span
                  className="shuic-eclipse-resource-icon"
                  aria-hidden="true"
                >
                  {symbol}
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
                <span
                  className="shuic-eclipse-arrow"
                  aria-hidden="true"
                >
                  →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
