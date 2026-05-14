import React from "react";
import FoundationHeader from "./FoundationHeader";
import FoundationFooter from "./FoundationFooter";
import "../styles/tokens.css";
import "../styles/foundation.css";

export default function FoundationLayout({ children }) {
  return (
    <div className="shf-site">
      <FoundationHeader />
      <main className="shf-main">{children}</main>
      <FoundationFooter />
    </div>
  );
}
