"use client";

import MetricsCards from "@/components/dashboard/MetricsCards";
import ReteachByGradeBars from "@/components/dashboard/ReteachByGradeBars";
import ScheduleBuilder from "@/components/dashboard/ScheduleBuilder";
import TodayTimeline from "@/components/dashboard/TodayTimeline";
import WeeklyLoadHeatmap from "@/components/dashboard/WeeklyLoadHeatmap";
import { useDashboardState } from "@/hooks/useDashboardState";

function toDisplayTime(hhmm: string): string {
  const [hoursRaw, minutesRaw] = hhmm.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return hhmm;

  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const mm = `${minutes}`.padStart(2, "0");
  return `${hour12}:${mm} ${suffix}`;
}

export default function DashboardPage() {
  const {
    mode,
    setMode,
    date,
    setDate,
    goPrevSchoolDay,
    goNextSchoolDay,
    isWeekendDate,
    isTodaySelected,
    previewItems,
    lessonPlans,
    items,
    allItems,
    struggledCount,
    nextClass,
    highlightedItemId,
    templateNotice,
    updateStatus,
    updateNotes,
    deleteItem,
    jumpToNextUp,
    generateDayFromTemplate,
    hasTemplateForDate
  } = useDashboardState();

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Teacher Dashboard</h1>
          <p style={{ margin: "6px 0 0", color: "#4B5563" }}>
            Daily command center for classes, lesson flow, and reteach signals.
          </p>
        </div>
        <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
          <div
            role="tablist"
            aria-label="Dashboard mode"
            style={{
              display: "inline-flex",
              gap: 6,
              border: "1px solid #E5E7EB",
              borderRadius: 999,
              padding: 4,
              background: "#fff"
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "today"}
              onClick={() => setMode("today")}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "7px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: mode === "today" ? "#F3F4F6" : "transparent",
                color: mode === "today" ? "#111827" : "#64748B"
              }}
            >
              Today
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "template"}
              onClick={() => setMode("template")}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "7px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: mode === "template" ? "#F3F4F6" : "transparent",
                color: mode === "template" ? "#111827" : "#64748B"
              }}
            >
              Template
            </button>
          </div>
          {mode === "today" ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: 4,
                background: "#fff"
              }}
            >
              <button
                type="button"
                aria-label="Previous school day"
                onClick={goPrevSchoolDay}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#475569",
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  fontSize: 16
                }}
              >
                ‹
              </button>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                style={{
                  border: "1px solid #D1D5DB",
                  borderRadius: 8,
                  padding: "6px 8px",
                  fontSize: 12,
                  color: "#1F2937"
                }}
              />
              <button
                type="button"
                aria-label="Next school day"
                onClick={goNextSchoolDay}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#475569",
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  fontSize: 16
                }}
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {mode === "today" && templateNotice ? (
        <p style={{ margin: "-10px 0 0", fontSize: 12, color: "#64748B" }}>{templateNotice}</p>
      ) : null}

      {mode === "today" ? (
        <>
          <MetricsCards
            classesToday={items.length}
            needReteach={struggledCount}
            nextUpLabel={
              nextClass ? (nextClass.grade?.trim() ? `${nextClass.grade}-${nextClass.classLabel}` : nextClass.classLabel) : "No remaining classes"
            }
            nextUpTime={nextClass ? `${toDisplayTime(nextClass.startTime)} to ${toDisplayTime(nextClass.endTime)}` : undefined}
            onNextUpClick={nextClass ? jumpToNextUp : undefined}
          />

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {previewItems.map((preview) => (
              <button
                key={preview.date}
                type="button"
                onClick={() => setDate(preview.date)}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 999,
                  padding: "7px 10px",
                  background: preview.date === date ? "#F8FAFC" : "#fff",
                  color: preview.date === date ? "#111827" : "#475569",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {preview.label} · {preview.count > 0 ? preview.count : preview.hasTemplate ? "—" : 0}
              </button>
            ))}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setMode("template")}
              style={{
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                background: "#fff",
                color: "#111827",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              Edit weekly template
            </button>
          </div>

          {isWeekendDate ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                background: "#fff",
                fontSize: 12,
                color: "#64748B",
                flexWrap: "wrap"
              }}
            >
              <span>Weekend — no scheduled classes.</span>
              <button
                type="button"
                onClick={goNextSchoolDay}
                style={{
                  border: "1px solid #D1D5DB",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#334155",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 9px",
                  cursor: "pointer"
                }}
              >
                Go to next school day
              </button>
              <button
                type="button"
                onClick={goPrevSchoolDay}
                style={{
                  border: "1px solid #D1D5DB",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#334155",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 9px",
                  cursor: "pointer"
                }}
              >
                Go to last school day
              </button>
            </div>
          ) : null}

          <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            <TodayTimeline
              items={items}
              isTodaySelected={isTodaySelected}
              highlightedItemId={highlightedItemId}
              onStatusChange={updateStatus}
              onGenerateToday={() => {
                generateDayFromTemplate(date, "fill-empty-only");
              }}
              onDelete={deleteItem}
              onStruggleNotesChange={updateNotes}
            />
            <div style={{ display: "grid", gap: 12 }}>
              <ReteachByGradeBars items={items} />
              <WeeklyLoadHeatmap selectedDate={date} allItems={allItems} />
            </div>
          </section>
        </>
      ) : (
        <ScheduleBuilder
          lessonPlans={lessonPlans}
          hasTemplateForDate={hasTemplateForDate}
          onGenerateForDate={generateDayFromTemplate}
        />
      )}
    </div>
  );
}
