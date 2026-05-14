import React from "react";
import { __debugKeys } from "../content/index.js";

export default function DebugContent() {
  const files = __debugKeys();
  return (
    <div>
      <h2>Debug Content ✅</h2>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
        {JSON.stringify(files, null, 2)}
      </pre>
    </div>
  );
}
