export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";
export type CellType = "instruction" | "practice" | "assessment" | "review" | "planning" | "lunch";

export type TemplateCell = {
  label: string;
  type: CellType;
  lessonPlanId: string;
  notes: string;
  locked: boolean;
};

export type WeeklyTemplate = Record<DayKey, Record<number, TemplateCell>>;

export type PublishMode = "fill-empty-only" | "overwrite";

export type TemplateScheduleDraft = {
  classLabel: string;
  grade: string;
  topic: string;
  startTime: string;
  endTime: string;
  lessonPlanId?: string;
};

export const TEMPLATE_STORAGE_KEY = "lv_weekly_template_v2";

export const DAYS: { key: DayKey; label: string; weekday: number }[] = [
  { key: "mon", label: "Mon", weekday: 1 },
  { key: "tue", label: "Tue", weekday: 2 },
  { key: "wed", label: "Wed", weekday: 3 },
  { key: "thu", label: "Thu", weekday: 4 },
  { key: "fri", label: "Fri", weekday: 5 }
];

export const PERIODS = [
  { id: 1, label: "1", start: "07:50", end: "08:45", publishable: true },
  { id: 2, label: "2", start: "09:00", end: "09:50", publishable: true },
  { id: 3, label: "3", start: "10:15", end: "11:05", publishable: true },
  { id: 0, label: "-", start: "11:06", end: "11:45", publishable: true },
  { id: 4, label: "4", start: "11:50", end: "12:40", publishable: true },
  { id: 5, label: "5", start: "13:00", end: "13:50", publishable: true },
  { id: 6, label: "6", start: "14:00", end: "14:50", publishable: true }
] as const;

export const TYPE_OPTIONS: { value: CellType; label: string }[] = [
  { value: "instruction", label: "Instruction" },
  { value: "practice", label: "Practice" },
  { value: "assessment", label: "Assessment" },
  { value: "review", label: "Review" }
];

export const TYPE_LABEL: Record<CellType, string> = {
  instruction: "Instruction",
  practice: "Practice",
  assessment: "Assessment",
  review: "Review",
  planning: "Planning",
  lunch: "Lunch"
};

const SEEDED_TEMPLATE: Record<DayKey, Record<number, { label: string; type?: CellType; locked?: boolean }>> = {
  mon: {
    1: { label: "Fortner" },
    2: { label: "Jazmine Smith" },
    3: { label: "Clark" },
    0: { label: "Lunch", type: "lunch", locked: true },
    4: { label: "Danis/McClain" },
    5: { label: "Edwards" },
    6: { label: "Alycia Smith" }
  },
  tue: {
    1: { label: "Helms" },
    2: { label: "Worsely" },
    3: { label: "Kennedy" },
    0: { label: "Meeting/ Lunch", type: "lunch", locked: true },
    4: { label: "Mello" },
    5: { label: "Bridgers" },
    6: { label: "N. Coles" }
  },
  wed: {
    1: { label: "Wingenroth" },
    2: { label: "Cosetti" },
    3: { label: "Ham" },
    0: { label: "Lunch", type: "lunch", locked: true },
    4: { label: "Planning", type: "planning", locked: true },
    5: { label: "Planning", type: "planning", locked: true },
    6: { label: "Lewis" }
  },
  thu: {
    1: { label: "McCormick" },
    2: { label: "Beckett" },
    3: { label: "Pollard" },
    0: { label: "Lunch", type: "lunch", locked: true },
    4: { label: "Jones" },
    5: { label: "Dohar" },
    6: { label: "Davis" }
  },
  fri: {
    1: { label: "Wingenroth" },
    2: { label: "Cosetti" },
    3: { label: "Ham" },
    0: { label: "Lunch", type: "lunch", locked: true },
    4: { label: "Jones" },
    5: { label: "Edwards" },
    6: { label: "Davis" }
  }
};

function makeDefaultCell(day: DayKey, periodId: number): TemplateCell {
  const seeded = SEEDED_TEMPLATE[day]?.[periodId];
  const inferredType: CellType =
    seeded?.type ??
    (periodId === 0 ? "lunch" : seeded?.label?.toLowerCase().includes("planning") ? "planning" : "instruction");
  const locked = seeded?.locked ?? (periodId === 0 || inferredType === "planning");

  return {
    label: seeded?.label ?? "",
    type: inferredType,
    lessonPlanId: "",
    notes: "",
    locked
  };
}

