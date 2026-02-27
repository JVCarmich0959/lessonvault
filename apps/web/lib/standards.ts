import { apiFetch } from "@/lib/api";

export async function listStandardsSets() {
  return apiFetch("/api/v1/standards-sets");
}

export async function createStandardsSet(payload: { name: string; version_label?: string }) {
  return apiFetch("/api/v1/standards-sets", { method: "POST", body: JSON.stringify(payload) });
}

export async function listStandards(params: { set_id?: string; q?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.set_id) qs.set("set_id", params.set_id);
  if (params.q) qs.set("q", params.q);
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/v1/standards${tail}`);
}

export async function createStandard(payload: { standards_set_id: string; code: string; description: string }) {
  return apiFetch("/api/v1/standards", { method: "POST", body: JSON.stringify(payload) });
}
