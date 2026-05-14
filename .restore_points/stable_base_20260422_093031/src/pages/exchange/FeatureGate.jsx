import React from "react";
import { useMode } from "./ModeContext";

export default function FeatureGate({ feature, children }) {
  const { features } = useMode();

  if (!features?.[feature]) {
    return null;
  }

  return children;
}
