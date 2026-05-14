import React from "react";
export default function AIScoreModal({ open, onClose }) {
  const [score, setScore] = React.useState(null);
  async function onSubmit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      geo: form.get("zip"),
      roles: (form.get("roles")||"").split(",").map(s=>s.trim()).filter(Boolean),
      skills: (form.get("skills")||"").split(",").map(s=>s.trim()).filter(Boolean),
      education: form.get("edu"),
      goal: form.get("goal"),
    };
    const res = await fetch("/api/mock/ai-score", { method:"POST", body: JSON.stringify(payload) });
    const data = await res.json();
    setScore(data);
  }
  if (!open) return null;
  return (
    <div className="ai-modal">
      <div className="ai-modalCard" role="dialog" aria-modal="true" aria-label="AI Score">
        <header><strong>Your AI Score</strong><button className="ai-btn ghost" onClick={onClose}>Close</button></header>
        {!score ? (
          <form onSubmit={onSubmit} className="ai-form">
            <input name="zip" placeholder="ZIP code" required />
            <input name="roles" placeholder="Last roles (comma separated)" />
            <input name="skills" placeholder="Top skills (comma separated)" />
            <select name="edu" defaultValue="hs">
              <option value="hs">High school</option>
              <option value="some_college">Some college</option>
              <option value="bachelors">Bachelor’s</option>
              <option value="advanced">Advanced</option>
            </select>
            <select name="goal" defaultValue="resistant">
              <option value="resistant">AI-resistant</option>
              <option value="builder">AI-building</option>
            </select>
            <button className="ai-btn primary">Calculate</button>
          </form>
        ) : (
          <div className="ai-scoreResult">
            <div className="score">{score.score}</div>
            <ul>{score.explanations.map((t,i)=><li key={i}>{t}</li>)}</ul>
            <div className="ai-cta"><a className="ai-btn primary" href="#/career">See my training pathway</a></div>
          </div>
        )}
      </div>
    </div>
  );
}
