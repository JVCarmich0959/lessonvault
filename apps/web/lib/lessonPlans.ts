import { apiFetch } from "@/lib/api";

export async function listLessonPlans() {
  return apiFetch("/api/v1/lesson-plans");
}

export async function getLessonPlan(id: string) {
  return apiFetch(`/api/v1/lesson-plans/${id}`);
}

export async function createLessonPlan(payload: any) {
  return apiFetch("/api/v1/lesson-plans", { method: "POST", body: JSON.stringify(payload) });
}
