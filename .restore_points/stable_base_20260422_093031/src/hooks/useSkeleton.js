import React from "react";

/**
 * useSkeleton
 * Returns { loading } that flips to false after delayMs.
 * Useful for local skeletons before real data arrives.
 */
export default function useSkeleton(delayMs = 700) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return { loading, setLoading };
}
