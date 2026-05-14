// src/components/ui/Toast.jsx
import React from "react";

export default function Toast({ msg = "" }) {
  if (!msg) return null;
  return (
    <div className="sh-toast" role="status" aria-live="polite">
      {msg}
    </div>
  );
}
