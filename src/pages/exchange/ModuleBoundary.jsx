import React from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ModuleBoundary({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
