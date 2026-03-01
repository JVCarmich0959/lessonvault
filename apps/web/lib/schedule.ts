export type ScheduleStatus = "planned" | "taught" | "struggled";

export type ScheduleItem = {
  id: string;
  date: string; // YYYY-MM-DD
  classLabel: string; // e.g. "K-Wingenroth"
  grade: string; // e.g. "K", "1"
  topic: string; // e.g. "Mouse pointers and manipulation"
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  lessonPlanId?: string;
  status: ScheduleStatus;
  struggleNotes: string;
};

const STORAGE_KEY = "lv_schedule_v1";

function safeParse(raw: string | null): ScheduleItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((it) => it && typeof it === "object");
  } catch {
    return [];
  }
}

function readAll(): ScheduleItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function writeAll(items: ScheduleItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function listScheduleByDate(date: string): ScheduleItem[] {
  return readAll()
    .filter((it) => it.date === date)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

export function listAllSchedule(): ScheduleItem[] {
  return readAll().sort((a, b) => {
    if (a.date === b.date) return toMinutes(a.startTime) - toMinutes(b.startTime);
    return a.date.localeCompare(b.date);
  });
}

export function createScheduleItem(
  item: Omit<ScheduleItem, "id" | "status" | "struggleNotes"> & { id?: string }
): ScheduleItem {
  const next: ScheduleItem = {
    id: item.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`),
    date: item.date,
    classLabel: item.classLabel,
    grade: item.grade,
    topic: item.topic,
    startTime: item.startTime,
    endTime: item.endTime,
    lessonPlanId: item.lessonPlanId || undefined,
    status: "planned",
    struggleNotes: ""
  };
  const all = readAll();
  all.push(next);
  writeAll(all);
  return next;
}

export function updateScheduleItem(id: string, patch: Partial<ScheduleItem>) {
  const all = readAll();
  const idx = all.findIndex((it) => it.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, id: all[idx].id };
  writeAll(all);
  return all[idx];
}

export function deleteScheduleItem(id: string) {
  const all = readAll();
  const next = all.filter((it) => it.id !== id);
  writeAll(next);
}
