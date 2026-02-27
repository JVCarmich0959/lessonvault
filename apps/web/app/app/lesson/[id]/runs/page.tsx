"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listLessonRuns, createLessonRun } from "@/lib/runs";

export default function LessonRuns({ params }: { params: { id: string } }) {
  const lessonId = params.id;
  const [runs, setRuns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [taughtOn, setTaughtOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [grade, setGrade] = useState("");
  const [period, setPeriod] = useState("");
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState("");

  async function refresh() {
    setError(null);
    try {
      setRuns(await listLessonRuns(lessonId));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load runs");
    }
  }

  async function addRun() {
    setError(null);
    try {
      await createLessonRun(lessonId, {
        taught_on: taughtOn,
        grade,
        class_period: period,
        duration_actual_minutes: Number(duration) || 0,
        notes_quick: notes
      });
      setNotes("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create run");
    }
  }

  useEffect(() => { refresh(); }, [lessonId]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Lesson Runs</h1>
      {error && <p style={{ color: "#B91C1C" }}>{error}</p>}

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Mark taught</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="date" value={taughtOn} onChange={(e) => setTaughtOn(e.target.value)} style={{ padding: 10 }} />
          <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Grade (optional)" style={{ padding: 10 }} />
          <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Class period (optional)" style={{ padding: 10 }} />
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} placeholder="Actual minutes" style={{ padding: 10, width: 140 }} />
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quick notes (optional)" style={{ padding: 10, minHeight: 80 }} />
        <button onClick={addRun} style={{ padding: 10 }}>Add run</button>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        {runs.map((r) => (
          <Link key={r.id} href={`/app/run/${r.id}`} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{r.taught_on}</div>
            <div style={{ color: "#6B7280", fontSize: 13 }}>
              Grade {r.grade || "—"} · Period {r.class_period || "—"} · {r.duration_actual_minutes} min
            </div>
            {r.notes_quick && <div style={{ marginTop: 6, color: "#374151" }}>{r.notes_quick}</div>}
          </Link>
        ))}
        {runs.length === 0 && <div style={{ color: "#6B7280" }}>No runs yet.</div>}
      </section>
    </div>
  );
}
