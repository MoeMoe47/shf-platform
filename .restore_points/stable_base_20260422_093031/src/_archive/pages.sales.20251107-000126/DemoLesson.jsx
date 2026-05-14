// src/pages/sales/DemoLesson.jsx
import React from "react";
import { Link } from "react-router-dom";
import PageHeaderPortal from "@/components/sales/PageHeaderPortal.jsx";
import { useBrandKit } from "@/hooks/useBrandKit.js";

export default function DemoLesson() {
  const { brand } = useBrandKit?.() || { brand: {} };
  const name = brand?.name || "Your Organization";
  const primary = brand?.primary || "#e11d2d";

  return (
    <>
      <PageHeaderPortal>
        <section className="lux-hero frost" style={{ padding: "24px 24px 18px" }}>
          <div className="lux-eyebrow">Micro-lesson</div>
          <h1 className="lux-title" style={{ margin: "6px 0 6px" }}>
            Onboarding: Workplace Communication
          </h1>
          <p className="lux-sub" style={{ margin: 0 }}>
            Branded for {name}. Watch the clip, then complete the quick quiz.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link to="/sales/demo-quiz" className="sh-btn">Start Quiz</Link>
            <Link to="/sales/demo-dashboard" className="sh-btn sh-btn--soft">Back to Demo</Link>
          </div>
        </section>
      </PageHeaderPortal>

      <section className="lux-page" style={{ display: "grid", gap: 16 }}>
        <section className="card lux-card" style={{ padding: 16 }}>
          <div
            style={{
              aspectRatio: "16 / 9",
              width: "100%",
              borderRadius: 12,
              border: "1px solid var(--ring)",
              overflow: "hidden",
              background:
                "linear-gradient(135deg, rgba(225,29,45,.2), rgba(0,0,0,.05))",
            }}
            aria-label="Lesson video"
          >
            {/* Drop your embed here if desired */}
            <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
              <div style={{ fontWeight: 700, color: "var(--ink-soft)" }}>
                Video Placeholder
              </div>
            </div>
          </div>
        </section>

        <section className="card lux-card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 10px" }}>Steps</h3>
          <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
            <li>Watch the 3-minute clip and note 3 key points.</li>
            <li>Write a one-sentence summary you would send to your supervisor.</li>
            <li>Complete the 5-question quiz to demonstrate understanding.</li>
          </ol>
        </section>

        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/sales/demo-quiz" className="sh-btn" style={{ background: primary }}>
            Take the Quiz
          </Link>
          <Link to="/sales/demo-dashboard" className="sh-btn sh-btn--secondary">
            Back
          </Link>
        </div>
      </section>
    </>
  );
}
