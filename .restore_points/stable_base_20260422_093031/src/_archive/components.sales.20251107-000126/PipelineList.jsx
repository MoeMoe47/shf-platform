import React from "react";

/**
 * PipelineList
 * Lightweight, theme-aware list of opportunities.
 * Props: items = [{ id, name, org, stage, amount, probability }]
 */
const STAGE_ORDER = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

function fmtUSD(n){ return n?.toLocaleString?.("en-US",{ style:"currency", currency:"USD", maximumFractionDigits:0 }) ?? "$0"; }

export default function PipelineList({ items = [] }) {
  const data = items.length ? items : [
    { id:"l1", name:"Cleveland City Schools", org:"CCS", stage:"Qualified", amount: 48000, probability: 0.45 },
    { id:"l2", name:"Franklin District",      org:"FD",  stage:"Proposal",  amount: 120000, probability: 0.55 },
    { id:"l3", name:"Summit Charter",         org:"SC",  stage:"Lead",      amount: 25000,  probability: 0.20 },
    { id:"l4", name:"Medina County Schools",  org:"MCS", stage:"Negotiation", amount: 210000, probability: 0.65 },
  ];

  const sorted = [...data].sort((a,b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  return (
    <ul className="pipe-list" role="list">
      {sorted.map(op => (
        <li key={op.id} className="pipe-row">
          <div className="pipe-main">
            <div className="pipe-title">{op.name}</div>
            <div className="pipe-meta">
              <span className="pipe-org">{op.org}</span>
              <span className={`pipe-stage badge-${kebab(op.stage)}`}>{op.stage}</span>
              <span className="pipe-prob">{Math.round(op.probability * 100)}%</span>
            </div>
          </div>
          <div className="pipe-amt">{fmtUSD(op.amount)}</div>
        </li>
      ))}
    </ul>
  );
}

function kebab(s=""){ return s.toLowerCase().replace(/\s+/g,"-"); }
