"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DayKey,
  DAYS,
  defaultWeeklyTemplate,
  enumerateDateRange,
  hasTemplateForDate as hasWeeklyTemplateForDate,
  loadWeeklyTemplate,
  parseTemplateDate,
  PERIODS,
  PublishMode,
  saveWeeklyTemplate,
  toIsoDate,
  TYPE_OPTIONS,
  WeeklyTemplate
} from "@/lib/weeklyTemplate";

type LessonPlan = {
  id: string;
  title: string;
};

type GenerateForDate = (dateIso: string, mode: PublishMode, template: WeeklyTemplate) => { created: number; skipped: number };

type ScheduleBuilderProps = {
  lessonPlans: LessonPlan[];
  onGenerateForDate: GenerateForDate;
  hasTemplateForDate?: (dateIso: string, template?: WeeklyTemplate) => boolean;
  onPublished?: () => void;
};

type CellRef = {
  day: DayKey;
  periodId: number;
};

function toDisplayTime(hhmm: string) {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${`${m}`.padStart(2, "0")} ${suffix}`;
}

export default function ScheduleBuilder(props: ScheduleBuilderProps) {
  const { lessonPlans, onGenerateForDate, onPublished, hasTemplateForDate = hasWeeklyTemplateForDate } = props;

  const [template, setTemplate] = useState<WeeklyTemplate>(() => defaultWeeklyTemplate());
  const [selectedCell, setSelectedCell] = useState<CellRef | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [startDay, setStartDay] = useState(1);
  const [endDay, setEndDay] = useState(31);
  const [publishMode, setPublishMode] = useState<PublishMode>("fill-empty-only");
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  useEffect(() => {
    setTemplate(loadWeeklyTemplate());
  }, []);

  useEffect(() => {
    saveWeeklyTemplate(template);
  }, [template]);

  const selected = useMemo(() => {
    if (!selectedCell) return null;
    const period = PERIODS.find((p) => p.id === selectedCell.periodId);
    if (!period) return null;
    return {
      ...selectedCell,
      period,
      cell: template[selectedCell.day][selectedCell.periodId]
    };
  }, [selectedCell, template]);
  const selectedLocked = Boolean(selected?.cell.locked);

  function updateCell(day: DayKey, periodId: number, patch: Partial<WeeklyTemplate[DayKey][number]>) {
    setTemplate((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [periodId]: {
          ...current[day][periodId],
          ...patch
        }
      }
    }));
  }

  function publishSchedule() {
    const from = toIsoDate(2026, 3, startDay);
    const to = toIsoDate(2026, 3, endDay);
    const allDates = enumerateDateRange(from, to);
    const weekdays = allDates.filter((iso) => {
      const weekday = parseTemplateDate(iso).getDay();
      return weekday >= 1 && weekday <= 5;
    });

    if (weekdays.length === 0) {
      setPublishFeedback("No weekdays found in selected range.");
      setPublishOpen(false);
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const iso of weekdays) {
      if (!hasTemplateForDate(iso, template)) continue;
      const result = onGenerateForDate(iso, publishMode, template);
      created += result.created;
      skipped += result.skipped;
    }

    onPublished?.();
    setPublishOpen(false);
    setPublishFeedback(`Published ${created} blocks${skipped > 0 ? `, skipped ${skipped}` : ""}.`);
  }

  return (
    <section className="shell">
      <div className="headRow">
        <div>
          <h2 className="title">Schedule Builder</h2>
        </div>

        <div className="headActions">
          <div className="publishWrap">
            <button type="button" className="publishBtn" onClick={() => setPublishOpen((open) => !open)}>
              Publish
            </button>

            {publishOpen ? (
              <div className="publishPopover" role="dialog" aria-label="Publish schedule options">
                <div className="popoverRow">
                  <label>
                    Start day
                    <select value={startDay} onChange={(e) => setStartDay(Number(e.target.value))}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    End day
                    <select value={endDay} onChange={(e) => setEndDay(Number(e.target.value))}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="monthLabel">March 2026</div>

                <fieldset>
                  <legend>Mode</legend>
                  <label>
                    <input
                      type="radio"
                      name="publish-mode"
                      value="fill-empty-only"
                      checked={publishMode === "fill-empty-only"}
                      onChange={() => setPublishMode("fill-empty-only")}
                    />
                    Fill-empty-only
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="publish-mode"
                      value="overwrite"
                      checked={publishMode === "overwrite"}
                      onChange={() => setPublishMode("overwrite")}
                    />
                    Overwrite
                  </label>
                </fieldset>

                <button type="button" className="confirmBtn" onClick={publishSchedule}>
                  Confirm publish
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {publishFeedback ? <p className="feedback">{publishFeedback}</p> : null}

      <div className={`builderBody ${selected ? "withPanel" : ""}`}>
        <div className="gridSurface" role="grid" aria-label="Weekly schedule template">
          <div className="cell headerCell" />
          {DAYS.map((day) => (
            <div key={day.key} className="cell headerCell">
              {day.label}
            </div>
          ))}

          {PERIODS.map((period) => (
            <div key={`row-${period.id}`} className="rowGroup">
              <div key={`time-${period.id}`} className="cell timeCell">
                <div className="periodLabel">{period.label}</div>
                <div className="periodTime">{toDisplayTime(period.start)} - {toDisplayTime(period.end)}</div>
              </div>

              {DAYS.map((day) => {
                const cell = template[day.key][period.id];
                const isSelected = selectedCell?.day === day.key && selectedCell?.periodId === period.id;
                return (
                  <button
                    key={`${day.key}-${period.id}`}
                    type="button"
                    className={`cell slotCell ${cell.locked ? "locked" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedCell({ day: day.key, periodId: period.id });
                    }}
                    aria-label={`${day.label} ${period.label}`}
                  >
                    <span className="slotLabel">{cell.label}</span>
                    {cell.lessonPlanId ? (
                      <span className="planIcon" aria-label="Linked lesson plan" title="Linked lesson plan">
                        •
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {selected ? (
          <aside className="sidePanel" aria-live="polite">
            <div className="panelCard">
              <div className="panelHead">
                <h3>{selected.day.toUpperCase()} · {selected.period.label}</h3>
                <button type="button" onClick={() => setSelectedCell(null)} aria-label="Close panel">
                  ×
                </button>
              </div>

              {selectedLocked ? <p className="lockedHint">Locked block</p> : null}

              <label className="field">
                Label
                <input
                  value={selected.cell.label}
                  onChange={(e) => updateCell(selected.day, selected.periodId, { label: e.target.value })}
                  placeholder="K-Wingenroth"
                  disabled={selectedLocked}
                />
              </label>

              <div className="field">
                <span>Type</span>
                <div className="chips" role="listbox" aria-label="Class block type">
                  {TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`chip ${selected.cell.type === option.value ? "active" : ""}`}
                      onClick={() => updateCell(selected.day, selected.periodId, { type: option.value })}
                      aria-pressed={selected.cell.type === option.value}
                      disabled={selectedLocked}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {!selectedLocked ? (
                <label className="field">
                  Lesson Plan (optional)
                  <select
                    value={selected.cell.lessonPlanId}
                    onChange={(e) => updateCell(selected.day, selected.periodId, { lessonPlanId: e.target.value })}
                  >
                    <option value="">None</option>
                    {lessonPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <details className="notesDisclosure">
                <summary>Notes (optional)</summary>
                <textarea
                  value={selected.cell.notes}
                  onChange={(e) => updateCell(selected.day, selected.periodId, { notes: e.target.value })}
                  placeholder="Optional context for publishing"
                  disabled={selectedLocked}
                />
              </details>
            </div>
          </aside>
        ) : null}
      </div>

      <style jsx>{`
        .shell {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          display: grid;
          gap: 12px;
          background: #ffffff;
        }

        .headRow {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #111827;
        }

        .headActions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .publishWrap {
          position: relative;
        }

        .publishBtn,
        .confirmBtn {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .publishBtn:hover,
        .confirmBtn:hover {
          background: #f8fafc;
        }

        .publishPopover {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          z-index: 20;
          width: 250px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
          padding: 10px;
          display: grid;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }

        .popoverRow {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .popoverRow label {
          display: grid;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .popoverRow select {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 7px;
          font: inherit;
          font-size: 13px;
        }

        .monthLabel {
          font-size: 12px;
          color: #475569;
          font-weight: 600;
        }

        fieldset {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          margin: 0;
          display: grid;
          gap: 6px;
        }

        legend {
          font-size: 12px;
          color: #64748b;
          padding: 0 4px;
        }

        fieldset label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #334155;
        }

        .feedback {
          margin: 0;
          font-size: 12px;
          color: #475569;
        }

        .builderBody {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
        }

        .builderBody.withPanel {
          grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
        }

        .gridSurface {
          display: grid;
          grid-template-columns: 140px repeat(5, minmax(120px, 1fr));
          gap: 8px;
          align-items: stretch;
        }

        .rowGroup {
          display: contents;
        }

        .cell {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          min-height: 58px;
          padding: 8px;
          box-sizing: border-box;
        }

        .headerCell {
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          background: #f8fafc;
        }

        .timeCell {
          display: grid;
          align-content: center;
          gap: 2px;
          background: #f8fafc;
        }

        .periodLabel {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .periodTime {
          font-size: 11px;
          color: #64748b;
        }

        .slotCell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          text-align: left;
          cursor: pointer;
        }

        .slotCell:hover {
          background: #f8fafc;
        }

        .slotCell.selected {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.14);
        }

        .slotCell.locked {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
          cursor: pointer;
        }

        .slotLabel {
          font-size: 12px;
          color: #334155;
          line-height: 1.35;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .slotCell.locked .slotLabel {
          color: #64748b;
          font-weight: 600;
        }

        .planIcon {
          font-size: 18px;
          line-height: 1;
          color: #0284c7;
          flex-shrink: 0;
        }

        .sidePanel {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          min-height: 420px;
          padding: 12px;
          box-sizing: border-box;
        }

        .panelCard {
          display: grid;
          gap: 10px;
        }

        .lockedHint {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }

        .panelHead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .panelHead h3 {
          margin: 0;
          font-size: 14px;
          color: #111827;
        }

        .panelHead button {
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 8px;
          width: 28px;
          height: 28px;
          cursor: pointer;
          color: #64748b;
        }

        .field {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .field input,
        .field select,
        .notesDisclosure textarea {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px;
          font: inherit;
          font-size: 13px;
          color: #1f2937;
          background: #ffffff;
        }

        .chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .chip {
          border: 1px solid #d1d5db;
          border-radius: 999px;
          background: #fff;
          color: #334155;
          padding: 5px 10px;
          font-size: 12px;
          cursor: pointer;
        }

        .chip.active {
          border-color: #0284c7;
          background: #f0f9ff;
          color: #0c4a6e;
        }

        .chip:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .notesDisclosure {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          display: grid;
          gap: 8px;
        }

        .notesDisclosure summary {
          cursor: pointer;
          font-size: 12px;
          color: #334155;
          font-weight: 600;
        }

        .notesDisclosure textarea {
          min-height: 74px;
          resize: vertical;
        }

        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible,
        button:focus-visible,
        .slotCell:focus-visible,
        summary:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 1px;
        }

        @media (max-width: 980px) {
          .builderBody {
            grid-template-columns: 1fr;
          }

          .sidePanel {
            min-height: 0;
          }
        }

        @media (max-width: 760px) {
          .gridSurface {
            grid-template-columns: 110px repeat(5, minmax(90px, 1fr));
            overflow-x: auto;
            padding-bottom: 4px;
          }
        }
      `}</style>
    </section>
  );
}
