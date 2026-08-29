import { apiGet } from "@/lib/apiClient.js";

export async function listCareers() {
  const response = await apiGet("/careers");
  return Array.isArray(response?.data?.items) ? response.data.items : [];
}

export async function getCareer(slug) {
  const response = await apiGet(`/careers/${encodeURIComponent(String(slug || ""))}`);
  return response?.data || null;
}

export async function getCareerCurriculum(slug) {
  const response = await apiGet(`/careers/${encodeURIComponent(String(slug || ""))}/curriculum`);
  return response?.data || null;
}