export function defaultWeeklyTemplate(): WeeklyTemplate {
  const result = {} as WeeklyTemplate;
  for (const day of DAYS) {
    const row = {} as Record<number, TemplateCell>;
    for (const period of PERIODS) {
      row[period.id] = makeDefaultCell(day.key, period.id);
    }
    result[day.key] = row;
  }
  return result;
}

function safeParseTemplate(raw: string | null): WeeklyTemplate | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const next = defaultWeeklyTemplate();

    for (const day of DAYS) {
      const dayValue = (parsed as Record<string, unknown>)[day.key];
      if (!dayValue || typeof dayValue !== "object") continue;

      for (const period of PERIODS) {
        const incoming = (dayValue as Record<string, unknown>)[String(period.id)];
        if (!incoming || typeof incoming !== "object") continue;

        const source = incoming as Record<string, unknown>;
        next[day.key][period.id] = {
          label: typeof source.label === "string" ? source.label : next[day.key][period.id].label,
          type: typeof source.type === "string" ? (source.type as CellType) : next[day.key][period.id].type,
          lessonPlanId: typeof source.lessonPlanId === "string" ? source.lessonPlanId : "",
          notes: typeof source.notes === "string" ? source.notes : "",
          locked: Boolean(source.locked)
        };
      }
    }

    return next;
  } catch {
    return null;
  }
}

export function loadWeeklyTemplate(): WeeklyTemplate {
  if (typeof window === "undefined") return defaultWeeklyTemplate();
  return safeParseTemplate(window.localStorage.getItem(TEMPLATE_STORAGE_KEY)) ?? defaultWeeklyTemplate();
}

export function saveWeeklyTemplate(template: WeeklyTemplate) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(template));
}

export function toIsoDate(year: number, month1: number, day: number): string {
  return `${year}-${`${month1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

export function parseTemplateDate(dateIso: string): Date {
  const date = new Date(`${dateIso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function enumerateDateRange(startIso: string, endIso: string): string[] {
  const start = parseTemplateDate(startIso);
  const end = parseTemplateDate(endIso);
  const out: string[] = [];
  const cursor = start <= end ? start : end;
  const stop = start <= end ? end : start;

  while (cursor <= stop) {
    out.push(toIsoDate(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()));
    cursor.setDate(cursor.getDate() + 1);
  }

  return out;
}

export function weekdayToDayKey(weekday: number): DayKey | null {
  return DAYS.find((day) => day.weekday === weekday)?.key ?? null;
}

function extractGrade(label: string): string {
  const match = label.trim().match(/^(K|[1-5])\b/i);
  return match ? match[1].toUpperCase() : "";
}

export function hasTemplateForDate(dateIso: string, template: WeeklyTemplate = loadWeeklyTemplate()): boolean {
  const dayKey = weekdayToDayKey(parseTemplateDate(dateIso).getDay());
  if (!dayKey) return false;

  return PERIODS.some((period) => {
    if (!period.publishable) return false;

    const cell = template[dayKey][period.id];
    const isLockedAutoBlock = cell.locked && (cell.type === "planning" || cell.type === "lunch");
    return isLockedAutoBlock || Boolean(cell.label.trim());
  });
}

export function buildScheduleDraftsForDate(
  dateIso: string,
  template: WeeklyTemplate = loadWeeklyTemplate()
): TemplateScheduleDraft[] {
  const dayKey = weekdayToDayKey(parseTemplateDate(dateIso).getDay());
  if (!dayKey) return [];

  const drafts: TemplateScheduleDraft[] = [];

  for (const period of PERIODS) {
    if (!period.publishable) continue;

    const cell = template[dayKey][period.id];
    const isLockedAutoBlock = cell.locked && (cell.type === "planning" || cell.type === "lunch");

    if (!isLockedAutoBlock && !cell.label.trim()) continue;

    const typeLabel = TYPE_LABEL[cell.type];
    const notes = cell.notes.trim();

    drafts.push({
      classLabel: isLockedAutoBlock ? (cell.label.trim() || typeLabel) : cell.label.trim(),
      grade: isLockedAutoBlock ? "" : extractGrade(cell.label),
      topic: isLockedAutoBlock ? typeLabel : notes ? `${typeLabel} · ${notes}` : typeLabel,
      startTime: period.start,
      endTime: period.end,
      lessonPlanId: isLockedAutoBlock ? undefined : cell.lessonPlanId || undefined
    });
  }

  return drafts;
}
