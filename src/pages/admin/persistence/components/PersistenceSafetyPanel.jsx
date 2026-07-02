import React from "react";
import { SHS_PERSISTENCE_SAFETY_COPY } from "@/system/persistence/persistenceTypes";

const blockedTypes = [
  "credentials",
  "API keys",
  "OAuth tokens",
  "banking/account secrets",
  "private keys",
  "auth secrets",
  "public approval mutation",
  "SHF Impact Data mutation",
];

export default function PersistenceSafetyPanel({ safetyResult, onSafetyScan }) {
  return (
    <section className="persistence-panel persistence-safety">
      <div className="panel-heading">
        <p>Safety Scanner</p>
        <h2>Persistence Boundaries</h2>
      </div>
      <p className="safety-copy">{SHS_PERSISTENCE_SAFETY_COPY}</p>
      <button type="button" onClick={onSafetyScan}>Run Safety Scan</button>
      <ul className="blocked-list">
        {blockedTypes.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className="result-box">
        <strong>{safetyResult.status}</strong>
        <span>Blocked findings: {safetyResult.blocked_count}</span>
      </div>
    </section>
  );
}

