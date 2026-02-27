"use client";

import { useEffect, useState } from "react";
import { listMaterials, createMaterial } from "@/lib/materials";

export default function MaterialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      setItems(await listMaterials());
    } catch (e: any) {
      setError(e?.message ?? "Failed (did you login?)");
    }
  }

  async function add() {
    setError(null);
    try {
      await createMaterial({ name, category });
      setName("");
      setCategory("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create");
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Materials</h1>
      {error && <p style={{ color: "#B91C1C" }}>{error}</p>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Material name" style={{ padding: 10, minWidth: 240 }} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)" style={{ padding: 10, minWidth: 200 }} />
        <button onClick={add} style={{ padding: 10 }}>Add</button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((m) => (
          <div key={m.id} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{m.name}</div>
            <div style={{ color: "#6B7280", fontSize: 13 }}>{m.category || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
