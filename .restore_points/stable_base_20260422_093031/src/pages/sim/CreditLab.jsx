import React from "react";
import { appendEvent } from "@/shared/ledger/ledgerClient.js";

export default function CreditLab(){
  const [limit, setLimit] = React.useState(1000);
  const [balance, setBalance] = React.useState(300);
  const util = Math.round((balance / Math.max(1, limit)) * 100);

  const pay50 = () => setBalance(b => Math.max(0, b - 50));
  const record = () => {
    appendEvent({
      actorId: "dev",
      app: "credit",
      type: "earn",
      amount: util <= 30 ? 5 : 0,
      tags: ["credit.utilization", util <= 30 ? "good" : "high"],
      meta: { limit, balance, util }
    });
    alert("Logged utilization event.");
  };

  return (
    <div className="pad">
      <h1>Credit Lab</h1>
      <div>Limit: {limit} <input type="range" min="200" max="5000" step="100"
        value={limit} onChange={e=>setLimit(Number(e.target.value))}/></div>
      <div>Balance: {balance} <input type="range" min="0" max="5000" step="50"
        value={balance} onChange={e=>setBalance(Number(e.target.value))}/></div>
      <p>Utilization: <strong>{util}%</strong> (goal ≤ 30%)</p>
      <button className="btn" onClick={pay50}>Pay $50</button>
      <button className="btn" onClick={record}>Record</button>
    </div>
  );
}
