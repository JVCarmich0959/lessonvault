"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { listLessonPlans, createLessonPlan } from "@/lib/lessonPlans";

type Lesson = {
  id: string;
  title: string;
  overview: string;
  primary_grade: string;
  subject: string;
  duration_minutes: number;
  content?: {
    meta?: {
      unit?: string;
    };
  };
};

const GRADE_OPTIONS = ["K", "1", "2", "3", "4", "5"] as const;
type GradeOption = (typeof GRADE_OPTIONS)[number];

const SUBJECT_OPTIONS = [
  "Technology",
  "Digital Citizenship",
  "Keyboarding",
  "Coding",
  "Robotics",
  "STEM",
] as const;

export default function LibraryPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<GradeOption | "all">("all");

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState<GradeOption>("K");
  const [subject, setSubject] = useState<(typeof SUBJECT_OPTIONS)[number]>("Technology");
  const [duration, setDuration] = useState<number>(45);

  const canCreate = useMemo(() => title.trim().length > 0, [title]);
  const filteredLessons = useMemo(() => {
    const query = search.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesGrade = gradeFilter === "all" || lesson.primary_grade === gradeFilter;
      if (!matchesGrade) return false;
      if (!query) return true;
      const haystack = `${lesson.title} ${lesson.overview} ${lesson.subject}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [gradeFilter, lessons, search]);

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
      const nextTitle = title.trim();
      const created = await createLessonPlan({
        title: nextTitle,
        overview: "",
        primary_grade: grade,
        subject,
        duration_minutes: duration,
        content: { blocks: [], meta: {} }
      });
      setTitle("");
      setGrade("K");
      setSubject("Technology");
      setDuration(45);
      setIsCreating(false);
      await refresh();
      if (created?.id) {
        router.push(`/app/lesson/${created.id}`);
        return;
      }
      setSearch(nextTitle);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="shell">
      <header className="header">
        <h1 className="title">Library</h1>
        <p className="subtitle">Browse and reuse lesson plans.</p>
      </header>

      <div className="controlsRow">
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, overview, subject"
          aria-label="Search lessons"
        />
        <select
          className="select"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value as GradeOption | "all")}
          aria-label="Filter by grade"
        >
          <option value="all">All grades</option>
          {GRADE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              Grade {option}
            </option>
          ))}
        </select>
        <button type="button" className="button" onClick={() => setIsCreating((open) => !open)}>
          New lesson
        </button>
      </div>

      {isCreating ? (
        <div className="createBar">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lesson title"
            aria-label="Lesson title"
          />
          <select className="select" value={grade} onChange={(e) => setGrade(e.target.value as GradeOption)} aria-label="Primary grade">
            {GRADE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Grade {option}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={subject}
            onChange={(e) => setSubject(e.target.value as (typeof SUBJECT_OPTIONS)[number])}
            aria-label="Subject"
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            className="input duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={5}
            step={5}
            aria-label="Duration in minutes"
          />
          <button type="button" className="button buttonPrimary" onClick={createFromForm} disabled={!canCreate}>
            Create
          </button>
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <div className="results">
        {filteredLessons.map((lesson) => (
          <Link key={lesson.id} href={`/app/lesson/${lesson.id}`} className="lessonLink">
            <div className="lessonTitle">{lesson.title}</div>
            <div className="metaLine">
              <span className="gradeChip">Grade {lesson.primary_grade || "—"}</span>
              <span>{lesson.subject || "—"}</span>
              <span>{lesson.duration_minutes} min</span>
            </div>
          </Link>
        ))}
        {filteredLessons.length === 0 ? (
          <div className="empty">No lessons match your filters.</div>
        ) : null}
      </div>

      <style jsx>{`
        .shell {
          display: grid;
          gap: 14px;
        }

        .header {
          display: grid;
          gap: 4px;
        }

        .title {
          margin: 0;
          color: #111827;
          font-size: 29px;
          font-weight: 700;
        }

        .subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .controlsRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .input,
        .select {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 9px 10px;
          color: #111827;
          background: #fff;
          font: inherit;
          font-size: 14px;
        }

        .input {
          flex: 1 1 320px;
          min-width: 220px;
        }

        .select {
          min-width: 125px;
        }

        .button {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 9px 12px;
          color: #111827;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 140ms ease;
        }

        .button:hover {
          background: #f8fafc;
        }

        .buttonPrimary {
          border-color: #0ea5e9;
          color: #0c4a6e;
          background: #f0f9ff;
        }

        .button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .createBar {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .createBar .duration {
          width: 120px;
          flex: 0 0 auto;
          min-width: 0;
        }

        .error {
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
        }

        .results {
          display: grid;
          gap: 10px;
        }

        .lessonLink {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          display: grid;
          gap: 6px;
          text-decoration: none;
          color: #111827;
          background: #fff;
          transition: background 140ms ease;
        }

        .lessonLink:visited {
          color: #111827;
        }

        .lessonLink:hover {
          background: #f8fafc;
        }

        .lessonTitle {
          font-size: 15px;
          font-weight: 600;
          line-height: 1.3;
        }

        .metaLine {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          color: #6b7280;
          font-size: 13px;
        }

        .gradeChip {
          border: 1px solid #dbeafe;
          background: #f8fafc;
          color: #1d4ed8;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .empty {
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          padding: 12px;
          color: #64748b;
          font-size: 13px;
        }
      `}</style>
    </section>
  );
}
