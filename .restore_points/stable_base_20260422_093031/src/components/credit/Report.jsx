// src/pages/credit/Report.jsx
import React from "react";
import { useParams } from "react-router-dom";
export default function Report() {
  const { consumerId } = useParams();
  return (
    <div className="page pad card card--pad">
      <h1 style={{ marginTop:0 }}>Report for Consumer {consumerId}</h1>
      <p className="ink-soft">Tradelines, inquiries, and SHF-linked items would render here.</p>
    </div>
  );
}
