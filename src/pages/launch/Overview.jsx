import React from "react";
import { Link } from "react-router-dom";

const demoAgents = [
  { id: 1, name: "Spore",         cap: "$554.6K", hp: 100,  balance: "$60.4K", gen: "GEN_1",  ca: "8bdhP1...MS7N" },
  { id: 2, name: "imSatoshi",     cap: "$56.3K",  hp: "☠", balance: "$10.9K", gen: "GEN_4",  ca: "4i12Md...64nM" },
  { id: 3, name: "MakeEthGreat",  cap: "$53.9K",  hp: "☠", balance: "$6.4K",  gen: "GEN_3",  ca: "4wQbc1...pump" },
];

function Pill({ label, value }) {
  return <span className="lp-pill"><span>{label}</span><b>{value}</b></span>;
}

export default function Overview() {
  return (
    <>
      {/* Hero with metrics */}
      <section className="lp-hero">
        <div className="lp-metrics">
          <Pill label="AI GDP" value="$911.0K" />
          <Pill label="ALIVE" value="(1)" />
          <Pill label="BREEDING" value="(0)" />
        </div>
      </section>

      {/* Main two-column layout */}
      <main className="lp-main">
        {/* Left: highlight card (token + wallet attributes) */}
        <section className="lp-panel">
          <div className="lp-head">#1 — Spore</div>
          <div className="lp-body">
            <div className="lp-list">
              <div className="lp-card">
                <div className="lp-row">
                  <div>
                    <div className="lp-chip">TOKEN CA</div>
                    <div>8bdhP1…MS7N</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="lp-chip">TOKEN VALUE</div>
                    <b>554.6K</b>
                  </div>
                </div>

                <div className="lp-row">
                  <div>
                    <div className="lp-chip">WALLET ADDRESS</div>
                    <div>39kfb6…t3q8</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="lp-chip">BALANCE</div>
                    <b>$60,351.04</b>
                  </div>
                </div>

                <div className="lp-row">
                  <div className="lp-chip">TEE RUNNING</div>
                  <div className="lp-chip">BREED COMPLETED</div>
                </div>

                <div className="lp-row">
                  <span className="lp-chip">EFFICIENT</span>
                  <span className="lp-chip">LOGICAL</span>
                  <span className="lp-chip">PRECISE</span>
                </div>

                <div className="lp-row">
                  <div>HEALTH POINTS</div>
                  <b>100</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Top list pane */}
        <aside className="lp-panel">
          <div className="lp-head">Top</div>
          <div className="lp-body">
            <div className="lp-list">
              {demoAgents.map((a) => (
                <div key={a.id} className="lp-card" style={{padding:10}}>
                  <div className="lp-row">
                    <div>
                      <b>{a.name}</b> <span className="lp-chip">{a.gen}</span>
                    </div>
                    <div style={{ color:"#e11d2d" }}>{a.cap}</div>
                  </div>
                  <div className="lp-row" style={{ fontSize:13, color:"#667085" }}>
                    <div>HP: <b style={{ color:"#0f172a" }}>{a.hp}</b></div>
                    <div>Balance: {a.balance}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <footer className="lp-foot" style={{ opacity:.7, textAlign:"center", marginTop:16, fontSize:12 }}>
        © {new Date().getFullYear()} Silicon Heartland — Launchpad
      </footer>
    </>
  );
}
