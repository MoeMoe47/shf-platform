import React from "react";

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: "#ffe5e5",
      border: "1px solid #ffb3b3",
      padding: 12,
      borderRadius: 10,
      marginBottom: 16
    }}>
      {message}
    </div>
  );
}
