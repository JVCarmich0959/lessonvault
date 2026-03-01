"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin, apiRegister } from "@/lib/auth";
import { getToken } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/app";
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") ? next : "/app";
  }, []);

  useEffect(() => {
    if (getToken()) router.replace(nextPath);
  }, [nextPath, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      if (mode === "login") {
        await apiLogin({ email, password });
        router.replace(nextPath);
      } else {
        await apiRegister({ email, password, name });
        router.replace(nextPath);
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Failed");
    }
  }

  return (
    <main style={{ padding: 32, maxWidth: 420, margin: "0 auto" }}>
      <h1>{mode === "login" ? "Login" : "Create account"}</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        {mode === "register" && (
          <label>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 10 }} />
          </label>
        )}
        <label>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>
        <label>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Password</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <button type="submit" style={{ padding: 10 }}>
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12, color: "#374151" }}>{msg}</p>}

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        style={{ marginTop: 16, padding: 10, background: "transparent" }}
      >
        Switch to {mode === "login" ? "register" : "login"}
      </button>
    </main>
  );
}
