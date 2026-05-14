import React from "react";

/**
 * RootProviders
 * Central place for global providers (theme, auth, query, etc.)
 * For now this is a clean pass-through wrapper.
 */
export default function RootProviders({ children }) {
  return <>{children}</>;
}
