import { apiFetch } from "@/lib/api";

export async function listLessonRuns(lessonId: string) {
  return apiFetch(`/api/v1/lesson-plans/${lessonId}/runs`);
}

export async function createLessonRun(lessonId: string, payload: any) {
  return apiFetch(`/api/v1/lesson-plans/${lessonId}/runs`, { method: "POST", body: JSON.stringify(payload) });
}

export async function getRun(runId: string) {
  return apiFetch(`/api/v1/runs/${runId}`);
}

export async function getReflection(runId: string) {
  return apiFetch(`/api/v1/runs/${runId}/reflection`);
}

export async function createReflection(runId: string, payload: any) {
  return apiFetch(`/api/v1/runs/${runId}/reflection`, { method: "POST", body: JSON.stringify(payload) });
}

export async function updateReflection(runId: string, payload: any) {
  return apiFetch(`/api/v1/runs/${runId}/reflection`, { method: "PATCH", body: JSON.stringify(payload) });
}
