function safeParseIso(dateIso: string): Date {
  const parsed = new Date(`${dateIso}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function isoFromDate(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

export function addDays(dateIso: string, days: number): string {
  const next = safeParseIso(dateIso);
  next.setDate(next.getDate() + days);
  return isoFromDate(next);
}

export function isWeekend(dateIso: string): boolean {
  const weekday = safeParseIso(dateIso).getDay();
  return weekday === 0 || weekday === 6;
}

export function nextSchoolDay(dateIso: string): string {
  let next = addDays(dateIso, 1);
  while (isWeekend(next)) {
    next = addDays(next, 1);
  }
  return next;
}

export function prevSchoolDay(dateIso: string): string {
  let prev = addDays(dateIso, -1);
  while (isWeekend(prev)) {
    prev = addDays(prev, -1);
  }
  return prev;
}
