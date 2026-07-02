import React from "react";

export default function PersistenceTransactionHistory({ transactions }) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Append-only</p>
        <h2>Transaction History</h2>
      </div>
      <div className="history-list">
        {transactions.length === 0 && <span className="empty-state">No local transactions recorded yet.</span>}
        {transactions.slice(-6).reverse().map((transaction) => (
          <article key={transaction.transaction_id}>
            <strong>{transaction.operation}</strong>
            <span>{transaction.repository} / {transaction.entity_id || "pending"}</span>
            <small>{transaction.status} · {transaction.timestamp}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

