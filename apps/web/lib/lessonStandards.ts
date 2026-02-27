import { apiFetch } from "@/lib/api";

export async function listLessonStandards(lessonId: string) {
  return apiFetch(`/api/v1/lesson-plans/${lessonId}/standards`);
}

export async function attachLessonStandards(lessonId: string, standardIds: string[]) {
  return apiFetch(`/api/v1/lesson-plans/${lessonId}/standards`, {
    method: "POST",
    body: JSON.stringify({ standard_ids: standardIds })
  });
}

export async function detachLessonStandard(lessonId: string, standardId: string) {
  return apiFetch(`/api/v1/lesson-plans/${lessonId}/standards/${standardId}`, { method: "DELETE" });
}
