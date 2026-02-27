import { apiFetch } from "@/lib/api";

export async function listMaterials(q?: string) {
  const tail = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch(`/api/v1/materials${tail}`);
}

export async function createMaterial(payload: { name: string; category?: string }) {
  return apiFetch("/api/v1/materials", { method: "POST", body: JSON.stringify(payload) });
}
