"use client";

import { useCallback, useEffect, useState } from "react";

import { listLessonPlans } from "@/lib/lessonPlans";

export type LessonPlanSummary = {
  id: string;
  title: string;
};

export type UseLessonPlansResult = {
  lessonPlans: LessonPlanSummary[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<LessonPlanSummary[]>;
};

function normalizeLessonPlans(source: unknown): LessonPlanSummary[] {
  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.title !== "string") return null;
      return { id: record.id, title: record.title };
    })
    .filter((item): item is LessonPlanSummary => Boolean(item));
}

export function useLessonPlans(): UseLessonPlansResult {
  const [lessonPlans, setLessonPlans] = useState<LessonPlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<LessonPlanSummary[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const source = await listLessonPlans();
      const next = normalizeLessonPlans(source);
      setLessonPlans(next);
      return next;
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Failed to load lesson plans";
      setError(message);
      setLessonPlans([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    lessonPlans,
    isLoading,
    error,
    refresh
  };
}
