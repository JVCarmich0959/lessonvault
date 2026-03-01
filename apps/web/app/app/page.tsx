"use client";

import { useEffect, useMemo, useState } from "react";

import MetricsCards from "@/components/dashboard/MetricsCards";
import ReteachByGradeBars from "@/components/dashboard/ReteachByGradeBars";
import ScheduleBuilder from "@/components/dashboard/ScheduleBuilder";
import TodayTimeline from "@/components/dashboard/TodayTimeline";
import WeeklyLoadHeatmap from "@/components/dashboard/WeeklyLoadHeatmap";
import { listLessonPlans } from "@/lib/lessonPlans";
import {
  deleteScheduleItem,
  listAllSchedule,
  listScheduleByDate,
  ScheduleItem,
  ScheduleStatus,
  updateScheduleItem
} from "@/lib/schedule";

function toDisplayTime(hhmm: string) {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = `${m}`.padStart(2, "0");
  return `${hour12}:${mm} ${suffix}`;
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function itemStartMinutes(it: ScheduleItem) {
  const [hRaw, mRaw] = it.startTime.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

export default function DashboardPage() {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [allItems, setAllItems] = useState<ScheduleItem[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  function refresh(day: string) {
    setItems(listScheduleByDate(day));
    setAllItems(listAllSchedule());
  }

  useEffect(() => {
    refresh(date);
  }, [date]);

  useEffect(() => {
    async function loadLessons() {
      try {
        const plans = await listLessonPlans();
        setLessonPlans(Array.isArray(plans) ? plans : []);
      } catch {
        setLessonPlans([]);
      }
    }
    loadLessons();
  }, []);

  const struggledCount = useMemo(() => items.filter((it) => it.status === "struggled").length, [items]);
  const nextClass = useMemo(() => {
    const now = nowMinutes();
    return items.find((it) => itemStartMinutes(it) >= now) ?? null;
  }, [items]);
  const isTodaySelected = date === todayIso;

  function setStatus(id: string, status: ScheduleStatus) {
    updateScheduleItem(id, { status });
    refresh(date);
  }

  function setStruggleNotes(id: string, struggleNotes: string) {
    updateScheduleItem(id, { struggleNotes });
    refresh(date);
  }

  function jumpToNextUp() {
    if (!nextClass) return;
    const target = document.getElementById(`timeline-item-${nextClass.id}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedItemId(nextClass.id);
    window.setTimeout(() => setHighlightedItemId((current) => (current === nextClass.id ? null : current)), 1800);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <header>
        <h1 style={{ margin: 0 }}>Teacher Dashboard</h1>
        <p style={{ margin: "6px 0 0", color: "#4B5563" }}>
          Daily command center for classes, lesson flow, and reteach signals.
        </p>
      </header>

      <MetricsCards
        classesToday={items.length}
        needReteach={struggledCount}
        nextUpLabel={
          nextClass ? (nextClass.grade?.trim() ? `${nextClass.grade}-${nextClass.classLabel}` : nextClass.classLabel) : "No remaining classes"
        }
        nextUpTime={nextClass ? `${toDisplayTime(nextClass.startTime)} to ${toDisplayTime(nextClass.endTime)}` : undefined}
        onNextUpClick={nextClass ? jumpToNextUp : undefined}
      />

      <ScheduleBuilder
        date={date}
        onDateChange={setDate}
        lessonPlans={lessonPlans}
        onPublished={() => refresh(date)}
      />

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <TodayTimeline
          items={items}
          isTodaySelected={isTodaySelected}
          highlightedItemId={highlightedItemId}
          onStatusChange={setStatus}
          onDelete={(id) => {
            deleteScheduleItem(id);
            refresh(date);
          }}
          onStruggleNotesChange={setStruggleNotes}
        />
        <div style={{ display: "grid", gap: 12 }}>
          <ReteachByGradeBars items={items} />
          <WeeklyLoadHeatmap selectedDate={date} allItems={allItems} />
        </div>
      </section>
    </div>
  );
}
