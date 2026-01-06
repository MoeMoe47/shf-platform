import React from "react";
import { appendEvent, rollup } from "@/shared/ledger/ledgerClient.js";

export default function Marketplace(){
  const [total, setTotal] = React.useState(rollup().total);
  const redeem = (cost) => {
    appendEvent({ actorId:"dev", app:"sales", type:"spend", amount:-Math.abs(cost), tags:["evu.spend"] });
    setTotal(rollup().total);
  };

  return (
    <div className="pad">
      <h1>EVU Marketplace</h1>
      <p>Redeem EVU for perks (demo).</p>
      <p>Balance: <strong>{total}</strong></p>
      <button className="btn" onClick={() => redeem(15)}>🎓 Tutoring (-15)</button>
      <button className="btn" onClick={() => redeem(5)}>🧰 Resume Review (-5)</button>
    </div>
  );
}
