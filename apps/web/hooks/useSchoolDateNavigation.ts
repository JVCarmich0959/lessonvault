"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { addDays, isWeekend, isoFromDate, nextSchoolDay, prevSchoolDay } from "@/lib/dates";

function nextSchoolDaysFrom(dateIso: string, count: number): string[] {
  const out: string[] = [];
  let cursor = isWeekend(dateIso) ? nextSchoolDay(dateIso) : dateIso;

  while (out.length < count) {
    if (!isWeekend(cursor)) out.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return out;
}

export type SchoolDateNavigation = {
  date: string;
  setDate: (dateIso: string) => void;
  goPrevSchoolDay: () => void;
  goNextSchoolDay: () => void;
  previewDates: string[];
  isWeekendDate: boolean;
  todayIso: string;
};

export function useSchoolDateNavigation(): SchoolDateNavigation {
  const todayIso = useMemo(() => isoFromDate(new Date()), []);
  const [date, setDateState] = useState(() => isoFromDate(new Date()));
  const hasAutoAdjustedDateRef = useRef(false);
  const userHasChosenDateRef = useRef(false);

  const setDate = useCallback((nextDate: string) => {
    userHasChosenDateRef.current = true;
    setDateState(nextDate);
  }, []);

  const goPrevSchoolDay = useCallback(() => {
    setDate(prevSchoolDay(date));
  }, [date, setDate]);

  const goNextSchoolDay = useCallback(() => {
    setDate(nextSchoolDay(date));
  }, [date, setDate]);

  useEffect(() => {
    if (hasAutoAdjustedDateRef.current || userHasChosenDateRef.current) return;

    hasAutoAdjustedDateRef.current = true;
    if (!isWeekend(todayIso)) return;

    setDateState(nextSchoolDay(todayIso));
  }, [todayIso]);

  const previewDates = useMemo(() => nextSchoolDaysFrom(date, 5), [date]);
  const isWeekendDate = useMemo(() => isWeekend(date), [date]);

  return {
    date,
    setDate,
    goPrevSchoolDay,
    goNextSchoolDay,
    previewDates,
    isWeekendDate,
    todayIso
  };
}
