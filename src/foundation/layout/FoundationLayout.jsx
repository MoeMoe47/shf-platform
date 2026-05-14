import React from "react";
import FoundationHeader from "./FoundationHeader";
import FoundationFooter from "./FoundationFooter";

export default function FoundationLayout({ children }) {
  return (
    <div className="shf-site shf-home-mock">
      <FoundationHeader />
      <main className="shf-main">{children}</main>
      <FoundationFooter />
    </div>
  );
}
