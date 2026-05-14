export function detectBase() {
  if (typeof window === 'undefined') return '/';
  // Match "/something.html" at the end of the path, else fallback to "/"
  const match = window.location.pathname.match(/\/[^/]+\.html$/);
  return match ? match[0] : '/';
}
