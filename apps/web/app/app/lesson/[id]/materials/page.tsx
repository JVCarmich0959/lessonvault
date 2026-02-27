"use client";

import { useEffect, useState } from "react";
import { listMaterials } from "@/lib/materials";
import { listLessonMaterials, attachLessonMaterials, detachLessonMaterial } from "@/lib/lessonMaterials";

export default function LessonMaterials({ params }: { params: { id: string } }) {
  const lessonId = params.id;
  const [attached, setAttached] = useState<any[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [materialId, setMaterialId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [prep, setPrep] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      setAttached(await listLessonMaterials(lessonId));
      const mats = await listMaterials();
      setAllMaterials(mats);
      if (!materialId && mats[0]?.id) setMaterialId(mats[0].id);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    }
  }

  async function attach() {
    setError(null);
    try {
      await attachLessonMaterials(lessonId, [{ material_id: materialId, quantity_note: quantity, prep_note: prep }]);
      setQuantity(""); setPrep("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to attach");
    }
  }

  async function detach(matId: string) {
    setError(null);
    try {
      await detachLessonMaterial(lessonId, matId);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to detach");
    }
  }

  useEffect(() => { refresh(); }, [lessonId]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Lesson Materials</h1>
      {error && <p style={{ color: "#B91C1C" }}>{error}</p>}

      <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Attach material</div>
        <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} style={{ padding: 10 }}>
          {allMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity note (e.g., 1 per student)" style={{ padding: 10 }} />
        <input value={prep} onChange={(e) => setPrep(e.target.value)} placeholder="Prep note (optional)" style={{ padding: 10 }} />
        <button onClick={attach} style={{ padding: 10 }}>Attach</button>
        <div style={{ color: "#6B7280", fontSize: 12 }}>
          Tip: add materials in the global Materials page first.
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {attached.map((a, idx) => (
          <div key={idx} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.material.name}</div>
                <div style={{ color: "#6B7280", fontSize: 13 }}>{a.material.category || "—"}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  <div><b>Qty:</b> {a.quantity_note || "—"}</div>
                  <div><b>Prep:</b> {a.prep_note || "—"}</div>
                </div>
              </div>
              <button onClick={() => detach(a.material.id)} style={{ padding: 10 }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
