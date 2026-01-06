/* Dev-only asserts for the Career app */
if (import.meta.env.DEV) {
  // Optional sanity check (will only warn if somehow loaded outside Career)
  if (!/career\.html/i.test(location.href)) {
    console.warn("[Career asserts] Running outside career.html (ok in monolith dev).");
  }

  const run = () => {
    // Does the sidebar expose a /learn link?
    const found = document.querySelector(
      'a[href="#/learn"], a[href="/learn"], a[href$="#/learn"]'
    );
    if (!found) {
      console.warn(
        '⚠️ [CareerSidebar] Missing "Continue learning" link to /learn.\n' +
        'Paste this where you want it:\n' +
        '<NavLink to="/learn" className={({isActive}) => isActive ? "car-link is-active" : "car-link"}>Continue learning</NavLink>'
      );
    }
  };

  // Run now…
  run();

  // …and re-run when the hash route changes (HashRouter)
  window.addEventListener("hashchange", run);

  // Re-run on HMR updates, too
  if (import.meta.hot) {
    import.meta.hot.accept(run);
  }
}
