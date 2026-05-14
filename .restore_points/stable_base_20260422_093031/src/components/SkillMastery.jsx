// src/components/SkillMastery.jsx
import React from "react";
import PropTypes from "prop-types";

export default function SkillMastery({ skills = [] }) {
  if (!skills.length) return null;
  return (
    <section className="sh-card" aria-label="Skill mastery">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <header className="section-head">
          <div className="section-title">Mastery</div>
        </header>
        <div className="skills">
          {skills.map((s) => (
            <div key={s.name} className="skill">
              <div className="skill-row">
                <strong>{s.name}</strong>
                <span className="skill-level">{s.state || "new"}</span>
              </div>
              <div className="skill-bar" aria-label={`${s.name} ${s.pct || 0}%`} role="img">
                <div className="skill-barFill" style={{ width: `${Math.max(0, Math.min(100, s.pct || 0))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
SkillMastery.propTypes = {
  skills: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      state: PropTypes.oneOf(["new", "learning", "review", "mastered"]),
      pct: PropTypes.number, // 0..100
    })
  ),
};
