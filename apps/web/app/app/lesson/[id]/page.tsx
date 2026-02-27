"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLessonPlan } from "@/lib/lessonPlans";

export default function LessonDetail({ params }: { params: { id: string } }) {
  const [lesson, setLesson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLessonPlan(params.id);
        setLesson(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load lesson");
      }
    })();
  }, [params.id]);

  if (error) return <p style={{ color: "#B91C1C" }}>{error}</p>;
  if (!lesson) return <p>Loading…</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{lesson.title}</h1>
          <div style={{ color: "#6B7280" }}>
            Grade {lesson.primary_grade || "—"} · {lesson.subject || "—"} · {lesson.duration_minutes} min
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href={`/app/lesson/${params.id}/materials`} style={{ padding: 10, border: "1px solid #E5E7EB", borderRadius: 10 }}>
            Materials
          </Link>
          <Link href={`/app/lesson/${params.id}/standards`} style={{ padding: 10, border: "1px solid #E5E7EB", borderRadius: 10 }}>
            Standards
          </Link>
          <Link href={`/app/lesson/${params.id}/runs`} style={{ padding: 10, border: "1px solid #E5E7EB", borderRadius: 10 }}>
            Runs / Reflection
          </Link>
        </div>
      </div>

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Overview</h3>
        <p style={{ marginBottom: 0 }}>{lesson.overview || "—"}</p>
      </section>

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Content (JSON)</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(lesson.content, null, 2)}</pre>
      </section>
    </div>
  );
}
