import {
  MOCK_STATE_OUTCOMES,
  MOCK_REGION_SUMMARY,
} from "./mockOutcomesData.js";

// DEMO MODE: no real backend yet
const USE_MOCK = true;
// When you're ready for backend later, point this to your API:
const BASE_URL = "http://localhost:4000/api/outcomes";

export async function fetchRegionSummary({ from, to } = {}) {
  if (USE_MOCK) {
    // simulate slight delay
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_REGION_SUMMARY;
  }

  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const res = await fetch(`${BASE_URL}/summary/region?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load region summary");
  return res.json();
}

export async function fetchStateSummaries({ from, to } = {}) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_STATE_OUTCOMES;
  }

  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const res = await fetch(`${BASE_URL}/summary/states?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load state summaries");
  return res.json();
}
