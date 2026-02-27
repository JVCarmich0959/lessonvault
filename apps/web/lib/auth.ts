import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/storage";

export async function apiRegister(payload: { email: string; password: string; name?: string }) {
  const data = await apiFetch("/api/v1/auth/register", { method: "POST", body: JSON.stringify(payload) });
  setToken(data.access_token);
  return data;
}

export async function apiLogin(payload: { email: string; password: string }) {
  const data = await apiFetch("/api/v1/auth/login", { method: "POST", body: JSON.stringify(payload) });
  setToken(data.access_token);
  return data;
}
