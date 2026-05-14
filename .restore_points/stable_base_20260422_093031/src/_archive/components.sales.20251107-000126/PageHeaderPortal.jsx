// src/components/sales/PageHeaderPortal.jsx
import React from "react";
import { createPortal } from "react-dom";

export default function PageHeaderPortal({ children }) {
  if (typeof document === "undefined") return null;
  const host = document.getElementById("page-header-slot");
  return host ? createPortal(children, host) : null;
}
