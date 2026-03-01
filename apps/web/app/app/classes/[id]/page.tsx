"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ClassKpis, ClassSummary, getClass, getClassKpis, LINK_SOURCE } from "@/lib/classes";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const classId = params.id;

  const [classroom, setClassroom] = useState<ClassSummary | null>(null);
  const [kpis, setKpis] = useState<ClassKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [classData, kpiData] = await Promise.all([getClass(classId), getClassKpis(classId, LINK_SOURCE)]);
      setClassroom(classData);
      setKpis(kpiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load class");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [classId]);

  if (loading) return <p style={{ margin: 0, color: "#64748B" }}>Loading class…</p>;
  if (error || !classroom || !kpis) return <p style={{ margin: 0, color: "#B91C1C" }}>{error ?? "Class not found"}</p>;

  const coverageLow = kpis.coverage_rate < 0.9;

  return (
    <section className="shell">
      <header className="header">
        <div>
          <h1 className="title">{classroom.name}</h1>
          <p className="subtitle">Grade {classroom.grade_label || "—"} · Source {kpis.source}</p>
        </div>
        <div className="actions">
          <Link href="/app/classes" className="button subtle">
            Back to classes
          </Link>
          <Link href={`/app/classes/${classId}/link`} className="button">
            Link students
          </Link>
        </div>
      </header>

      {coverageLow ? (
        <div className="banner warn">
          Coverage is {percent(kpis.coverage_rate)}. Progress KPIs are partial until students are linked.
        </div>
      ) : (
        <div className="banner">Coverage {percent(kpis.coverage_rate)}. Progress KPIs are fully linked.</div>
      )}

      <div className="kpiGrid">
        <article className="kpiCard">
          <div className="kpiLabel">Roster</div>
          <div className="kpiValue">{kpis.roster_count}</div>
        </article>
        <article className="kpiCard">
          <div className="kpiLabel">Linked</div>
          <div className="kpiValue">{kpis.linked_count}</div>
        </article>
        <article className="kpiCard">
          <div className="kpiLabel">Avg Progress</div>
          <div className="kpiValue">{kpis.average_progress_pct !== null ? `${kpis.average_progress_pct.toFixed(1)}%` : "—"}</div>
        </article>
        <article className="kpiCard">
          <div className="kpiLabel">Avg Score</div>
          <div className="kpiValue">{kpis.average_score_pct !== null ? `${kpis.average_score_pct.toFixed(1)}%` : "—"}</div>
        </article>
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Score</th>
              <th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {kpis.roster.map((row) => (
              <tr key={row.student_id}>
                <td>
                  <div className="studentName">{row.display_name}</div>
                  <div className="studentEmail">{row.email || "No email"}</div>
                </td>
                <td>
                  <span className={`status ${row.status}`}>{row.status === "unlinked" ? "Unlinked" : row.status === "linked-no-data" ? "No data" : "Linked"}</span>
                </td>
                <td>{row.progress_pct_avg !== null ? `${row.progress_pct_avg.toFixed(1)}%` : "No data / Unlinked"}</td>
                <td>{row.score_pct_avg !== null ? `${row.score_pct_avg.toFixed(1)}%` : "No data / Unlinked"}</td>
                <td>{row.attempts_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .shell {
          display: grid;
          gap: 16px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
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

        .actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .button {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 12px;
        }

        .button:visited {
          color: #111827;
        }

        .button:hover {
          background: #f8fafc;
        }

        .subtle {
          color: #475569;
        }

        .banner {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          color: #334155;
          background: #ffffff;
        }

        .banner.warn {
          border-color: #f3d9a6;
          background: #fffbeb;
          color: #7c2d12;
        }

        .kpiGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 10px;
        }

        .kpiCard {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          background: #ffffff;
          display: grid;
          gap: 6px;
        }

        .kpiLabel {
          font-size: 12px;
          color: #64748b;
        }

        .kpiValue {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          line-height: 1.1;
        }

        .tableWrap {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: auto;
          background: #ffffff;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          min-width: 680px;
        }

        .table th,
        .table td {
          text-align: left;
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          color: #334155;
          vertical-align: top;
        }

        .table th {
          font-weight: 600;
          color: #64748b;
          font-size: 12px;
          background: #f8fafc;
        }

        .studentName {
          font-weight: 600;
          color: #111827;
        }

        .studentEmail {
          font-size: 12px;
          color: #64748b;
        }

        .status {
          display: inline-flex;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
        }

        .status.linked {
          background: #ecfdf3;
          color: #166534;
        }

        .status.unlinked {
          background: #fff7ed;
          color: #9a3412;
        }

        .status.linked-no-data {
          background: #eff6ff;
          color: #1d4ed8;
        }
      `}</style>
    </section>
  );
}
