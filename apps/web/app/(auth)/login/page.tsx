"use client";

import { useState } from "react";
import { apiLogin, apiRegister } from "@/lib/auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      if (mode === "login") {
        await apiLogin({ email, password });
        setMsg("Logged in. Go to /app/library");
      } else {
        await apiRegister({ email, password, name });
        setMsg("Registered. Go to /app/library");
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
