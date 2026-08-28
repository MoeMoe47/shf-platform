// src/pages/career/portfolio-sections/ProfileStrength.jsx
import React from "react";

const PHOTO_KEY = "sh_profile_photo";

/**
 * "Career goal" and "Skills added" have no connected completion source
 * in the repo yet; isolated as fallback flags here. "Profile photo" is
 * wired to the real upload state (same localStorage key AvatarUploader
 * writes to), so it reflects reality rather than a fixed mock value.
 */
const FALLBACK_FLAGS = {
  careerGoal: true,
  skillsAdded: true,
  introduction: false,
};

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}
function CircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export default function ProfileStrength({ onComplete }) {
  const [hasPhoto, setHasPhoto] = React.useState(false);

  React.useEffect(() => {
    const read = () => {
      try {
        setHasPhoto(!!localStorage.getItem(PHOTO_KEY));
      } catch {
        setHasPhoto(false);
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("sh-profile-photo-updated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("sh-profile-photo-updated", read);
    };
  }, []);

  const items = [
    { key: "photo", label: "Profile photo", done: hasPhoto },
    { key: "goal", label: "Career goal", done: FALLBACK_FLAGS.careerGoal },
    { key: "skills", label: "Skills added", done: FALLBACK_FLAGS.skillsAdded },
    { key: "intro", label: "Add introduction", done: FALLBACK_FLAGS.introduction },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <section className="sp-card" aria-labelledby="sp-strength-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-strength-h" className="sp-cardTitle">
          Profile strength
        </h2>
      </div>

      <div className="sp-strengthGrid">
        <div
          className="sp-ring"
          style={{ "--sp-ring-pct": pct }}
          role="img"
          aria-label={`Profile strength ${pct}% complete`}
        >
          <div className="sp-ringInner">{pct}%</div>
        </div>

        <ul className="sp-strengthList">
          {items.map((i) => (
            <li key={i.key} className={`sp-strengthItem ${i.done ? "is-done" : "is-todo"}`}>
              <span className="sp-strengthIcon" aria-hidden="true">
                {i.done ? <CheckIcon /> : <CircleIcon />}
              </span>
              <span>
                {i.label}
                <span className="sp-srOnly">{i.done ? " — complete" : " — incomplete"}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="sp-viewLink" style={{ marginTop: 14 }} onClick={onComplete}>
        Complete profile
      </button>
    </section>
  );
}
