import React from "react";

export default function ExecutiveNavigationPanel({ navigation }) {
  return (
    <section className="ecc-panel ecc-span-4">
      <div className="ecc-panel-heading"><p>Navigation</p><h2>Safe source links</h2></div>
      <div className="ecc-link-grid">
        {navigation.map((item) => <a key={item.layer_id} href={item.route}>{item.label}</a>)}
      </div>
    </section>
  );
}
