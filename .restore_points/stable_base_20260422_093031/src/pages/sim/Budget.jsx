import React from "react";
import { appendEvent } from "@/shared/ledger/ledgerClient.js";

export default function Budget(){
  const [income, setIncome] = React.useState(2000);
  const [expenses, setExpenses] = React.useState(1500);
  const savings = income - expenses;

  const log = () => {
    appendEvent({
      actorId: "dev",
      app: "career",
      type: "progress",
      amount: 0,
      tags: ["budget.completed"],
      meta: { income, expenses, savings }
    });
    alert("Recorded budget practice!");
  };

  return (
    <div className="pad">
      <h1>Budget</h1>
      <label>Income: {income}
        <input type="range" min="500" max="5000" step="100"
               value={income} onChange={e=>setIncome(Number(e.target.value))}/>
      </label>
      <label>Expenses: {expenses}
        <input type="range" min="300" max="4000" step="100"
               value={expenses} onChange={e=>setExpenses(Number(e.target.value))}/>
      </label>
      <p>Savings: <strong>{savings}</strong></p>
      <button className="btn" onClick={log}>Save Practice</button>
    </div>
  );
}
