import React from "react";
import { Link } from "react-router-dom";

export default function Sandbox(){
  return (
    <div className="pad">
      <h1>Sandbox Economy</h1>
      <p>Practice budgeting, credit utilization, and EVU marketplace.</p>
      <ul>
        <li><Link to="/sim/budget">Budget</Link></li>
        <li><Link to="/sim/credit">Credit Lab</Link></li>
        <li><Link to="/sim/market">Marketplace</Link></li>
      </ul>
    </div>
  );
}
