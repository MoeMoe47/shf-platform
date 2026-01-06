// src/dev/allpages.jsx
import React from "react";
import DevDocs from "@/pages/dev/Docs.jsx";

/**
 * All Pages (canonical)
 * - Renders the universal Dev Index (DevDocs).
 * - Lives under src/dev so you can keep your preferred path.
 * - Pair this with the proxy in src/pages/AllPages.jsx so the index can discover it.
 */
export default function AllPages() {
  return <DevDocs />;
}
