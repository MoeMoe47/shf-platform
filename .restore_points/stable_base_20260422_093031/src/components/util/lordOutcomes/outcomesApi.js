// For now this reads from mock data.
// Later, point BASE_URL to your Node/Express Outcomes API.

import {
  MOCK_STATE_OUTCOMES,
  MOCK_REGION_SUMMARY,
} from "./mockOutcomesData.js";

const USE_MOCK = true;
const BASE_URL = "http://localhost:4000/api/outcomes";

export async function fetchRegionSummary({ from, to } = {}) {
  if (USE_MOCK) {
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
    return MOCK_STATE_OUTCOMES;
  }

  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const res = await fetch(`${BASE_URL}/summary/states?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load state summaries");
  return res.json();
}
