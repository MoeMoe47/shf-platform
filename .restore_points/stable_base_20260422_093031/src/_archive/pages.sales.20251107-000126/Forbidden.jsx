import React from "react";

export default function Forbidden() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Access denied</h1>
      <p>This area is restricted to Sales/Marketing staff.</p>
      <a href="/store.html#/marketplace">Go to the public Store</a>
    </div>
  );
}
