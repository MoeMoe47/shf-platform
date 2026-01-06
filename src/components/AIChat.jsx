import React from "react";

/**
 * AIChat
 * - Slide-in panel controlled by `open` prop
 * - Emits onClose() when X/scrim clicked
 * - “Quick suggestion chips” inject prompts into input
 * - Fake typing + echo reply as placeholders (replace later)
 */
export default function AIChat({ open = false, onClose }) {
  const [messages, setMessages] = React.useState([
    { id: "m1", role: "ai", text: "Hi! I’m your coach. How can I help today?" },
  ]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);

  const panelRef = React.useRef(null);
  const listRef = React.useRef(null);

  // Auto-scroll to bottom on message change
  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  function sendPrompt(text) {
    const value = text ?? input.trim();
    if (!value) return;

    // push user message
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: value }]);
    setInput("");
    setTyping(true);

    // placeholder AI reply
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text:
            "Placeholder reply. In production, call your backend / OpenAI here.\n\nYou asked: “" +
            value +
            "”.",
        },
      ]);
      setTyping(false);
    }, 700);
  }

  function onSubmit(e) {
    e.preventDefault();
    sendPrompt();
  }

  // Quick suggestion chips (can vary by page later)
  const suggestions = [
    "Summarize my last lesson",
    "Create 3 practice prompts",
    "Explain this concept simply",
    "Suggest a mini-review quiz",
  ];

  return (
    <>
      {/* Scrim */}
      {open && <div className="ai-scrim" onClick={onClose} aria-hidden />}

      {/* Panel */}
      <aside
        ref={panelRef}
        className={`ai-panel ${open ? "open" : ""}`}
        role="dialog"
        aria-label="AI Coach"
        aria-modal="true"
      >
        <button className="ai-close" onClick={onClose} aria-label="Close coach">×</button>

        <div className="ai-panel__header">
          <h2 className="ai-panel__title">
            <span className="ai-badge" aria-hidden>✨</span> Your AI Coach
          </h2>
          <div className="muted">Ask questions, get examples, and practice.</div>
        </div>

        {/* Suggestions */}
        <div className="ai-suggest" aria-label="Suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="chip"
              onClick={() => sendPrompt(s)}
              aria-label={`Suggest: ${s}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="ai-chat">
          <div ref={listRef} className="ai-messages">
            {messages.map((m) => (
              <div key={m.id} className={`ai-msg ${m.role === "ai" ? "is-ai" : "is-user"}`}>
                <div className="ai-bubble">
                  {m.text.split("\n").map((line, i) => (
                    <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {typing && (
              <div className="ai-msg is-ai">
                <div className="ai-bubble is-typing" aria-live="polite" aria-label="Coach is typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form className="ai-composer" onSubmit={onSubmit}>
            <textarea
              className="ai-input"
              rows={1}
              placeholder="Ask your coach…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message your coach"
            />
            <div className="ai-actions">
              <button type="submit" className="btn btn--primary btn--small">Send</button>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
/* --- SHF: Reflection submitted award (AI/Coach chat) --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_reflection) return;
  window.__shfHook_reflection = true;

  const COOLDOWN = 30 * 60 * 1000; // 30 min between awards
  const ok = () => {
    const k = "shf.award.reflection.last";
    const last = Number(localStorage.getItem(k) || 0);
    if (Date.now() - last < COOLDOWN) return false;
    localStorage.setItem(k, String(Date.now()));
    return true;
  };

  window.addEventListener("reflection:submitted", (e) => {
    const { chars = 0 } = (e && e.detail) || {};
    if (!ok()) return;
    try {
      window.shfCredit?.earn?.({
        action: "reflection.submit",
        rewards: { corn: 1 }, // 🌽
        scoreDelta: 3,
        meta: { chars }
      });
      window.shToast?.("📝 Reflection logged · +1 🌽 · +3 score");
    } catch {}
  });

  window.shfAward = Object.assign({}, window.shfAward || {}, {
    reflectionSubmitted: (chars=0) =>
      window.dispatchEvent(new CustomEvent("reflection:submitted", { detail: { chars } }))
  });
})();
/* --- SHF: AI chat solved micro-award (cooldown) --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_aiSolved) return;
  window.__shfHook_aiSolved = true;

  const COOLDOWN_MS = 60_000; // 1 minute buckets if no qid
  const seen = (k) => { if (localStorage.getItem(k)) return true; localStorage.setItem(k, "1"); return false; };

  // Fire when a chat session yields a correct/accepted solution:
  //   window.dispatchEvent(new CustomEvent("ai:chat:solved", { detail:{ qid, topic } }))
  window.addEventListener("ai:chat:solved", (e) => {
    const d = (e && e.detail) || {};
    const key =
      d.qid ? `shf.award.ai.solved.${d.qid}` :
      `shf.award.ai.solved.bucket.${Math.floor(Date.now() / COOLDOWN_MS)}`;
    if (seen(key)) return;
    try {
      window.shfCredit?.earn?.({
        action: "ai.solve",
        rewards: { corn: 1 },
        scoreDelta: 2,
        meta: { qid: d.qid, topic: d.topic }
      });
      window.shToast?.("🤖 Solved with AI · +1 🌽 · +2 score");
    } catch {}
  });
})();
