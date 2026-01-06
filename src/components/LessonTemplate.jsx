// src/components/LessonTemplate.jsx
import React from "react";
import PropTypes from "prop-types";
import { readJSON, safeSet } from "@/utils/storage.js";
import * as RQ from "@/utils/reviewQueue.js";

/* ========= Utilities (TTS, confetti, kb helpers) ========= */
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text || "");
  u.rate = 1; u.pitch = 1; u.lang = "en-US";
  try { window.speechSynthesis.cancel(); } catch {}
  window.speechSynthesis.speak(u);
}
function stopSpeak(){ try{ window.speechSynthesis.cancel(); } catch{} }

function popConfetti() {
  const root = document.body;
  const wrap = document.createElement("div");
  wrap.className = "sh-confetti";
  for (let i = 0; i < 24; i++) {
    const p = document.createElement("div");
    p.className = "sh-confettiPiece";
    p.style.left = Math.random() * 100 + "%";
    p.style.width = "8px";
    p.style.height = (6 + Math.random() * 8) + "px";
    p.style.background = ["#ff4f00","#10b981","#06b6d4","#f59e0b","#6366f1"][i%5];
    p.style.animationDuration = `${1.1 + Math.random()*0.8}s, ${0.8+Math.random()*1.2}s`;
    p.style.animationDelay = `${Math.random()*0.2}s, 0s`;
    wrap.appendChild(p);
  }
  root.appendChild(wrap);
  setTimeout(()=>wrap.remove(), 1800);
}

/* ========= Small atoms ========= */
const Badge = ({ children }) => <span className="sh-tag">{children}</span>;
const Icon = ({ children }) => <span className="app-ico" aria-hidden="true">{children}</span>;
Badge.propTypes = { children: PropTypes.node };
Icon.propTypes = { children: PropTypes.node };

