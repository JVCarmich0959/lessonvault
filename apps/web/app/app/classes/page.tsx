"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ClassSummary, createClass, listClasses } from "@/lib/classes";

export default function ClassesPage() {
  const [items, setItems] = useState<ClassSummary[]>([]);
  const [name, setName] = useState("");
  const [gradeLabel, setGradeLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listClasses();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate() {
    const nextName = name.trim();
    if (!nextName) return;
    setError(null);
    try {
      await createClass({ name: nextName, grade_label: gradeLabel.trim() });
      setName("");
      setGradeLabel("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
    }
  }

  return (
    <section className="shell">
      <header className="header">
        <div>
          <h1 className="title">Classes</h1>
          <p className="subtitle">Open a class to review coverage and link students.</p>
        </div>
      </header>

      <div className="controls">
        <input
          className="input"
          placeholder="Class name (e.g., 1 - Cosetti)"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="input grade"
          placeholder="Grade"
          value={gradeLabel}
          onChange={(event) => setGradeLabel(event.target.value)}
        />
        <button type="button" className="button" onClick={onCreate} disabled={!name.trim()}>
          New class
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading classes…</p> : null}

      <div className="list">
        {items.map((item) => (
          <Link key={item.id} href={`/app/classes/${item.id}`} className="row">
            <div className="rowTitle">{item.name}</div>
            <div className="rowMeta">{item.grade_label || "—"}</div>
          </Link>
        ))}
        {!loading && items.length === 0 ? <p className="muted">No classes yet.</p> : null}
      </div>

      <style jsx>{`
        .shell {
          display: grid;
          gap: 16px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .title {
          margin: 0;
          font-size: 28px;
          color: #111827;
        }

        .subtitle {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .controls {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 120px auto;
          gap: 8px;
        }

        .input {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 9px 11px;
          font-size: 14px;
        }

        .button {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          padding: 0 14px;
          cursor: pointer;
        }

        .button:hover {
          background: #f8fafc;
        }

        .button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .error {
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
        }

        .muted {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .list {
          display: grid;
          gap: 8px;
        }

        .row {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          text-decoration: none;
          color: #111827;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          background: #ffffff;
        }

        .row:hover {
          background: #f8fafc;
        }

        .row:visited {
          color: #111827;
        }

        .rowTitle {
          font-size: 14px;
          font-weight: 600;
        }

        .rowMeta {
          font-size: 12px;
          color: #64748b;
        }

        @media (max-width: 780px) {
          .controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
