export default function SkipLinks() {
  return (
    <nav className="skip-links" aria-label="Skip links">
      <a href="#main">Skip to main content</a>
      <a href="#sidebar">Skip to navigation</a>
      {/* Only include this if your page actually has filters */}
      {/* <a href="#filters">Skip to filters</a> */}
    </nav>
  );
}
