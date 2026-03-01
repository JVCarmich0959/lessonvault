"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { listAllSchedule, listScheduleByDate, ScheduleItem } from "@/lib/schedule";

type ScheduleByDate = Record<string, ScheduleItem[]>;

type RefreshOptions = {
  force?: boolean;
};

export type UseScheduleResult = {
  itemsForDate: ScheduleItem[];
  allItems: ScheduleItem[];
  refreshDate: (dateIso: string, options?: RefreshOptions) => ScheduleItem[];
  refreshAll: (options?: RefreshOptions) => ScheduleItem[];
  isLoading: boolean;
  error: string | null;
};

function groupByDate(items: ScheduleItem[]): Map<string, ScheduleItem[]> {
  const grouped = new Map<string, ScheduleItem[]>();

  for (const item of items) {
    const list = grouped.get(item.date) ?? [];
    list.push(item);
    grouped.set(item.date, list);
  }

  return grouped;
}

function mapToRecord(map: Map<string, ScheduleItem[]>): ScheduleByDate {
  const record: ScheduleByDate = {};
  for (const [date, items] of map.entries()) {
    record[date] = items;
  }
  return record;
}

export function useSchedule(dateIso: string): UseScheduleResult {
  const [itemsByDate, setItemsByDate] = useState<ScheduleByDate>({});
  const [allItems, setAllItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dateCacheRef = useRef<Map<string, ScheduleItem[]>>(new Map());
  const hasAllCacheRef = useRef(false);
  const allCacheRef = useRef<ScheduleItem[]>([]);

  const refreshAll = useCallback((options?: RefreshOptions): ScheduleItem[] => {
    const force = options?.force ?? false;

    if (!force && hasAllCacheRef.current) {
      return allCacheRef.current;
    }

    try {
      setIsLoading(true);
      setError(null);

      const nextAllItems = listAllSchedule();
      const grouped = groupByDate(nextAllItems);

      dateCacheRef.current = grouped;
      hasAllCacheRef.current = true;
      allCacheRef.current = nextAllItems;
      setAllItems(nextAllItems);
      setItemsByDate(mapToRecord(grouped));

      return nextAllItems;
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Failed to load schedule";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDate = useCallback((targetDateIso: string, options?: RefreshOptions): ScheduleItem[] => {
    const force = options?.force ?? false;

    if (!force) {
      const cached = dateCacheRef.current.get(targetDateIso);
      if (cached) return cached;
    }

    try {
      setIsLoading(true);
      setError(null);

      const nextItems = listScheduleByDate(targetDateIso);
      dateCacheRef.current.set(targetDateIso, nextItems);
      setItemsByDate((current) => ({ ...current, [targetDateIso]: nextItems }));

      return nextItems;
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Failed to load schedule for date";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasAllCacheRef.current) {
      refreshAll();
      return;
    }

    refreshDate(dateIso);
  }, [dateIso, refreshAll, refreshDate]);

  const itemsForDate = useMemo(() => itemsByDate[dateIso] ?? [], [dateIso, itemsByDate]);

  return {
    itemsForDate,
    allItems,
    refreshDate,
    refreshAll,
    isLoading,
    error
  };
}
