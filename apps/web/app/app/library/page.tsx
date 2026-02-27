"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listLessonPlans, createLessonPlan } from "@/lib/lessonPlans";

type Lesson = {
  id: string;
  title: string;
  overview: string;
  primary_grade: string;
  subject: string;
  duration_minutes: number;
};

const GRADE_OPTIONS = ["K", "1", "2", "3", "4", "5"] as const;

// Adjust this list to match your actual categories:
const SUBJECT_OPTIONS = [
  "Technology",
  "Digital Citizenship",
  "Keyboarding",
  "Coding",
  "Robotics",
  "STEM",
] as const;

export default function LibraryPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New lesson form state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState<(typeof GRADE_OPTIONS)[number]>("K");
  const [subject, setSubject] =
    useState<(typeof SUBJECT_OPTIONS)[number]>("Technology");
  const [duration, setDuration] = useState<number>(45);

  const canCreate = useMemo(() => title.trim().length > 0, [title]);

  async function refresh() {
    setError(null);
    try {
      const data = await listLessonPlans();
      setLessons(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load lessons (did you login?)");
    }
  }

  async function createFromForm() {
    setError(null);
    try {
      await createLessonPlan({
        title: title.trim(),
        overview: "",
        primary_grade: grade,
        subject,
        duration_minutes: duration,
        content: { blocks: [] },
      });
      setTitle("");
      setGrade("K");
      setSubject("Technology");
      setDuration(45);
      setIsCreating(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Library</h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isCreating ? (
            <button onClick={() => setIsCreating(true)} style={{ padding: 10 }}>
              + New
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson title (e.g., Chromebook Login Routine)"
                style={{ padding: 10, minWidth: 260 }}
              />

              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as any)}
                style={{ padding: 10 }}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as any)}
                style={{ padding: 10 }}
              >
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={5}
                step={5}
                style={{ padding: 10, width: 110 }}
                title="Duration (minutes)"
              />

              <button
                onClick={createFromForm}
                style={{ padding: 10 }}
                disabled={!canCreate}
              >
                Create
              </button>

              <button
                onClick={() => setIsCreating(false)}
                style={{ padding: 10, background: "transparent" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p style={{ color: "#B91C1C" }}>{error}</p>}

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {lessons.map((l) => (
          <Link
            key={l.id}
            href={`/app/lesson/${l.id}`}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 600 }}>{l.title}</div>
            <div style={{ color: "#6B7280", fontSize: 13 }}>
              Grade {l.primary_grade || "—"} · {l.subject || "—"} ·{" "}
              {l.duration_minutes} min
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}