/* ========= Keyboard Map Overlay ========= */
function KeyboardMap({ open, onClose }) {
  React.useEffect(() => {
    function onKey(e){ if (e.key === "Escape") onClose?.(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="kb-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="kb-card">
        <header><strong>Keyboard Shortcuts</strong></header>
        <ul className="kb-grid">
          <li><span className="kbd">J</span> rewind 10s</li>
          <li><span className="kbd">K</span> play / pause</li>
          <li><span className="kbd">L</span> forward 10s</li>
          <li><span className="kbd">1–4</span> answer options</li>
          <li><span className="kbd">/</span> focus transcript search</li>
          <li><span className="kbd">?</span> toggle this panel</li>
        </ul>
        <div className="kb-actions">
          <button className="sh-btn sh-btn--primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
KeyboardMap.propTypes = { open: PropTypes.bool, onClose: PropTypes.func };

/* ========= Hero Header ========= */
function HeroHeader({ title, level="Beginner", minutes=30, onResume, progress=0, onComplete }) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <section className="sh-card hero-card" aria-label="Lesson header">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody sh-cardBody--flat hero-body">
        <div className="hero-left">
          <div className="hero-row">
            <Badge>{level}</Badge>
            <Badge>{minutes} min</Badge>
          </div>
          <h1 className="hero-title">{title}</h1>
          <div className="hero-actions">
            <button className="sh-btn sh-btn--primary" onClick={onResume}>Continue / Resume</button>
            <button className="sh-btn sh-btn--secondary" onClick={onComplete} aria-live="polite">Mark Complete</button>
          </div>
        </div>

        <div className="hero-ring" role="img" aria-label={`Progress ${pct}%`}>
          <svg viewBox="0 0 120 120" width="96" height="96">
            <circle cx="60" cy="60" r="48" fill="none" stroke="#eee" strokeWidth="12" />
            <circle
              cx="60" cy="60" r="48" fill="none" stroke="var(--orange)"
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${pct*3.02} 1000`} transform="rotate(-90 60 60)"
            />
            <text x="60" y="66" textAnchor="middle" fontSize="20" fill="var(--ink)">{pct}%</text>
          </svg>
        </div>
      </div>
    </section>
  );
}
HeroHeader.propTypes = {
  title: PropTypes.string, level: PropTypes.string, minutes: PropTypes.number,
  onResume: PropTypes.func, progress: PropTypes.number, onComplete: PropTypes.func
};

/* ========= Video + Transcript block ========= */
function VideoBlock({
  src, poster, captions=[], resources=[], introText="",
  onPracticeFromCue = () => {},
  onFocusTranscriptSearch = () => {},
  aslMode=false, setAslMode=()=>{}
}) {
  const videoRef = React.useRef(null);
  const [aslOn, setAslOn] = React.useState(aslMode);
  const [aslSize, setAslSize] = React.useState(28); // %
  const [speed, setSpeed] = React.useState(1);
  const [loop, setLoop] = React.useState(null); // {a,b} in seconds
  const [activeCue, setActiveCue] = React.useState(null);

  React.useEffect(() => { setAslOn(aslMode); }, [aslMode]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function onTime() {
      if (loop && (v.currentTime < loop.a || v.currentTime > loop.b)) v.currentTime = loop.a;
      const t = v.currentTime;
      const cue = captions.find(c => t >= c.t && t <= c.t + (c.d || 3));
      setActiveCue(cue ? cue.id : null);
    }
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [captions, loop]);

  React.useEffect(() => {
    function onKey(e){
      if (["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "/"){ e.preventDefault(); onFocusTranscriptSearch(); }
      if (e.key.toLowerCase()==="j") { const v=videoRef.current; if(v) v.currentTime=Math.max(0,v.currentTime-10); }
      if (e.key.toLowerCase()==="l") { const v=videoRef.current; if(v) v.currentTime=Math.min(v.duration||1,v.currentTime+10); }
      if (e.key.toLowerCase()==="k") { const v=videoRef.current; if(v) v.paused ? v.play() : v.pause(); }
    }
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  }, [onFocusTranscriptSearch]);

  React.useEffect(() => { const v = videoRef.current; if (v) v.playbackRate = speed; }, [speed]);

  return (
    <section id="intro" className="sh-card" aria-labelledby="intro-h">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <header className="section-head">
          <div className="section-title" id="intro-h">
            <Icon>▶</Icon> Introduction <span className="badge">Video</span>
          </div>
          <div className="section-tools">
            <button className="sh-btn" onClick={() => speak(introText || "Introduction")}>🔊 Read</button>
            <label className="sh-btn">
              ASL mode
              <input type="checkbox" checked={aslOn} onChange={e=>{ setAslOn(e.target.checked); setAslMode(e.target.checked); }} style={{marginLeft:8}} />
            </label>
            <label className="sh-btn" title="Playback speed">
              {speed.toFixed(2)}×
              <input aria-label="Playback speed" type="range" min="0.5" max="2" step="0.25" value={speed} onChange={e=>setSpeed(+e.target.value)} />
            </label>
          </div>
        </header>

        <div className={`video-wrap ${aslOn ? "is-asl" : ""}`}>
          <video
            ref={videoRef} controls poster={poster} className="video"
            crossOrigin="anonymous" playsInline
          >
            <source src={src} type="video/mp4" />
            {captions.length === 0 ? null : (
              <track kind="captions" srcLang="en" label="English" default />
            )}
          </video>

          {aslOn && (
            <div className="asl-pip" style={{ width: `${aslSize}%` }} aria-label="ASL interpreter video">
              {/* Replace with real interpreter stream or clip */}
              <video src={src} muted playsInline autoPlay loop />
              <input
                aria-label="ASL size"
                className="asl-size"
                type="range" min="18" max="45" value={aslSize}
                onChange={e=>setAslSize(+e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Loop controls */}
        <div className="video-controls">
          <button className="sh-btn" onClick={()=>{
            const v = videoRef.current; if(!v) return;
            const a = Math.max(0, v.currentTime - 3);
            const b = Math.min(v.duration || a+6, a + 6);
            setLoop({a,b});
          }}>Loop 6s</button>
          <button className="sh-btn" onClick={()=>setLoop(null)}>Clear loop</button>
        </div>

        {/* Transcript */}
        <Transcript
          captions={captions}
          activeCue={activeCue}
          onJump={t => { const v=videoRef.current; if(v) v.currentTime = t + 0.05; }}
          onPractice={onPracticeFromCue}
          onFocusQuery={onFocusTranscriptSearch}
        />

        {/* Resources */}
        {resources?.length ? (
          <div className="resources-row">
            {resources.map(r => (
              <a key={r.href} className="sh-btn sh-btn--secondary" href={r.href} target="_blank" rel="noreferrer">
                {r.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
VideoBlock.propTypes = {
  src: PropTypes.string, poster: PropTypes.string,
  captions: PropTypes.array, resources: PropTypes.array, introText: PropTypes.string,
  onPracticeFromCue: PropTypes.func, onFocusTranscriptSearch: PropTypes.func,
  aslMode: PropTypes.bool, setAslMode: PropTypes.func
};

/* ========= Transcript with “Practice this moment” ========= */
function Transcript({ captions=[], activeCue, onJump, onPractice, onFocusQuery }) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (!inputRef.current) return;
    const el=inputRef.current;
    function onSlash(e){ if(e.key==="/" && document.activeElement!==el){ e.preventDefault(); el.focus(); } }
    window.addEventListener("keydown", onSlash);
    return ()=>window.removeEventListener("keydown", onSlash);
  }, []);
  return (
    <details className="transcript" open>
      <summary className="sh-collapseSummary">Transcript</summary>
      <div className="sh-collapseBody">
        <div className="transcript-tools">
          <input
            ref={inputRef}
            className="app-search__input" placeholder="Search transcript…"
            value={query} onChange={e=>setQuery(e.target.value)}
            onFocus={()=>onFocusQuery?.()}
          />
        </div>
        <ol className="transcript-list">
          {captions
            .filter(c => !query || c.text.toLowerCase().includes(query.toLowerCase()))
            .map(c => (
            <li key={c.id} className={activeCue===c.id ? "is-active" : ""}>
              <button className="transcript-time" onClick={()=>onJump(c.t)} aria-label={`Jump to ${Math.round(c.t)} seconds`}>
                {formatTime(c.t)}
              </button>
              <span className="transcript-text">{c.text}</span>
              <div className="transcript-actions">
                <button className="sh-btn" onClick={()=>onPractice({ id:c.id, t:c.t, text:c.text })}>Practice this</button>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
Transcript.propTypes = {
  captions: PropTypes.array, activeCue: PropTypes.any, onJump: PropTypes.func,
  onPractice: PropTypes.func, onFocusQuery: PropTypes.func
};
function formatTime(s){ const m = Math.floor(s/60); const ss = Math.floor(s%60).toString().padStart(2,"0"); return `${m}:${ss}`; }

/* ========= Vocabulary ========= */
function VocabSection({ items=[] }) {
  const [starred, setStarred] = React.useState(()=> new Set(readJSON("vocab.stars", [])));
  function toggle(term){
    const next = new Set(starred);
    next.has(term) ? next.delete(term) : next.add(term);
    setStarred(next);
    safeSet("vocab.stars", Array.from(next));
  }
  return (
    <section id="vocab" className="sh-card" aria-labelledby="vocab-h">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <header className="section-head">
          <div className="section-title" id="vocab-h"><Icon>🔤</Icon> Vocabulary <span className="badge">{items.length}</span></div>
          <div className="section-tools"><button className="sh-btn sh-btn--primary">Practice all</button></div>
        </header>
        <div className="vocab-grid">
          {items.map(v => (
            <div key={v.term} className="vocab-chip">
              <div className="vocab-top">
                <strong>{v.term}</strong>
                <button className="star" aria-pressed={starred.has(v.term)} onClick={()=>toggle(v.term)}>{starred.has(v.term)?"⭐":"☆"}</button>
              </div>
              {v.preview && (
                <div className="vocab-video" aria-label={`${v.term} preview`}>
                  <video src={v.preview} loop muted playsInline preload="metadata" onMouseOver={e=>e.currentTarget.play()} onMouseOut={e=>{e.currentTarget.pause(); e.currentTarget.currentTime=0;}} />
                </div>
              )}
              <p className="vocab-usage">{v.usage}</p>
              <div className="vocab-actions">
                <button className="sh-btn" onClick={()=>speak(`${v.term}. ${v.usage||""}`)}>🔊</button>
                <button className="sh-btn">Practice</button>
              </div>
            </div>
          ))}
          {!items.length && <div className="sh-muted">No vocabulary yet.</div>}
        </div>
      </div>
    </section>
  );
}
VocabSection.propTypes = { items: PropTypes.array };

/* ========= Micro Quiz (confidence → review queue) ========= */
function QuizSection({ questions=[], onConfidenceItem=()=>{} }) {
  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [conf, setConf] = React.useState(false);
  const [ariaMsg, setAriaMsg] = React.useState("");

  const q = questions[idx];

  React.useEffect(() => {
    function onKey(e){
      if (!q) return;
      if (/^[1-4]$/.test(e.key)) pick(Number(e.key)-1);
    }
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, picked]);

  function pick(i){
    if (picked!=null) return;
    setPicked(i);
    const c = q.options[i].correct;
    setAriaMsg(c ? "Correct" : "Incorrect");
    if (c) setCorrectCount(x => x+1);
    if (conf) onConfidenceItem(q.id || `q${idx}`, { type:"quiz", prompt:q.prompt });
  }
  function next(){ setPicked(null); setConf(false); if (idx < questions.length-1) setIdx(i=>i+1); }

  const pct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <section id="quiz" className="sh-card" aria-label="Practice quiz">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <header className="section-head">
          <div className="section-title"><Icon>✅</Icon> Quick Check <span className="badge">{pct}%</span></div>
          <div className="section-tools">
            <label className="sh-btn">
              <input type="checkbox" checked={conf} onChange={e=>setConf(e.target.checked)} />
              I’m 50/50
            </label>
          </div>
        </header>

        <div className="sr-only" aria-live="polite">{ariaMsg}</div>

        {!q ? <div className="sh-muted">No questions yet.</div> : (
          <div className="quiz">
            <h3 className="sh-mcqQ">{q.prompt}</h3>
            <div className="sh-mcqOpts">
              {q.options.map((o, i) => {
                const isPicked = picked===i;
                const state = picked!=null ? (o.correct ? "is-right" : isPicked ? "is-wrong" : "") : "";
                return (
                  <button
                    key={i}
                    className={`quiz-opt ${state}`}
                    onClick={()=>pick(i)}
                    aria-pressed={isPicked}
                  >
                    <span className="kbd">{i+1}</span> {o.label}
                  </button>
                );
              })}
            </div>

            {picked!=null && (
              <div className="quiz-feedback" role="status" aria-live="polite">
                {q.options[picked].correct ? "Correct! 🎉" : "Not quite."} {q.options[picked].why || ""}
                {q.options[picked].timestamp!=null && (
                  <a
                    className="sh-linkBtn"
                    href={`#t=${q.options[picked].timestamp}`}
                    onClick={(e)=>{ e.preventDefault(); document.getElementById("intro")?.scrollIntoView({behavior:"smooth"}); }}
                    style={{marginLeft:8}}
                  >
                    Jump to video moment
                  </a>
                )}
                <div style={{marginTop:8}}>
                  <button className="sh-btn sh-btn--primary" onClick={next}>Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
QuizSection.propTypes = { questions: PropTypes.array, onConfidenceItem: PropTypes.func };

/* ========= Artifact Upload ========= */
function ArtifactsSection({ allowRecord=false }) {
  const [files, setFiles] = React.useState([]);
  const [ariaMsg, setAriaMsg] = React.useState("");

  function onDrop(e){
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files || []);
    addFiles(list);
  }
  function addFiles(list){
    const next = list.map(f => ({ id: crypto.randomUUID(), name: f.name, file: f, url: URL.createObjectURL(f) }));
    setFiles(prev => [...prev, ...next]);
    setAriaMsg(`Added ${list.length} file${list.length!==1?"s":""}`);
  }

  return (
    <section id="artifacts" className="sh-card">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <header className="section-head">
          <div className="section-title"><Icon>📎</Icon> Upload Artifact</div>
          <div className="section-tools">
            <label className="sh-btn">
              Choose file
              <input type="file" hidden onChange={e=>addFiles(Array.from(e.target.files||[]))} />
            </label>
            {allowRecord && (
              <label className="sh-btn">
                Record
                <input type="file" hidden accept="video/*" capture="user" onChange={e=>addFiles(Array.from(e.target.files||[]))} />
              </label>
            )}
          </div>
        </header>

        <div className="sr-only" aria-live="polite">{ariaMsg}</div>

        <div
          className="dropzone"
          onDragOver={e=>e.preventDefault()}
          onDrop={onDrop}
          role="region"
          aria-label="Drag and drop files here"
        >
          Drop files here
        </div>

        <div className="thumbs">
          {files.map(f => (
            <figure key={f.id} className="thumb">
              <img src={f.url} alt={f.name} onError={e=>{e.currentTarget.replaceWith(document.createTextNode("File"));}} />
              <figcaption>{f.name}</figcaption>
              <div className="thumb-actions">
                <a className="sh-btn" href={f.url} target="_blank" rel="noreferrer">Preview</a>
                <button className="sh-btn" onClick={()=>setFiles(files.filter(x=>x.id!==f.id))}>Remove</button>
              </div>
            </figure>
          ))}
          {!files.length && <div className="sh-muted">No artifacts yet.</div>}
        </div>
      </div>
    </section>
  );
}
ArtifactsSection.propTypes = { allowRecord: PropTypes.bool };

/* ========= Reflection ========= */
function ReflectionSection({ storageKey="lesson.reflection" }) {
  const [text, setText] = React.useState(()=> readJSON(storageKey, "") || "");
  const [savedAt, setSavedAt] = React.useState(null);
  const [exportToPortfolio, setExportToPortfolio] = React.useState(!!readJSON(storageKey+".export", false));

  React.useEffect(() => {
    const t = setTimeout(() => {
      safeSet(storageKey, text);
      setSavedAt(Date.now());
    }, 400);
    return ()=>clearTimeout(t);
  }, [text, storageKey]);

  React.useEffect(() => { safeSet(storageKey+".export", exportToPortfolio); }, [exportToPortfolio, storageKey]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <section id="reflection" className="sh-card">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <header className="section-head">
          <div className="section-title"><Icon>📝</Icon> Reflection</div>
          <div className="section-tools">
            <label className="sh-btn">
              <input type="checkbox" checked={exportToPortfolio} onChange={e=>setExportToPortfolio(e.target.checked)} />
              Export to portfolio
            </label>
          </div>
        </header>

        <div className="reflection-tools">
          <button className="sh-btn" onClick={()=>setText(t=>t+(t? "\n":"")+"I noticed ")}>“I noticed …”</button>
          <button className="sh-btn" onClick={()=>setText(t=>t+(t? "\n":"")+"I struggled with ")}>“I struggled with …”</button>
          <button className="sh-btn" onClick={()=>speak("Reflect on what felt natural and what was hard.")}>🔊 Read prompt</button>
        </div>

        <textarea
          className="reflection-input"
          placeholder="Write your thoughts here…"
          value={text}
          onChange={e=>setText(e.target.value)}
          rows={5}
        />
        <div className="reflection-meta">
          <span className="sh-muted">{words} words</span>
          <span className="sh-muted">{savedAt ? `Saved · ${Math.round((Date.now()-savedAt)/1000)}s ago` : "Not saved yet"}</span>
        </div>
      </div>
    </section>
  );
}
ReflectionSection.propTypes = { storageKey: PropTypes.string };

/* ========= Skill Mastery ========= */
function SkillMastery({ skills=[], ns="skills" }) {
  const [state, setState] = React.useState(()=> {
    const saved = readJSON(`${ns}.state`, {});
    const base = {}; skills.forEach(s => { base[s.id] = saved?.[s.id] ?? { level: "new", pct: 0 }; });
    return base;
  });

  function bump(id, delta=25){
    setState(prev => {
      const cur = prev[id] || { level:"new", pct:0 };
      const nextPct = Math.min(100, cur.pct + delta);
      const nextLevel = nextPct >= 100 ? "mastered" : nextPct >= 50 ? "learning" : "new";
      const next = { ...prev, [id]: { level: nextLevel, pct: nextPct } };
      safeSet(`${ns}.state`, next);
      return next;
    });
  }

  return (
    <section className="sh-card" aria-label="Mastery">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <header className="section-head">
          <div className="section-title"><Icon>🎯</Icon> Mastery</div>
          <div className="section-tools"><span className="badge">{skills.length} skills</span></div>
        </header>
        {!skills.length ? <div className="sh-muted">No skills defined.</div> : (
          <div className="skills">
            {skills.map(s => {
              const st = state[s.id] || { level:"new", pct:0 };
              return (
                <div key={s.id} className={`skill ${st.level}`}>
                  <div className="skill-row">
                    <strong>{s.label}</strong>
                    <span className="skill-level">{st.level}</span>
                  </div>
                  <div className="skill-bar"><div className="skill-barFill" style={{ width: `${st.pct}%` }} /></div>
                  <div className="skill-actions">
                    <button className="sh-btn" onClick={()=>bump(s.id, 25)}>I practiced</button>
                    {st.pct>=100 && <a className="sh-linkBtn" href="#challenge" onClick={(e)=>{e.preventDefault(); alert("Challenge unlocked!");}}>Open Challenge</a>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
SkillMastery.propTypes = { skills: PropTypes.array, ns: PropTypes.string };

/* ========= Lesson TOC (sticky right column) ========= */
function LessonTOC({ sections=[] }) {
  const [active, setActive] = React.useState(sections[0]?.id);
  React.useEffect(() => {
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return ()=>obs.disconnect();
  }, [sections]);

  return (
    <aside className="lesson-toc" aria-label="Lesson table of contents">
      <h4>On this lesson</h4>
      <ol>
        {sections.map(s => (
          <li key={s.id}>
            <a href={`#${s.id}`} className={active===s.id ? "is-active" : ""}>
              <Icon>{s.icon}</Icon> {s.label} {s.count!=null ? <span className="badge">{s.count}</span> : null}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
LessonTOC.propTypes = { sections: PropTypes.array };

/* ========= Micro-drill modal (spawned from transcript) ========= */
function DrillModal({ cue, onClose, onQueue }) {
  React.useEffect(() => {
    function onKey(e){ if(e.key==="Escape") onClose?.(); }
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!cue) return null;
  return (
    <div className="kb-overlay" role="dialog" aria-modal="true" aria-label="Practice this moment">
      <div className="kb-card">
        <header><strong>Practice this moment</strong></header>
        <p className="prose" style={{marginTop:8}}>{cue.text}</p>
        <div className="kb-actions">
          <button className="sh-btn" onClick={()=>onQueue(cue)}>Add to review</button>
          <button className="sh-btn sh-btn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
DrillModal.propTypes = { cue: PropTypes.object, onClose: PropTypes.func, onQueue: PropTypes.func };

/* ========= Main template ========= */
export default function LessonTemplate({
  lesson = {},
  instructorMeta = null,
  mode = "student",
  curriculum = "asl",
  currentSlug = "ch1",
  nextSlug = null,
  prevSlug = null,
  progressKey = "lesson.progress",
  onMarkComplete = () => {},
}) {
  const title = lesson.title || "Lesson";
  const minutes = lesson.estMinutes || 30;
  const level = (lesson.level || "Beginner");
  const [progress, setProgress] = React.useState(()=> readJSON(progressKey, 0));
  const [done, setDone] = React.useState(()=> !!readJSON(progressKey+".done", false));
  const [kbOpen, setKbOpen] = React.useState(false);
  const [aslFirst, setAslFirst] = React.useState(!!readJSON("ui.aslFirst", false));
  const [contrast, setContrast] = React.useState(!!readJSON("ui.contrast", false));
  const [drillCue, setDrillCue] = React.useState(null);

  // Theme toggles (persist + set classes)
  React.useEffect(() => {
    safeSet("ui.aslFirst", aslFirst);
    document.documentElement.classList.toggle("asl-first", aslFirst);
  }, [aslFirst]);
  React.useEffect(() => {
    safeSet("ui.contrast", contrast);
    document.documentElement.classList.toggle("theme-contrast", contrast);
  }, [contrast]);

  // Keyboard ? overlay
  React.useEffect(() => {
    function onKey(e){ if(e.key === "?") setKbOpen(v=>!v); }
    window.addEventListener("keydown", onKey);
    return ()=>window.removeEventListener("keydown", onKey);
  }, []);

  function markComplete(){
    if (done) return;
    safeSet(progressKey+".done", true);
    setDone(true);
    setProgress(100);
    popConfetti();
    onMarkComplete?.();
  }

  const sections = [
    { id:"intro", label:"Introduction", icon:"▶" },
    { id:"vocab", label:"Vocabulary", icon:"🔤", count: (lesson.vocab||[]).length },
    { id:"quiz", label:"Practice", icon:"✅", count: (lesson.questions||[]).length },
    { id:"artifacts", label:"Artifacts", icon:"📎" },
    { id:"reflection", label:"Reflection", icon:"📝" },
    { id:"skills", label:"Mastery", icon:"🎯" },
  ];

  // Update progress as user scrolls through required sections
  React.useEffect(() => {
    const ids = ["intro","vocab","quiz","artifacts","reflection"];
    const seen = new Set();
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting) {
          seen.add(e.target.id);
          const pct = Math.round((seen.size / ids.length) * 90); // leave 10% for final mark
          setProgress(pct);
          safeSet(progressKey, pct);
        }
      });
    }, { root: document.querySelector(".app-main"), threshold: 0.4 });
    ids.forEach(id => { const el=document.getElementById(id); if(el) obs.observe(el); });
    return ()=>obs.disconnect();
  }, [progressKey]);

  // Confidence → review queue hook
  function handleConfidence(itemId, payload){
    RQ.enqueue({ id: itemId, at: Date.now(), meta: payload });
  }

  // Practice from transcript
  function handlePracticeFromCue(cue){
    setDrillCue(cue);
    RQ.enqueue({ id: `cue:${cue.id}`, at: Date.now(), meta: { type:"cue", t: cue.t } });
  }

  return (
    <div className="lesson-grid">
      {/* LEFT: main content */}
      <div className="lesson-main">
        <div className="lesson-toolbar">
          <label className="sh-btn">
            <input type="checkbox" checked={aslFirst} onChange={e=>setAslFirst(e.target.checked)} /> ASL-first mode
          </label>
          <label className="sh-btn">
            <input type="checkbox" checked={contrast} onChange={e=>setContrast(e.target.checked)} /> High contrast
          </label>
          <button className="sh-btn" onClick={()=>setKbOpen(true)}>?</button>
        </div>

        <HeroHeader
          title={title}
          level={level}
          minutes={minutes}
          progress={progress}
          onResume={()=>document.getElementById("intro")?.scrollIntoView({behavior:"smooth", block:"start"})}
          onComplete={markComplete}
        />

        <VideoBlock
          src={lesson.media?.src || "/sample.mp4"}
          poster={lesson.media?.poster}
          captions={lesson.transcript || []}
          resources={lesson.resources || []}
          introText={lesson.summary || ""}
          onPracticeFromCue={handlePracticeFromCue}
          onFocusTranscriptSearch={()=>{}}
          aslMode={aslFirst}
          setAslMode={setAslFirst}
        />

        <VocabSection items={lesson.vocab || []} />

        <QuizSection questions={lesson.questions || []} onConfidenceItem={handleConfidence} />

        <ArtifactsSection allowRecord />

        <ReflectionSection storageKey={`reflect.${curriculum}.${currentSlug}`} />

        <section id="skills">{/* anchor */}</section>
        <SkillMastery skills={lesson.skills || []} ns={`skills.${curriculum}.${currentSlug}`} />
      </div>

      {/* RIGHT: sticky TOC */}
      <LessonTOC sections={sections} />

      {/* Overlays */}
      <KeyboardMap open={kbOpen} onClose={()=>setKbOpen(false)} />
      <DrillModal cue={drillCue} onClose={()=>setDrillCue(null)} onQueue={(c)=>{ RQ.enqueue({ id:`cue:${c.id}`, at:Date.now(), meta:{ type:"cue", t:c.t }}); setDrillCue(null); }} />
    </div>
  );
}
