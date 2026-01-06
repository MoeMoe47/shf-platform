export function contentSelfTest(where = "unknown") {
  const dbg = typeof window !== "undefined" ? window.__contentDebug : null;
  console.group(`[contentSelfTest @ ${where}]`);
  if (!dbg) {
    console.warn("window.__contentDebug is undefined (index.js may not have run yet).");
  } else {
    console.log("studentLazy:", dbg.studentLazy);
    console.log("studentEager:", dbg.studentEager);
    console.log("studentFiles:", dbg.studentFiles);
  }
  console.groupEnd();
  return dbg;
}
