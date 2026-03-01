"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ClassSummary,
  ExternalStudentSummary,
  LINK_SOURCE,
  LinkStatus,
  LinkSuggestion,
  bulkCreateStudentLinks,
  createStudentLink,
  getClass,
  getLinkStatus,
  getLinkSuggestions,
  listExternalStudents
} from "@/lib/classes";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

type ModalState = {
  open: boolean;
  studentId: string | null;
  studentLabel: string;
};

export default function LinkStudentsPage() {
  const params = useParams<{ id: string }>();
  const classId = params.id;

  const [classroom, setClassroom] = useState<ClassSummary | null>(null);
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkReviewOpen, setBulkReviewOpen] = useState(false);

  const [modal, setModal] = useState<ModalState>({ open: false, studentId: null, studentLabel: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [externalOptions, setExternalOptions] = useState<ExternalStudentSummary[]>([]);
  const [selectedExternalId, setSelectedExternalId] = useState<string>("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [classData, statusData, suggestionData] = await Promise.all([
        getClass(classId),
        getLinkStatus(classId, LINK_SOURCE),
        getLinkSuggestions(classId, LINK_SOURCE)
      ]);
      setClassroom(classData);
      setStatus(statusData);
      setSuggestions(suggestionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load link workflow");
    } finally {
      setLoading(false);
    }
  }

  async function refreshExternalOptions(query?: string) {
    try {
      const options = await listExternalStudents(classId, LINK_SOURCE, query);
      setExternalOptions(options);
    } catch {}
  }

  useEffect(() => {
    void refresh();
  }, [classId]);

  useEffect(() => {
    if (!modal.open) return;
    void refreshExternalOptions(searchQuery);
  }, [classId, modal.open, searchQuery]);

  const highConfidenceSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) =>
          suggestion.confidence === "high" &&
          suggestion.suggestion &&
          suggestion.student.student_id &&
          suggestion.suggestion.external_student_id
      ),
    [suggestions]
  );

  async function linkStudent(studentId: string, externalStudentId: string) {
    setActionLoading(true);
    setError(null);
    try {
      await createStudentLink({
        source: LINK_SOURCE,
        student_id: studentId,
        external_student_id: externalStudentId,
        verified_by_user: true
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setActionLoading(false);
    }
  }

  async function applyHighConfidenceBulk() {
    if (highConfidenceSuggestions.length === 0) return;
    setActionLoading(true);
    setError(null);
    try {
      await bulkCreateStudentLinks(
        highConfidenceSuggestions.map((suggestion) => ({
          source: LINK_SOURCE,
          student_id: suggestion.student.student_id,
          external_student_id: suggestion.suggestion!.external_student_id,
          verified_by_user: true
        }))
      );
      setBulkReviewOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk linking failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p style={{ margin: 0, color: "#64748B" }}>Loading links…</p>;
  if (!classroom || !status) return <p style={{ margin: 0, color: "#B91C1C" }}>{error ?? "Class not found"}</p>;

  return (
    <section className="shell">
      <header className="header">
        <div>
          <h1 className="title">Link Students</h1>
          <p className="subtitle">{classroom.name}</p>
        </div>
      </header>

      <div className="summary">
        <article className="card">
          <div className="label">Roster</div>
          <div className="value">{status.roster_count}</div>
        </article>
        <article className="card">
          <div className="label">External</div>
          <div className="value">{status.external_count}</div>
        </article>
        <article className="card">
          <div className="label">Linked</div>
          <div className="value">{status.linked_count}</div>
        </article>
        <article className="card">
          <div className="label">Coverage</div>
          <div className="value">{percent(status.coverage_rate)}</div>
        </article>
      </div>

      {status.coverage_rate < 0.9 ? (
        <div className="banner warn">Coverage is below 90%. Progress analytics are partial until links are verified.</div>
      ) : (
        <div className="banner">Coverage looks healthy.</div>
      )}

      {highConfidenceSuggestions.length > 0 ? (
        <div className="bulkRow">
          <button type="button" className="button" onClick={() => setBulkReviewOpen((open) => !open)}>
            Bulk apply HIGH confidence suggestions
          </button>
          {bulkReviewOpen ? (
            <div className="bulkReview">
              <div className="bulkTitle">Review {highConfidenceSuggestions.length} links</div>
              <ul>
                {highConfidenceSuggestions.map((item) => (
                  <li key={item.student.student_id}>
                    {item.student.display_name} → {item.suggestion?.display_name}
                  </li>
                ))}
              </ul>
              <button type="button" className="button primary" disabled={actionLoading} onClick={applyHighConfidenceBulk}>
                Confirm bulk link
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <section className="tableSection">
        <h2>Suggested matches</h2>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Roster student</th>
                <th>Suggested match</th>
                <th>Confidence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => (
                <tr key={suggestion.student.student_id}>
                  <td>
                    <div className="name">{suggestion.student.display_name}</div>
                    <div className="muted">{suggestion.student.email || "No email"}</div>
                  </td>
                  <td>
                    {suggestion.suggestion ? (
                      <>
                        <div className="name">{suggestion.suggestion.display_name}</div>
                        <div className="muted">SIS: {suggestion.suggestion.external_key}</div>
                      </>
                    ) : (
                      <span className="muted">No suggestion</span>
                    )}
                    {suggestion.alternatives.length > 1 ? (
                      <div className="muted">Alternatives: {suggestion.alternatives.slice(0, 3).map((item) => item.display_name).join(", ")}</div>
                    ) : null}
                    <div className="muted">{suggestion.reason}</div>
                  </td>
                  <td>
                    <span className={`badge ${suggestion.confidence}`}>{suggestion.confidence}</span>
                  </td>
                  <td>
                    <div className="actions">
                      {(suggestion.confidence === "high" || suggestion.confidence === "medium") && suggestion.suggestion ? (
                        <button
                          type="button"
                          className="button"
                          disabled={actionLoading}
                          onClick={() =>
                            linkStudent(
                              suggestion.student.student_id,
                              suggestion.suggestion?.external_student_id ?? ""
                            )
                          }
                        >
                          Link
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="button subtle"
                        onClick={() => {
                          setModal({
                            open: true,
                            studentId: suggestion.student.student_id,
                            studentLabel: suggestion.student.display_name
                          });
                          setSearchQuery("");
                          setSelectedExternalId(suggestion.suggestion?.external_student_id ?? "");
                        }}
                      >
                        Choose…
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tableSection">
        <h2>Unlinked external students</h2>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SIS ID</th>
              </tr>
            </thead>
            <tbody>
              {status.unlinked_external.map((externalStudent) => (
                <tr key={externalStudent.external_student_id}>
                  <td>{externalStudent.display_name}</td>
                  <td>{externalStudent.external_key}</td>
                </tr>
              ))}
              {status.unlinked_external.length === 0 ? (
                <tr>
                  <td colSpan={2} className="muted">
                    All external students are linked.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {modal.open ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="Choose external student">
          <div className="modalCard">
            <h3>Choose match</h3>
            <p className="muted">{modal.studentLabel}</p>

            <input
              className="input"
              placeholder="Search name or SIS ID"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            <div className="optionList">
              {externalOptions.map((option) => (
                <button
                  key={option.external_student_id}
                  type="button"
                  className={`option ${selectedExternalId === option.external_student_id ? "selected" : ""}`}
                  onClick={() => setSelectedExternalId(option.external_student_id)}
                >
                  <span>{option.display_name}</span>
                  <span className="muted">SIS: {option.external_key}</span>
                </button>
              ))}
            </div>

            <div className="modalActions">
              <button type="button" className="button subtle" onClick={() => setModal({ open: false, studentId: null, studentLabel: "" })}>
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                disabled={!modal.studentId || !selectedExternalId || actionLoading}
                onClick={async () => {
                  if (!modal.studentId || !selectedExternalId) return;
                  await linkStudent(modal.studentId, selectedExternalId);
                  setModal({ open: false, studentId: null, studentLabel: "" });
                }}
              >
                Confirm link
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .shell {
          display: grid;
          gap: 16px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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

        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
        }

        .card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          background: #ffffff;
          display: grid;
          gap: 5px;
        }

        .label {
          font-size: 12px;
          color: #64748b;
        }

        .value {
          font-size: 24px;
          line-height: 1.1;
          font-weight: 700;
          color: #111827;
        }

        .banner {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          background: #ffffff;
          color: #334155;
          font-size: 13px;
        }

        .warn {
          border-color: #f3d9a6;
          background: #fffbeb;
          color: #7c2d12;
        }

        .bulkRow {
          display: grid;
          gap: 10px;
        }

        .bulkReview {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          background: #ffffff;
          display: grid;
          gap: 8px;
        }

        .bulkReview ul {
          margin: 0;
          padding-left: 18px;
          display: grid;
          gap: 4px;
          font-size: 13px;
          color: #334155;
        }

        .bulkTitle {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .error {
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
        }

        .tableSection {
          display: grid;
          gap: 8px;
        }

        .tableSection h2 {
          margin: 0;
          font-size: 16px;
          color: #111827;
        }

        .tableWrap {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: auto;
          background: #ffffff;
        }

        .table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
        }

        .table th,
        .table td {
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
          padding: 10px 12px;
          font-size: 13px;
          color: #334155;
          vertical-align: top;
        }

        .table th {
          font-size: 12px;
          color: #64748b;
          background: #f8fafc;
        }

        .name {
          font-weight: 600;
          color: #111827;
        }

        .muted {
          color: #64748b;
          font-size: 12px;
        }

        .badge {
          display: inline-flex;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          text-transform: capitalize;
        }

        .badge.high {
          background: #ecfdf3;
          color: #166534;
        }

        .badge.medium {
          background: #fff7ed;
          color: #9a3412;
        }

        .badge.low {
          background: #f1f5f9;
          color: #334155;
        }

        .actions {
          display: inline-flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .button {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          cursor: pointer;
        }

        .button:hover {
          background: #f8fafc;
        }

        .button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .button.primary {
          border-color: #2563eb;
          color: #1d4ed8;
        }

        .button.subtle {
          color: #475569;
        }

        .modalBackdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.25);
          display: grid;
          place-items: center;
          padding: 18px;
          z-index: 40;
        }

        .modalCard {
          width: min(560px, 100%);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          padding: 14px;
          display: grid;
          gap: 10px;
        }

        .modalCard h3 {
          margin: 0;
          font-size: 16px;
          color: #111827;
        }

        .input {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
        }

        .optionList {
          max-height: 240px;
          overflow: auto;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          display: grid;
        }

        .option {
          border: 0;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          padding: 8px 10px;
          text-align: left;
          display: grid;
          gap: 2px;
          cursor: pointer;
        }

        .option:hover {
          background: #f8fafc;
        }

        .option.selected {
          background: #eff6ff;
        }

        .modalActions {
          display: inline-flex;
          justify-content: flex-end;
          gap: 8px;
        }
      `}</style>
    </section>
  );
}
