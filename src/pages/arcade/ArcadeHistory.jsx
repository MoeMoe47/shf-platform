// Deprecated compatibility route; the only Arcade history surface is History.jsx.
import React from "react";
import { Navigate } from "react-router-dom";

export default function ArcadeHistory() {
  return <Navigate to="/history" replace />;
}
