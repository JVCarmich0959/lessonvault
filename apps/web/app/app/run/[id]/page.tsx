"use client";

import { useEffect, useState } from "react";
import { getRun, getReflection, createReflection, updateReflection } from "@/lib/runs";

export default function RunPage({ params }: { params: { id: string } }) {
  const runId = params.id;

  const [run, setRun] = useState<any>(null);
  const [ref, setRef] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(3);
  const [worked, setWorked] = useState("");
  const [didnt, setDidnt] = useState("");
  const [mis, setMis] = useState("");
  const [changes, setChanges] = useState("");

  async function refresh() {
    setError(null);
    try {
      const r = await getRun(runId);
      setRun(r);

      try {
        const existing = await getReflection(runId);
        setRef(existing);
        setRating(existing.effectiveness_rating);
        setWorked(existing.worked_well);
        setDidnt(existing.did_not_work);
        setMis(existing.misconceptions);
        setChanges(existing.changes_next_time);
      } catch {
        setRef(null);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load run");
    }
  }

  async function save() {
    setError(null);
    try {
      const payload = {
        effectiveness_rating: Number(rating),
        worked_well: worked,
        did_not_work: didnt,
        misconceptions: mis,
        changes_next_time: changes
      };
      if (!ref) {
        const created = await createReflection(runId, payload);
        setRef(created);
      } else {
        const updated = await updateReflection(runId, payload);
        setRef(updated);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to save reflection");
    }
  }

  useEffect(() => { refresh(); }, [runId]);

  if (error) return <p style={{ color: "#B91C1C" }}>{error}</p>;
  if (!run) return <p>Loading…</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Run</h1>

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 700 }}>{run.taught_on}</div>
        <div style={{ color: "#6B7280", fontSize: 13 }}>
          Grade {run.grade || "—"} · Period {run.class_period || "—"} · {run.duration_actual_minutes} min
        </div>
        {run.notes_quick && <div style={{ marginTop: 8 }}>{run.notes_quick}</div>}
      </section>

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Reflection</div>

        <label>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Effectiveness (1–5)</div>
          <input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ padding: 10, width: 120 }} />
        </label>

        <label>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Worked well</div>
          <textarea value={worked} onChange={(e) => setWorked(e.target.value)} style={{ padding: 10, minHeight: 70 }} />
        </label>

        <label>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Did not work</div>
          <textarea value={didnt} onChange={(e) => setDidnt(e.target.value)} style={{ padding: 10, minHeight: 70 }} />
        </label>

        <label>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Misconceptions</div>
          <textarea value={mis} onChange={(e) => setMis(e.target.value)} style={{ padding: 10, minHeight: 70 }} />
        </label>

        <label>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Changes next time</div>
          <textarea value={changes} onChange={(e) => setChanges(e.target.value)} style={{ padding: 10, minHeight: 70 }} />
        </label>

        <button onClick={save} style={{ padding: 10 }}>
          {ref ? "Update reflection" : "Create reflection"}
        </button>
      </section>
    </div>
  );
}
