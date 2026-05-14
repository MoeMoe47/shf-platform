// src/pages/Subscribe.jsx
import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Subscribe() {
  const navigate = useNavigate();
  const { search } = useLocation();

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const from = params.get("from") || "/";

  // Optional: in dev, if you never want to see the subscribe wall, bounce back
  useEffect(() => {
    if (import.meta.env.DEV) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  return (
    <div className="pad">
      <h1>Subscribe</h1>
      <p>You’re not subscribed yet.</p>
      <button className="btn" onClick={() => navigate(from, { replace: true })}>
        Go back
      </button>
    </div>
  );
}
