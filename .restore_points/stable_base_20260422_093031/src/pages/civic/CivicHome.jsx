import React from "react";

export default function CivicHome() {
  return (
    <section className="card card--pad" style={{padding:16}}>
      <h1 style={{marginTop:0}}>Civic Dashboard (Safe Restore)</h1>
      <p>This is a minimal restore so your Civic app renders again without interfering with Sales or Career.</p>
      <ul>
        <li>Hash routing is isolated to <code>civic.html</code>.</li>
        <li>Next step is to reattach your original widgets (header, sidebar, missions, debt clock, etc.) one at a time.</li>
      </ul>
    </section>
  );
}
