import { apiFetch } from "@/lib/api";

export async function listLessonMaterials(lessonId: string) {
  return apiFetch(`/api/v1/lesson-plans/${lessonId}/materials`);
}

export async function attachLessonMaterials(lessonId: string, items: Array<{ material_id: string; quantity_note?: string; prep_note?: string }>) {
  return apiFetch(`/api/v1/lesson-plans/${lessonId}/materials`, {
    method: "POST",
    body: JSON.stringify({ items })
  });
}

export async function detachLessonMaterial(lessonId: string, materialId: string) {
  return apiFetch(`/api/v1/lesson-plans/${lessonId}/materials/${materialId}`, { method: "DELETE" });
}
