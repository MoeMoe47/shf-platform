import { createBlockedCommandExamples } from "@/system/command-bus/shsCommandSafety";

export default function CommandSafetyPanel({ safety, onBlock }) {
  return (
    <section className="command-panel safety">
      <div className="panel-heading"><p>Safety</p><h2>Blocked Commands</h2></div>
      <p>{safety.safety_copy}</p>
      <button type="button" onClick={onBlock}>Block Dangerous Command</button>
      <strong>Dangerous command blocked: {String(!safety.safe)}</strong>
      <div className="blocked-grid">
        {createBlockedCommandExamples().map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
  );
}
