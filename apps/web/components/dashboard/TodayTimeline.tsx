import Link from "next/link";
import type { CSSProperties } from "react";

import { ScheduleItem, ScheduleStatus } from "@/lib/schedule";

type TodayTimelineProps = {
  items: ScheduleItem[];
  isTodaySelected: boolean;
  highlightedItemId?: string | null;
  onStatusChange: (id: string, status: ScheduleStatus) => void;
  onGenerateToday?: () => void;
  onDelete: (id: string) => void;
  onStruggleNotesChange: (id: string, notes: string) => void;
};

const gradeAccent: Record<string, string> = {
  K: "#5B8DEF",
  "1": "#16A085",
  "2": "#F39C12",
  "3": "#8E44AD",
  "4": "#E67E22",
  "5": "#2E86C1"
};

function formatTime(hhmm: string) {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "p" : "a";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${`${m}`.padStart(2, "0")}${suffix}`;
}

function formatTimeRange(startTime: string, endTime: string) {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

function statusTone(status: ScheduleStatus) {
  if (status === "taught") return { bg: "#DCFCE7", color: "#166534", label: "Taught" };
  if (status === "struggled") return { bg: "#FEE2E2", color: "#991B1B", label: "Struggled" };
  return { bg: "#EEF2FF", color: "#3730A3", label: "Planned" };
}

function toMinutes(hhmm: string): number {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

function isNowWithin(item: ScheduleItem) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(item.startTime);
  const end = toMinutes(item.endTime);
  return current >= start && current <= end;
}

export default function TodayTimeline(props: TodayTimelineProps) {
  const { items, isTodaySelected, highlightedItemId, onStatusChange, onGenerateToday, onDelete, onStruggleNotesChange } = props;

  return (
    <section className="shell">
      <h2 className="title">Daily Timeline</h2>
      <p className="subtitle">Ordered by class start time</p>

      {items.length === 0 ? (
        <div className="emptyState" role="status" aria-live="polite">
          <div>
            <div className="emptyTitle">No classes scheduled for this date.</div>
            <div className="emptyHint">Use Template to edit your weekly schedule, or generate from template if available.</div>
            {onGenerateToday ? (
              <button type="button" className="emptyAction" onClick={onGenerateToday}>
                Generate this day
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="list">
        {items.map((it) => {
          const tone = statusTone(it.status);
          const accent = gradeAccent[it.grade] ?? "#94A3B8";
          const isHighlighted = highlightedItemId === it.id;
          const showNow = isTodaySelected && isNowWithin(it);

          return (
            <article
              id={`timeline-item-${it.id}`}
              key={it.id}
              className={`timelineRow ${isHighlighted ? "highlighted" : ""}`}
              style={{ ["--grade-accent" as string]: accent } as CSSProperties}
            >
              <div className="timeColumn" aria-label={`Class time ${formatTimeRange(it.startTime, it.endTime)}`}>
                <span className="timeBadge">{formatTimeRange(it.startTime, it.endTime)}</span>
                {showNow ? <span className="nowPill">Now</span> : null}
              </div>

              <div className="itemCard">
                <div className="itemTop">
                  <div className="classMeta">
                    {it.grade?.trim() ? <span className="gradeChip">{it.grade}</span> : null}
                    <strong className="className">{it.classLabel}</strong>
                    {it.lessonPlanId ? (
                      <Link href={`/app/lesson/${it.lessonPlanId}`} className="linkedLesson">
                        Linked lesson
                      </Link>
                    ) : null}
                  </div>
                </div>

                <p className="topic">{it.topic}</p>

                <div className="actionsRow">
                  <span className="statusPill" style={{ background: tone.bg, color: tone.color }}>
                    {tone.label}
                  </span>

                  <button
                    type="button"
                    className="primaryAction"
                    onClick={() => onStatusChange(it.id, it.status === "taught" ? "struggled" : "taught")}
                  >
                    {it.status === "taught" ? "Mark struggled" : "Mark taught"}
                  </button>

                  <details className="menuWrap">
                    <summary className="menuToggle" aria-label="More timeline actions">
                      <span aria-hidden>⋯</span>
                    </summary>
                    <div className="menuList">
                      <button type="button" onClick={() => onStatusChange(it.id, "planned")}>
                        Mark planned
                      </button>
                      <button type="button" onClick={() => onStatusChange(it.id, "taught")}>
                        Mark taught
                      </button>
                      <button type="button" onClick={() => onStatusChange(it.id, "struggled")}>
                        Mark struggled
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(it.id)}>
                        Delete block
                      </button>
                    </div>
                  </details>
                </div>

                {it.status === "struggled" ? (
                  <details className="notesWrap">
                    <summary className="notesSummary">Notes</summary>
                    <label className="notesEditor">
                      <span className="notesLabel">What did this class struggle with?</span>
                      <textarea
                        value={it.struggleNotes}
                        onChange={(e) => onStruggleNotesChange(it.id, e.target.value)}
                        placeholder="Example: Needed more modeling on safe search terms."
                      />
                    </label>
                  </details>
                ) : null}
              </div>

            </article>
          );
        })}
      </div>

      <style jsx>{`
        .shell {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
        }

        .title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #111827;
        }

        .subtitle {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .emptyState {
          margin-top: 12px;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          padding: 12px;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .emptyTitle {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .emptyHint {
          margin-top: 2px;
          font-size: 12px;
          color: #64748b;
        }

        .emptyAction {
          margin-top: 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #111827;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 10px;
          cursor: pointer;
        }

        .emptyAction:hover {
          background: #f8fafc;
        }

        .list {
          display: grid;
          gap: 12px;
          margin-top: 12px;
        }

        .timelineRow {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 12px;
          scroll-margin-top: 18px;
        }

        .timeColumn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding-top: 6px;
        }

        .timeBadge {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .nowPill {
          background: #dbeafe;
          color: #1d4ed8;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .itemCard {
          border: 1px solid #e5e7eb;
          border-left: 4px solid var(--grade-accent);
          border-radius: 10px;
          padding: 12px;
          background: #fff;
          transition: background 140ms ease;
        }

        .itemCard:hover {
          background: #f8fafc;
        }

        .highlighted .itemCard {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
        }

        .itemTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .classMeta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .gradeChip {
          background: #f8fafc;
          color: var(--grade-accent);
          border: 1px solid #dbeafe;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .className {
          color: #111827;
          font-size: 14px;
        }

        .linkedLesson {
          color: #2563eb;
          font-size: 12px;
          text-decoration: none;
        }

        .linkedLesson:visited {
          color: #2563eb;
        }

        .linkedLesson:hover {
          text-decoration: underline;
        }

        .topic {
          margin: 8px 0 0;
          color: #374151;
          font-size: 14px;
          line-height: 1.35;
        }

        .actionsRow {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .statusPill {
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
        }

        .primaryAction {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #374151;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          cursor: pointer;
        }

        .primaryAction:hover {
          background: #f8fafc;
        }

        .primaryAction:focus-visible,
        .menuToggle:focus-visible,
        .menuList button:focus-visible,
        .notesWrap textarea:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 1px;
        }

        .menuWrap {
          margin-left: auto;
          position: relative;
        }

        .menuToggle {
          list-style: none;
          cursor: pointer;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          width: 30px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          color: #64748b;
        }

        .menuToggle:hover {
          background: #f8fafc;
        }

        .menuToggle::-webkit-details-marker {
          display: none;
        }

        .menuList {
          position: absolute;
          right: 0;
          top: calc(100% + 6px);
          z-index: 10;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          min-width: 148px;
          display: grid;
          gap: 2px;
          padding: 6px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
        }

        .menuList button {
          border: 0;
          text-align: left;
          background: transparent;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 12px;
          color: #334155;
          cursor: pointer;
        }

        .menuList button:hover {
          background: #f8fafc;
        }

        .menuList .danger {
          color: #b91c1c;
        }

        .notesWrap {
          margin-top: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          display: grid;
          gap: 8px;
        }

        .notesSummary {
          cursor: pointer;
          font-size: 12px;
          color: #334155;
          font-weight: 600;
        }

        .notesEditor {
          display: grid;
          gap: 6px;
        }

        .notesLabel {
          font-size: 12px;
          color: #6b7280;
        }

        .notesWrap textarea {
          width: 100%;
          min-height: 72px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px;
          box-sizing: border-box;
          font: inherit;
          font-size: 13px;
          color: #1f2937;
          resize: vertical;
        }

        @media (max-width: 760px) {
          .timelineRow {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </section>
  );
}
