// src/lib/curriculum/learningApi.js
//
// SHF Curriculum Phase 5.5 — real backend client for apps/shs-api's new
// /curriculum/learning/* routes (student-catalog-service.ts). Mirrors
// src/lib/assignments/api.js's pattern exactly: same base URL, same
// Bearer dev-token auth header, same {ok,data}/{ok:false,error} envelope.
// This is the ONLY place in the frontend that talks to those routes —
// Learning.jsx / CourseWorkspace and its tabs must go through here,
// never fetch() the backend directly, and never compute progress/course
// membership themselves — the backend already resolved it from real
// entitlement + completion data (see student-catalog-service.ts).
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const LEARNING_API_BASE = import.meta.env?.VITE_SHS_API_BASE || import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error?.message || `Learning request failed: ${res.status}`);
    err.code = data?.error?.code || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export async function listMyCourses(role) {
  const res = await fetch(`${LEARNING_API_BASE}/curriculum/learning/courses`, { headers: authHeaders(role) });
  return parseJson(res);
}

export async function getCourseDetail(role, courseId) {
  const res = await fetch(`${LEARNING_API_BASE}/curriculum/learning/courses/${encodeURIComponent(courseId)}`, { headers: authHeaders(role) });
  return parseJson(res);
}

export default { listMyCourses, getCourseDetail };
